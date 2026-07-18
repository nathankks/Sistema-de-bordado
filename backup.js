const path = require("node:path");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { promisify } = require("node:util");
const {
    gzip,
    gunzip
} = require("node:zlib");

const {
    backup: criarCopiaSqlite,
    DatabaseSync
} = require("node:sqlite");

const compactar = promisify(gzip);
const descompactar = promisify(gunzip);

/*
|--------------------------------------------------------------------------
| Limites de segurança
|--------------------------------------------------------------------------
*/

const LIMITE_BACKUP_RECEBIDO =
    450 * 1024 * 1024;

const LIMITE_BANCO_BACKUP =
    120 * 1024 * 1024;

const LIMITE_ARQUIVOS_BACKUP =
    320 * 1024 * 1024;

const ASSINATURA_BACKUP =
    "SISTEMA_BORDADO_BACKUP";

const VERSAO_BACKUP = 1;

/*
|--------------------------------------------------------------------------
| Serviço de backup
|--------------------------------------------------------------------------
*/

function criarServicoBackup({
    banco,
    pastaRaiz,
    pastaDados,
    pastaUploads,
    ErroHttp,
    enviarJson
}) {
    const pastaTemporaria = path.join(
        pastaDados,
        "temporarios"
    );

    const caminhoStatus = path.join(
        pastaDados,
        "backup-status.json"
    );

    fs.mkdirSync(
        pastaTemporaria,
        {
            recursive: true
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Status do último backup
    |--------------------------------------------------------------------------
    */

    async function lerStatusBackup() {
        try {
            const conteudo =
                await fsPromises.readFile(
                    caminhoStatus,
                    "utf8"
                );

            const dados =
                JSON.parse(conteudo);

            return {
                ultimoBackup:
                    dados.ultimoBackup ||
                    null,

                ultimoRestauro:
                    dados.ultimoRestauro ||
                    null
            };
        } catch (erro) {
            if (
                erro.code !== "ENOENT"
            ) {
                console.error(
                    "Não foi possível ler o status do backup:",
                    erro
                );
            }

            return {
                ultimoBackup: null,
                ultimoRestauro: null
            };
        }
    }

    async function salvarStatusBackup(
        alteracoes
    ) {
        const statusAtual =
            await lerStatusBackup();

        const novoStatus = {
            ...statusAtual,
            ...alteracoes
        };

        await fsPromises.writeFile(
            caminhoStatus,
            JSON.stringify(
                novoStatus,
                null,
                2
            ),
            "utf8"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Utilitários
    |--------------------------------------------------------------------------
    */

    function nomeArquivoBackup() {
        const agora =
            new Date();

        const partes = [
            agora.getFullYear(),

            String(
                agora.getMonth() + 1
            ).padStart(2, "0"),

            String(
                agora.getDate()
            ).padStart(2, "0"),

            String(
                agora.getHours()
            ).padStart(2, "0"),

            String(
                agora.getMinutes()
            ).padStart(2, "0"),

            String(
                agora.getSeconds()
            ).padStart(2, "0")
        ];

        return (
            `backup-bordado-` +
            `${partes[0]}-${partes[1]}-${partes[2]}-` +
            `${partes[3]}-${partes[4]}-${partes[5]}` +
            `.bordado`
        );
    }

    function normalizarCaminhoRelativo(
        caminhoRecebido
    ) {
        const caminho = String(
            caminhoRecebido || ""
        )
            .replace(/\\/g, "/")
            .trim();

        if (
            !caminho ||
            caminho.includes("\0") ||
            caminho.startsWith("/") ||
            /^[a-zA-Z]:/.test(caminho)
        ) {
            throw new ErroHttp(
                400,
                "O backup contém um caminho de arquivo inválido."
            );
        }

        const partes =
            caminho.split("/");

        if (
            partes.some(
                parte =>
                    !parte ||
                    parte === "." ||
                    parte === ".."
            )
        ) {
            throw new ErroHttp(
                400,
                "O backup contém um caminho de arquivo inseguro."
            );
        }

        if (
            partes[0] !== "originais" &&
            partes[0] !== "convertidos"
        ) {
            throw new ErroHttp(
                400,
                "O backup contém um diretório não permitido."
            );
        }

        return partes.join("/");
    }

    function converterBase64(
        texto,
        descricao
    ) {
        if (
            typeof texto !== "string" ||
            !texto.length
        ) {
            throw new ErroHttp(
                400,
                `${descricao} não foi encontrado no backup.`
            );
        }

        try {
            return Buffer.from(
                texto,
                "base64"
            );
        } catch {
            throw new ErroHttp(
                400,
                `${descricao} está corrompido.`
            );
        }
    }

    async function removerSilenciosamente(
        caminho
    ) {
        if (!caminho) {
            return;
        }

        try {
            await fsPromises.rm(
                caminho,
                {
                    recursive: true,
                    force: true
                }
            );
        } catch (erro) {
            console.error(
                `Não foi possível remover ${caminho}:`,
                erro
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Leitura dos arquivos de upload
    |--------------------------------------------------------------------------
    */

    async function listarArquivosUploads() {
        const arquivos = [];
        let tamanhoTotal = 0;

        async function percorrer(
            pastaAtual,
            caminhoRelativo = ""
        ) {
            let itens;

            try {
                itens =
                    await fsPromises.readdir(
                        pastaAtual,
                        {
                            withFileTypes: true
                        }
                    );
            } catch (erro) {
                if (
                    erro.code === "ENOENT"
                ) {
                    return;
                }

                throw erro;
            }

            for (
                const item
                of itens
            ) {
                /*
                 * Links simbólicos são ignorados
                 * por segurança.
                 */
                if (
                    item.isSymbolicLink()
                ) {
                    continue;
                }

                const caminhoItem =
                    path.join(
                        pastaAtual,
                        item.name
                    );

                const relativoItem =
                    caminhoRelativo
                        ? `${caminhoRelativo}/${item.name}`
                        : item.name;

                if (item.isDirectory()) {
                    await percorrer(
                        caminhoItem,
                        relativoItem
                    );

                    continue;
                }

                if (!item.isFile()) {
                    continue;
                }

                const relativoSeguro =
                    normalizarCaminhoRelativo(
                        relativoItem
                    );

                const conteudo =
                    await fsPromises.readFile(
                        caminhoItem
                    );

                tamanhoTotal +=
                    conteudo.length;

                if (
                    tamanhoTotal >
                    LIMITE_ARQUIVOS_BACKUP
                ) {
                    throw new ErroHttp(
                        413,
                        "Os arquivos ultrapassaram o limite de 320 MB para um único backup."
                    );
                }

                arquivos.push({
                    caminho:
                        relativoSeguro,

                    tamanho:
                        conteudo.length,

                    conteudo:
                        conteudo.toString(
                            "base64"
                        )
                });
            }
        }

        await percorrer(
            pastaUploads
        );

        return {
            arquivos,
            tamanhoTotal
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Download do backup
    |--------------------------------------------------------------------------
    */

    async function baixarBackup(
        response
    ) {
        const identificador =
            randomUUID();

        const caminhoBancoTemporario =
            path.join(
                pastaTemporaria,
                `banco-${identificador}.db`
            );

        try {
            /*
             * Cria uma cópia consistente
             * do banco em uso.
             */
            await criarCopiaSqlite(
                banco,
                caminhoBancoTemporario
            );

            const bancoCopiado =
                await fsPromises.readFile(
                    caminhoBancoTemporario
                );

            if (
                bancoCopiado.length >
                LIMITE_BANCO_BACKUP
            ) {
                throw new ErroHttp(
                    413,
                    "O banco de dados ultrapassou o limite permitido para backup."
                );
            }

            const {
                arquivos,
                tamanhoTotal
            } =
                await listarArquivosUploads();

            const dataCriacao =
                new Date()
                    .toISOString();

            const pacote = {
                assinatura:
                    ASSINATURA_BACKUP,

                versao:
                    VERSAO_BACKUP,

                criadoEm:
                    dataCriacao,

                aplicativo:
                    "Sistema de Bordados",

                banco: {
                    nome:
                        "sistema-bordado.db",

                    tamanho:
                        bancoCopiado.length,

                    conteudo:
                        bancoCopiado.toString(
                            "base64"
                        )
                },

                arquivos,

                resumo: {
                    quantidadeArquivos:
                        arquivos.length,

                    tamanhoArquivos:
                        tamanhoTotal
                }
            };

            const json =
                Buffer.from(
                    JSON.stringify(
                        pacote
                    ),
                    "utf8"
                );

            const conteudoCompactado =
                await compactar(
                    json,
                    {
                        level: 9
                    }
                );

            const nome =
                nomeArquivoBackup();

            await salvarStatusBackup({
                ultimoBackup:
                    dataCriacao
            });

            response.writeHead(
                200,
                {
                    "Content-Type":
                        "application/gzip",

                    "Content-Length":
                        conteudoCompactado.length,

                    "Content-Disposition":
                        `attachment; filename="${nome}"`,

                    "Cache-Control":
                        "no-store",

                    "X-Content-Type-Options":
                        "nosniff"
                }
            );

            response.end(
                conteudoCompactado
            );
        } finally {
            await removerSilenciosamente(
                caminhoBancoTemporario
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Leitura do backup enviado
    |--------------------------------------------------------------------------
    */

    async function lerArquivoBackup(
        request
    ) {
        const tamanhoCabecalho =
            Number(
                request.headers[
                    "content-length"
                ] || 0
            );

        if (
            tamanhoCabecalho >
            LIMITE_BACKUP_RECEBIDO
        ) {
            throw new ErroHttp(
                413,
                "O arquivo de backup ultrapassou o limite de 450 MB."
            );
        }

        const tipoConteudo =
            String(
                request.headers[
                    "content-type"
                ] || ""
            ).toLowerCase();

        if (
            !tipoConteudo.startsWith(
                "multipart/form-data"
            )
        ) {
            throw new ErroHttp(
                415,
                "Envie o backup como formulário multipart."
            );
        }

        const requisicaoWeb =
            new Request(
                `http://localhost${request.url}`,
                {
                    method:
                        request.method,

                    headers:
                        request.headers,

                    body:
                        Readable.toWeb(
                            request
                        ),

                    duplex:
                        "half"
                }
            );

        let formulario;

        try {
            formulario =
                await requisicaoWeb
                    .formData();
        } catch {
            throw new ErroHttp(
                400,
                "Não foi possível processar o arquivo de backup."
            );
        }

        const arquivo =
            formulario.get(
                "backup"
            );

        if (
            !(arquivo instanceof File) ||
            !arquivo.size
        ) {
            throw new ErroHttp(
                400,
                "Selecione um arquivo de backup válido."
            );
        }

        if (
            arquivo.size >
            LIMITE_BACKUP_RECEBIDO
        ) {
            throw new ErroHttp(
                413,
                "O arquivo de backup ultrapassou o limite de 450 MB."
            );
        }

        const buffer =
            Buffer.from(
                await arquivo.arrayBuffer()
            );

        return {
            nome:
                arquivo.name,

            buffer
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Validação do conteúdo do backup
    |--------------------------------------------------------------------------
    */

    async function abrirPacoteBackup(
        bufferCompactado
    ) {
        let bufferJson;

        try {
            bufferJson =
                await descompactar(
                    bufferCompactado
                );
        } catch {
            throw new ErroHttp(
                400,
                "O arquivo selecionado não é um backup válido ou está corrompido."
            );
        }

        let pacote;

        try {
            pacote =
                JSON.parse(
                    bufferJson.toString(
                        "utf8"
                    )
                );
        } catch {
            throw new ErroHttp(
                400,
                "O conteúdo do backup não pôde ser lido."
            );
        }

        if (
            pacote.assinatura !==
                ASSINATURA_BACKUP ||
            pacote.versao !==
                VERSAO_BACKUP
        ) {
            throw new ErroHttp(
                400,
                "Este arquivo não pertence ao Sistema de Bordados ou usa uma versão incompatível."
            );
        }

        if (
            !pacote.banco ||
            !Array.isArray(
                pacote.arquivos
            )
        ) {
            throw new ErroHttp(
                400,
                "O backup não possui todos os dados necessários."
            );
        }

        const bufferBanco =
            converterBase64(
                pacote.banco.conteudo,
                "O banco de dados"
            );

        if (
            bufferBanco.length >
            LIMITE_BANCO_BACKUP
        ) {
            throw new ErroHttp(
                413,
                "O banco armazenado no backup é muito grande."
            );
        }

        if (
            Number(
                pacote.banco.tamanho
            ) !== bufferBanco.length
        ) {
            throw new ErroHttp(
                400,
                "O banco armazenado no backup está incompleto."
            );
        }

        return {
            pacote,
            bufferBanco
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Validação do banco recebido
    |--------------------------------------------------------------------------
    */

    function validarBancoRecebido(
        bancoRecebido
    ) {
        const resultadoIntegridade =
            bancoRecebido
                .prepare(
                    "PRAGMA integrity_check"
                )
                .get();

        const valorIntegridade =
            Object.values(
                resultadoIntegridade ||
                {}
            )[0];

        if (
            valorIntegridade !== "ok"
        ) {
            throw new ErroHttp(
                400,
                "O banco de dados do backup está corrompido."
            );
        }

        const colunas =
            bancoRecebido
                .prepare(
                    "PRAGMA table_info(clientes)"
                )
                .all()
                .map(
                    coluna =>
                        coluna.name
                );

        const colunasNecessarias = [
            "id",
            "nome",
            "cpf",
            "cpf_numeros",
            "telefone",
            "telefone_numeros",
            "linha",
            "logo_original",
            "logo_original_arquivo",
            "logo_convertida",
            "logo_convertida_arquivo",
            "observacoes",
            "criado_em",
            "atualizado_em"
        ];

        const faltando =
            colunasNecessarias.filter(
                coluna =>
                    !colunas.includes(
                        coluna
                    )
            );

        if (faltando.length) {
            throw new ErroHttp(
                400,
                "O banco do backup não possui a estrutura esperada.",
                {
                    colunasFaltando:
                        faltando
                }
            );
        }

        return bancoRecebido
            .prepare(`
                SELECT
                    id,
                    nome,
                    cpf,
                    cpf_numeros,
                    telefone,
                    telefone_numeros,
                    linha,
                    logo_original,
                    logo_original_arquivo,
                    logo_convertida,
                    logo_convertida_arquivo,
                    observacoes,
                    criado_em,
                    atualizado_em
                FROM clientes
                ORDER BY criado_em ASC
            `)
            .all();
    }

    /*
    |--------------------------------------------------------------------------
    | Criação da pasta temporária de uploads
    |--------------------------------------------------------------------------
    */

    async function prepararArquivosRecebidos(
        arquivos,
        clientes,
        pastaPreparacao
    ) {
        const caminhosEncontrados =
            new Set();

        let tamanhoTotal = 0;

        await fsPromises.mkdir(
            path.join(
                pastaPreparacao,
                "originais"
            ),
            {
                recursive: true
            }
        );

        await fsPromises.mkdir(
            path.join(
                pastaPreparacao,
                "convertidos"
            ),
            {
                recursive: true
            }
        );

        for (
            const arquivo
            of arquivos
        ) {
            const caminhoRelativo =
                normalizarCaminhoRelativo(
                    arquivo.caminho
                );

            if (
                caminhosEncontrados.has(
                    caminhoRelativo
                )
            ) {
                throw new ErroHttp(
                    400,
                    "O backup contém arquivos duplicados."
                );
            }

            caminhosEncontrados.add(
                caminhoRelativo
            );

            const conteudo =
                converterBase64(
                    arquivo.conteudo,
                    `O arquivo ${caminhoRelativo}`
                );

            if (
                Number(
                    arquivo.tamanho
                ) !== conteudo.length
            ) {
                throw new ErroHttp(
                    400,
                    `O arquivo ${caminhoRelativo} está incompleto.`
                );
            }

            tamanhoTotal +=
                conteudo.length;

            if (
                tamanhoTotal >
                LIMITE_ARQUIVOS_BACKUP
            ) {
                throw new ErroHttp(
                    413,
                    "Os arquivos do backup ultrapassaram o limite permitido."
                );
            }

            const caminhoDestino =
                path.resolve(
                    pastaPreparacao,
                    caminhoRelativo
                );

            const prefixoPermitido =
                `${path.resolve(
                    pastaPreparacao
                )}${path.sep}`;

            if (
                !caminhoDestino.startsWith(
                    prefixoPermitido
                )
            ) {
                throw new ErroHttp(
                    400,
                    "O backup contém um caminho inseguro."
                );
            }

            await fsPromises.mkdir(
                path.dirname(
                    caminhoDestino
                ),
                {
                    recursive: true
                }
            );

            await fsPromises.writeFile(
                caminhoDestino,
                conteudo,
                {
                    flag: "wx"
                }
            );
        }

        /*
         * Confere se todo arquivo referenciado
         * pelos clientes existe no pacote.
         */
        for (
            const cliente
            of clientes
        ) {
            const caminhosCliente = [
                cliente
                    .logo_original_arquivo,

                cliente
                    .logo_convertida_arquivo
            ].filter(Boolean);

            for (
                const caminho
                of caminhosCliente
            ) {
                const caminhoSeguro =
                    normalizarCaminhoRelativo(
                        caminho
                    );

                if (
                    !caminhosEncontrados.has(
                        caminhoSeguro
                    )
                ) {
                    throw new ErroHttp(
                        400,
                        `O backup não contém o arquivo ${caminhoSeguro}.`
                    );
                }
            }
        }

        return {
            quantidade:
                caminhosEncontrados.size,

            tamanhoTotal
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Restauração do banco
    |--------------------------------------------------------------------------
    */

    function restaurarRegistrosBanco(
        clientes
    ) {
        const inserir =
            banco.prepare(`
                INSERT INTO clientes (
                    id,
                    nome,
                    cpf,
                    cpf_numeros,
                    telefone,
                    telefone_numeros,
                    linha,
                    logo_original,
                    logo_original_arquivo,
                    logo_convertida,
                    logo_convertida_arquivo,
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

        let transacaoAberta =
            false;

        try {
            banco.exec(
                "BEGIN IMMEDIATE"
            );

            transacaoAberta = true;

            banco.exec(
                "DELETE FROM clientes"
            );

            for (
                const cliente
                of clientes
            ) {
                inserir.run(
                    cliente.id,
                    cliente.nome,
                    cliente.cpf,
                    cliente.cpf_numeros,
                    cliente.telefone,
                    cliente.telefone_numeros,
                    cliente.linha,
                    cliente.logo_original,
                    cliente.logo_original_arquivo,
                    cliente.logo_convertida,
                    cliente.logo_convertida_arquivo,
                    cliente.observacoes,
                    cliente.criado_em,
                    cliente.atualizado_em
                );
            }

            banco.exec("COMMIT");

            transacaoAberta = false;
        } catch (erro) {
            if (transacaoAberta) {
                try {
                    banco.exec(
                        "ROLLBACK"
                    );
                } catch {
                    /*
                     * O erro original será mantido.
                     */
                }
            }

            throw erro;
        }
    }

/*
|--------------------------------------------------------------------------
| Operações compatíveis com Windows e OneDrive
|--------------------------------------------------------------------------
*/

function aguardar(milissegundos) {
    return new Promise(
        resolve => {
            setTimeout(
                resolve,
                milissegundos
            );
        }
    );
}

async function executarComTentativas(
    operacao,
    tentativas = 8
) {
    let ultimoErro = null;

    for (
        let tentativa = 1;
        tentativa <= tentativas;
        tentativa += 1
    ) {
        try {
            return await operacao();
        } catch (erro) {
            ultimoErro = erro;

            const erroTemporario =
                [
                    "EPERM",
                    "EBUSY",
                    "EACCES",
                    "ENOTEMPTY"
                ].includes(
                    erro?.code
                );

            if (
                !erroTemporario ||
                tentativa === tentativas
            ) {
                throw erro;
            }

            await aguardar(
                250 * tentativa
            );
        }
    }

    throw ultimoErro;
}

async function garantirPastasUploads(
    pasta
) {
    await fsPromises.mkdir(
        pasta,
        {
            recursive: true
        }
    );

    await fsPromises.mkdir(
        path.join(
            pasta,
            "originais"
        ),
        {
            recursive: true
        }
    );

    await fsPromises.mkdir(
        path.join(
            pasta,
            "convertidos"
        ),
        {
            recursive: true
        }
    );
}

async function esvaziarPastaSemRemoverRaiz(
    pasta
) {
    await fsPromises.mkdir(
        pasta,
        {
            recursive: true
        }
    );

    const itens =
        await fsPromises.readdir(
            pasta,
            {
                withFileTypes: true
            }
        );

    for (
        const item
        of itens
    ) {
        const caminhoItem =
            path.join(
                pasta,
                item.name
            );

        await executarComTentativas(
            () =>
                fsPromises.rm(
                    caminhoItem,
                    {
                        recursive: true,
                        force: true,
                        maxRetries: 5,
                        retryDelay: 250
                    }
                )
        );
    }
}

async function copiarConteudoPasta(
    origem,
    destino
) {
    await fsPromises.mkdir(
        destino,
        {
            recursive: true
        }
    );

    let itens;

    try {
        itens =
            await fsPromises.readdir(
                origem,
                {
                    withFileTypes: true
                }
            );
    } catch (erro) {
        if (
            erro.code === "ENOENT"
        ) {
            return;
        }

        throw erro;
    }

    for (
        const item
        of itens
    ) {
        /*
         * Links simbólicos são ignorados
         * por segurança.
         */
        if (
            item.isSymbolicLink()
        ) {
            continue;
        }

        const caminhoOrigem =
            path.join(
                origem,
                item.name
            );

        const caminhoDestino =
            path.join(
                destino,
                item.name
            );

        if (item.isDirectory()) {
            await copiarConteudoPasta(
                caminhoOrigem,
                caminhoDestino
            );

            continue;
        }

        if (!item.isFile()) {
            continue;
        }

        await fsPromises.mkdir(
            path.dirname(
                caminhoDestino
            ),
            {
                recursive: true
            }
        );

        await executarComTentativas(
            () =>
                fsPromises.copyFile(
                    caminhoOrigem,
                    caminhoDestino
                )
        );
    }
}

    /*
    |--------------------------------------------------------------------------
    | Restaurar backup
    |--------------------------------------------------------------------------
    */

async function restaurarBackup(
    request,
    response
) {
    const identificador =
        randomUUID();

    const caminhoBancoTemporario =
        path.join(
            pastaTemporaria,
            `restauracao-${identificador}.db`
        );

    const pastaPreparacao =
        path.join(
            pastaRaiz,
            `uploads-restauracao-${identificador}`
        );

    const pastaUploadsAnterior =
        path.join(
            pastaRaiz,
            `uploads-anterior-${identificador}`
        );

    let bancoRecebido = null;

    let copiaAnteriorCriada =
        false;

    let uploadsAlterados =
        false;

    let registrosRestaurados =
        false;

    let preservarCopiaAnterior =
        false;

    try {
        /*
         * Lê e valida o arquivo enviado.
         */
        const arquivoRecebido =
            await lerArquivoBackup(
                request
            );

        const {
            pacote,
            bufferBanco
        } =
            await abrirPacoteBackup(
                arquivoRecebido.buffer
            );

        /*
         * Salva temporariamente o banco
         * presente no backup.
         */
        await fsPromises.writeFile(
            caminhoBancoTemporario,
            bufferBanco,
            {
                flag: "wx"
            }
        );

        bancoRecebido =
            new DatabaseSync(
                caminhoBancoTemporario,
                {
                    readOnly: true
                }
            );

        const clientesRecebidos =
            validarBancoRecebido(
                bancoRecebido
            );

        /*
         * Extrai e valida todos os arquivos
         * em uma pasta temporária.
         */
        const resumoArquivos =
            await prepararArquivosRecebidos(
                pacote.arquivos,
                clientesRecebidos,
                pastaPreparacao
            );

        /*
         * Mantém a pasta uploads original
         * no mesmo lugar.
         *
         * Isso evita o erro EPERM causado
         * pelo OneDrive ao renomear a pasta.
         */
        await garantirPastasUploads(
            pastaUploads
        );

        await fsPromises.mkdir(
            pastaUploadsAnterior,
            {
                recursive: true
            }
        );

        /*
         * Cria uma cópia de segurança dos
         * uploads atuais antes de modificá-los.
         */
        await copiarConteudoPasta(
            pastaUploads,
            pastaUploadsAnterior
        );

        copiaAnteriorCriada =
            true;

        /*
         * A partir daqui a pasta atual
         * começa a ser modificada.
         */
        uploadsAlterados =
            true;

        await esvaziarPastaSemRemoverRaiz(
            pastaUploads
        );

        /*
         * Copia os arquivos restaurados sem
         * renomear a pasta uploads.
         */
        await copiarConteudoPasta(
            pastaPreparacao,
            pastaUploads
        );

        await garantirPastasUploads(
            pastaUploads
        );

        /*
         * Somente após os arquivos estarem
         * prontos o banco é atualizado.
         */
        restaurarRegistrosBanco(
            clientesRecebidos
        );

        registrosRestaurados =
            true;

        const dataRestauro =
            new Date()
                .toISOString();

        /*
         * Uma falha apenas ao salvar a data
         * não deve cancelar a restauração.
         */
        try {
            await salvarStatusBackup({
                ultimoRestauro:
                    dataRestauro
            });
        } catch (erroStatus) {
            console.error(
                "A restauração terminou, mas não foi possível salvar a data:",
                erroStatus
            );
        }

        /*
         * A cópia antiga não é mais necessária
         * depois do sucesso completo.
         */
        await removerSilenciosamente(
            pastaUploadsAnterior
        );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Backup restaurado com sucesso.",

                restauracao: {
                    arquivo:
                        arquivoRecebido.nome,

                    criadoEm:
                        pacote.criadoEm ||
                        null,

                    restauradoEm:
                        dataRestauro,

                    clientes:
                        clientesRecebidos.length,

                    arquivos:
                        resumoArquivos.quantidade,

                    tamanhoArquivos:
                        resumoArquivos.tamanhoTotal
                }
            }
        );
    } catch (erro) {
        /*
         * Se os uploads foram modificados,
         * mas o banco não foi restaurado,
         * recupera os arquivos anteriores.
         */
        if (
            uploadsAlterados &&
            !registrosRestaurados &&
            copiaAnteriorCriada
        ) {
            try {
                await esvaziarPastaSemRemoverRaiz(
                    pastaUploads
                );

                await copiarConteudoPasta(
                    pastaUploadsAnterior,
                    pastaUploads
                );

                await garantirPastasUploads(
                    pastaUploads
                );

                console.log(
                    "Os uploads anteriores foram recuperados."
                );
            } catch (
                erroRecuperacao
            ) {
                preservarCopiaAnterior =
                    true;

                console.error(
                    "Não foi possível recuperar automaticamente os uploads anteriores:",
                    erroRecuperacao
                );

                console.error(
                    "A cópia de segurança foi mantida em:",
                    pastaUploadsAnterior
                );
            }
        }

        throw erro;
    } finally {
        if (bancoRecebido) {
            try {
                bancoRecebido.close();
            } catch {
                /*
                 * O arquivo temporário ainda
                 * será removido quando possível.
                 */
            }
        }

        await removerSilenciosamente(
            caminhoBancoTemporario
        );

        await removerSilenciosamente(
            pastaPreparacao
        );

        /*
         * Caso a recuperação automática tenha
         * falhado, preserva a cópia anterior
         * para recuperação manual.
         */
        if (
            !preservarCopiaAnterior
        ) {
            await removerSilenciosamente(
                pastaUploadsAnterior
            );
        }
    }
}

    /*
    |--------------------------------------------------------------------------
    | Resposta de status
    |--------------------------------------------------------------------------
    */

    async function obterStatus(
        response
    ) {
        const status =
            await lerStatusBackup();

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                backup: status
            }
        );
    }

    return {
        baixarBackup,
        restaurarBackup,
        obterStatus
    };
}

module.exports = {
    criarServicoBackup
};