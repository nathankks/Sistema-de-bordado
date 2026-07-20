const {
    createHash,
    randomBytes,
    randomUUID,
    scrypt,
    timingSafeEqual
} = require("node:crypto");

const {
    promisify
} = require("node:util");

const scryptAsync =
    promisify(scrypt);

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

const MAX_TENTATIVAS =
    5;

const JANELA_TENTATIVAS_MS =
    15 * 60 * 1000;

const BLOQUEIO_MS =
    15 * 60 * 1000;

const SCRYPT =
    Object.freeze({
        N: 16384,
        r: 8,
        p: 1,
        keylen: 64,

        maxmem:
            64 * 1024 * 1024
    });

/*
|--------------------------------------------------------------------------
| Permissões do sistema
|--------------------------------------------------------------------------
*/

const CHAVES_PERMISSOES =
    Object.freeze([
        "clientes.visualizar",
        "clientes.dados_pessoais",
        "clientes.criar",
        "clientes.editar",
        "clientes.excluir",

        "ordens.visualizar",
        "ordens.criar",
        "ordens.editar",
        "ordens.excluir",

        "linhas.visualizar",
        "linhas.criar",
        "linhas.editar",
        "linhas.excluir",

        "arquivos.baixar",
        "arquivos.remover",

        "backup.criar",
        "backup.restaurar",

        "usuarios.gerenciar"
    ]);

const PERMISSOES_ADMINISTRADOR =
    Object.freeze(
        Object.fromEntries(
            CHAVES_PERMISSOES.map(
                permissao => [
                    permissao,
                    true
                ]
            )
        )
    );

const PERMISSOES_OPERADOR =
    Object.freeze({
        "clientes.visualizar":
            true,

        "clientes.dados_pessoais":
            false,

        "clientes.criar":
            true,

        "clientes.editar":
            true,

        "clientes.excluir":
            false,

        "ordens.visualizar":
            true,

        "ordens.criar":
            true,

        "ordens.editar":
            true,

        "ordens.excluir":
            false,

        "linhas.visualizar":
            true,

        "linhas.criar":
            false,

        "linhas.editar":
            false,

        "linhas.excluir":
            false,

        "arquivos.baixar":
            true,

        "arquivos.remover":
            false,

        "backup.criar":
            false,

        "backup.restaurar":
            false,

        "usuarios.gerenciar":
            false
    });

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
    if (
        !banco ||
        !ErroHttp
    ) {
        throw new Error(
            "Banco e ErroHttp são obrigatórios na autenticação."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Banco de dados
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
                DEFAULT '',

            permissoes TEXT
                NOT NULL
                DEFAULT '{}'
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
     * Atualiza bancos criados em versões
     * anteriores do sistema.
     */

    const colunasUsuarios =
        banco
            .prepare(
                "PRAGMA table_info(usuarios)"
            )
            .all()
            .map(
                coluna =>
                    coluna.name
            );

    function garantirColunaUsuario(
        nome,
        definicao
    ) {
        if (
            colunasUsuarios.includes(
                nome
            )
        ) {
            return;
        }

        banco.exec(`
            ALTER TABLE usuarios
            ADD COLUMN ${nome}
            ${definicao}
        `);
    }

    garantirColunaUsuario(
        "perfil",
        "TEXT NOT NULL DEFAULT 'administrador'"
    );

    garantirColunaUsuario(
        "ativo",
        "INTEGER NOT NULL DEFAULT 1"
    );

    garantirColunaUsuario(
        "ultimo_login_em",
        "TEXT NOT NULL DEFAULT ''"
    );

    garantirColunaUsuario(
        "permissoes",
        "TEXT NOT NULL DEFAULT '{}'"
    );

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

        listarUsuarios:
            banco.prepare(`
                SELECT
                    id,
                    nome,
                    usuario,
                    perfil,
                    ativo,
                    permissoes,
                    criado_em,
                    atualizado_em,
                    ultimo_login_em

                FROM usuarios

                ORDER BY
                    ativo DESC,
                    nome COLLATE NOCASE
            `),

        listarUsuariosSeguranca:
            banco.prepare(`
                SELECT
                    id,
                    perfil,
                    ativo,
                    permissoes

                FROM usuarios
            `),

        inserirUsuarioInicial:
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
                    ultimo_login_em,
                    permissoes
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
                    '',
                    ?
                )
            `),

        inserirUsuarioGerenciado:
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
                    ultimo_login_em,
                    permissoes
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    1,
                    ?,
                    ?,
                    '',
                    ?
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

        atualizarPerfil:
            banco.prepare(`
                UPDATE usuarios

                SET
                    nome = ?,
                    usuario = ?,
                    atualizado_em = ?

                WHERE id = ?
            `),

        atualizarSenha:
            banco.prepare(`
                UPDATE usuarios

                SET
                    senha_hash = ?,
                    atualizado_em = ?

                WHERE id = ?
            `),

        atualizarUsuarioGerenciado:
            banco.prepare(`
                UPDATE usuarios

                SET
                    nome = ?,
                    usuario = ?,
                    perfil = ?,
                    ativo = ?,
                    permissoes = ?,
                    atualizado_em = ?

                WHERE id = ?
            `),

        redefinirSenhaUsuario:
            banco.prepare(`
                UPDATE usuarios

                SET
                    senha_hash = ?,
                    atualizado_em = ?

                WHERE id = ?
            `),

        excluirUsuarioGerenciado:
            banco.prepare(`
                DELETE FROM usuarios

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
                    u.permissoes,
                    u.ultimo_login_em

                FROM sessoes s

                INNER JOIN usuarios u
                    ON u.id =
                        s.usuario_id

                WHERE
                    s.token_hash = ?

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
    | Validação básica
    |--------------------------------------------------------------------------
    */

    function texto(
        valor
    ) {
        return String(
            valor ?? ""
        )
            .normalize(
                "NFKC"
            )
            .trim();
    }

    function normalizarUsuario(
        valor
    ) {
        return texto(
            valor
        ).toLowerCase();
    }

    function validarNome(
        valor
    ) {
        const nome =
            texto(
                valor
            );

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

    function validarPerfil(
        valor
    ) {
        const perfil =
            texto(
                valor
            ).toLowerCase();

        if (
            ![
                "administrador",
                "operador"
            ].includes(
                perfil
            )
        ) {
            throw new ErroHttp(
                400,
                "O perfil do usuário não é válido."
            );
        }

        return perfil;
    }

    function validarSituacaoUsuario(
        valor,
        padrao = true
    ) {
        if (
            valor === undefined ||
            valor === null
        ) {
            return Boolean(
                padrao
            );
        }

        const normalizado =
            typeof valor ===
                "string"

                ? texto(
                    valor
                ).toLowerCase()

                : valor;

        if (
            [
                false,
                0,
                "0",
                "false",
                "inativo"
            ].includes(
                normalizado
            )
        ) {
            return false;
        }

        if (
            [
                true,
                1,
                "1",
                "true",
                "ativo"
            ].includes(
                normalizado
            )
        ) {
            return true;
        }

        throw new ErroHttp(
            400,
            "A situação do usuário não é válida."
        );
    }

    function validarSenha(
        valor,
        usuario = ""
    ) {
        const senha =
            String(
                valor ?? ""
            );

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
            !/\d/.test(
                senha
            )
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
                    usuario
                        .toLowerCase()
                )
        ) {
            throw new ErroHttp(
                400,
                "A senha não pode conter o nome de usuário."
            );
        }

        return senha;
    }

    /*
    |--------------------------------------------------------------------------
    | Tratamento das permissões
    |--------------------------------------------------------------------------
    */

    function permissoesPadrao(
        perfil
    ) {
        const origem =
            perfil ===
                "administrador"

                ? PERMISSOES_ADMINISTRADOR

                : PERMISSOES_OPERADOR;

        return Object.fromEntries(
            CHAVES_PERMISSOES.map(
                permissao => [
                    permissao,

                    Boolean(
                        origem[
                            permissao
                        ]
                    )
                ]
            )
        );
    }

    function lerPermissoesArmazenadas(
        valor,
        perfil
    ) {
        const permissoes =
            permissoesPadrao(
                perfil
            );

        let armazenadas = {};

        if (
            typeof valor ===
            "string"
        ) {
            try {
                const convertido =
                    JSON.parse(
                        valor
                    );

                if (
                    convertido &&
                    typeof convertido ===
                        "object" &&
                    !Array.isArray(
                        convertido
                    )
                ) {
                    armazenadas =
                        convertido;
                }
            } catch {
                armazenadas = {};
            }
        } else if (
            valor &&
            typeof valor ===
                "object" &&
            !Array.isArray(
                valor
            )
        ) {
            armazenadas =
                valor;
        }

        for (
            const permissao
            of CHAVES_PERMISSOES
        ) {
            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        armazenadas,
                        permissao
                    )
            ) {
                permissoes[
                    permissao
                ] =
                    Boolean(
                        armazenadas[
                            permissao
                        ]
                    );
            }
        }

        /*
 * Dados pessoais são definidos automaticamente:
 * administrador vê; operador não vê.
 */
permissoes[
    "clientes.dados_pessoais"
] =
    perfil ===
    "administrador";    

        return permissoes;
    }

    function validarPermissoesRecebidas(
        valor,
        permissoesBase
    ) {
        if (
            !valor ||
            typeof valor !==
                "object" ||
            Array.isArray(
                valor
            )
        ) {
            throw new ErroHttp(
                400,
                "As permissões enviadas não são válidas."
            );
        }

        const chavesDesconhecidas =
            Object.keys(
                valor
            ).filter(
                permissao =>
                    !CHAVES_PERMISSOES
                        .includes(
                            permissao
                        )
            );

        if (
            chavesDesconhecidas
                .length
        ) {
            throw new ErroHttp(
                400,

                `Permissão desconhecida: ${
                    chavesDesconhecidas[
                        0
                    ]
                }.`
            );
        }

        const resultado = {
            ...permissoesBase
        };

        for (
            const [
                permissao,
                permitido
            ]
            of Object.entries(
                valor
            )
        ) {
            if (
                typeof permitido !==
                "boolean"
            ) {
                throw new ErroHttp(
                    400,

                    `A permissão ${
                        permissao
                    } deve ser verdadeira ou falsa.`
                );
            }

            resultado[
                permissao
            ] =
                permitido;
        }

        /*
 * Impede que essa permissão interna seja
 * alterada manualmente pela requisição.
 */
resultado[
    "clientes.dados_pessoais"
] =
    Boolean(
        permissoesBase[
            "clientes.dados_pessoais"
        ]
    );

        return resultado;
    }

    function serializarPermissoes(
        permissoes
    ) {
        const organizadas =
            Object.fromEntries(
                CHAVES_PERMISSOES.map(
                    permissao => [
                        permissao,

                        Boolean(
                            permissoes?.[
                                permissao
                            ]
                        )
                    ]
                )
            );

        return JSON.stringify(
            organizadas
        );
    }

    function permissoesDoRegistro(
        registro
    ) {
        return lerPermissoesArmazenadas(
            registro?.permissoes,
            registro?.perfil
        );
    }

    function possuiPermissao(
        registro,
        permissao
    ) {
        if (
            !CHAVES_PERMISSOES
                .includes(
                    permissao
                )
        ) {
            return false;
        }

        return Boolean(
            permissoesDoRegistro(
                registro
            )[permissao]
        );
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

            permissoes:
                permissoesDoRegistro(
                    registro
                ),

            ultimoLoginEm:
                registro
                    .ultimo_login_em ||
                null
        };
    }

    function usuarioGerenciadoPublico(
        registro
    ) {
        if (!registro) {
            return null;
        }

        return {
            id:
                registro.id,

            nome:
                registro.nome,

            usuario:
                registro.usuario,

            perfil:
                registro.perfil,

            permissoes:
                permissoesDoRegistro(
                    registro
                ),

            ativo:
                Boolean(
                    registro.ativo
                ),

            criadoEm:
                registro.criado_em,

            atualizadoEm:
                registro.atualizado_em,

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
            randomBytes(
                16
            );

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

            Buffer
                .from(
                    chave
                )
                .toString(
                    "base64"
                )
        ].join(
            "$"
        );
    }

    async function verificacaoFicticia(
        senha
    ) {
        await derivarSenha(
            String(
                senha ?? ""
            ),

            randomBytes(
                16
            )
        );
    }

    async function verificarSenha(
        senha,
        hashArmazenado
    ) {
        const partes =
            String(
                hashArmazenado ||
                ""
            ).split(
                "$"
            );

        if (
            partes.length !== 6 ||
            partes[0] !==
                "scrypt"
        ) {
            await verificacaoFicticia(
                senha
            );

            return false;
        }

        const parametros = {
            N:
                Number(
                    partes[1]
                ),

            r:
                Number(
                    partes[2]
                ),

            p:
                Number(
                    partes[3]
                ),

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
                request.headers
                    .cookie ||
                ""
            );

        for (
            const parte
            of cabecalho.split(
                ";"
            )
        ) {
            const indice =
                parte.indexOf(
                    "="
                );

            if (
                indice < 0
            ) {
                continue;
            }

            const nome =
                parte
                    .slice(
                        0,
                        indice
                    )
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
                resultado[
                    nome
                ] =
                    decodeURIComponent(
                        valor
                    );
            } catch {
                resultado[
                    nome
                ] =
                    valor;
            }
        }

        return resultado;
    }

    function hashToken(
        token
    ) {
        return createHash(
            "sha256"
        )
            .update(
                String(
                    token
                )
            )
            .digest(
                "hex"
            );
    }

    function obterToken(
        request
    ) {
        return (
            analisarCookies(
                request
            )[
                COOKIE_SESSAO
            ] ||
            ""
        );
    }

    function obterIp(
        request
    ) {
        return String(
            request.socket
                ?.remoteAddress ||
            ""
        ).slice(
            0,
            120
        );
    }

    function obterUserAgent(
        request
    ) {
        return String(
            request.headers[
                "user-agent"
            ] || ""
        ).slice(
            0,
            500
        );
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
            `${
                COOKIE_SESSAO
            }=${
                encodeURIComponent(
                    token
                )
            }`,

            "Path=/",

            "HttpOnly",

            "SameSite=Lax",

            `Max-Age=${
                Math.floor(
                    DURACAO_SESSAO_MS /
                    1000
                )
            }`
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
            partes.join(
                "; "
            )
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
            partes.join(
                "; "
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Sessões e autenticação
    |--------------------------------------------------------------------------
    */

    function criarSessao(
        usuarioId,
        request,
        response
    ) {
        const token =
            randomBytes(
                32
            ).toString(
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

            hashToken(
                token
            ),

            agora.toISOString(),

            expira.toISOString(),

            agora.toISOString(),

            obterIp(
                request
            ),

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
                ?.quantidade ||
            0
        ) > 0;
    }

    function obterSessao(
        request,
        response = null
    ) {
        const token =
            obterToken(
                request
            );

        if (!token) {
            return null;
        }

        const tokenHash =
            hashToken(
                token
            );

        const sessao =
            sql.sessaoPorToken
                .get(
                    tokenHash
                );

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
                new Date(
                    agora
                ).toISOString(),

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

    function exigirPermissao(
        request,
        response,
        permissao
    ) {
        const sessao =
            exigirAutenticacao(
                request,
                response
            );

        if (
            !CHAVES_PERMISSOES
                .includes(
                    permissao
                )
        ) {
            throw new ErroHttp(
                500,
                "A permissão exigida pelo sistema não existe."
            );
        }

        if (
            !sessao.usuario
                .permissoes[
                    permissao
                ]
        ) {
            throw new ErroHttp(
                403,
                "Você não possui permissão para realizar esta ação."
            );
        }

        return sessao;
    }

    function exigirAdministrador(
        request,
        response = null
    ) {
        return exigirPermissao(
            request,
            response,
            "usuarios.gerenciar"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Limite de tentativas de login
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
                `${
                    obterIp(
                        request
                    )
                }|${
                    normalizarUsuario(
                        usuario
                    )
                }`
            )
            .digest(
                "hex"
            );
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
                .get(
                    chave
                );

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
                .get(
                    chave
                );

        let falhas =
            1;

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

            if (
                dentroDaJanela
            ) {
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

        const confirmarSenha =
            String(
                dados?.confirmarSenha ??
                dados?.senha ??
                ""
            );

        if (
            senha !==
            confirmarSenha
        ) {
            throw new ErroHttp(
                400,
                "A confirmação da senha não corresponde."
            );
        }

        if (
            sql.usuarioPorLogin
                .get(
                    usuario
                )
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

        const permissoes =
            serializarPermissoes(
                permissoesPadrao(
                    "administrador"
                )
            );

        sql.inserirUsuarioInicial.run(
            id,
            nome,
            usuario,
            senhaHash,
            agora,
            agora,
            permissoes
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
                .get(
                    id
                )
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
                dados?.senha ??
                ""
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

        if (
            usuario?.ativo
        ) {
            senhaCorreta =
                await verificarSenha(
                    senhaRecebida,
                    usuario
                        .senha_hash
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
         * Mantém apenas uma sessão ativa
         * por usuário.
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
                .get(
                    usuario.id
                )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Atualização da própria conta
    |--------------------------------------------------------------------------
    */

    function atualizarPerfil(
        dados,
        request,
        response
    ) {
        const sessao =
            exigirAutenticacao(
                request,
                response
            );

        const usuarioAtual =
            sql.usuarioPorId
                .get(
                    sessao.usuario.id
                );

        if (
            !usuarioAtual ||
            !usuarioAtual.ativo
        ) {
            throw new ErroHttp(
                404,
                "Usuário não encontrado."
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

        const usuarioExistente =
            sql.usuarioPorLogin
                .get(
                    usuario
                );

        if (
            usuarioExistente &&
            usuarioExistente.id !==
                usuarioAtual.id
        ) {
            throw new ErroHttp(
                409,
                "Este nome de usuário já está em uso."
            );
        }

        const agora =
            new Date()
                .toISOString();

        sql.atualizarPerfil.run(
            nome,
            usuario,
            agora,
            usuarioAtual.id
        );

        return usuarioPublico(
            sql.usuarioPorId
                .get(
                    usuarioAtual.id
                )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Alteração da própria senha
    |--------------------------------------------------------------------------
    */

    async function alterarSenha(
        dados,
        request,
        response
    ) {
        const sessao =
            exigirAutenticacao(
                request,
                response
            );

        const usuarioAtual =
            sql.usuarioPorId
                .get(
                    sessao.usuario.id
                );

        if (
            !usuarioAtual ||
            !usuarioAtual.ativo
        ) {
            throw new ErroHttp(
                404,
                "Usuário não encontrado."
            );
        }

        const senhaAtual =
            String(
                dados?.senhaAtual ??
                ""
            );

        if (!senhaAtual) {
            throw new ErroHttp(
                400,
                "Informe sua senha atual."
            );
        }

        const senhaAtualCorreta =
            await verificarSenha(
                senhaAtual,
                usuarioAtual
                    .senha_hash
            );

        if (
            !senhaAtualCorreta
        ) {
            throw new ErroHttp(
                401,
                "A senha atual está incorreta."
            );
        }

        const novaSenha =
            validarSenha(
                dados?.novaSenha,
                usuarioAtual.usuario
            );

        const confirmarNovaSenha =
            String(
                dados
                    ?.confirmarNovaSenha ??
                ""
            );

        if (
            novaSenha !==
            confirmarNovaSenha
        ) {
            throw new ErroHttp(
                400,
                "A confirmação da nova senha não corresponde."
            );
        }

        const mesmaSenha =
            await verificarSenha(
                novaSenha,
                usuarioAtual
                    .senha_hash
            );

        if (
            mesmaSenha
        ) {
            throw new ErroHttp(
                400,
                "A nova senha deve ser diferente da senha atual."
            );
        }

        const novoHash =
            await criarHashSenha(
                novaSenha
            );

        const agora =
            new Date()
                .toISOString();

        sql.atualizarSenha.run(
            novoHash,
            agora,
            usuarioAtual.id
        );

        sql.excluirSessoesUsuario.run(
            usuarioAtual.id
        );

        criarSessao(
            usuarioAtual.id,
            request,
            response
        );

        return usuarioPublico(
            sql.usuarioPorId
                .get(
                    usuarioAtual.id
                )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Segurança do último gerenciador
    |--------------------------------------------------------------------------
    */

    function contarGestoresAtivosAposAlteracao({
        usuarioId,
        ativo,
        permissoes,
        excluir = false
    }) {
        let quantidade =
            0;

        const usuarios =
            sql.listarUsuariosSeguranca
                .all();

        for (
            const usuario
            of usuarios
        ) {
            if (
                usuario.id ===
                usuarioId
            ) {
                if (
                    excluir ||
                    !ativo
                ) {
                    continue;
                }

                if (
                    permissoes[
                        "usuarios.gerenciar"
                    ]
                ) {
                    quantidade +=
                        1;
                }

                continue;
            }

            if (
                !Boolean(
                    usuario.ativo
                )
            ) {
                continue;
            }

            if (
                possuiPermissao(
                    usuario,
                    "usuarios.gerenciar"
                )
            ) {
                quantidade +=
                    1;
            }
        }

        return quantidade;
    }

    /*
    |--------------------------------------------------------------------------
    | Gerenciamento de usuários
    |--------------------------------------------------------------------------
    */

    function listarUsuarios(
        request,
        response
    ) {
        exigirAdministrador(
            request,
            response
        );

        return sql.listarUsuarios
            .all()
            .map(
                usuarioGerenciadoPublico
            );
    }

    async function criarUsuarioGerenciado(
        dados,
        request,
        response
    ) {
        exigirAdministrador(
            request,
            response
        );

        const nome =
            validarNome(
                dados?.nome
            );

        const usuario =
            validarUsuario(
                dados?.usuario
            );

        const perfil =
            validarPerfil(
                dados?.perfil
            );

        const senha =
            validarSenha(
                dados?.senha,
                usuario
            );

        const confirmarSenha =
            String(
                dados
                    ?.confirmarSenha ??
                ""
            );

        if (
            senha !==
            confirmarSenha
        ) {
            throw new ErroHttp(
                400,
                "A confirmação da senha não corresponde."
            );
        }

        if (
            sql.usuarioPorLogin
                .get(
                    usuario
                )
        ) {
            throw new ErroHttp(
                409,
                "Este nome de usuário já está em uso."
            );
        }

        const permissoesBase =
            permissoesPadrao(
                perfil
            );

        const permissoes =
            dados?.permissoes ===
                undefined

                ? permissoesBase

                : validarPermissoesRecebidas(
                    dados.permissoes,
                    permissoesBase
                );

        const agora =
            new Date()
                .toISOString();

        const id =
            randomUUID();

        const senhaHash =
            await criarHashSenha(
                senha
            );

        sql.inserirUsuarioGerenciado.run(
            id,
            nome,
            usuario,
            senhaHash,
            perfil,
            agora,
            agora,

            serializarPermissoes(
                permissoes
            )
        );

        return usuarioGerenciadoPublico(
            sql.usuarioPorId
                .get(
                    id
                )
        );
    }

    function editarUsuarioGerenciado(
        id,
        dados,
        request,
        response
    ) {
        const sessao =
            exigirAdministrador(
                request,
                response
            );

        const usuarioAtual =
            sql.usuarioPorId
                .get(
                    id
                );

        if (
            !usuarioAtual
        ) {
            throw new ErroHttp(
                404,
                "Usuário não encontrado."
            );
        }

        if (
            usuarioAtual.id ===
            sessao.usuario.id
        ) {
            throw new ErroHttp(
                400,
                "Use a seção Minha conta para alterar seu próprio usuário."
            );
        }

        const nome =
            validarNome(
                dados?.nome ??
                usuarioAtual.nome
            );

        const usuario =
            validarUsuario(
                dados?.usuario ??
                usuarioAtual.usuario
            );

        const perfil =
            validarPerfil(
                dados?.perfil ??
                usuarioAtual.perfil
            );

        const ativo =
            validarSituacaoUsuario(
                dados?.ativo,

                Boolean(
                    usuarioAtual.ativo
                )
            );

        const usuarioExistente =
            sql.usuarioPorLogin
                .get(
                    usuario
                );

        if (
            usuarioExistente &&
            usuarioExistente.id !==
                id
        ) {
            throw new ErroHttp(
                409,
                "Este nome de usuário já está em uso."
            );
        }

        const permissoesAtuais =
            permissoesDoRegistro(
                usuarioAtual
            );

        const perfilMudou =
            perfil !==
            usuarioAtual.perfil;

        const permissoesBase =
            perfilMudou

                ? permissoesPadrao(
                    perfil
                )

                : permissoesAtuais;

        const permissoes =
            dados?.permissoes ===
                undefined

                ? permissoesBase

                : validarPermissoesRecebidas(
                    dados.permissoes,
                    permissoesBase
                );

        const gestoresRestantes =
            contarGestoresAtivosAposAlteracao({
                usuarioId:
                    id,

                ativo,

                permissoes
            });

        if (
            gestoresRestantes < 1
        ) {
            throw new ErroHttp(
                409,
                "O sistema precisa manter pelo menos um usuário ativo com permissão para gerenciar usuários."
            );
        }

        const permissoesSerializadas =
            serializarPermissoes(
                permissoes
            );

        const permissoesAtuaisSerializadas =
            serializarPermissoes(
                permissoesAtuais
            );

        const permissoesMudaram =
            permissoesSerializadas !==
            permissoesAtuaisSerializadas;

        const agora =
            new Date()
                .toISOString();

        sql.atualizarUsuarioGerenciado.run(
            nome,
            usuario,
            perfil,
            ativo
                ? 1
                : 0,

            permissoesSerializadas,

            agora,
            id
        );

        /*
         * Encerra todas as sessões quando
         * perfil, situação ou permissões mudarem.
         */

        if (
            perfilMudou ||
            permissoesMudaram ||

            ativo !==
                Boolean(
                    usuarioAtual.ativo
                )
        ) {
            sql.excluirSessoesUsuario.run(
                id
            );
        }

        return usuarioGerenciadoPublico(
            sql.usuarioPorId
                .get(
                    id
                )
        );
    }

    async function redefinirSenhaGerenciada(
        id,
        dados,
        request,
        response
    ) {
        const sessao =
            exigirAdministrador(
                request,
                response
            );

        const usuarioAtual =
            sql.usuarioPorId
                .get(
                    id
                );

        if (
            !usuarioAtual
        ) {
            throw new ErroHttp(
                404,
                "Usuário não encontrado."
            );
        }

        if (
            usuarioAtual.id ===
            sessao.usuario.id
        ) {
            throw new ErroHttp(
                400,
                "Use a seção Minha conta para alterar sua própria senha."
            );
        }

        const novaSenha =
            validarSenha(
                dados?.novaSenha,
                usuarioAtual.usuario
            );

        const confirmarNovaSenha =
            String(
                dados
                    ?.confirmarNovaSenha ??
                ""
            );

        if (
            novaSenha !==
            confirmarNovaSenha
        ) {
            throw new ErroHttp(
                400,
                "A confirmação da nova senha não corresponde."
            );
        }

        const mesmaSenha =
            await verificarSenha(
                novaSenha,
                usuarioAtual
                    .senha_hash
            );

        if (
            mesmaSenha
        ) {
            throw new ErroHttp(
                400,
                "A nova senha deve ser diferente da senha atual do usuário."
            );
        }

        const senhaHash =
            await criarHashSenha(
                novaSenha
            );

        const agora =
            new Date()
                .toISOString();

        sql.redefinirSenhaUsuario.run(
            senhaHash,
            agora,
            id
        );

        /*
         * Obriga o usuário a entrar
         * novamente com a nova senha.
         */

        sql.excluirSessoesUsuario.run(
            id
        );

        return usuarioGerenciadoPublico(
            sql.usuarioPorId
                .get(
                    id
                )
        );
    }

    function excluirUsuarioGerenciado(
        id,
        request,
        response
    ) {
        const sessao =
            exigirAdministrador(
                request,
                response
            );

        const usuarioAtual =
            sql.usuarioPorId
                .get(
                    id
                );

        if (
            !usuarioAtual
        ) {
            throw new ErroHttp(
                404,
                "Usuário não encontrado."
            );
        }

        if (
            usuarioAtual.id ===
            sessao.usuario.id
        ) {
            throw new ErroHttp(
                400,
                "Você não pode excluir a conta que está utilizando."
            );
        }

        const gestoresRestantes =
            contarGestoresAtivosAposAlteracao({
                usuarioId:
                    id,

                ativo:
                    false,

                permissoes:
                    permissoesDoRegistro(
                        usuarioAtual
                    ),

                excluir:
                    true
            });

        if (
            gestoresRestantes < 1
        ) {
            throw new ErroHttp(
                409,
                "O último usuário com permissão para gerenciar usuários não pode ser excluído."
            );
        }

        sql.excluirUsuarioGerenciado.run(
            id
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Logout e status
    |--------------------------------------------------------------------------
    */

    function encerrarSessao(
        request,
        response
    ) {
        const token =
            obterToken(
                request
            );

        if (token) {
            sql.excluirSessao.run(
                hashToken(
                    token
                )
            );
        }

        limparCookie(
            request,
            response
        );
    }

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
                Boolean(
                    sessao
                ),

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
        alterarSenha,

        autenticar,

        atualizarPerfil,

        criarUsuarioInicial,

        criarUsuarioGerenciado,

        editarUsuarioGerenciado,

        excluirUsuarioGerenciado,

        listarUsuarios,

        redefinirSenhaGerenciada,

        encerrarSessao,

        exigirAutenticacao,

        exigirAdministrador,

        exigirPermissao,

        obterSessao,

        obterStatus,

        sistemaConfigurado,

        encerrar:
            () =>
                clearInterval(
                    temporizador
                )
    };
}

module.exports = {
    criarServicoAutenticacao
};