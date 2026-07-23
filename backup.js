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
    /*
     * Confere a integridade geral
     * do arquivo SQLite.
     */

    const resultadoIntegridade =
        bancoRecebido
            .prepare(
                "PRAGMA integrity_check"
            )
            .get();

    const valorIntegridade =
        Object.values(
            resultadoIntegridade || {}
        )[0];

    if (
        valorIntegridade !==
        "ok"
    ) {
        throw new ErroHttp(
            400,
            "O banco de dados do backup está corrompido."
        );
    }

    /*
     * Confere relacionamentos, como
     * ordens vinculadas a clientes.
     */

    const errosRelacionamentos =
        bancoRecebido
            .prepare(
                "PRAGMA foreign_key_check"
            )
            .all();

    if (
        errosRelacionamentos.length
    ) {
        throw new ErroHttp(
            400,
            "O banco do backup possui relacionamentos inválidos.",
            {
                quantidade:
                    errosRelacionamentos.length
            }
        );
    }

    const tabelasObrigatorias = {
        usuarios: {
            tabela:
                "usuarios",

            colunas: [
                "id",
                "nome",
                "usuario",
                "senha_hash",
                "perfil",
                "ativo",
                "criado_em",
                "atualizado_em",
                "ultimo_login_em",
                "permissoes"
            ]
        },

        clientes: {
            tabela:
                "clientes",

            colunas: [
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
            ]
        },

        linhas: {
            tabela:
                "catalogo_linhas",

            colunas: [
                "id",
                "marca",
                "codigo",
                "nome",
                "cor_hex",
                "unidade",
                "estoque",
                "estoque_minimo",
                "ativo",
                "observacoes",
                "criado_em",
                "atualizado_em",
                "fornecedor",
                "valor_centavos"
            ]
        },

        ordens: {
            tabela:
                "ordens",

            colunas: [
                "numero",
                "id",
                "cliente_id",
                "cliente_nome",
                "cliente_cpf",
                "descricao",
                "quantidade",
                "linha",
                "prazo_entrega",
                "valor_centavos",
                "status",
                "arquivo_original",
                "arquivo_convertido",
                "observacoes",
                "criado_em",
                "atualizado_em"
            ]
        }
    };

    const configuracaoArquivosClientes = {
    tabela:
        "cliente_arquivos",

    colunas: [
        "id",
        "cliente_id",
        "tipo",
        "nome_original",
        "caminho_arquivo",
        "criado_em"
    ]
};

    function protegerIdentificador(
        valor
    ) {
        return `"${String(
            valor
        ).replace(
            /"/g,
            '""'
        )}"`;
    }

    function lerTabelaObrigatoria(
        configuracao
    ) {
        const nomeTabela =
            configuracao.tabela;

        const colunasExistentes =
            bancoRecebido
                .prepare(
                    `PRAGMA table_info(${
                        protegerIdentificador(
                            nomeTabela
                        )
                    })`
                )
                .all()
                .map(
                    coluna =>
                        coluna.name
                );

        const colunasFaltando =
            configuracao
                .colunas
                .filter(
                    coluna =>
                        !colunasExistentes
                            .includes(
                                coluna
                            )
                );

        if (
            colunasFaltando.length
        ) {
            throw new ErroHttp(
                400,
                `A tabela ${nomeTabela} do backup não possui a estrutura esperada.`,
                {
                    tabela:
                        nomeTabela,

                    colunasFaltando
                }
            );
        }

        const selecaoColunas =
            configuracao
                .colunas
                .map(
                    protegerIdentificador
                )
                .join(
                    ",\n"
                );

        return bancoRecebido
            .prepare(`
                SELECT
                    ${selecaoColunas}

                FROM ${
                    protegerIdentificador(
                        nomeTabela
                    )
                }
            `)
            .all();
    }

    function tabelaExiste(
    nomeTabela
) {
    return Boolean(
        bancoRecebido
            .prepare(`
                SELECT name

                FROM sqlite_master

                WHERE
                    type = 'table'
                    AND name = ?

                LIMIT 1
            `)
            .get(
                nomeTabela
            )
    );
}

const dadosRecebidos = {};

for (
    const [
        identificador,
        configuracao
    ]
    of Object.entries(
        tabelasObrigatorias
    )
) {
    dadosRecebidos[
        identificador
    ] =
        lerTabelaObrigatoria(
            configuracao
        );
}

/*
 * Celular é opcional para permitir
 * a restauração de backups antigos.
 */

const colunasClientesBackup =
    bancoRecebido
        .prepare(`
            PRAGMA table_info(
                ${
                    protegerIdentificador(
                        "clientes"
                    )
                }
            )
        `)
        .all()
        .map(
            coluna =>
                coluna.name
        );

const backupPossuiCelular =
    colunasClientesBackup.includes(
        "celular"
    );

const backupPossuiCelularNumeros =
    colunasClientesBackup.includes(
        "celular_numeros"
    );

const celularesBackup =
    bancoRecebido
        .prepare(`
            SELECT
                id,

                ${
                    backupPossuiCelular
                        ? protegerIdentificador(
                            "celular"
                        )
                        : "NULL"
                }
                    AS celular,

                ${
                    backupPossuiCelularNumeros
                        ? protegerIdentificador(
                            "celular_numeros"
                        )
                        : "NULL"
                }
                    AS celular_numeros

            FROM ${
                protegerIdentificador(
                    "clientes"
                )
            }
        `)
        .all();

const celularesPorCliente =
    new Map(
        celularesBackup.map(
            cliente => [
                cliente.id,
                cliente
            ]
        )
    );

const backupNovoContatos =
    backupPossuiCelular ||
    backupPossuiCelularNumeros;

dadosRecebidos.clientes =
    dadosRecebidos.clientes.map(
        cliente => {
            const contato =
                celularesPorCliente.get(
                    cliente.id
                );

            if (!backupNovoContatos) {
                return {
                    ...cliente,

                    celular:
                        cliente.telefone ||
                        "",

                    celular_numeros:
                        cliente
                            .telefone_numeros ||
                        "",

                    telefone:
                        "",

                    telefone_numeros:
                        ""
                };
            }

            return {
                ...cliente,

                celular:
                    contato?.celular ||
                    "",

                celular_numeros:
                    contato
                        ?.celular_numeros ||
                    ""
            };
        }
    );

/*
 * As colunas de seleção da ordem são
 * opcionais para manter compatibilidade
 * com backups antigos.
 */

const colunasOrdensBackup =
    bancoRecebido
        .prepare(`
            PRAGMA table_info(
                ${
                    protegerIdentificador(
                        "ordens"
                    )
                }
            )
        `)
        .all()
        .map(
            coluna =>
                coluna.name
        );

const backupPossuiArquivoOriginalId =
    colunasOrdensBackup.includes(
        "arquivo_original_id"
    );

const backupPossuiArquivoConvertidoId =
    colunasOrdensBackup.includes(
        "arquivo_convertido_id"
    );

const idsArquivosOrdens =
    bancoRecebido
        .prepare(`
            SELECT
                id,

                ${
                    backupPossuiArquivoOriginalId
                        ? protegerIdentificador(
                            "arquivo_original_id"
                        )
                        : "NULL"
                }
                    AS arquivo_original_id,

                ${
                    backupPossuiArquivoConvertidoId
                        ? protegerIdentificador(
                            "arquivo_convertido_id"
                        )
                        : "NULL"
                }
                    AS arquivo_convertido_id

            FROM ${
                protegerIdentificador(
                    "ordens"
                )
            }
        `)
        .all();

const idsArquivosPorOrdem =
    new Map(
        idsArquivosOrdens.map(
            ordem => [
                ordem.id,
                ordem
            ]
        )
    );

dadosRecebidos.ordens =
    dadosRecebidos.ordens.map(
        ordem => {
            const ids =
                idsArquivosPorOrdem.get(
                    ordem.id
                );

            return {
                ...ordem,

                arquivo_original_id:
                    ids
                        ?.arquivo_original_id ||
                    null,

                arquivo_convertido_id:
                    ids
                        ?.arquivo_convertido_id ||
                    null
            };
        }
    );

    /*
 * Backups novos possuem a tabela completa.
 * Backups antigos são convertidos usando
 * os arquivos principais dos clientes.
 */

if (
    tabelaExiste(
        configuracaoArquivosClientes
            .tabela
    )
) {
    dadosRecebidos.clienteArquivos =
        lerTabelaObrigatoria(
            configuracaoArquivosClientes
        );
} else {
    dadosRecebidos.clienteArquivos =
        [];

    const caminhosIncluidos =
        new Set();

    for (
        const cliente
        of dadosRecebidos.clientes
    ) {
        const arquivosLegados = [
            {
                tipo:
                    "original",

                nome:
                    cliente
                        .logo_original,

                caminho:
                    cliente
                        .logo_original_arquivo
            },
            {
                tipo:
                    "convertido",

                nome:
                    cliente
                        .logo_convertida,

                caminho:
                    cliente
                        .logo_convertida_arquivo
            }
        ];

        for (
            const arquivo
            of arquivosLegados
        ) {
            if (!arquivo.caminho) {
                continue;
            }

            const caminhoNormalizado =
                normalizarCaminhoRelativo(
                    arquivo.caminho
                );

            if (
                caminhosIncluidos.has(
                    caminhoNormalizado
                )
            ) {
                continue;
            }

            caminhosIncluidos.add(
                caminhoNormalizado
            );

            dadosRecebidos
                .clienteArquivos
                .push({
                    id:
                        randomUUID(),

                    cliente_id:
                        cliente.id,

                    tipo:
                        arquivo.tipo,

                    nome_original:
                        arquivo.nome ||
                        (
                            arquivo.tipo ===
                                "original"

                                ? "logo-original"
                                : "arquivo-convertido"
                        ),

                    caminho_arquivo:
                        caminhoNormalizado,

                    criado_em:
                        cliente.criado_em ||
                        new Date()
                            .toISOString()
                });
        }
    }
}

dadosRecebidos.clientes =
    dadosRecebidos.clientes.map(
        cliente => ({
            ...cliente,

            logo_original_arquivo:
                cliente
                    .logo_original_arquivo

                    ? normalizarCaminhoRelativo(
                        cliente
                            .logo_original_arquivo
                    )

                    : "",

            logo_convertida_arquivo:
                cliente
                    .logo_convertida_arquivo

                    ? normalizarCaminhoRelativo(
                        cliente
                            .logo_convertida_arquivo
                    )

                    : ""
        })
    );

dadosRecebidos.clienteArquivos =
    dadosRecebidos
        .clienteArquivos
        .map(
            arquivo => ({
                ...arquivo,

                caminho_arquivo:
                    normalizarCaminhoRelativo(
                        arquivo
                            .caminho_arquivo
                    )
            })
        );

/*
 * Preserva a seleção dos backups novos.
 *
 * Para backups antigos, tenta localizar
 * o arquivo pelo cliente, tipo e nome.
 */

const arquivosClientesPorId =
    new Map(
        dadosRecebidos
            .clienteArquivos
            .map(
                arquivo => [
                    arquivo.id,
                    arquivo
                ]
            )
    );

const arquivosPorClienteTipo =
    new Map();

for (
    const arquivo
    of dadosRecebidos
        .clienteArquivos
) {
    const chave =
        `${
            arquivo.cliente_id
        }\u0000${
            arquivo.tipo
        }`;

    if (
        !arquivosPorClienteTipo.has(
            chave
        )
    ) {
        arquivosPorClienteTipo.set(
            chave,
            []
        );
    }

    arquivosPorClienteTipo
        .get(
            chave
        )
        .push(
            arquivo
        );
}

function resolverArquivoOrdemRestaurada(
    ordem,
    tipo,
    backupPossuiColuna
) {
    const original =
        tipo === "original";

    const campoId =
        original
            ? "arquivo_original_id"
            : "arquivo_convertido_id";

    const campoNome =
        original
            ? "arquivo_original"
            : "arquivo_convertido";

    const idRecebido =
        String(
            ordem[
                campoId
            ] || ""
        ).trim();

    /*
     * Em backups novos, inclusive uma
     * seleção vazia precisa ser respeitada.
     */

    if (backupPossuiColuna) {
        if (!idRecebido) {
            return null;
        }

        const arquivo =
            arquivosClientesPorId.get(
                idRecebido
            );

        if (
            !arquivo ||
            arquivo.cliente_id !==
                ordem.cliente_id ||
            arquivo.tipo !== tipo
        ) {
            throw new ErroHttp(
                400,

                original
                    ? "O backup possui uma ordem vinculada a uma logo original inválida."
                    : "O backup possui uma ordem vinculada a um arquivo convertido inválido."
            );
        }

        return arquivo;
    }

    /*
     * Backups antigos não possuíam os IDs.
     * Quando há nome, recuperamos o vínculo.
     */

    const nomeRecebido =
        String(
            ordem[
                campoNome
            ] || ""
        ).trim();

    if (
        !ordem.cliente_id ||
        !nomeRecebido
    ) {
        return null;
    }

    const chave =
        `${
            ordem.cliente_id
        }\u0000${tipo}`;

    const arquivosDisponiveis =
        arquivosPorClienteTipo.get(
            chave
        ) || [];

    return (
        arquivosDisponiveis.find(
            arquivo =>
                arquivo.nome_original ===
                    nomeRecebido
        ) ||

        arquivosDisponiveis[0] ||

        null
    );
}

dadosRecebidos.ordens =
    dadosRecebidos.ordens.map(
        ordem => {
            const arquivoOriginal =
                resolverArquivoOrdemRestaurada(
                    ordem,
                    "original",
                    backupPossuiArquivoOriginalId
                );

            const arquivoConvertido =
                resolverArquivoOrdemRestaurada(
                    ordem,
                    "convertido",
                    backupPossuiArquivoConvertidoId
                );

            return {
                ...ordem,

                arquivo_original_id:
                    arquivoOriginal
                        ?.id ||
                    null,

                arquivo_original:
                    arquivoOriginal
                        ?.nome_original ||
                    ordem
                        .arquivo_original ||
                    "",

                arquivo_convertido_id:
                    arquivoConvertido
                        ?.id ||
                    null,

                arquivo_convertido:
                    arquivoConvertido
                        ?.nome_original ||
                    ordem
                        .arquivo_convertido ||
                    ""
            };
        }
    );

    /*
     * Impede restaurar um banco que
     * deixaria o sistema sem acesso.
     */

    const possuiAdministradorAtivo =
        dadosRecebidos
            .usuarios
            .some(
                usuario =>
                    usuario.perfil ===
                        "administrador" &&

                    Number(
                        usuario.ativo
                    ) === 1
            );

    if (
        !possuiAdministradorAtivo
    ) {
        throw new ErroHttp(
            400,
            "O backup não possui um administrador ativo."
        );
    }

    return dadosRecebidos;
}

    /*
    |--------------------------------------------------------------------------
    | Criação da pasta temporária de uploads
    |--------------------------------------------------------------------------
    */

    async function prepararArquivosRecebidos(
    arquivos,
    clientes,
    arquivosClientes,
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
 * Confere todos os arquivos principais
 * e adicionais referenciados no banco.
 */

const caminhosReferenciados = [
    ...clientes.flatMap(
        cliente => [
            cliente
                .logo_original_arquivo,

            cliente
                .logo_convertida_arquivo
        ]
    ),

    ...arquivosClientes.map(
        arquivo =>
            arquivo
                .caminho_arquivo
    )
].filter(Boolean);

for (
    const caminho
    of caminhosReferenciados
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
        dadosRecebidos
    ) {
        const configuracoes = [
            {
                tabela: "usuarios",
                colunas: [
                    "id",
                    "nome",
                    "usuario",
                    "senha_hash",
                    "perfil",
                    "ativo",
                    "criado_em",
                    "atualizado_em",
                    "ultimo_login_em",
                    "permissoes"
                ],
                registros:
                    dadosRecebidos.usuarios
            },
            {
                tabela: "clientes",
                colunas: [
                    "id",
                    "nome",
                    "cpf",
                    "cpf_numeros",
                    "telefone",
                    "telefone_numeros",
                    "celular",
                    "celular_numeros",
                    "linha",
                    "logo_original",
                    "logo_original_arquivo",
                    "logo_convertida",
                    "logo_convertida_arquivo",
                    "observacoes",
                    "criado_em",
                    "atualizado_em"
                ],
                registros:
                    dadosRecebidos.clientes
            },

            {
    tabela:
        "cliente_arquivos",

    colunas: [
        "id",
        "cliente_id",
        "tipo",
        "nome_original",
        "caminho_arquivo",
        "criado_em"
    ],

    registros:
        dadosRecebidos
            .clienteArquivos
},

            {
                tabela: "catalogo_linhas",
                colunas: [
                    "id",
                    "marca",
                    "codigo",
                    "nome",
                    "cor_hex",
                    "unidade",
                    "estoque",
                    "estoque_minimo",
                    "ativo",
                    "observacoes",
                    "criado_em",
                    "atualizado_em",
                    "fornecedor",
                    "valor_centavos"
                ],
                registros:
                    dadosRecebidos.linhas
            },
            {
                tabela: "ordens",
                colunas: [
                    "numero",
                    "id",
                    "cliente_id",
                    "cliente_nome",
                    "cliente_cpf",
                    "descricao",
                    "quantidade",
                    "linha",
                    "prazo_entrega",
                    "valor_centavos",
                    "status",
                    "arquivo_original_id",
                    "arquivo_original",
                    "arquivo_convertido_id",
                    "arquivo_convertido",
                    "observacoes",
                    "criado_em",
                    "atualizado_em"
                ],
                registros:
                    dadosRecebidos.ordens
            }
        ];

        function protegerIdentificador(
            valor
        ) {
            return `"${String(
                valor
            ).replace(
                /"/g,
                '""'
            )}"`;
        }

        const inseridores =
            configuracoes.map(
                configuracao => {
                    const colunasSql =
                        configuracao
                            .colunas
                            .map(
                                protegerIdentificador
                            )
                            .join(", ");

                    const valoresSql =
                        configuracao
                            .colunas
                            .map(() => "?")
                            .join(", ");

                    return {
                        ...configuracao,

                        inserir:
                            banco.prepare(`
                                INSERT INTO ${
                                    protegerIdentificador(
                                        configuracao.tabela
                                    )
                                } (
                                    ${colunasSql}
                                )
                                VALUES (
                                    ${valoresSql}
                                )
                            `)
                    };
                }
            );

        let transacaoAberta =
            false;

        try {
            banco.exec(
                "BEGIN IMMEDIATE"
            );

            transacaoAberta = true;

            /*
             * Sessões e bloqueios não são
             * reaproveitados por segurança.
             * Após restaurar, todos entram
             * novamente com os usuários do backup.
             */
            banco.exec(`
            DELETE FROM sessoes;
            DELETE FROM tentativas_login;
            DELETE FROM ordens;
            DELETE FROM cliente_arquivos;
            DELETE FROM clientes;
            DELETE FROM catalogo_linhas;
            DELETE FROM usuarios;

            DELETE FROM sqlite_sequence
            WHERE name = 'ordens';
            `);

            for (
                const configuracao
                of inseridores
            ) {
                for (
                    const registro
                    of configuracao.registros
                ) {
                    configuracao
                        .inserir
                        .run(
                            ...configuracao
                                .colunas
                                .map(
                                    coluna =>
                                        registro[coluna]
                                )
                        );
                }
            }

            const resultadoIntegridade =
                banco
                    .prepare(
                        "PRAGMA foreign_key_check"
                    )
                    .all();

            if (
                resultadoIntegridade.length
            ) {
                throw new ErroHttp(
                    400,
                    "Os dados restaurados possuem relacionamentos inválidos."
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

        const dadosRecebidos =
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
        dadosRecebidos.clientes,
        dadosRecebidos
            .clienteArquivos,
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
            dadosRecebidos
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

                    usuarios:
                        dadosRecebidos.usuarios.length,

                    clientes:
                    dadosRecebidos.clientes.length,

                    arquivosClientes:
                    dadosRecebidos
                    .clienteArquivos
                    .length,

                    linhas:
                        dadosRecebidos.linhas.length,

                    ordens:
                        dadosRecebidos.ordens.length,

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
