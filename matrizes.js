const {
    randomUUID
} = require("node:crypto");

const STATUS_MATRIZES =
    new Set([
        "rascunho",
        "teste",
        "aprovada",
        "arquivada"
    ]);

const ROTULOS_STATUS = {
    rascunho:
        "Rascunho",

    teste:
        "Em teste",

    aprovada:
        "Aprovada",

    arquivada:
        "Arquivada"
};

function criarServicoMatrizes({
    banco,
    ErroHttp,
    enviarJson,
    lerJson
}) {
    /*
    |--------------------------------------------------------------------------
    | Índice de nome e versão
    |--------------------------------------------------------------------------
    */

    banco.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS
            indice_matrizes_nome_versao

        ON matrizes_bordado (
            cliente_id,
            nome COLLATE NOCASE,
            versao
        );
    `);

    const CAMPOS_MATRIZ_SQL = `
        matriz.id,
        matriz.cliente_id,
        cliente.nome AS cliente_nome,
        matriz.nome,
        matriz.versao,
        matriz.arquivo_original_id,

        original.nome_original
            AS arquivo_original_nome,

        original.criado_em
            AS arquivo_original_criado_em,

        matriz.local_aplicacao,
        matriz.largura_mm,
        matriz.altura_mm,
        matriz.quantidade_pontos,
        matriz.quantidade_cores,
        matriz.status,
        matriz.observacoes,
        matriz.criado_em,
        matriz.atualizado_em
    `;

    /*
    |--------------------------------------------------------------------------
    | Consultas
    |--------------------------------------------------------------------------
    */

    const consultarClientePorId =
        banco.prepare(`
            SELECT
                id,
                nome

            FROM clientes

            WHERE id = ?

            LIMIT 1
        `);

    const consultarArquivoPorId =
        banco.prepare(`
            SELECT
                id,
                cliente_id,
                tipo,
                nome_original,
                caminho_arquivo,
                criado_em

            FROM cliente_arquivos

            WHERE id = ?

            LIMIT 1
        `);

    const consultarMatrizPorId =
        banco.prepare(`
            SELECT
                ${CAMPOS_MATRIZ_SQL}

            FROM matrizes_bordado
                AS matriz

            INNER JOIN clientes
                AS cliente
                ON cliente.id =
                    matriz.cliente_id

            LEFT JOIN cliente_arquivos
                AS original
                ON original.id =
                    matriz.arquivo_original_id

            WHERE matriz.id = ?

            LIMIT 1
        `);

    const consultarVinculosMatriz =
        banco.prepare(`
            SELECT
                vinculo.id,
                vinculo.matriz_id,
                vinculo.funcao,
                vinculo.criado_em,

                arquivo.id
                    AS arquivo_id,

                arquivo.cliente_id,
                arquivo.tipo,
                arquivo.nome_original,

                arquivo.criado_em
                    AS arquivo_criado_em

            FROM matriz_arquivos
                AS vinculo

            INNER JOIN cliente_arquivos
                AS arquivo
                ON arquivo.id =
                    vinculo.arquivo_id

            WHERE vinculo.matriz_id = ?

            ORDER BY
                CASE vinculo.funcao
                    WHEN 'editavel'
                        THEN 0
                    ELSE 1
                END,

                arquivo.criado_em ASC,
                arquivo.id ASC
        `);

    const consultarVinculoPorArquivo =
        banco.prepare(`
            SELECT
                id,
                matriz_id,
                arquivo_id,
                funcao

            FROM matriz_arquivos

            WHERE arquivo_id = ?

            LIMIT 1
        `);

    const consultarDuplicidade =
        banco.prepare(`
            SELECT id

            FROM matrizes_bordado

            WHERE
                cliente_id = ?

                AND nome = ?
                    COLLATE NOCASE

                AND versao = ?

                AND id <> ?

            LIMIT 1
        `);

    const inserirMatriz =
        banco.prepare(`
            INSERT INTO matrizes_bordado (
                id,
                cliente_id,
                nome,
                versao,
                arquivo_original_id,
                local_aplicacao,
                largura_mm,
                altura_mm,
                quantidade_pontos,
                quantidade_cores,
                status,
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

    const atualizarMatriz =
        banco.prepare(`
            UPDATE matrizes_bordado

            SET
                cliente_id = ?,
                nome = ?,
                versao = ?,
                arquivo_original_id = ?,
                local_aplicacao = ?,
                largura_mm = ?,
                altura_mm = ?,
                quantidade_pontos = ?,
                quantidade_cores = ?,
                status = ?,
                observacoes = ?,
                atualizado_em = ?

            WHERE id = ?
        `);

    const atualizarStatusMatriz =
        banco.prepare(`
            UPDATE matrizes_bordado

            SET
                status = ?,
                atualizado_em = ?

            WHERE id = ?
        `);

    const excluirVinculosMatriz =
        banco.prepare(`
            DELETE FROM matriz_arquivos

            WHERE matriz_id = ?
        `);

    const desvincularOrdensMatriz =
        banco.prepare(`
            UPDATE ordens

            SET matriz_id = NULL

            WHERE matriz_id = ?
        `);

    const excluirMatriz =
        banco.prepare(`
            DELETE FROM matrizes_bordado

            WHERE id = ?
        `);

    const inserirVinculo =
        banco.prepare(`
            INSERT INTO matriz_arquivos (
                id,
                matriz_id,
                arquivo_id,
                funcao,
                criado_em
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?
            )
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

    function converterNumeroOpcional(
        valor,
        nomeCampo,
        {
            inteiro = false,
            maximo =
                Number.MAX_SAFE_INTEGER
        } = {}
    ) {
        if (
            valor === undefined ||
            valor === null ||
            limparTexto(valor) === ""
        ) {
            return null;
        }

        const numero =
            Number(
                limparTexto(valor)
                    .replace(
                        ",",
                        "."
                    )
            );

        if (
            !Number.isFinite(numero) ||
            numero < 0 ||
            numero > maximo ||
            (
                inteiro &&
                !Number.isInteger(
                    numero
                )
            )
        ) {
            throw new ErroHttp(
                400,
                `Informe um valor válido para ${nomeCampo}.`
            );
        }

        return numero;
    }

    function buscarMatrizObrigatoria(
        id
    ) {
        const matriz =
            consultarMatrizPorId.get(
                id
            );

        if (!matriz) {
            throw new ErroHttp(
                404,
                "Matriz de bordado não encontrada."
            );
        }

        return matriz;
    }

    function obterVinculosAtuais(
        matrizId
    ) {
        const vinculos =
            consultarVinculosMatriz.all(
                matrizId
            );

        return {
            arquivoEditavelId:
                vinculos.find(
                    vinculo =>
                        vinculo.funcao ===
                            "editavel"
                )?.arquivo_id || "",

            arquivosMaquinaIds:
                vinculos
                    .filter(
                        vinculo =>
                            vinculo.funcao ===
                                "maquina"
                    )
                    .map(
                        vinculo =>
                            vinculo.arquivo_id
                    )
        };
    }

    function validarArquivoCliente({
        id,
        clienteId,
        tipo,
        rotulo,
        matrizId = ""
    }) {
        const arquivoId =
            limparTexto(
                id
            );

        if (!arquivoId) {
            return null;
        }

        const arquivo =
            consultarArquivoPorId.get(
                arquivoId
            );

        if (
            !arquivo ||
            arquivo.cliente_id !==
                clienteId ||
            arquivo.tipo !== tipo
        ) {
            throw new ErroHttp(
                400,
                `${rotulo} não pertence ao cliente ou possui um tipo inválido.`
            );
        }

        /*
         * O arquivo editável e o arquivo
         * de máquina pertencem somente
         * a uma matriz.
         */

        if (
            tipo === "editavel" ||
            tipo === "convertido"
        ) {
            const vinculo =
                consultarVinculoPorArquivo
                    .get(
                        arquivoId
                    );

            if (
                vinculo &&
                vinculo.matriz_id !==
                    matrizId
            ) {
                throw new ErroHttp(
                    409,
                    `${rotulo} já está vinculado a outra matriz.`
                );
            }
        }

        return arquivo;
    }

    /*
    |--------------------------------------------------------------------------
    | Validação da matriz
    |--------------------------------------------------------------------------
    */

    function validarDadosMatriz(
        dados,
        matrizAtual = null
    ) {
        const clienteId =
            limparTexto(
                dados.clienteId ??
                matrizAtual?.cliente_id
            );

        const cliente =
            consultarClientePorId.get(
                clienteId
            );

        if (!cliente) {
            throw new ErroHttp(
                400,
                "Selecione um cliente válido."
            );
        }

        const nome =
            limparTexto(
                dados.nome ??
                matrizAtual?.nome
            );

        if (
            nome.length < 2 ||
            nome.length > 120
        ) {
            throw new ErroHttp(
                400,
                "O nome da matriz deve possuir entre 2 e 120 caracteres."
            );
        }

        const versao =
            Number(
                dados.versao ??
                matrizAtual?.versao ??
                1
            );

        if (
            !Number.isInteger(
                versao
            ) ||
            versao < 1 ||
            versao > 9999
        ) {
            throw new ErroHttp(
                400,
                "A versão deve ser um número inteiro entre 1 e 9999."
            );
        }

        const matrizDuplicada =
            consultarDuplicidade.get(
                clienteId,
                nome,
                versao,
                matrizAtual?.id || ""
            );

        if (matrizDuplicada) {
            throw new ErroHttp(
                409,
                "Já existe uma matriz desse cliente com o mesmo nome e versão."
            );
        }

        const localAplicacao =
            limparTexto(
                dados.localAplicacao ??
                matrizAtual
                    ?.local_aplicacao
            );

        if (
            localAplicacao.length >
            100
        ) {
            throw new ErroHttp(
                400,
                "O local de aplicação pode ter no máximo 100 caracteres."
            );
        }

        const larguraMm =
            Object.hasOwn(
                dados,
                "larguraMm"
            )
                ? converterNumeroOpcional(
                    dados.larguraMm,
                    "a largura",
                    {
                        maximo:
                            10000
                    }
                )
                : matrizAtual
                    ?.largura_mm ??
                    null;

        const alturaMm =
            Object.hasOwn(
                dados,
                "alturaMm"
            )
                ? converterNumeroOpcional(
                    dados.alturaMm,
                    "a altura",
                    {
                        maximo:
                            10000
                    }
                )
                : matrizAtual
                    ?.altura_mm ??
                    null;

        if (
            larguraMm === 0 ||
            alturaMm === 0
        ) {
            throw new ErroHttp(
                400,
                "A largura e a altura precisam ser maiores que zero."
            );
        }

        const quantidadePontos =
            Object.hasOwn(
                dados,
                "quantidadePontos"
            )
                ? converterNumeroOpcional(
                    dados.quantidadePontos,
                    "a quantidade de pontos",
                    {
                        inteiro:
                            true,

                        maximo:
                            100000000
                    }
                )
                : matrizAtual
                    ?.quantidade_pontos ??
                    null;

        const quantidadeCores =
            Object.hasOwn(
                dados,
                "quantidadeCores"
            )
                ? converterNumeroOpcional(
                    dados.quantidadeCores,
                    "a quantidade de cores",
                    {
                        inteiro:
                            true,

                        maximo:
                            1000
                    }
                )
                : matrizAtual
                    ?.quantidade_cores ??
                    null;

        const status =
            limparTexto(
                dados.status ??
                matrizAtual?.status ??
                "rascunho"
            ).toLowerCase();

        if (
            !STATUS_MATRIZES.has(
                status
            )
        ) {
            throw new ErroHttp(
                400,
                "O status da matriz não é válido."
            );
        }

        const observacoes =
            limparTexto(
                dados.observacoes ??
                matrizAtual?.observacoes
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

        const vinculosAtuais =
            matrizAtual
                ? obterVinculosAtuais(
                    matrizAtual.id
                )
                : {
                    arquivoEditavelId:
                        "",

                    arquivosMaquinaIds:
                        []
                };

        const arquivoOriginalId =
            limparTexto(
                Object.hasOwn(
                    dados,
                    "arquivoOriginalId"
                )
                    ? dados
                        .arquivoOriginalId
                    : matrizAtual
                        ?.arquivo_original_id
            );

        const arquivoEditavelId =
            limparTexto(
                Object.hasOwn(
                    dados,
                    "arquivoEditavelId"
                )
                    ? dados
                        .arquivoEditavelId
                    : vinculosAtuais
                        .arquivoEditavelId
            );

        const arquivosMaquinaRecebidos =
            Object.hasOwn(
                dados,
                "arquivosMaquinaIds"
            )
                ? dados
                    .arquivosMaquinaIds
                : vinculosAtuais
                    .arquivosMaquinaIds;

        if (
            !Array.isArray(
                arquivosMaquinaRecebidos
            )
        ) {
            throw new ErroHttp(
                400,
                "Os arquivos de máquina precisam ser enviados como uma lista."
            );
        }

        const arquivosMaquinaIds =
            [
                ...new Set(
                    arquivosMaquinaRecebidos
                        .map(
                            valor =>
                                limparTexto(
                                    valor
                                )
                        )
                        .filter(
                            Boolean
                        )
                )
            ];

        if (
            arquivosMaquinaIds.length >
            10
        ) {
            throw new ErroHttp(
                400,
                "Uma matriz pode possuir no máximo 10 arquivos de máquina."
            );
        }

        const matrizId =
            matrizAtual?.id || "";

        const arquivoOriginal =
            validarArquivoCliente({
                id:
                    arquivoOriginalId,

                clienteId,

                tipo:
                    "original",

                rotulo:
                    "O arquivo original",

                matrizId
            });

        const arquivoEditavel =
            validarArquivoCliente({
                id:
                    arquivoEditavelId,

                clienteId,

                tipo:
                    "editavel",

                rotulo:
                    "O arquivo editável",

                matrizId
            });

        const arquivosMaquina =
            arquivosMaquinaIds.map(
                arquivoId =>
                    validarArquivoCliente({
                        id:
                            arquivoId,

                        clienteId,

                        tipo:
                            "convertido",

                        rotulo:
                            "O arquivo de máquina",

                        matrizId
                    })
            );

        return {
            cliente,
            nome,
            versao,
            arquivoOriginal,
            arquivoEditavel,
            arquivosMaquina,
            localAplicacao,
            larguraMm,
            alturaMm,
            quantidadePontos,
            quantidadeCores,
            status,
            observacoes
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Conversão para a API
    |--------------------------------------------------------------------------
    */

    function converterArquivo(
        arquivo,
        funcao = null
    ) {
        if (!arquivo) {
            return null;
        }

        const arquivoId =
            arquivo.arquivo_id ||
            arquivo.id;

        return {
            id:
                arquivoId,

            funcao,

            tipo:
                arquivo.tipo,

            nome:
                arquivo.nome_original,

            url:
                `/api/clientes/${
                    encodeURIComponent(
                        arquivo.cliente_id
                    )
                }/arquivos/${
                    encodeURIComponent(
                        arquivoId
                    )
                }`,

            criadoEm:
                arquivo
                    .arquivo_criado_em ||
                arquivo.criado_em ||
                null
        };
    }

    function converterMatriz(
        matriz
    ) {
        if (!matriz) {
            return null;
        }

        const vinculos =
            consultarVinculosMatriz.all(
                matriz.id
            );

        const editavel =
            vinculos.find(
                vinculo =>
                    vinculo.funcao ===
                        "editavel"
            );

        const arquivosMaquina =
            vinculos
                .filter(
                    vinculo =>
                        vinculo.funcao ===
                            "maquina"
                )
                .map(
                    vinculo =>
                        converterArquivo(
                            vinculo,
                            "maquina"
                        )
                );

        const arquivoOriginal =
            matriz.arquivo_original_id
                ? converterArquivo({
                    id:
                        matriz
                            .arquivo_original_id,

                    cliente_id:
                        matriz.cliente_id,

                    tipo:
                        "original",

                    nome_original:
                        matriz
                            .arquivo_original_nome,

                    criado_em:
                        matriz
                            .arquivo_original_criado_em
                })
                : null;

        return {
            id:
                matriz.id,

            cliente: {
                id:
                    matriz.cliente_id,

                nome:
                    matriz.cliente_nome
            },

            nome:
                matriz.nome,

            versao:
                Number(
                    matriz.versao
                ),

            arquivoOriginal,

            arquivoEditavel:
                converterArquivo(
                    editavel,
                    "editavel"
                ),

            arquivosMaquina,

            localAplicacao:
                matriz.local_aplicacao ||
                "",

            larguraMm:
                matriz.largura_mm ===
                    null
                    ? null
                    : Number(
                        matriz.largura_mm
                    ),

            alturaMm:
                matriz.altura_mm ===
                    null
                    ? null
                    : Number(
                        matriz.altura_mm
                    ),

            quantidadePontos:
                matriz.quantidade_pontos ===
                    null
                    ? null
                    : Number(
                        matriz
                            .quantidade_pontos
                    ),

            quantidadeCores:
                matriz.quantidade_cores ===
                    null
                    ? null
                    : Number(
                        matriz
                            .quantidade_cores
                    ),

            status:
                matriz.status,

            statusRotulo:
                ROTULOS_STATUS[
                    matriz.status
                ] ||
                matriz.status,

            observacoes:
                matriz.observacoes ||
                "",

            criadoEm:
                matriz.criado_em,

            atualizadoEm:
                matriz.atualizado_em
        };
    }

    function inserirVinculos(
        matrizId,
        dados,
        agora
    ) {
        if (
            dados.arquivoEditavel
        ) {
            inserirVinculo.run(
                randomUUID(),
                matrizId,
                dados
                    .arquivoEditavel
                    .id,
                "editavel",
                agora
            );
        }

        for (
            const arquivo
            of dados.arquivosMaquina
        ) {
            inserirVinculo.run(
                randomUUID(),
                matrizId,
                arquivo.id,
                "maquina",
                agora
            );
        }
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
        const clienteId =
            limparTexto(
                url.searchParams.get(
                    "clienteId"
                )
            );

        const status =
            limparTexto(
                url.searchParams.get(
                    "status"
                )
            ).toLowerCase();

        const busca =
            limparTexto(
                url.searchParams.get(
                    "busca"
                )
            );

        if (
            status &&
            status !== "todos" &&
            !STATUS_MATRIZES.has(
                status
            )
        ) {
            throw new ErroHttp(
                400,
                "O filtro de status não é válido."
            );
        }

        const condicoes = [];
        const parametros = [];

        if (clienteId) {
            condicoes.push(
                "matriz.cliente_id = ?"
            );

            parametros.push(
                clienteId
            );
        }

        if (
            status &&
            status !== "todos"
        ) {
            condicoes.push(
                "matriz.status = ?"
            );

            parametros.push(
                status
            );
        }

        if (busca) {
            const termo =
                `%${busca}%`;

            condicoes.push(`
                (
                    matriz.nome LIKE ?
                        COLLATE NOCASE

                    OR matriz.local_aplicacao
                        LIKE ?
                        COLLATE NOCASE

                    OR cliente.nome LIKE ?
                        COLLATE NOCASE
                )
            `);

            parametros.push(
                termo,
                termo,
                termo
            );
        }

        const onde =
            condicoes.length
                ? `WHERE ${
                    condicoes.join(
                        " AND "
                    )
                }`
                : "";

        const matrizes =
            banco.prepare(`
                SELECT
                    ${CAMPOS_MATRIZ_SQL}

                FROM matrizes_bordado
                    AS matriz

                INNER JOIN clientes
                    AS cliente
                    ON cliente.id =
                        matriz.cliente_id

                LEFT JOIN cliente_arquivos
                    AS original
                    ON original.id =
                        matriz.arquivo_original_id

                ${onde}

                ORDER BY
                    matriz.atualizado_em
                        DESC,

                    matriz.criado_em
                        DESC,

                    matriz.id ASC
            `)
                .all(
                    ...parametros
                )
                .map(
                    converterMatriz
                );

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                matrizes
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Obter uma matriz
    |--------------------------------------------------------------------------
    */

    function obter(
        response,
        id
    ) {
        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                matriz:
                    converterMatriz(
                        buscarMatrizObrigatoria(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Criar matriz
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
            validarDadosMatriz(
                dadosRecebidos
            );

        const id =
            randomUUID();

        const agora =
            new Date()
                .toISOString();

        let transacaoAberta =
            false;

        try {
            banco.exec(
                "BEGIN IMMEDIATE"
            );

            transacaoAberta =
                true;

            inserirMatriz.run(
                id,
                dados.cliente.id,
                dados.nome,
                dados.versao,

                dados.arquivoOriginal
                    ?.id ||
                    null,

                dados.localAplicacao,
                dados.larguraMm,
                dados.alturaMm,
                dados.quantidadePontos,
                dados.quantidadeCores,
                dados.status,
                dados.observacoes,
                agora,
                agora
            );

            inserirVinculos(
                id,
                dados,
                agora
            );

            banco.exec(
                "COMMIT"
            );

            transacaoAberta =
                false;
        } catch (erro) {
            if (transacaoAberta) {
                try {
                    banco.exec(
                        "ROLLBACK"
                    );
                } catch {
                    // Mantém o erro original.
                }
            }

            throw erro;
        }

        enviarJson(
            response,
            201,
            {
                sucesso:
                    true,

                mensagem:
                    "Matriz de bordado cadastrada com sucesso.",

                matriz:
                    converterMatriz(
                        buscarMatrizObrigatoria(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Editar matriz
    |--------------------------------------------------------------------------
    */

    async function editar(
        request,
        response,
        id
    ) {
        const matrizAtual =
            buscarMatrizObrigatoria(
                id
            );

        const dadosRecebidos =
            await lerJson(
                request
            );

        const dados =
            validarDadosMatriz(
                dadosRecebidos,
                matrizAtual
            );

        const agora =
            new Date()
                .toISOString();

        let transacaoAberta =
            false;

        try {
            banco.exec(
                "BEGIN IMMEDIATE"
            );

            transacaoAberta =
                true;

            atualizarMatriz.run(
                dados.cliente.id,
                dados.nome,
                dados.versao,

                dados.arquivoOriginal
                    ?.id ||
                    null,

                dados.localAplicacao,
                dados.larguraMm,
                dados.alturaMm,
                dados.quantidadePontos,
                dados.quantidadeCores,
                dados.status,
                dados.observacoes,
                agora,
                id
            );

            excluirVinculosMatriz.run(
                id
            );

            inserirVinculos(
                id,
                dados,
                agora
            );

            banco.exec(
                "COMMIT"
            );

            transacaoAberta =
                false;
        } catch (erro) {
            if (transacaoAberta) {
                try {
                    banco.exec(
                        "ROLLBACK"
                    );
                } catch {
                    // Mantém o erro original.
                }
            }

            throw erro;
        }

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                mensagem:
                    "Matriz de bordado atualizada com sucesso.",

                matriz:
                    converterMatriz(
                        buscarMatrizObrigatoria(
                            id
                        )
                    )
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Arquivar matriz
    |--------------------------------------------------------------------------
    */

    function arquivar(
        response,
        id
    ) {
        buscarMatrizObrigatoria(
            id
        );

        atualizarStatusMatriz.run(
            "arquivada",

            new Date()
                .toISOString(),

            id
        );

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                mensagem:
                    "Matriz de bordado arquivada com sucesso.",

                matriz:
                    converterMatriz(
                        buscarMatrizObrigatoria(
                            id
                        )
                    )
            }
        );
    }

/*
|--------------------------------------------------------------------------
| Restaurar matriz arquivada
|--------------------------------------------------------------------------
*/

function restaurar(
    response,
    id
) {
    const matriz =
        buscarMatrizObrigatoria(
            id
        );

    if (
        matriz.status !==
            "arquivada"
    ) {
        throw new ErroHttp(
            409,
            "Somente matrizes arquivadas podem ser restauradas."
        );
    }

    atualizarStatusMatriz.run(
        "rascunho",

        new Date()
            .toISOString(),

        id
    );

    enviarJson(
        response,
        200,
        {
            sucesso:
                true,

            mensagem:
                "Matriz restaurada como rascunho com sucesso.",

            matriz:
                converterMatriz(
                    buscarMatrizObrigatoria(
                        id
                    )
                )
        }
    );
}

    /*
|--------------------------------------------------------------------------
| Excluir matriz arquivada
|--------------------------------------------------------------------------
*/

function remover(
    response,
    id
) {
    const matriz =
        buscarMatrizObrigatoria(
            id
        );

    if (
        matriz.status !==
            "arquivada"
    ) {
        throw new ErroHttp(
            409,
            "Arquive a matriz antes de excluí-la permanentemente."
        );
    }

    let transacaoAberta =
        false;

    try {
        banco.exec(
            "BEGIN IMMEDIATE"
        );

        transacaoAberta =
            true;

        const ordensDesvinculadas =
            desvincularOrdensMatriz
                .run(
                    id
                )
                .changes;

        excluirVinculosMatriz.run(
            id
        );

        const resultado =
            excluirMatriz.run(
                id
            );

        if (!resultado.changes) {
            throw new ErroHttp(
                404,
                "Matriz de bordado não encontrada."
            );
        }

        banco.exec(
            "COMMIT"
        );

        transacaoAberta =
            false;

        let mensagem =
            "Matriz de bordado excluída permanentemente.";

        if (
            ordensDesvinculadas ===
                1
        ) {
            mensagem =
                "Matriz excluída. Uma ordem permaneceu salva, mas perdeu o vínculo com a matriz.";
        }

        if (
            ordensDesvinculadas >
                1
        ) {
            mensagem =
                `Matriz excluída. ${ordensDesvinculadas} ordens permaneceram salvas, mas perderam o vínculo com a matriz.`;
        }

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                mensagem,

                ordensDesvinculadas
            }
        );
    } catch (erro) {
        if (transacaoAberta) {
            banco.exec(
                "ROLLBACK"
            );
        }

        throw erro;
    }
}

    return {
        listar,
        obter,
        criar,
        editar,
        arquivar,
        restaurar,
        remover
    };
}

module.exports = {
    criarServicoMatrizes
};
