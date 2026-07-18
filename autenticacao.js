const {
    createHash,
    randomBytes,
    randomUUID,
    scrypt,
    timingSafeEqual
} = require("node:crypto");

const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

/*
|--------------------------------------------------------------------------
| Configurações
|--------------------------------------------------------------------------
*/

const COOKIE_SESSAO =
    "bordado_sessao";

const DURACAO_SESSAO_MS =
    12 * 60 * 60 * 1000;

const RENOVAR_APOS_MS =
    15 * 60 * 1000;

const MAX_TENTATIVAS = 5;

const JANELA_TENTATIVAS_MS =
    15 * 60 * 1000;

const BLOQUEIO_MS =
    15 * 60 * 1000;

const SCRYPT = {
    N: 16384,
    r: 8,
    p: 1,
    keylen: 64,
    maxmem:
        64 * 1024 * 1024
};

/*
|--------------------------------------------------------------------------
| Serviço de autenticação
|--------------------------------------------------------------------------
*/

function criarServicoAutenticacao({
    banco,
    ErroHttp,
    usarCookieSeguro = false
}) {
    if (!banco || !ErroHttp) {
        throw new Error(
            "Banco e ErroHttp são obrigatórios na autenticação."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Tabelas
    |--------------------------------------------------------------------------
    */

    banco.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,

            nome TEXT NOT NULL,

            usuario TEXT
                NOT NULL
                COLLATE NOCASE
                UNIQUE,

            senha_hash TEXT NOT NULL,

            perfil TEXT
                NOT NULL
                DEFAULT 'administrador'
                CHECK (
                    perfil IN (
                        'administrador',
                        'operador'
                    )
                ),

            ativo INTEGER
                NOT NULL
                DEFAULT 1
                CHECK (
                    ativo IN (0, 1)
                ),

            criado_em TEXT NOT NULL,

            atualizado_em TEXT NOT NULL,

            ultimo_login_em TEXT
                NOT NULL
                DEFAULT ''
        ) STRICT;

        CREATE TABLE IF NOT EXISTS sessoes (
            id TEXT PRIMARY KEY,

            usuario_id TEXT NOT NULL,

            token_hash TEXT
                NOT NULL
                UNIQUE,

            criado_em TEXT NOT NULL,

            expira_em TEXT NOT NULL,

            ultimo_uso_em TEXT NOT NULL,

            ip TEXT
                NOT NULL
                DEFAULT '',

            user_agent TEXT
                NOT NULL
                DEFAULT '',

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        ) STRICT;

        CREATE TABLE IF NOT EXISTS tentativas_login (
            chave TEXT PRIMARY KEY,

            falhas INTEGER
                NOT NULL
                DEFAULT 0,

            primeira_falha_em TEXT
                NOT NULL,

            ultima_falha_em TEXT
                NOT NULL,

            bloqueado_ate TEXT
                NOT NULL
                DEFAULT ''
        ) STRICT;

        CREATE INDEX IF NOT EXISTS
            indice_sessoes_usuario
        ON sessoes(usuario_id);

        CREATE INDEX IF NOT EXISTS
            indice_sessoes_expiracao
        ON sessoes(expira_em);
    `);

    /*
    |--------------------------------------------------------------------------
    | Consultas preparadas
    |--------------------------------------------------------------------------
    */

    const sql = {
        contarUsuarios:
            banco.prepare(`
                SELECT
                    COUNT(*) AS quantidade
                FROM usuarios
                WHERE ativo = 1
            `),

        usuarioPorLogin:
            banco.prepare(`
                SELECT *
                FROM usuarios
                WHERE
                    usuario = ?
                    COLLATE NOCASE
                LIMIT 1
            `),

        usuarioPorId:
            banco.prepare(`
                SELECT *
                FROM usuarios
                WHERE id = ?
                LIMIT 1
            `),

        inserirUsuario:
            banco.prepare(`
                INSERT INTO usuarios (
                    id,
                    nome,
                    usuario,
                    senha_hash,
                    perfil,
                    ativo,
                    criado_em,
                    atualizado_em,
                    ultimo_login_em
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    'administrador',
                    1,
                    ?,
                    ?,
                    ''
                )
            `),

        atualizarUltimoLogin:
            banco.prepare(`
                UPDATE usuarios
                SET
                    ultimo_login_em = ?,
                    atualizado_em = ?
                WHERE id = ?
            `),

        inserirSessao:
            banco.prepare(`
                INSERT INTO sessoes (
                    id,
                    usuario_id,
                    token_hash,
                    criado_em,
                    expira_em,
                    ultimo_uso_em,
                    ip,
                    user_agent
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `),

        sessaoPorToken:
            banco.prepare(`
                SELECT
                    s.id AS sessao_id,
                    s.expira_em,
                    s.ultimo_uso_em,

                    u.id AS usuario_id,
                    u.nome,
                    u.usuario,
                    u.perfil,
                    u.ativo,
                    u.ultimo_login_em

                FROM sessoes s

                INNER JOIN usuarios u
                    ON u.id = s.usuario_id

                WHERE s.token_hash = ?

                LIMIT 1
            `),

        renovarSessao:
            banco.prepare(`
                UPDATE sessoes
                SET
                    ultimo_uso_em = ?,
                    expira_em = ?
                WHERE id = ?
            `),

        excluirSessao:
            banco.prepare(`
                DELETE FROM sessoes
                WHERE token_hash = ?
            `),

        excluirSessoesUsuario:
            banco.prepare(`
                DELETE FROM sessoes
                WHERE usuario_id = ?
            `),

        excluirExpiradas:
            banco.prepare(`
                DELETE FROM sessoes
                WHERE expira_em <= ?
            `),

        tentativaPorChave:
            banco.prepare(`
                SELECT *
                FROM tentativas_login
                WHERE chave = ?
                LIMIT 1
            `),

        salvarTentativa:
            banco.prepare(`
                INSERT INTO tentativas_login (
                    chave,
                    falhas,
                    primeira_falha_em,
                    ultima_falha_em,
                    bloqueado_ate
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )

                ON CONFLICT(chave)
                DO UPDATE SET
                    falhas =
                        excluded.falhas,

                    primeira_falha_em =
                        excluded.primeira_falha_em,

                    ultima_falha_em =
                        excluded.ultima_falha_em,

                    bloqueado_ate =
                        excluded.bloqueado_ate
            `),

        excluirTentativa:
            banco.prepare(`
                DELETE FROM tentativas_login
                WHERE chave = ?
            `)
    };

    /*
    |--------------------------------------------------------------------------
    | Validação
    |--------------------------------------------------------------------------
    */

    function texto(valor) {
        return String(
            valor ?? ""
        )
            .normalize("NFKC")
            .trim();
    }

    function normalizarUsuario(
        valor
    ) {
        return texto(valor)
            .toLowerCase();
    }

    function validarNome(valor) {
        const nome =
            texto(valor);

        if (
            nome.length < 3 ||
            nome.length > 100
        ) {
            throw new ErroHttp(
                400,
                "O nome deve possuir entre 3 e 100 caracteres."
            );
        }

        return nome;
    }

    function validarUsuario(
        valor
    ) {
        const usuario =
            normalizarUsuario(
                valor
            );

        if (
            usuario.length < 3 ||
            usuario.length > 40
        ) {
            throw new ErroHttp(
                400,
                "O usuário deve possuir entre 3 e 40 caracteres."
            );
        }

        if (
            !/^[a-z0-9._-]+$/.test(
                usuario
            )
        ) {
            throw new ErroHttp(
                400,
                "Use apenas letras sem acento, números, ponto, hífen ou underline no usuário."
            );
        }

        return usuario;
    }

    function validarSenha(
        valor,
        usuario = ""
    ) {
        const senha =
            String(valor ?? "");

        if (
            senha.length < 10 ||
            senha.length > 128
        ) {
            throw new ErroHttp(
                400,
                "A senha deve possuir entre 10 e 128 caracteres."
            );
        }

        if (
            !/[A-Za-zÀ-ÿ]/.test(
                senha
            ) ||
            !/\d/.test(senha)
        ) {
            throw new ErroHttp(
                400,
                "A senha precisa conter pelo menos uma letra e um número."
            );
        }

        if (
            usuario &&
            senha
                .toLowerCase()
                .includes(
                    usuario.toLowerCase()
                )
        ) {
            throw new ErroHttp(
                400,
                "A senha não pode conter o nome de usuário."
            );
        }

        return senha;
    }

    function usuarioPublico(
        registro
    ) {
        if (!registro) {
            return null;
        }

        return {
            id:
                registro.usuario_id ||
                registro.id,

            nome:
                registro.nome,

            usuario:
                registro.usuario,

            perfil:
                registro.perfil,

            ultimoLoginEm:
                registro
                    .ultimo_login_em ||
                null
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Proteção das senhas
    |--------------------------------------------------------------------------
    */

    async function derivarSenha(
        senha,
        salt,
        parametros = SCRYPT
    ) {
        return scryptAsync(
            senha,
            salt,
            parametros.keylen ||
                SCRYPT.keylen,
            {
                N:
                    parametros.N,

                r:
                    parametros.r,

                p:
                    parametros.p,

                maxmem:
                    SCRYPT.maxmem
            }
        );
    }

    async function criarHashSenha(
        senha
    ) {
        const salt =
            randomBytes(16);

        const chave =
            await derivarSenha(
                senha,
                salt
            );

        return [
            "scrypt",
            SCRYPT.N,
            SCRYPT.r,
            SCRYPT.p,
            salt.toString(
                "base64"
            ),
            Buffer.from(chave)
                .toString("base64")
        ].join("$");
    }

    async function verificacaoFicticia(
        senha
    ) {
        await derivarSenha(
            String(senha ?? ""),
            randomBytes(16)
        );
    }

    async function verificarSenha(
        senha,
        hashArmazenado
    ) {
        const partes =
            String(
                hashArmazenado || ""
            ).split("$");

        if (
            partes.length !== 6 ||
            partes[0] !== "scrypt"
        ) {
            await verificacaoFicticia(
                senha
            );

            return false;
        }

        const parametros = {
            N:
                Number(partes[1]),

            r:
                Number(partes[2]),

            p:
                Number(partes[3]),

            keylen:
                SCRYPT.keylen
        };

        if (
            !Number.isSafeInteger(
                parametros.N
            ) ||
            !Number.isSafeInteger(
                parametros.r
            ) ||
            !Number.isSafeInteger(
                parametros.p
            ) ||
            parametros.N < 1024 ||
            parametros.r < 1 ||
            parametros.p < 1
        ) {
            await verificacaoFicticia(
                senha
            );

            return false;
        }

        const salt =
            Buffer.from(
                partes[4],
                "base64"
            );

        const esperado =
            Buffer.from(
                partes[5],
                "base64"
            );

        if (
            salt.length < 16 ||
            esperado.length !==
                SCRYPT.keylen
        ) {
            await verificacaoFicticia(
                senha
            );

            return false;
        }

        try {
            const recebido =
                Buffer.from(
                    await derivarSenha(
                        String(
                            senha ?? ""
                        ),
                        salt,
                        parametros
                    )
                );

            return (
                recebido.length ===
                    esperado.length &&

                timingSafeEqual(
                    recebido,
                    esperado
                )
            );
        } catch {
            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Cookies
    |--------------------------------------------------------------------------
    */

    function analisarCookies(
        request
    ) {
        const resultado = {};

        const cabecalho =
            String(
                request.headers.cookie ||
                ""
            );

        for (
            const parte
            of cabecalho.split(";")
        ) {
            const indice =
                parte.indexOf("=");

            if (indice < 0) {
                continue;
            }

            const nome =
                parte
                    .slice(0, indice)
                    .trim();

            const valor =
                parte
                    .slice(
                        indice + 1
                    )
                    .trim();

            if (!nome) {
                continue;
            }

            try {
                resultado[nome] =
                    decodeURIComponent(
                        valor
                    );
            } catch {
                resultado[nome] =
                    valor;
            }
        }

        return resultado;
    }

    function hashToken(token) {
        return createHash(
            "sha256"
        )
            .update(
                String(token)
            )
            .digest("hex");
    }

    function obterToken(request) {
        return (
            analisarCookies(
                request
            )[COOKIE_SESSAO] ||
            ""
        );
    }

    function obterIp(request) {
        return String(
            request.socket
                ?.remoteAddress ||
            ""
        ).slice(0, 120);
    }

    function obterUserAgent(
        request
    ) {
        return String(
            request.headers[
                "user-agent"
            ] || ""
        ).slice(0, 500);
    }

    function deveUsarCookieSeguro(
        request
    ) {
        return Boolean(
            usarCookieSeguro ||
            request.socket
                ?.encrypted
        );
    }

    function definirCookie(
        request,
        response,
        token
    ) {
        const partes = [
            `${COOKIE_SESSAO}=${encodeURIComponent(
                token
            )}`,

            "Path=/",

            "HttpOnly",

            "SameSite=Lax",

            `Max-Age=${Math.floor(
                DURACAO_SESSAO_MS /
                1000
            )}`
        ];

        if (
            deveUsarCookieSeguro(
                request
            )
        ) {
            partes.push(
                "Secure"
            );
        }

        response.setHeader(
            "Set-Cookie",
            partes.join("; ")
        );
    }

    function limparCookie(
        request,
        response
    ) {
        const partes = [
            `${COOKIE_SESSAO}=`,
            "Path=/",
            "HttpOnly",
            "SameSite=Lax",
            "Max-Age=0",
            "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        ];

        if (
            deveUsarCookieSeguro(
                request
            )
        ) {
            partes.push(
                "Secure"
            );
        }

        response.setHeader(
            "Set-Cookie",
            partes.join("; ")
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Sessões
    |--------------------------------------------------------------------------
    */

    function criarSessao(
        usuarioId,
        request,
        response
    ) {
        const token =
            randomBytes(32)
                .toString(
                    "base64url"
                );

        const agora =
            new Date();

        const expira =
            new Date(
                agora.getTime() +
                DURACAO_SESSAO_MS
            );

        sql.inserirSessao.run(
            randomUUID(),

            usuarioId,

            hashToken(token),

            agora.toISOString(),

            expira.toISOString(),

            agora.toISOString(),

            obterIp(request),

            obterUserAgent(
                request
            )
        );

        definirCookie(
            request,
            response,
            token
        );
    }

    function limparExpiradas() {
        sql.excluirExpiradas.run(
            new Date()
                .toISOString()
        );
    }

    function sistemaConfigurado() {
        return Number(
            sql.contarUsuarios
                .get()
                ?.quantidade || 0
        ) > 0;
    }

    function obterSessao(
        request,
        response = null
    ) {
        const token =
            obterToken(request);

        if (!token) {
            return null;
        }

        const tokenHash =
            hashToken(token);

        const sessao =
            sql.sessaoPorToken
                .get(tokenHash);

        if (!sessao) {
            if (response) {
                limparCookie(
                    request,
                    response
                );
            }

            return null;
        }

        const agora =
            Date.now();

        const expiraEm =
            new Date(
                sessao.expira_em
            ).getTime();

        if (
            !sessao.ativo ||
            !Number.isFinite(
                expiraEm
            ) ||
            expiraEm <= agora
        ) {
            sql.excluirSessao.run(
                tokenHash
            );

            if (response) {
                limparCookie(
                    request,
                    response
                );
            }

            return null;
        }

        const ultimoUso =
            new Date(
                sessao
                    .ultimo_uso_em
            ).getTime();

        if (
            !Number.isFinite(
                ultimoUso
            ) ||
            agora - ultimoUso >=
                RENOVAR_APOS_MS
        ) {
            const novaExpiracao =
                new Date(
                    agora +
                    DURACAO_SESSAO_MS
                );

            sql.renovarSessao.run(
                new Date(agora)
                    .toISOString(),

                novaExpiracao
                    .toISOString(),

                sessao.sessao_id
            );

            if (response) {
                definirCookie(
                    request,
                    response,
                    token
                );
            }
        }

        return {
            sessaoId:
                sessao.sessao_id,

            tokenHash,

            usuario:
                usuarioPublico(
                    sessao
                )
        };
    }

    function exigirAutenticacao(
        request,
        response = null
    ) {
        const sessao =
            obterSessao(
                request,
                response
            );

        if (!sessao) {
            throw new ErroHttp(
                401,
                "Faça login para continuar."
            );
        }

        return sessao;
    }

    /*
    |--------------------------------------------------------------------------
    | Limite de tentativas
    |--------------------------------------------------------------------------
    */

    function chaveTentativa(
        request,
        usuario
    ) {
        return createHash(
            "sha256"
        )
            .update(
                `${obterIp(
                    request
                )}|${normalizarUsuario(
                    usuario
                )}`
            )
            .digest("hex");
    }

    function verificarBloqueio(
        request,
        usuario
    ) {
        const chave =
            chaveTentativa(
                request,
                usuario
            );

        const tentativa =
            sql.tentativaPorChave
                .get(chave);

        if (
            !tentativa
                ?.bloqueado_ate
        ) {
            return chave;
        }

        const bloqueadoAte =
            new Date(
                tentativa
                    .bloqueado_ate
            ).getTime();

        if (
            Number.isFinite(
                bloqueadoAte
            ) &&
            bloqueadoAte >
                Date.now()
        ) {
            throw new ErroHttp(
                429,

                "Muitas tentativas incorretas. Aguarde alguns minutos e tente novamente.",

                {
                    segundosRestantes:
                        Math.ceil(
                            (
                                bloqueadoAte -
                                Date.now()
                            ) /
                            1000
                        )
                }
            );
        }

        return chave;
    }

    function registrarFalha(
        chave
    ) {
        const agora =
            new Date();

        const anterior =
            sql.tentativaPorChave
                .get(chave);

        let falhas = 1;

        let primeiraFalha =
            agora;

        if (anterior) {
            const dataAnterior =
                new Date(
                    anterior
                        .primeira_falha_em
                );

            const dentroDaJanela =
                Number.isFinite(
                    dataAnterior
                        .getTime()
                ) &&
                agora.getTime() -
                    dataAnterior
                        .getTime() <=
                    JANELA_TENTATIVAS_MS;

            if (dentroDaJanela) {
                falhas =
                    anterior.falhas +
                    1;

                primeiraFalha =
                    dataAnterior;
            }
        }

        const bloqueadoAte =
            falhas >=
            MAX_TENTATIVAS

                ? new Date(
                    agora.getTime() +
                    BLOQUEIO_MS
                ).toISOString()

                : "";

        sql.salvarTentativa.run(
            chave,

            falhas,

            primeiraFalha
                .toISOString(),

            agora.toISOString(),

            bloqueadoAte
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Primeiro administrador
    |--------------------------------------------------------------------------
    */

    async function criarUsuarioInicial(
        dados,
        request,
        response
    ) {
        if (
            sistemaConfigurado()
        ) {
            throw new ErroHttp(
                409,
                "O administrador inicial já foi configurado."
            );
        }

        const nome =
            validarNome(
                dados?.nome
            );

        const usuario =
            validarUsuario(
                dados?.usuario
            );

        const senha =
            validarSenha(
                dados?.senha,
                usuario
            );

        if (
            sql.usuarioPorLogin
                .get(usuario)
        ) {
            throw new ErroHttp(
                409,
                "Este nome de usuário já está em uso."
            );
        }

        const agora =
            new Date()
                .toISOString();

        const id =
            randomUUID();

        const senhaHash =
            await criarHashSenha(
                senha
            );

        sql.inserirUsuario.run(
            id,
            nome,
            usuario,
            senhaHash,
            agora,
            agora
        );

        sql.atualizarUltimoLogin.run(
            agora,
            agora,
            id
        );

        criarSessao(
            id,
            request,
            response
        );

        return usuarioPublico(
            sql.usuarioPorId
                .get(id)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async function autenticar(
        dados,
        request,
        response
    ) {
        limparExpiradas();

        const usuarioRecebido =
            normalizarUsuario(
                dados?.usuario
            );

        const senhaRecebida =
            String(
                dados?.senha ?? ""
            );

        const chave =
            verificarBloqueio(
                request,
                usuarioRecebido
            );

        const usuario =
            usuarioRecebido

                ? sql.usuarioPorLogin
                    .get(
                        usuarioRecebido
                    )

                : null;

        let senhaCorreta =
            false;

        if (usuario?.ativo) {
            senhaCorreta =
                await verificarSenha(
                    senhaRecebida,
                    usuario.senha_hash
                );
        } else {
            await verificacaoFicticia(
                senhaRecebida
            );
        }

        if (!senhaCorreta) {
            registrarFalha(
                chave
            );

            throw new ErroHttp(
                401,
                "Usuário ou senha incorretos."
            );
        }

        sql.excluirTentativa.run(
            chave
        );

        const agora =
            new Date()
                .toISOString();

        sql.atualizarUltimoLogin.run(
            agora,
            agora,
            usuario.id
        );

        /*
         * Mantém somente uma sessão ativa
         * para esse usuário.
         */
        sql.excluirSessoesUsuario.run(
            usuario.id
        );

        criarSessao(
            usuario.id,
            request,
            response
        );

        return usuarioPublico(
            sql.usuarioPorId
                .get(usuario.id)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    function encerrarSessao(
        request,
        response
    ) {
        const token =
            obterToken(request);

        if (token) {
            sql.excluirSessao.run(
                hashToken(token)
            );
        }

        limparCookie(
            request,
            response
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    function obterStatus(
        request,
        response = null
    ) {
        const configurado =
            sistemaConfigurado();

        const sessao =
            configurado

                ? obterSessao(
                    request,
                    response
                )

                : null;

        return {
            configurado,

            autenticado:
                Boolean(sessao),

            usuario:
                sessao?.usuario ||
                null
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Limpeza automática
    |--------------------------------------------------------------------------
    */

    limparExpiradas();

    const temporizador =
        setInterval(
            limparExpiradas,
            60 * 60 * 1000
        );

    temporizador.unref();

    return {
        autenticar,

        criarUsuarioInicial,

        encerrar:
            () =>
                clearInterval(
                    temporizador
                ),

        encerrarSessao,

        exigirAutenticacao,

        obterSessao,

        obterStatus,

        sistemaConfigurado
    };
}

module.exports = {
    criarServicoAutenticacao
};