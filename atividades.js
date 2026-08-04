const {
    randomUUID
} = require(
    "node:crypto"
);

function criarServicoAtividades({
    banco,
    enviarJson
}) {
    banco.exec(`
        CREATE TABLE IF NOT EXISTS atividades_sistema (
            id TEXT PRIMARY KEY,

            usuario_id TEXT
                NOT NULL
                DEFAULT '',

            usuario_nome TEXT
                NOT NULL,

            usuario_login TEXT
                NOT NULL
                DEFAULT '',

            acao TEXT
                NOT NULL,

            entidade TEXT
                NOT NULL,

            entidade_id TEXT
                NOT NULL
                DEFAULT '',

            descricao TEXT
                NOT NULL,

            metodo TEXT
                NOT NULL
                DEFAULT '',

            rota TEXT
                NOT NULL
                DEFAULT '',

            criado_em TEXT
                NOT NULL
        ) STRICT;

        CREATE INDEX IF NOT EXISTS
            indice_atividades_data
        ON atividades_sistema(
            criado_em DESC
        );

        CREATE INDEX IF NOT EXISTS
            indice_atividades_usuario
        ON atividades_sistema(
            usuario_id,
            criado_em DESC
        );

        CREATE INDEX IF NOT EXISTS
            indice_atividades_entidade
        ON atividades_sistema(
            entidade,
            criado_em DESC
        );
    `);

    const inserir =
        banco.prepare(`
            INSERT INTO atividades_sistema (
                id,
                usuario_id,
                usuario_nome,
                usuario_login,
                acao,
                entidade,
                entidade_id,
                descricao,
                metodo,
                rota,
                criado_em
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
        `);

    const removerExcedentes =
        banco.prepare(`
            DELETE FROM atividades_sistema

            WHERE id IN (
                SELECT id

                FROM atividades_sistema

                ORDER BY
                    criado_em DESC

                LIMIT -1 OFFSET 20000
            )
        `);

    function texto(
        valor,
        limite = 500
    ) {
        return String(
            valor ?? ""
        )
            .trim()
            .slice(
                0,
                limite
            );
    }

    function primeiroValor(
        dados,
        chaves
    ) {
        for (
            const chave
            of chaves
        ) {
            const valor =
                texto(
                    dados?.[chave],
                    120
                );

            if (valor) {
                return valor;
            }
        }

        return "";
    }

    function identificarRequisicao(
        request,
        pathname
    ) {
        const metodo =
            String(
                request.method ||
                ""
            ).toUpperCase();

        const dados =
            request.dadosAuditoria ||
            {};

        const partes =
            pathname
                .split("/")
                .filter(Boolean)
                .map(
                    parte => {
                        try {
                            return decodeURIComponent(
                                parte
                            );
                        } catch {
                            return parte;
                        }
                    }
                );

        const base =
            partes[1] ||
            "sistema";

        const id =
            partes[2] ||
            "";

        const entidades = {
            clientes:
                "cliente",

            ordens:
                "ordem",

            linhas:
                "linha",

            matrizes:
                "matriz",

            usuarios:
                "usuário",

            backup:
                "backup",

            auth:
                "conta"
        };

        const entidade =
            entidades[base] ||
            base;

        const nome =
            primeiroValor(
                dados,
                [
                    "nome",
                    "descricao",
                    "usuario",
                    "codigo",
                    "marca"
                ]
            );

        const complemento =
            nome

                ? ` “${nome}”`

                : id

                    ? ` de código ${id}`

                    : "";

        if (
            pathname ===
                "/api/backup/restaurar" &&
            metodo ===
                "POST"
        ) {
            return {
                acao:
                    "restaurar",

                entidade:
                    "backup",

                entidadeId:
                    "",

                descricao:
                    "restaurou um backup do sistema"
            };
        }

        if (
            pathname ===
                "/api/backup" &&
            metodo ===
                "GET"
        ) {
            return {
                acao:
                    "criar",

                entidade:
                    "backup",

                entidadeId:
                    "",

                descricao:
                    "gerou um novo backup do sistema"
            };
        }

        if (
            pathname ===
                "/api/auth/logout" &&
            metodo ===
                "POST"
        ) {
            return {
                acao:
                    "sair",

                entidade:
                    "conta",

                entidadeId:
                    "",

                descricao:
                    "encerrou a sessão no sistema"
            };
        }

        if (
            pathname ===
                "/api/auth/perfil" &&
            metodo ===
                "PUT"
        ) {
            return {
                acao:
                    "editar",

                entidade:
                    "conta",

                entidadeId:
                    "",

                descricao:
                    "atualizou os dados da própria conta"
            };
        }

        if (
            pathname ===
                "/api/auth/senha" &&
            metodo ===
                "PUT"
        ) {
            return {
                acao:
                    "alterar_senha",

                entidade:
                    "conta",

                entidadeId:
                    "",

                descricao:
                    "alterou a senha da própria conta"
            };
        }

        if (
            base ===
                "matrizes" &&
            partes[3] ===
                "arquivar"
        ) {
            return {
                acao:
                    "arquivar",

                entidade:
                    "matriz",

                entidadeId:
                    id,

                descricao:
                    `arquivou a matriz${complemento}`
            };
        }

        if (
            base ===
                "matrizes" &&
            partes[3] ===
                "restaurar"
        ) {
            return {
                acao:
                    "restaurar",

                entidade:
                    "matriz",

                entidadeId:
                    id,

                descricao:
                    `restaurou a matriz${complemento}`
            };
        }

        if (
            base ===
                "usuarios" &&
            partes[3] ===
                "senha"
        ) {
            return {
                acao:
                    "alterar_senha",

                entidade:
                    "usuário",

                entidadeId:
                    id,

                descricao:
                    `redefiniu a senha do usuário${complemento}`
            };
        }

        if (
            base ===
                "clientes" &&
            partes[3] ===
                "arquivos" &&
            metodo ===
                "DELETE"
        ) {
            return {
                acao:
                    "excluir",

                entidade:
                    "arquivo",

                entidadeId:
                    partes[4] ||
                    id,

                descricao:
                    "excluiu um arquivo da Biblioteca"
            };
        }

        if (
            base ===
                "clientes" &&
            !id &&
            metodo ===
                "DELETE"
        ) {
            return {
                acao:
                    "excluir",

                entidade:
                    "cliente",

                entidadeId:
                    "",

                descricao:
                    "excluiu todos os clientes do sistema"
            };
        }

        const acoes = {
            POST: [
                "criar",
                "criou"
            ],

            PUT: [
                "editar",
                "atualizou"
            ],

            PATCH: [
                "editar",
                "atualizou"
            ],

            DELETE: [
                "excluir",
                "excluiu"
            ]
        };

        const [
            acao,
            verbo
        ] =
            acoes[metodo] ||
            [
                "alterar",
                "alterou"
            ];

        const artigo =
            [
                "ordem",
                "linha",
                "matriz",
                "conta"
            ].includes(
                entidade
            )

                ? "a"

                : "o";

        return {
            acao,

            entidade,

            entidadeId:
                id,

            descricao:
                `${verbo} ${artigo} ${entidade}${complemento}`
        };
    }

    function registrar({
        usuario,
        acao,
        entidade,
        entidadeId = "",
        descricao,
        metodo = "",
        rota = ""
    }) {
        if (!usuario) {
            return;
        }

        inserir.run(
            randomUUID(),

            texto(
                usuario.id,
                100
            ),

            texto(
                usuario.nome ||
                usuario.usuario ||
                "Usuário",
                120
            ),

            texto(
                usuario.usuario,
                80
            ),

            texto(
                acao,
                50
            ),

            texto(
                entidade,
                50
            ),

            texto(
                entidadeId,
                120
            ),

            texto(
                descricao,
                500
            ),

            texto(
                metodo,
                10
            ),

            texto(
                rota,
                500
            ),

            new Date()
                .toISOString()
        );

        removerExcedentes.run();
    }

    function registrarRequisicao({
        request,
        pathname,
        usuario
    }) {
        registrar({
            usuario,

            ...identificarRequisicao(
                request,
                pathname
            ),

            metodo:
                request.method,

            rota:
                pathname
        });
    }

    function listar(
        url,
        response
    ) {
        const busca =
            texto(
                url.searchParams.get(
                    "busca"
                ),
                120
            );

        const acao =
            texto(
                url.searchParams.get(
                    "acao"
                ),
                50
            );

        const entidade =
            texto(
                url.searchParams.get(
                    "entidade"
                ),
                50
            );

        const limiteRecebido =
            Number(
                url.searchParams.get(
                    "limite"
                ) ||
                300
            );

        const limite =
            Math.min(
                Math.max(
                    Number.isFinite(
                        limiteRecebido
                    )

                        ? Math.trunc(
                            limiteRecebido
                        )

                        : 300,

                    1
                ),

                1000
            );

        const condicoes = [];
        const parametros = [];

        if (busca) {
            condicoes.push(`
                (
                    usuario_nome LIKE ?
                        COLLATE NOCASE

                    OR usuario_login LIKE ?
                        COLLATE NOCASE

                    OR descricao LIKE ?
                        COLLATE NOCASE

                    OR entidade_id LIKE ?
                        COLLATE NOCASE
                )
            `);

            const termo =
                `%${busca}%`;

            parametros.push(
                termo,
                termo,
                termo,
                termo
            );
        }

        if (
            acao &&
            acao !==
                "todas"
        ) {
            condicoes.push(
                "acao = ?"
            );

            parametros.push(
                acao
            );
        }

        if (
            entidade &&
            entidade !==
                "todas"
        ) {
            condicoes.push(
                "entidade = ?"
            );

            parametros.push(
                entidade
            );
        }

        const where =
            condicoes.length

                ? `WHERE ${
                    condicoes.join(
                        " AND "
                    )
                }`

                : "";

        const atividades =
            banco.prepare(`
                SELECT
                    id,
                    usuario_id,
                    usuario_nome,
                    usuario_login,
                    acao,
                    entidade,
                    entidade_id,
                    descricao,
                    metodo,
                    rota,
                    criado_em

                FROM atividades_sistema

                ${where}

                ORDER BY
                    criado_em DESC

                LIMIT ?
            `)
                .all(
                    ...parametros,
                    limite
                )
                .map(
                    item => ({
                        id:
                            item.id,

                        usuarioId:
                            item.usuario_id,

                        usuarioNome:
                            item.usuario_nome,

                        usuarioLogin:
                            item.usuario_login,

                        acao:
                            item.acao,

                        entidade:
                            item.entidade,

                        entidadeId:
                            item.entidade_id,

                        descricao:
                            item.descricao,

                        metodo:
                            item.metodo,

                        rota:
                            item.rota,

                        criadoEm:
                            item.criado_em
                    })
                );

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                atividades,

                total:
                    atividades.length
            }
        );
    }

    return {
        listar,
        registrar,
        registrarRequisicao
    };
}

module.exports = {
    criarServicoAtividades
};
