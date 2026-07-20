const {
    randomUUID
} = require("node:crypto");

const UNIDADES_LINHA =
    new Set([
        "cone",
        "carretel",
        "metro",
        "unidade"
    ]);

function criarServicoLinhas({
    banco,
    ErroHttp,
    enviarJson,
    lerJson
}) {
    /*
    |--------------------------------------------------------------------------
    | Tabela
    |--------------------------------------------------------------------------
    */

    banco.exec(`
        CREATE TABLE IF NOT EXISTS catalogo_linhas (
            id TEXT
                PRIMARY KEY,

            marca TEXT
                NOT NULL,

            codigo TEXT
                NOT NULL,

            nome TEXT
                NOT NULL,

            cor_hex TEXT
                NOT NULL
                DEFAULT '',

            unidade TEXT
                NOT NULL
                DEFAULT 'cone'
                CHECK (
                    unidade IN (
                        'cone',
                        'carretel',
                        'metro',
                        'unidade'
                    )
                ),

            estoque REAL
                NOT NULL
                DEFAULT 0
                CHECK (
                    estoque >= 0
                ),

            estoque_minimo REAL
                NOT NULL
                DEFAULT 0
                CHECK (
                    estoque_minimo >= 0
                ),

            ativo INTEGER
                NOT NULL
                DEFAULT 1
                CHECK (
                    ativo IN (0, 1)
                ),

            observacoes TEXT
                NOT NULL
                DEFAULT '',

            criado_em TEXT
                NOT NULL,

            atualizado_em TEXT
                NOT NULL
        ) STRICT;

        CREATE UNIQUE INDEX IF NOT EXISTS
            indice_catalogo_linhas_marca_codigo

        ON catalogo_linhas (
            marca COLLATE NOCASE,
            codigo COLLATE NOCASE
        );

        CREATE INDEX IF NOT EXISTS
            indice_catalogo_linhas_nome

        ON catalogo_linhas (
            nome COLLATE NOCASE
        );

        CREATE INDEX IF NOT EXISTS
            indice_catalogo_linhas_estoque

        ON catalogo_linhas (
            estoque
        );
    `);

    const CAMPOS_SQL = `
    id,
    marca,
    codigo,
    nome,
    fornecedor,
    valor_centavos,
    cor_hex,
    unidade,
    estoque,
    estoque_minimo,
    ativo,
    observacoes,
    criado_em,
    atualizado_em
`;

    /*
|--------------------------------------------------------------------------
| Migração de fornecedor e valor
|--------------------------------------------------------------------------
*/

const colunasCatalogoLinhas =
    new Set(
        banco
            .prepare(
                "PRAGMA table_info(catalogo_linhas)"
            )
            .all()
            .map(
                coluna =>
                    coluna.name
            )
    );

if (
    !colunasCatalogoLinhas.has(
        "fornecedor"
    )
) {
    banco.exec(`
        ALTER TABLE catalogo_linhas
        ADD COLUMN fornecedor TEXT
            NOT NULL
            DEFAULT '';
    `);
}

if (
    !colunasCatalogoLinhas.has(
        "valor_centavos"
    )
) {
    banco.exec(`
        ALTER TABLE catalogo_linhas
        ADD COLUMN valor_centavos INTEGER
            NOT NULL
            DEFAULT 0
            CHECK (
                valor_centavos >= 0
            );
    `);
}

    /*
    |--------------------------------------------------------------------------
    | Consultas
    |--------------------------------------------------------------------------
    */

    const consultarLinhaPorId =
        banco.prepare(`
            SELECT
                ${CAMPOS_SQL}

            FROM catalogo_linhas

            WHERE id = ?
        `);

    const consultarDuplicidade =
        banco.prepare(`
            SELECT
                id

            FROM catalogo_linhas

            WHERE
                marca = ?
                    COLLATE NOCASE

                AND codigo = ?
                    COLLATE NOCASE

                AND id <> ?

            LIMIT 1
        `);

    const inserirLinha =
    banco.prepare(`
        INSERT INTO catalogo_linhas (
            id,
            marca,
            codigo,
            nome,
            fornecedor,
            valor_centavos,
            cor_hex,
            unidade,
            estoque,
            estoque_minimo,
            ativo,
            observacoes,
            criado_em,
            atualizado_em
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `);

    const atualizarLinha =
    banco.prepare(`
        UPDATE catalogo_linhas

        SET
            marca = ?,
            codigo = ?,
            nome = ?,
            fornecedor = ?,
            valor_centavos = ?,
            cor_hex = ?,
            unidade = ?,
            estoque = ?,
            estoque_minimo = ?,
            ativo = ?,
            observacoes = ?,
            atualizado_em = ?

        WHERE id = ?
    `);

    const excluirLinha =
        banco.prepare(`
            DELETE FROM catalogo_linhas
            WHERE id = ?
        `);

    /*
    |--------------------------------------------------------------------------
    | Funções auxiliares
    |--------------------------------------------------------------------------
    */

    function limparTexto(
        valor
    ) {
        return String(
            valor ?? ""
        ).trim();
    }

    function converterNumero(
        valor,
        nomeCampo
    ) {
        const texto =
            limparTexto(valor)
                .replace(
                    ",",
                    "."
                );

        if (!texto) {
            return 0;
        }

        const numero =
            Number(texto);

        if (
            !Number.isFinite(numero) ||
            numero < 0
        ) {
            throw new ErroHttp(
                400,
                `Informe um valor válido para ${nomeCampo}.`
            );
        }

        return numero;
    }

    function converterValorParaCentavos(
    valor
) {
    let texto =
        limparTexto(
            valor
        )
            .replace(
                /R\$/gi,
                ""
            )
            .replace(
                /\s/g,
                ""
            )
            .replace(
                /[^\d,.-]/g,
                ""
            );

    if (!texto) {
        return 0;
    }

    if (
        texto.includes(",")
    ) {
        texto =
            texto
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );
    }

    const numero =
        Number(
            texto
        );

    if (
        !Number.isFinite(
            numero
        ) ||
        numero < 0
    ) {
        throw new ErroHttp(
            400,
            "Informe um valor válido para a linha."
        );
    }

    const centavos =
        Math.round(
            numero * 100
        );

    if (
        centavos >
        99999999999
    ) {
        throw new ErroHttp(
            400,
            "O valor informado é muito alto."
        );
    }

    return centavos;
}

    function converterAtivo(
        valor,
        padrao = 1
    ) {
        if (
            valor === undefined ||
            valor === null
        ) {
            return padrao;
        }

        if (
            valor === false ||
            valor === 0 ||
            valor === "0" ||
            valor === "false" ||
            valor === "nao" ||
            valor === "não"
        ) {
            return 0;
        }

        return 1;
    }

    function validarCorHex(
        valor
    ) {
        const cor =
            limparTexto(valor);

        if (!cor) {
            return "";
        }

        if (
            !/^#[0-9a-fA-F]{6}$/
                .test(cor)
        ) {
            throw new ErroHttp(
                400,
                "A cor precisa estar no formato #RRGGBB."
            );
        }

        return cor.toUpperCase();
    }

    function validarDadosLinha(
        dados,
        linhaAtual = null
    ) {
        const marca =
            limparTexto(
                dados.marca ??
                linhaAtual?.marca
            );

        const codigo =
            limparTexto(
                dados.codigo ??
                linhaAtual?.codigo
            );

        const nome =
            limparTexto(
                dados.nome ??
                linhaAtual?.nome
            );

        const fornecedor =
    limparTexto(
        dados.fornecedor ??
        linhaAtual?.fornecedor
    );

const valorCentavos =
    Object.hasOwn(
        dados,
        "valor"
    )
        ? converterValorParaCentavos(
            dados.valor
        )
        : Number(
            linhaAtual
                ?.valor_centavos ??
            0
        );

        const corHex =
            validarCorHex(
                dados.corHex ??
                linhaAtual?.cor_hex
            );

        const unidade =
            limparTexto(
                dados.unidade ??
                linhaAtual?.unidade ??
                "cone"
            ).toLowerCase();

        const estoque =
            Object.hasOwn(
                dados,
                "estoque"
            )
                ? converterNumero(
                    dados.estoque,
                    "o estoque"
                )
                : Number(
                    linhaAtual?.estoque ??
                    0
                );

        const estoqueMinimo =
            Object.hasOwn(
                dados,
                "estoqueMinimo"
            )
                ? converterNumero(
                    dados.estoqueMinimo,
                    "o estoque mínimo"
                )
                : Number(
                    linhaAtual
                        ?.estoque_minimo ??
                    0
                );

        const ativo =
            converterAtivo(
                dados.ativo,
                linhaAtual?.ativo ?? 1
            );

        if (
    fornecedor.length >
    120
) {
    throw new ErroHttp(
        400,
        "O fornecedor pode ter no máximo 120 caracteres."
    );
}

        const observacoes =
            limparTexto(
                dados.observacoes ??
                linhaAtual?.observacoes
            );

        if (
            marca.length < 2 ||
            marca.length > 80
        ) {
            throw new ErroHttp(
                400,
                "A marca deve possuir entre 2 e 80 caracteres."
            );
        }

        if (
            codigo.length < 1 ||
            codigo.length > 50
        ) {
            throw new ErroHttp(
                400,
                "O código deve possuir entre 1 e 50 caracteres."
            );
        }

        if (
            nome.length < 2 ||
            nome.length > 100
        ) {
            throw new ErroHttp(
                400,
                "O nome da cor deve possuir entre 2 e 100 caracteres."
            );
        }

        if (
            !UNIDADES_LINHA.has(
                unidade
            )
        ) {
            throw new ErroHttp(
                400,
                "A unidade de estoque não é válida."
            );
        }

        if (
            observacoes.length >
            1000
        ) {
            throw new ErroHttp(
                400,
                "As observações podem ter no máximo 1000 caracteres."
            );
        }

        const duplicada =
            consultarDuplicidade.get(
                marca,
                codigo,
                linhaAtual?.id || ""
            );

        if (duplicada) {
            throw new ErroHttp(
                409,
                "Já existe uma linha dessa marca com o mesmo código."
            );
        }

        return {
    marca,
    codigo,
    nome,
    fornecedor,
    valorCentavos,
    corHex,
    unidade,
    estoque,
    estoqueMinimo,
    ativo,
    observacoes
};
    }

    function converterLinha(
        linha
    ) {
        if (!linha) {
            return null;
        }

        let statusEstoque =
            "disponivel";

        if (
            Number(linha.estoque) <= 0
        ) {
            statusEstoque =
                "zerado";
        } else if (
            Number(linha.estoque) <=
            Number(
                linha.estoque_minimo
            )
        ) {
            statusEstoque =
                "baixo";
        }

        return {
            id:
                linha.id,

            marca:
                linha.marca,

            codigo:
                linha.codigo,

            nome:
                linha.nome,

            fornecedor:
    linha.fornecedor || "",

valorCentavos:
    Number(
        linha.valor_centavos || 0
    ),

valor:
    Number(
        linha.valor_centavos || 0
    ) / 100,

            corHex:
                linha.cor_hex,

            unidade:
                linha.unidade,

            estoque:
                Number(
                    linha.estoque
                ),

            estoqueMinimo:
                Number(
                    linha.estoque_minimo
                ),

            estoqueBaixo:
                statusEstoque !==
                "disponivel",

            statusEstoque,

            ativo:
                Boolean(
                    linha.ativo
                ),

            observacoes:
                linha.observacoes,

            criadoEm:
                linha.criado_em,

            atualizadoEm:
                linha.atualizado_em
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Listar linhas
    |--------------------------------------------------------------------------
    */

    function listar(
        url,
        response
    ) {
        const busca =
            limparTexto(
                url.searchParams.get(
                    "busca"
                )
            );

        const estoqueFiltro =
            limparTexto(
                url.searchParams.get(
                    "estoque"
                )
            );

        const ativoFiltro =
            limparTexto(
                url.searchParams.get(
                    "ativo"
                )
            );

        const condicoes = [];
        const parametros = [];

        if (busca) {
            const termo =
                `%${busca}%`;

            condicoes.push(`
    (
        marca LIKE ?
            COLLATE NOCASE

        OR codigo LIKE ?
            COLLATE NOCASE

        OR nome LIKE ?
            COLLATE NOCASE

        OR fornecedor LIKE ?
            COLLATE NOCASE
    )
`);

parametros.push(
    termo,
    termo,
    termo,
    termo
);
        }

        if (
            ativoFiltro ===
            "ativos"
        ) {
            condicoes.push(
                "ativo = 1"
            );
        }

        if (
            ativoFiltro ===
            "inativos"
        ) {
            condicoes.push(
                "ativo = 0"
            );
        }

        if (
            estoqueFiltro ===
            "zerado"
        ) {
            condicoes.push(
                "estoque <= 0"
            );
        }

        if (
            estoqueFiltro ===
            "baixo"
        ) {
            condicoes.push(`
                estoque > 0
                AND estoque <=
                    estoque_minimo
            `);
        }

        if (
            estoqueFiltro ===
            "disponivel"
        ) {
            condicoes.push(`
                estoque >
                    estoque_minimo
            `);
        }

        const sql = `
            SELECT
                ${CAMPOS_SQL}

            FROM catalogo_linhas

            ${
                condicoes.length
                    ? `WHERE ${
                        condicoes.join(
                            " AND "
                        )
                    }`
                    : ""
            }

            ORDER BY
                ativo DESC,
                marca COLLATE NOCASE,
                nome COLLATE NOCASE
        `;

        const linhas =
            banco
                .prepare(sql)
                .all(
                    ...parametros
                )
                .map(
                    converterLinha
                );

        enviarJson(
            response,
            200,
            {
                sucesso: true,
                linhas
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Obter linha
    |--------------------------------------------------------------------------
    */

    function obter(
        response,
        id
    ) {
        const linha =
            consultarLinhaPorId.get(
                id
            );

        if (!linha) {
            throw new ErroHttp(
                404,
                "Linha não encontrada."
            );
        }

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                linha:
                    converterLinha(
                        linha
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Criar linha
    |--------------------------------------------------------------------------
    */

    async function criar(
        request,
        response
    ) {
        const dadosRecebidos =
            await lerJson(
                request
            );

        const dados =
            validarDadosLinha(
                dadosRecebidos
            );

        const id =
            randomUUID();

        const agora =
            new Date()
                .toISOString();

        inserirLinha.run(
    id,
    dados.marca,
    dados.codigo,
    dados.nome,
    dados.fornecedor,
    dados.valorCentavos,
    dados.corHex,
    dados.unidade,
    dados.estoque,
    dados.estoqueMinimo,
    dados.ativo,
    dados.observacoes,
    agora,
    agora
);

        enviarJson(
            response,
            201,
            {
                sucesso: true,

                mensagem:
                    "Linha cadastrada com sucesso.",

                linha:
                    converterLinha(
                        consultarLinhaPorId.get(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Editar linha
    |--------------------------------------------------------------------------
    */

    async function editar(
        request,
        response,
        id
    ) {
        const linhaAtual =
            consultarLinhaPorId.get(
                id
            );

        if (!linhaAtual) {
            throw new ErroHttp(
                404,
                "Linha não encontrada."
            );
        }

        const dadosRecebidos =
            await lerJson(
                request
            );

        const dados =
            validarDadosLinha(
                dadosRecebidos,
                linhaAtual
            );

        atualizarLinha.run(
    dados.marca,
    dados.codigo,
    dados.nome,
    dados.fornecedor,
    dados.valorCentavos,
    dados.corHex,
    dados.unidade,
    dados.estoque,
    dados.estoqueMinimo,
    dados.ativo,
    dados.observacoes,
    new Date()
        .toISOString(),
    id
);

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Linha atualizada com sucesso.",

                linha:
                    converterLinha(
                        consultarLinhaPorId.get(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Excluir linha
    |--------------------------------------------------------------------------
    */

    function remover(
        response,
        id
    ) {
        const linha =
            consultarLinhaPorId.get(
                id
            );

        if (!linha) {
            throw new ErroHttp(
                404,
                "Linha não encontrada."
            );
        }

        excluirLinha.run(
            id
        );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Linha excluída com sucesso."
            }
        );
    }

    return {
        listar,
        obter,
        criar,
        editar,
        remover
    };
}

module.exports = {
    criarServicoLinhas
};