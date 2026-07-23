const {
    randomUUID
} = require("node:crypto");

const STATUS_ORDENS =
    new Set([
        "aguardando-arquivo",
        "aguardando-aprovacao",
        "pronto-producao",
        "em-producao",
        "concluido",
        "entregue",
        "cancelado"
    ]);

const ROTULOS_STATUS = {
    "aguardando-arquivo":
        "Aguardando arquivo",

    "aguardando-aprovacao":
        "Aguardando aprovação",

    "pronto-producao":
        "Pronto para produzir",

    "em-producao":
        "Em produção",

    concluido:
        "Concluído",

    entregue:
        "Entregue",

    cancelado:
        "Cancelado"
};

function criarServicoOrdens({
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
        CREATE TABLE IF NOT EXISTS ordens (
            numero INTEGER
                PRIMARY KEY
                AUTOINCREMENT,

            id TEXT
                NOT NULL
                UNIQUE,

            cliente_id TEXT
                REFERENCES clientes(id)
                ON DELETE SET NULL,

            cliente_nome TEXT
                NOT NULL,

            cliente_cpf TEXT
                NOT NULL
                DEFAULT '',

            descricao TEXT
                NOT NULL,

            quantidade INTEGER
                NOT NULL
                CHECK (quantidade > 0),

            linha TEXT
                NOT NULL
                DEFAULT '',

            prazo_entrega TEXT
                NOT NULL,

            valor_centavos INTEGER
                NOT NULL
                DEFAULT 0
                CHECK (valor_centavos >= 0),

            status TEXT
                NOT NULL
                CHECK (
                    status IN (
                        'aguardando-arquivo',
                        'aguardando-aprovacao',
                        'pronto-producao',
                        'em-producao',
                        'concluido',
                        'entregue',
                        'cancelado'
                    )
                ),

            arquivo_original_id TEXT
    REFERENCES cliente_arquivos(id)
    ON DELETE SET NULL,

arquivo_original TEXT
    NOT NULL
    DEFAULT '',

arquivo_convertido_id TEXT
    REFERENCES cliente_arquivos(id)
    ON DELETE SET NULL,

arquivo_convertido TEXT
    NOT NULL
    DEFAULT '',

            observacoes TEXT
                NOT NULL
                DEFAULT '',

            criado_em TEXT
                NOT NULL,

            atualizado_em TEXT
                NOT NULL
        ) STRICT;

        CREATE INDEX IF NOT EXISTS
            indice_ordens_cliente
        ON ordens(cliente_id);

        CREATE INDEX IF NOT EXISTS
            indice_ordens_status
        ON ordens(status);

        CREATE INDEX IF NOT EXISTS
            indice_ordens_prazo
        ON ordens(prazo_entrega);

        CREATE INDEX IF NOT EXISTS
            indice_ordens_criado_em
        ON ordens(criado_em);
    `);

    function garantirColunaOrdem(
    nome,
    definicao
) {
    const existe =
        banco
            .prepare(
                "PRAGMA table_info(ordens)"
            )
            .all()
            .some(
                coluna =>
                    coluna.name === nome
            );

    if (existe) {
        return false;
    }

    banco.exec(`
        ALTER TABLE ordens
        ADD COLUMN ${nome}
        ${definicao}
    `);

    return true;
}

const colunaArquivoOriginalCriada =
    garantirColunaOrdem(
        "arquivo_original_id",
        `
            TEXT
            REFERENCES cliente_arquivos(id)
            ON DELETE SET NULL
        `
    );

const colunaArquivoConvertidoCriada =
    garantirColunaOrdem(
        "arquivo_convertido_id",
        `
            TEXT
            REFERENCES cliente_arquivos(id)
            ON DELETE SET NULL
        `
    );

const precisaMigrarArquivosOrdens =
    colunaArquivoOriginalCriada ||
    colunaArquivoConvertidoCriada;

/*
|--------------------------------------------------------------------------
| Migração dos arquivos das ordens existentes
|--------------------------------------------------------------------------
*/

if (precisaMigrarArquivosOrdens) {

banco.exec(`
    DROP TRIGGER IF EXISTS
        sincronizar_ordens_apos_alterar_arquivos_cliente;

    UPDATE ordens

    SET arquivo_original_id =
        COALESCE(
            (
                SELECT
                    arquivo.id

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.cliente_id =
                        ordens.cliente_id

                    AND arquivo.tipo =
                        'original'

                    AND arquivo.nome_original =
                        ordens.arquivo_original

                ORDER BY
                    arquivo.criado_em ASC,
                    arquivo.id ASC

                LIMIT 1
            ),

            (
                SELECT
                    arquivo.id

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.cliente_id =
                        ordens.cliente_id

                    AND arquivo.tipo =
                        'original'

                ORDER BY
                    arquivo.criado_em ASC,
                    arquivo.id ASC

                LIMIT 1
            )
        )

    WHERE
        cliente_id IS NOT NULL

        AND COALESCE(
            arquivo_original_id,
            ''
        ) = '';

    UPDATE ordens

    SET arquivo_convertido_id =
        COALESCE(
            (
                SELECT
                    arquivo.id

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.cliente_id =
                        ordens.cliente_id

                    AND arquivo.tipo =
                        'convertido'

                    AND arquivo.nome_original =
                        ordens.arquivo_convertido

                ORDER BY
                    arquivo.criado_em ASC,
                    arquivo.id ASC

                LIMIT 1
            ),

            (
                SELECT
                    arquivo.id

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.cliente_id =
                        ordens.cliente_id

                    AND arquivo.tipo =
                        'convertido'

                ORDER BY
                    arquivo.criado_em ASC,
                    arquivo.id ASC

                LIMIT 1
            )
        )

    WHERE
        cliente_id IS NOT NULL

        AND COALESCE(
            arquivo_convertido_id,
            ''
        ) = '';

    UPDATE ordens

    SET arquivo_original =
        COALESCE(
            (
                SELECT
                    arquivo.nome_original

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.id =
                        ordens.arquivo_original_id
            ),

            arquivo_original
        )

    WHERE
        arquivo_original_id IS NOT NULL;

    UPDATE ordens

    SET arquivo_convertido =
        COALESCE(
            (
                SELECT
                    arquivo.nome_original

                FROM cliente_arquivos
                    AS arquivo

                WHERE
                    arquivo.id =
                        ordens.arquivo_convertido_id
            ),

            arquivo_convertido
        )

    WHERE
        arquivo_convertido_id IS NOT NULL;
    `);
}

const CAMPOS_ORDEM_SQL = `
    numero,
    id,
    cliente_id,
    cliente_nome,
    cliente_cpf,
    descricao,
    quantidade,
    linha,
    prazo_entrega,
    valor_centavos,
    status,
    arquivo_original_id,
    arquivo_original,
    arquivo_convertido_id,
    arquivo_convertido,
    observacoes,
    criado_em,
    atualizado_em
`;

    /*
    |--------------------------------------------------------------------------
    | Consultas
    |--------------------------------------------------------------------------
    */

    const consultaClientePorId =
        banco.prepare(`
            SELECT
                id,
                nome,
                cpf,
                linha,
                logo_original,
                logo_convertida
            FROM clientes
            WHERE id = ?
        `);

    const consultaOrdemPorId =
        banco.prepare(`
            SELECT
                ${CAMPOS_ORDEM_SQL}
            FROM ordens
            WHERE id = ?
        `);

const inserirOrdem =
    banco.prepare(`
        INSERT INTO ordens (
            id,
            cliente_id,
            cliente_nome,
            cliente_cpf,
            descricao,
            quantidade,
            linha,
            prazo_entrega,
            valor_centavos,
            status,
            arquivo_original_id,
            arquivo_original,
            arquivo_convertido_id,
            arquivo_convertido,
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
            ?,
            ?,
            ?,
            ?
        )
    `);

const atualizarOrdem =
    banco.prepare(`
        UPDATE ordens

        SET
            cliente_id = ?,
            cliente_nome = ?,
            cliente_cpf = ?,
            descricao = ?,
            quantidade = ?,
            linha = ?,
            prazo_entrega = ?,
            valor_centavos = ?,
            status = ?,
            arquivo_original_id = ?,
            arquivo_original = ?,
            arquivo_convertido_id = ?,
            arquivo_convertido = ?,
            observacoes = ?,
            atualizado_em = ?

        WHERE id = ?
    `);

    const excluirOrdem =
        banco.prepare(`
            DELETE FROM ordens
            WHERE id = ?
        `);

    const consultaArquivoClientePorId =
    banco.prepare(`
        SELECT
            id,
            cliente_id,
            tipo,
            nome_original,
            caminho_arquivo,
            criado_em

        FROM cliente_arquivos

        WHERE
            id = ?
            AND cliente_id = ?
            AND tipo = ?

        LIMIT 1
    `);

const consultaPrimeiroArquivoCliente =
    banco.prepare(`
        SELECT
            id,
            cliente_id,
            tipo,
            nome_original,
            caminho_arquivo,
            criado_em

        FROM cliente_arquivos

        WHERE
            cliente_id = ?
            AND tipo = ?

        ORDER BY
            criado_em ASC,
            id ASC

        LIMIT 1
    `);

    /*
    |--------------------------------------------------------------------------
    | Funções auxiliares
    |--------------------------------------------------------------------------
    */

    function limparTexto(valor) {
        return String(
            valor ?? ""
        ).trim();
    }

    function converterValorParaCentavos(
        valor
    ) {
        if (
            Number.isInteger(valor)
        ) {
            return valor;
        }

        let texto =
            limparTexto(valor)
                .replace(
                    /R\$/gi,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                );

        if (!texto) {
            return 0;
        }

        /*
         * Permite valores como:
         * 150
         * 150,00
         * 1.500,00
         */
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
            Number(texto);

        if (
            !Number.isFinite(numero) ||
            numero < 0
        ) {
            throw new ErroHttp(
                400,
                "Informe um valor válido para a ordem."
            );
        }

        return Math.round(
            numero * 100
        );
    }

    function validarData(valor) {
        const data =
            limparTexto(valor);

        if (
            !/^\d{4}-\d{2}-\d{2}$/
                .test(data)
        ) {
            throw new ErroHttp(
                400,
                "Informe o prazo de entrega."
            );
        }

        const dataTeste =
            new Date(
                `${data}T00:00:00Z`
            );

        if (
            Number.isNaN(
                dataTeste.getTime()
            ) ||
            dataTeste
                .toISOString()
                .slice(0, 10) !==
                data
        ) {
            throw new ErroHttp(
                400,
                "O prazo de entrega não é válido."
            );
        }

        return data;
    }

function definirStatusInicial(
    arquivoOriginal,
    arquivoConvertido
) {
    if (arquivoConvertido) {
        return "pronto-producao";
    }

    if (arquivoOriginal) {
        return "aguardando-aprovacao";
    }

    return "aguardando-arquivo";
}

function resolverArquivoOrdem({
    dados,
    ordemAtual,
    cliente,
    tipo
}) {
    const original =
        tipo === "original";

    const campoRecebido =
        original
            ? "arquivoOriginalId"
            : "arquivoConvertidoId";

    const colunaAtual =
        original
            ? "arquivo_original_id"
            : "arquivo_convertido_id";

    if (
        Object.hasOwn(
            dados,
            campoRecebido
        )
    ) {
        const arquivoId =
            limparTexto(
                dados[
                    campoRecebido
                ]
            );

        if (!arquivoId) {
            return null;
        }

        const arquivo =
            consultaArquivoClientePorId
                .get(
                    arquivoId,
                    cliente.id,
                    tipo
                );

        if (!arquivo) {
            throw new ErroHttp(
                400,

                original
                    ? "A logo original selecionada não pertence ao cliente."
                    : "O arquivo convertido selecionado não pertence ao cliente."
            );
        }

        return arquivo;
    }

    const arquivoAtualId =
        limparTexto(
            ordemAtual?.[
                colunaAtual
            ]
        );

    if (arquivoAtualId) {
        const arquivoAtual =
            consultaArquivoClientePorId
                .get(
                    arquivoAtualId,
                    cliente.id,
                    tipo
                );

        if (arquivoAtual) {
            return arquivoAtual;
        }
    }

    return (
        consultaPrimeiroArquivoCliente
            .get(
                cliente.id,
                tipo
            ) ||
        null
    );
}

    function validarDadosOrdem(
        dados,
        ordemAtual = null
    ) {
        const clienteId =
            limparTexto(
                dados.clienteId ??
                ordemAtual?.cliente_id
            );

        const cliente =
            consultaClientePorId.get(
                clienteId
            );

        if (!cliente) {
            throw new ErroHttp(
                400,
                "Selecione um cliente válido."
            );
        }

        const arquivoOriginal =
    resolverArquivoOrdem({
        dados,
        ordemAtual,
        cliente,
        tipo:
            "original"
    });

const arquivoConvertido =
    resolverArquivoOrdem({
        dados,
        ordemAtual,
        cliente,
        tipo:
            "convertido"
    });

        const descricao =
            limparTexto(
                dados.descricao ??
                ordemAtual?.descricao
            );

        if (
            descricao.length < 3 ||
            descricao.length > 200
        ) {
            throw new ErroHttp(
                400,
                "A descrição deve possuir entre 3 e 200 caracteres."
            );
        }

        const quantidade =
            Number(
                dados.quantidade ??
                ordemAtual?.quantidade ??
                1
            );

        if (
            !Number.isInteger(
                quantidade
            ) ||
            quantidade < 1 ||
            quantidade > 100000
        ) {
            throw new ErroHttp(
                400,
                "Informe uma quantidade válida."
            );
        }

        const linhas =
    String(
        dados.linha ??
        ordemAtual?.linha ??
        cliente.linha ??
        ""
    )
        .split(
            /\r?\n/
        )
        .map(
            limparTexto
        )
        .filter(
            Boolean
        );

const linhasUnicas =
    [
        ...new Set(
            linhas
        )
    ];

const linha =
    linhasUnicas.join(
        "\n"
    );

if (!linhasUnicas.length) {
    throw new ErroHttp(
        400,
        "Informe pelo menos uma linha utilizada."
    );
}

if (
    linhasUnicas.some(
        item =>
            item.length > 200
    ) ||
    linha.length > 2000
) {
    throw new ErroHttp(
        400,
        "As linhas selecionadas ultrapassaram o limite permitido."
    );
}

        const prazoEntrega =
            validarData(
                dados.prazoEntrega ??
                ordemAtual
                    ?.prazo_entrega
            );

        let valorCentavos;

        if (
            Object.hasOwn(
                dados,
                "valorCentavos"
            )
        ) {
            valorCentavos =
                converterValorParaCentavos(
                    dados.valorCentavos
                );
        } else if (
            Object.hasOwn(
                dados,
                "valor"
            )
        ) {
            valorCentavos =
                converterValorParaCentavos(
                    dados.valor
                );
        } else {
            valorCentavos =
                ordemAtual
                    ?.valor_centavos ??
                0;
        }

        const status =
            limparTexto(
                dados.status ??
                ordemAtual?.status ??
                definirStatusInicial(
    arquivoOriginal,
    arquivoConvertido
)
            );

        if (
            !STATUS_ORDENS.has(
                status
            )
        ) {
            throw new ErroHttp(
                400,
                "O status da ordem não é válido."
            );
        }

        const observacoes =
            limparTexto(
                dados.observacoes ??
                ordemAtual?.observacoes
            );

        if (
            observacoes.length >
            2000
        ) {
            throw new ErroHttp(
                400,
                "As observações podem ter no máximo 2000 caracteres."
            );
        }

        return {
        cliente,
        arquivoOriginal,
        arquivoConvertido,
        descricao,
        quantidade,
        linha,
        prazoEntrega,
        valorCentavos,
        status,
        observacoes
        };
    }

    function converterOrdem(
        ordem
    ) {
        if (!ordem) {
            return null;
        }

        return {
            id:
                ordem.id,

            numero:
                ordem.numero,

            codigo:
                `OS #${
                    String(
                        ordem.numero
                    ).padStart(
                        4,
                        "0"
                    )
                }`,

            clienteId:
                ordem.cliente_id || "",

            clienteNome:
                ordem.cliente_nome,

            clienteCpf:
                ordem.cliente_cpf,

            descricao:
                ordem.descricao,

            quantidade:
                ordem.quantidade,

            linha:
                ordem.linha,

            prazoEntrega:
                ordem.prazo_entrega,

            valorCentavos:
                ordem.valor_centavos,

            status:
                ordem.status,

            statusTexto:
                ROTULOS_STATUS[
                    ordem.status
                ] ||
                ordem.status,

            arquivoOriginalId:
    ordem.arquivo_original_id ||
    "",

arquivoOriginal:
    ordem.arquivo_original,

arquivoOriginalUrl:
    ordem.cliente_id &&
    ordem.arquivo_original_id

        ? `/api/clientes/${
            encodeURIComponent(
                ordem.cliente_id
            )
        }/arquivos/${
            encodeURIComponent(
                ordem.arquivo_original_id
            )
        }`

        : "",

arquivoConvertidoId:
    ordem.arquivo_convertido_id ||
    "",

arquivoConvertido:
    ordem.arquivo_convertido,

arquivoConvertidoUrl:
    ordem.cliente_id &&
    ordem.arquivo_convertido_id

        ? `/api/clientes/${
            encodeURIComponent(
                ordem.cliente_id
            )
        }/arquivos/${
            encodeURIComponent(
                ordem.arquivo_convertido_id
            )
        }`

        : "",

            observacoes:
                ordem.observacoes,

            criadoEm:
                ordem.criado_em,

            atualizadoEm:
                ordem.atualizado_em
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Listagem
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

        const status =
            limparTexto(
                url.searchParams.get(
                    "status"
                )
            );

        const condicoes = [];
        const parametros = [];

        if (busca) {
            const termo =
                `%${busca}%`;

            condicoes.push(`
                (
                    cliente_nome
                        LIKE ?
                        COLLATE NOCASE

                    OR cliente_cpf
                        LIKE ?
                        COLLATE NOCASE

                    OR descricao
                        LIKE ?
                        COLLATE NOCASE

                    OR CAST(
                        numero AS TEXT
                    ) LIKE ?
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
            status &&
            status !== "todos"
        ) {
            if (
                !STATUS_ORDENS.has(
                    status
                )
            ) {
                throw new ErroHttp(
                    400,
                    "O filtro de status não é válido."
                );
            }

            condicoes.push(
                "status = ?"
            );

            parametros.push(
                status
            );
        }

        const sql = `
            SELECT
                ${CAMPOS_ORDEM_SQL}
            FROM ordens

            ${
                condicoes.length
                    ? `WHERE ${
                        condicoes.join(
                            " AND "
                        )
                    }`
                    : ""
            }

            ORDER BY numero DESC
        `;

        const ordens =
            banco
                .prepare(sql)
                .all(
                    ...parametros
                )
                .map(
                    converterOrdem
                );

        enviarJson(
            response,
            200,
            {
                sucesso: true,
                ordens
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Cadastro
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
            validarDadosOrdem(
                dadosRecebidos
            );

        const agora =
            new Date()
                .toISOString();

        const id =
            randomUUID();

        inserirOrdem.run(
            id,
            dados.cliente.id,
            dados.cliente.nome,
            dados.cliente.cpf,
            dados.descricao,
            dados.quantidade,
            dados.linha,
            dados.prazoEntrega,
            dados.valorCentavos,
            dados.status,

            dados.arquivoOriginal
                ?.id ||
                null,

            dados.arquivoOriginal
                ?.nome_original ||
                "",

            dados.arquivoConvertido
                ?.id ||
                null,

            dados.arquivoConvertido
                ?.nome_original ||
                "",

            dados.observacoes,
            agora,
            agora
        );

        const ordem =
            converterOrdem(
                consultaOrdemPorId.get(
                    id
                )
            );

        enviarJson(
            response,
            201,
            {
                sucesso: true,

                mensagem:
                    "Ordem criada com sucesso.",

                ordem
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Consulta individual
    |--------------------------------------------------------------------------
    */

    function obter(
        response,
        id
    ) {
        const ordem =
            consultaOrdemPorId.get(
                id
            );

        if (!ordem) {
            throw new ErroHttp(
                404,
                "Ordem não encontrada."
            );
        }

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                ordem:
                    converterOrdem(
                        ordem
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Edição
    |--------------------------------------------------------------------------
    */

    async function editar(
        request,
        response,
        id
    ) {
        const ordemAtual =
            consultaOrdemPorId.get(
                id
            );

        if (!ordemAtual) {
            throw new ErroHttp(
                404,
                "Ordem não encontrada."
            );
        }

        const dadosRecebidos =
            await lerJson(
                request
            );

        const dados =
            validarDadosOrdem(
                dadosRecebidos,
                ordemAtual
            );

        const agora =
            new Date()
                .toISOString();

        atualizarOrdem.run(
            dados.cliente.id,
            dados.cliente.nome,
            dados.cliente.cpf,
            dados.descricao,
            dados.quantidade,
            dados.linha,
            dados.prazoEntrega,
            dados.valorCentavos,
            dados.status,

            dados.arquivoOriginal
                ?.id ||
                null,

            dados.arquivoOriginal
                ?.nome_original ||
                "",

            dados.arquivoConvertido
                ?.id ||
                null,

            dados.arquivoConvertido
                ?.nome_original ||
                "",

            dados.observacoes,
            agora,
            id
        );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Ordem atualizada com sucesso.",

                ordem:
                    converterOrdem(
                        consultaOrdemPorId.get(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Exclusão
    |--------------------------------------------------------------------------
    */

    function remover(
        response,
        id
    ) {
        const ordem =
            consultaOrdemPorId.get(
                id
            );

        if (!ordem) {
            throw new ErroHttp(
                404,
                "Ordem não encontrada."
            );
        }

        excluirOrdem.run(
            id
        );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Ordem excluída com sucesso."
            }
        );
    }

    return {
        listar,
        criar,
        obter,
        editar,
        remover
    };
}

module.exports = {
    criarServicoOrdens
};
