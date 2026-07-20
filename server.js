const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const { criarServicoBackup } = require("./backup");
const { criarServicoAutenticacao } = require("./autenticacao");
const { criarServicoOrdens } = require("./ordens");
const { criarServicoLinhas } = require("./linhas");

/*
|--------------------------------------------------------------------------
| Configurações
|--------------------------------------------------------------------------
*/

const PORTA = Number(process.env.PORT || 3000);
const PASTA_RAIZ = __dirname;

const PASTA_ARMAZENAMENTO =
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    process.env.STORAGE_PATH ||
    PASTA_RAIZ;

const PASTA_PUBLICA = path.join(
    PASTA_RAIZ,
    "public"
);

const PASTA_DADOS = path.join(
    PASTA_ARMAZENAMENTO,
    "dados"
);

const PASTA_UPLOADS = path.join(
    PASTA_ARMAZENAMENTO,
    "uploads"
);

const PASTA_ORIGINAIS = path.join(
    PASTA_UPLOADS,
    "originais"
);

const PASTA_CONVERTIDOS = path.join(
    PASTA_UPLOADS,
    "convertidos"
);

const CAMINHO_BANCO = path.join(
    PASTA_DADOS,
    "sistema-bordado.db"
);

const LIMITE_JSON =
    2 * 1024 * 1024;

const LIMITE_UPLOAD_TOTAL =
    35 * 1024 * 1024;

const LIMITE_LOGO_ORIGINAL =
    12 * 1024 * 1024;

const LIMITE_LOGO_CONVERTIDA =
    20 * 1024 * 1024;

const EXTENSOES_ORIGINAIS =
    new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".svg",
        ".pdf"
    ]);

const EXTENSOES_CONVERTIDAS =
    new Set([
        ".dst",
        ".pes",
        ".jef",
        ".exp",
        ".vp3",
        ".zip"
    ]);

const TIPOS_MIME = {
    ".html":
        "text/html; charset=utf-8",

    ".css":
        "text/css; charset=utf-8",

    ".js":
        "text/javascript; charset=utf-8",

    ".json":
        "application/json; charset=utf-8",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg",

    ".webp":
        "image/webp",

    ".svg":
        "image/svg+xml",

    ".pdf":
        "application/pdf",

    ".zip":
        "application/zip",

    ".dst":
        "application/octet-stream",

    ".pes":
        "application/octet-stream",

    ".jef":
        "application/octet-stream",

    ".exp":
        "application/octet-stream",

    ".vp3":
        "application/octet-stream",

    ".ico":
        "image/x-icon"
};

/*
|--------------------------------------------------------------------------
| Verificação do Node.js e criação das pastas
|--------------------------------------------------------------------------
*/

const versaoPrincipalNode =
    Number(
        process.versions.node
            .split(".")[0]
    );

if (versaoPrincipalNode < 24) {
    console.error(
        "Este projeto precisa do Node.js 24 ou superior."
    );

    console.error(
        `Versão encontrada: ${process.versions.node}`
    );

    process.exit(1);
}

for (
    const pasta
    of [
        PASTA_DADOS,
        PASTA_PUBLICA,
        PASTA_UPLOADS,
        PASTA_ORIGINAIS,
        PASTA_CONVERTIDOS
    ]
) {
    fs.mkdirSync(
        pasta,
        {
            recursive: true
        }
    );
}

/*
|--------------------------------------------------------------------------
| Banco de dados dos clientes
|--------------------------------------------------------------------------
*/

const banco =
    new DatabaseSync(
        CAMINHO_BANCO,
        {
            timeout: 5000
        }
    );

banco.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,

        nome TEXT NOT NULL,

        cpf TEXT NOT NULL,

        cpf_numeros TEXT
            NOT NULL
            UNIQUE,

        telefone TEXT NOT NULL,

        telefone_numeros TEXT
            NOT NULL,

        linha TEXT NOT NULL,

        logo_original TEXT
            NOT NULL
            DEFAULT '',

        logo_convertida TEXT
            NOT NULL
            DEFAULT '',

        observacoes TEXT
            NOT NULL
            DEFAULT '',

        criado_em TEXT NOT NULL,

        atualizado_em TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS
        indice_clientes_nome

    ON clientes(nome);

    CREATE INDEX IF NOT EXISTS
        indice_clientes_telefone

    ON clientes(telefone_numeros);

    CREATE INDEX IF NOT EXISTS
        indice_clientes_criado_em

    ON clientes(criado_em);
`);

function garantirColunaCliente(
    nome,
    definicao
) {
    const existe =
        banco
            .prepare(
                "PRAGMA table_info(clientes)"
            )
            .all()
            .some(
                coluna =>
                    coluna.name === nome
            );

    if (!existe) {
        banco.exec(`
            ALTER TABLE clientes
            ADD COLUMN ${nome}
            ${definicao}
        `);
    }
}

garantirColunaCliente(
    "logo_original_arquivo",
    "TEXT NOT NULL DEFAULT ''"
);

garantirColunaCliente(
    "logo_convertida_arquivo",
    "TEXT NOT NULL DEFAULT ''"
);

const CAMPOS_CLIENTE_SQL = `
    id,
    nome,
    cpf,
    telefone,
    linha,
    logo_original,
    logo_original_arquivo,
    logo_convertida,
    logo_convertida_arquivo,
    observacoes,
    criado_em,
    atualizado_em
`;

const consultasClientes = {
    todos:
        banco.prepare(`
            SELECT
                ${CAMPOS_CLIENTE_SQL}

            FROM clientes

            ORDER BY
                criado_em DESC
        `),

    porId:
        banco.prepare(`
            SELECT
                ${CAMPOS_CLIENTE_SQL}

            FROM clientes

            WHERE id = ?

            LIMIT 1
        `),

    cpfExistente:
        banco.prepare(`
            SELECT id

            FROM clientes

            WHERE cpf_numeros = ?

            LIMIT 1
        `),

    cpfOutroCliente:
        banco.prepare(`
            SELECT id

            FROM clientes

            WHERE
                cpf_numeros = ?
                AND id <> ?

            LIMIT 1
        `),

    inserir:
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
        `),

    atualizar:
        banco.prepare(`
            UPDATE clientes

            SET
                nome = ?,
                cpf = ?,
                cpf_numeros = ?,
                telefone = ?,
                telefone_numeros = ?,
                linha = ?,
                logo_original = ?,
                logo_original_arquivo = ?,
                logo_convertida = ?,
                logo_convertida_arquivo = ?,
                observacoes = ?,
                atualizado_em = ?

            WHERE id = ?
        `),

    excluir:
        banco.prepare(`
            DELETE FROM clientes

            WHERE id = ?
        `),

    excluirTodos:
        banco.prepare(`
            DELETE FROM clientes
        `),

    removerLogoOriginal:
        banco.prepare(`
            UPDATE clientes

            SET
                logo_original = '',
                logo_original_arquivo = '',
                atualizado_em = ?

            WHERE id = ?
        `),

    removerLogoConvertida:
        banco.prepare(`
            UPDATE clientes

            SET
                logo_convertida = '',
                logo_convertida_arquivo = '',
                atualizado_em = ?

            WHERE id = ?
        `)
};

/*
|--------------------------------------------------------------------------
| Erros e respostas HTTP
|--------------------------------------------------------------------------
*/

class ErroHttp extends Error {
    constructor(
        status,
        mensagem,
        detalhes = null
    ) {
        super(mensagem);

        this.status =
            status;

        this.detalhes =
            detalhes;
    }
}

function enviarJson(
    response,
    status,
    dados
) {
    const conteudo =
        JSON.stringify(
            dados
        );

    response.writeHead(
        status,
        {
            "Content-Type":
                "application/json; charset=utf-8",

            "Content-Length":
                Buffer.byteLength(
                    conteudo
                ),

            "Cache-Control":
                "no-store",

            "X-Content-Type-Options":
                "nosniff"
        }
    );

    response.end(
        conteudo
    );
}

function redirecionar(
    response,
    destino,
    status = 302
) {
    response.writeHead(
        status,
        {
            Location:
                destino,

            "Cache-Control":
                "no-store"
        }
    );

    response.end();
}

function enviarErro(
    response,
    erro
) {
    if (response.headersSent) {
        response.destroy();

        return;
    }

    const status =
        erro instanceof ErroHttp
            ? erro.status
            : 500;

    if (status === 500) {
        console.error(
            erro
        );
    }

    enviarJson(
        response,
        status,
        {
            sucesso:
                false,

            mensagem:
                erro instanceof ErroHttp
                    ? erro.message
                    : "Ocorreu um erro interno no servidor.",

            detalhes:
                erro instanceof ErroHttp
                    ? erro.detalhes
                    : null
        }
    );
}

/*
|--------------------------------------------------------------------------
| Formatação e validação dos clientes
|--------------------------------------------------------------------------
*/

function somenteNumeros(
    valor
) {
    return String(
        valor || ""
    ).replace(
        /\D/g,
        ""
    );
}

function limparTexto(
    valor
) {
    return String(
        valor || ""
    ).trim();
}

function formatarCpf(
    valor
) {
    return somenteNumeros(
        valor
    )
        .slice(
            0,
            11
        )
        .replace(
            /(\d{3})(\d)/,
            "$1.$2"
        )
        .replace(
            /(\d{3})(\d)/,
            "$1.$2"
        )
        .replace(
            /(\d{3})(\d{1,2})$/,
            "$1-$2"
        );
}

function normalizarCnpj(
    valor
) {
    const bruto =
        String(
            valor || ""
        )
            .toUpperCase()
            .replace(
                /[^A-Z0-9]/g,
                ""
            );

    const base =
        bruto.slice(
            0,
            12
        );

    const digitos =
        bruto
            .slice(12)
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                2
            );

    return base + digitos;
}

function formatarCnpj(
    valor
) {
    return normalizarCnpj(
        valor
    )
        .replace(
            /^([A-Z0-9]{2})([A-Z0-9])/,
            "$1.$2"
        )
        .replace(
            /^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/,
            "$1.$2.$3"
        )
        .replace(
            /\.([A-Z0-9]{3})([A-Z0-9])/,
            ".$1/$2"
        )
        .replace(
            /([A-Z0-9]{4})([0-9]{1,2})$/,
            "$1-$2"
        );
}

function identificarTipoPessoaPorDocumento(
    valor
) {
    const documento =
        String(
            valor || ""
        )
            .toUpperCase()
            .replace(
                /[^A-Z0-9]/g,
                ""
            );

    return (
        documento.length === 14 ||
        /[A-Z]/.test(
            documento
        )
    )
        ? "juridica"
        : "fisica";
}

function normalizarDocumentoPorTipo(
    valor,
    tipo
) {
    return tipo ===
        "juridica"
        ? normalizarCnpj(
            valor
        )
        : somenteNumeros(
            valor
        ).slice(
            0,
            11
        );
}

function formatarDocumentoPorTipo(
    valor,
    tipo
) {
    return tipo ===
        "juridica"
        ? formatarCnpj(
            valor
        )
        : formatarCpf(
            valor
        );
}

function formatarTelefone(
    valor
) {
    const numeros =
        somenteNumeros(
            valor
        ).slice(
            0,
            11
        );

    if (numeros.length <= 10) {
        return numeros
            .replace(
                /(\d{2})(\d)/,
                "($1) $2"
            )
            .replace(
                /(\d{4})(\d)/,
                "$1-$2"
            );
    }

    return numeros
        .replace(
            /(\d{2})(\d)/,
            "($1) $2"
        )
        .replace(
            /(\d{5})(\d)/,
            "$1-$2"
        );
}

function validarCpf(
    valor
) {
    const cpf =
        somenteNumeros(
            valor
        );

    if (
        cpf.length !== 11 ||
        /^(\d)\1{10}$/.test(
            cpf
        )
    ) {
        return false;
    }

    function calcularDigito(
        quantidade
    ) {
        let soma =
            0;

        for (
            let indice = 0;
            indice < quantidade;
            indice += 1
        ) {
            soma +=
                Number(
                    cpf[indice]
                ) *
                (
                    quantidade +
                    1 -
                    indice
                );
        }

        const resto =
            (
                soma *
                10
            ) % 11;

        return resto === 10
            ? 0
            : resto;
    }

    return (
        calcularDigito(
            9
        ) ===
            Number(
                cpf[9]
            ) &&

        calcularDigito(
            10
        ) ===
            Number(
                cpf[10]
            )
    );
}

function validarCnpj(
    valor
) {
    const cnpj =
        normalizarCnpj(
            valor
        );

    if (
        !/^[A-Z0-9]{12}\d{2}$/.test(
            cnpj
        ) ||
        /^(\d)\1{13}$/.test(
            cnpj
        )
    ) {
        return false;
    }

    function valorCaractere(
        caractere
    ) {
        return (
            caractere
                .charCodeAt(
                    0
                ) -
            48
        );
    }

    function calcularDigito(
        base,
        pesos
    ) {
        const soma =
            base
                .split("")
                .reduce(
                    (
                        total,
                        caractere,
                        indice
                    ) =>
                        total +
                        valorCaractere(
                            caractere
                        ) *
                        pesos[
                            indice
                        ],
                    0
                );

        const resto =
            soma % 11;

        return resto < 2
            ? 0
            : 11 - resto;
    }

    const base =
        cnpj.slice(
            0,
            12
        );

    const primeiro =
        calcularDigito(
            base,
            [
                5, 4, 3, 2,
                9, 8, 7, 6,
                5, 4, 3, 2
            ]
        );

    const segundo =
        calcularDigito(
            base + primeiro,
            [
                6, 5, 4, 3,
                2, 9, 8, 7,
                6, 5, 4, 3,
                2
            ]
        );

    return (
        cnpj.slice(
            -2
        ) ===
        `${primeiro}${segundo}`
    );
}

function validarDadosCliente(
    dados
) {
    const nome =
        limparTexto(
            dados.nome
        );

    const documentoRecebido =
        limparTexto(
            dados.cpf
        );

    const tipoPessoa =
        identificarTipoPessoaPorDocumento(
            documentoRecebido
        );

    const documentoNormalizado =
        normalizarDocumentoPorTipo(
            documentoRecebido,
            tipoPessoa
        );

    const rotuloDocumento =
        tipoPessoa ===
        "juridica"
            ? "CNPJ"
            : "CPF";

    const telefoneNumeros =
        somenteNumeros(
            dados.telefone
        );

    const linhasRecebidas =
    String(
        dados.linha || ""
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
            linhasRecebidas
        )
    ];

const linha =
    linhasUnicas.join(
        "\n"
    );

    const observacoes =
        limparTexto(
            dados.observacoes
        );

    if (
        nome.length < 3
    ) {
        throw new ErroHttp(
            400,
            "Informe o nome ou a razão social do cliente."
        );
    }

    const documentoValido =
        tipoPessoa ===
        "juridica"
            ? validarCnpj(
                documentoNormalizado
            )
            : validarCpf(
                documentoNormalizado
            );

    if (!documentoValido) {
        throw new ErroHttp(
            400,
            `O ${rotuloDocumento} informado não é válido.`
        );
    }

    if (
        telefoneNumeros.length < 10 ||
        telefoneNumeros.length > 11
    ) {
        throw new ErroHttp(
            400,
            "Informe um telefone válido."
        );
    }

    if (
        nome.length > 150
    ) {
        throw new ErroHttp(
            400,
            "O nome informado é muito grande."
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

    if (
        observacoes.length > 3000
    ) {
        throw new ErroHttp(
            400,
            "As observações ultrapassaram o limite permitido."
        );
    }

    return {
        nome,

        /*
         * Mantemos estes nomes para não
         * precisar alterar as consultas SQL.
         */
        cpf:
            formatarDocumentoPorTipo(
                documentoNormalizado,
                tipoPessoa
            ),

        cpfNumeros:
            documentoNormalizado,

        telefone:
            formatarTelefone(
                telefoneNumeros
            ),

        telefoneNumeros,

        linha,

        observacoes
    };
}

function converterCliente(
    cliente
) {
    if (!cliente) {
        return null;
    }

    return {
        id:
            cliente.id,

        nome:
            cliente.nome,

        cpf:
            cliente.cpf,

        telefone:
            cliente.telefone,

        linha:
            cliente.linha,

        logoOriginal:
            cliente
                .logo_original,

        logoOriginalUrl:
            cliente
                .logo_original_arquivo

                ? `/api/clientes/${
                    encodeURIComponent(
                        cliente.id
                    )
                }/arquivos/original`

                : "",

        logoConvertida:
            cliente
                .logo_convertida,

        logoConvertidaUrl:
            cliente
                .logo_convertida_arquivo

                ? `/api/clientes/${
                    encodeURIComponent(
                        cliente.id
                    )
                }/arquivos/convertido`

                : "",

        observacoes:
            cliente.observacoes,

        criadoEm:
            cliente.criado_em,

        atualizadoEm:
            cliente.atualizado_em
    };
}

/*
|--------------------------------------------------------------------------
| Leitura de JSON e formulários
|--------------------------------------------------------------------------
*/

function lerJson(
    request
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            let corpo =
                "";

            let tamanho =
                0;

            let limiteExcedido =
                false;

            request.setEncoding(
                "utf8"
            );

            request.on(
                "data",
                parte => {
                    tamanho +=
                        Buffer.byteLength(
                            parte
                        );

                    if (
                        tamanho >
                        LIMITE_JSON
                    ) {
                        limiteExcedido =
                            true;

                        return;
                    }

                    corpo +=
                        parte;
                }
            );

            request.on(
                "end",
                () => {
                    if (
                        limiteExcedido
                    ) {
                        reject(
                            new ErroHttp(
                                413,
                                "Os dados enviados são muito grandes."
                            )
                        );

                        return;
                    }

                    if (!corpo.trim()) {
                        resolve({});

                        return;
                    }

                    try {
                        resolve(
                            JSON.parse(
                                corpo
                            )
                        );
                    } catch {
                        reject(
                            new ErroHttp(
                                400,
                                "O JSON enviado não é válido."
                            )
                        );
                    }
                }
            );

            request.on(
                "error",
                () => {
                    reject(
                        new ErroHttp(
                            400,
                            "Não foi possível ler os dados enviados."
                        )
                    );
                }
            );
        }
    );
}

async function lerFormularioMultipart(
    request
) {
    const tamanho =
        Number(
            request.headers[
                "content-length"
            ] || 0
        );

    if (
        tamanho &&
        tamanho >
            LIMITE_UPLOAD_TOTAL
    ) {
        throw new ErroHttp(
            413,
            "O envio ultrapassou o limite total de 35 MB."
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

    try {
        return await requisicaoWeb
            .formData();
    } catch {
        throw new ErroHttp(
            400,
            "Não foi possível processar o formulário e os arquivos."
        );
    }
}

function arquivoDoFormulario(
    formulario,
    campo
) {
    const valor =
        formulario.get(
            campo
        );

    if (
        typeof File !== "undefined" &&
        valor instanceof File &&
        valor.size > 0 &&
        valor.name
    ) {
        return valor;
    }

    return null;
}

async function lerDadosRecebidos(
    request
) {
    const tipo =
        String(
            request.headers[
                "content-type"
            ] || ""
        ).toLowerCase();

    if (
        tipo.startsWith(
            "multipart/form-data"
        )
    ) {
        const formulario =
            await lerFormularioMultipart(
                request
            );

        const texto =
            nome => {
                const valor =
                    formulario.get(
                        nome
                    );

                return typeof valor ===
                    "string"

                    ? valor

                    : "";
            };

        return {
            dados: {
                nome:
                    texto(
                        "nome"
                    ),

                cpf:
                    texto(
                        "cpf"
                    ),

                telefone:
                    texto(
                        "telefone"
                    ),

                linha:
                    texto(
                        "linha"
                    ),

                observacoes:
                    texto(
                        "observacoes"
                    )
            },

            arquivoOriginal:
                arquivoDoFormulario(
                    formulario,
                    "logoOriginal"
                ),

            arquivoConvertido:
                arquivoDoFormulario(
                    formulario,
                    "logoConvertida"
                )
        };
    }

    if (
        tipo.startsWith(
            "application/json"
        )
    ) {
        return {
            dados:
                await lerJson(
                    request
                ),

            arquivoOriginal:
                null,

            arquivoConvertido:
                null
        };
    }

    throw new ErroHttp(
        415,
        "Envie os dados como formulário multipart ou JSON."
    );
}

/*
|--------------------------------------------------------------------------
| Arquivos dos clientes
|--------------------------------------------------------------------------
*/

function nomeSeguroOriginal(
    nome
) {
    return path
        .basename(
            String(
                nome ||
                "arquivo"
            )
        )
        .replace(
            /[\r\n"]/g,
            "_"
        )
        .slice(
            0,
            180
        );
}

function validarArquivo(
    arquivo,
    tipo
) {
    if (!arquivo) {
        return null;
    }

    const nomeOriginal =
        nomeSeguroOriginal(
            arquivo.name
        );

    const extensao =
        path
            .extname(
                nomeOriginal
            )
            .toLowerCase();

    const original =
        tipo === "original";

    const permitidas =
        original
            ? EXTENSOES_ORIGINAIS
            : EXTENSOES_CONVERTIDAS;

    const limite =
        original
            ? LIMITE_LOGO_ORIGINAL
            : LIMITE_LOGO_CONVERTIDA;

    if (
        !permitidas.has(
            extensao
        )
    ) {
        throw new ErroHttp(
            400,

            original
                ? "Formato da logo original não permitido."
                : "Formato do arquivo convertido não permitido."
        );
    }

    if (arquivo.size > limite) {
        throw new ErroHttp(
            413,

            original
                ? "A logo original deve ter no máximo 12 MB."
                : "O arquivo convertido deve ter no máximo 20 MB."
        );
    }

    return {
        arquivo,
        nomeOriginal,
        extensao,
        tipo
    };
}

async function salvarArquivo(
    arquivoValidado
) {
    if (!arquivoValidado) {
        return null;
    }

    const original =
        arquivoValidado.tipo ===
        "original";

    const pasta =
        original
            ? PASTA_ORIGINAIS
            : PASTA_CONVERTIDOS;

    const subpasta =
        original
            ? "originais"
            : "convertidos";

    const nomeArmazenado =
        `${randomUUID()}${
            arquivoValidado.extensao
        }`;

    const caminhoAbsoluto =
        path.join(
            pasta,
            nomeArmazenado
        );

    const buffer =
        Buffer.from(
            await arquivoValidado
                .arquivo
                .arrayBuffer()
        );

    await fsPromises.writeFile(
        caminhoAbsoluto,
        buffer,
        {
            flag:
                "wx"
        }
    );

    return {
        nomeOriginal:
            arquivoValidado
                .nomeOriginal,

        caminhoRelativo:
            path.join(
                subpasta,
                nomeArmazenado
            )
    };
}

async function apagarArquivo(
    caminhoRelativo
) {
    if (!caminhoRelativo) {
        return;
    }

    const caminhoAbsoluto =
        path.resolve(
            PASTA_UPLOADS,
            caminhoRelativo
        );

    const prefixoPermitido =
        `${path.resolve(
            PASTA_UPLOADS
        )}${path.sep}`;

    if (
        !caminhoAbsoluto
            .startsWith(
                prefixoPermitido
            )
    ) {
        return;
    }

    try {
        await fsPromises.unlink(
            caminhoAbsoluto
        );
    } catch (erro) {
        if (
            erro.code !==
            "ENOENT"
        ) {
            console.error(
                "Falha ao apagar arquivo:",
                erro
            );
        }
    }
}

function cabecalhoDisposicao(
    nome,
    abrirNoNavegador = false
) {
    const nomeLimpo =
        nomeSeguroOriginal(
            nome
        );

    const nomeBasico =
        nomeLimpo.replace(
            /[^\x20-\x7E]/g,
            "_"
        );

    const nomeCodificado =
        encodeURIComponent(
            nomeLimpo
        );

    return `${
        abrirNoNavegador
            ? "inline"
            : "attachment"
    }; filename="${
        nomeBasico
    }"; filename*=UTF-8''${
        nomeCodificado
    }`;
}

async function servirArquivoCliente(
    request,
    response,
    id,
    tipo
) {
    const cliente =
        consultasClientes
            .porId
            .get(
                id
            );

    if (!cliente) {
        throw new ErroHttp(
            404,
            "Cliente não encontrado."
        );
    }

    const original =
        tipo === "original";

    const nome =
        original
            ? cliente.logo_original
            : cliente.logo_convertida;

    const caminhoRelativo =
        original
            ? cliente
                .logo_original_arquivo
            : cliente
                .logo_convertida_arquivo;

    if (
        !nome ||
        !caminhoRelativo
    ) {
        throw new ErroHttp(
            404,
            "Arquivo não encontrado para este cliente."
        );
    }

    const caminhoAbsoluto =
        path.resolve(
            PASTA_UPLOADS,
            caminhoRelativo
        );

    const prefixoPermitido =
        `${path.resolve(
            PASTA_UPLOADS
        )}${path.sep}`;

    if (
        !caminhoAbsoluto
            .startsWith(
                prefixoPermitido
            )
    ) {
        throw new ErroHttp(
            403,
            "Acesso ao arquivo não permitido."
        );
    }

    let estatisticas;

    try {
        estatisticas =
            await fsPromises.stat(
                caminhoAbsoluto
            );
    } catch {
        throw new ErroHttp(
            404,
            "O arquivo não existe mais no armazenamento."
        );
    }

    const extensao =
        path
            .extname(
                nome
            )
            .toLowerCase();

    const urlRequisicao =
    new URL(
        request.url,
        "http://localhost"
    );

const forcarDownload =
    urlRequisicao
        .searchParams
        .get(
            "download"
        ) ===
        "1";

const podeAbrirNoNavegador =
    !forcarDownload &&
    original &&
    [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".pdf"
    ].includes(
        extensao
    );

    response.writeHead(
        200,
        {
            "Content-Type":
                TIPOS_MIME[
                    extensao
                ] ||
                "application/octet-stream",

            "Content-Length":
                estatisticas.size,

            "Content-Disposition":
                cabecalhoDisposicao(
                    nome,
                    podeAbrirNoNavegador
                ),

            "X-Content-Type-Options":
                "nosniff",

            "Cache-Control":
                "private, max-age=300"
        }
    );

    if (
        request.method ===
        "HEAD"
    ) {
        response.end();

        return;
    }

    const leitura =
        fs.createReadStream(
            caminhoAbsoluto
        );

    leitura.on(
        "error",
        erro => {
            console.error(
                erro
            );

            if (
                !response.headersSent
            ) {
                enviarErro(
                    response,
                    new ErroHttp(
                        500,
                        "Não foi possível abrir o arquivo."
                    )
                );
            } else {
                response.destroy();
            }
        }
    );

    leitura.pipe(
        response
    );
}

/*
|--------------------------------------------------------------------------
| Serviços do sistema
|--------------------------------------------------------------------------
*/

const servicoBackup =
    criarServicoBackup({
        banco,

        pastaRaiz:
            PASTA_RAIZ,

        pastaDados:
            PASTA_DADOS,

        pastaUploads:
            PASTA_UPLOADS,

        ErroHttp,

        enviarJson
    });

const servicoAutenticacao =
    criarServicoAutenticacao({
        banco,

        ErroHttp,

        usarCookieSeguro:
            process.env.NODE_ENV ===
            "production"
    });

const servicoOrdens =
    criarServicoOrdens({
        banco,
        ErroHttp,
        enviarJson,
        lerJson
    });

const servicoLinhas =
    criarServicoLinhas({
        banco,
        ErroHttp,
        enviarJson,
        lerJson
    });

function exigirUmaDasPermissoes(
    request,
    response,
    permissoes
) {
    const sessao =
        servicoAutenticacao
            .exigirAutenticacao(
                request,
                response
            );

    const autorizado =
        permissoes.some(
            permissao =>
                Boolean(
                    sessao.usuario
                        ?.permissoes
                        ?.[permissao]
                )
        );

    if (!autorizado) {
        throw new ErroHttp(
            403,
            "Você não possui permissão para realizar esta ação."
        );
    }

    return sessao;
}

/*
|--------------------------------------------------------------------------
| Operações dos clientes
|--------------------------------------------------------------------------
*/

function listarClientes(
    url
) {
    const busca =
        limparTexto(
            url.searchParams.get(
                "busca"
            )
        );

    if (!busca) {
        return consultasClientes
            .todos
            .all()
            .map(
                converterCliente
            );
    }

    const buscaNumeros =
        somenteNumeros(
            busca
        );

    const termos = [
        `%${busca}%`,
        `%${busca}%`
    ];

    let sql = `
        SELECT
            ${CAMPOS_CLIENTE_SQL}

        FROM clientes

        WHERE
            nome LIKE ?
                COLLATE NOCASE

            OR linha LIKE ?
                COLLATE NOCASE
    `;

    if (buscaNumeros) {
        sql += `
            OR cpf_numeros LIKE ?
            OR telefone_numeros LIKE ?
        `;

        termos.push(
            `%${buscaNumeros}%`,
            `%${buscaNumeros}%`
        );
    }

    sql += `
        ORDER BY
            criado_em DESC
    `;

    return banco
        .prepare(
            sql
        )
        .all(
            ...termos
        )
        .map(
            converterCliente
        );
}

async function criarCliente(
    request,
    response
) {
    const recebido =
        await lerDadosRecebidos(
            request
        );

    const dados =
        validarDadosCliente(
            recebido.dados
        );

    if (
        consultasClientes
            .cpfExistente
            .get(
                dados.cpfNumeros
            )
    ) {
        throw new ErroHttp(
            409,
            "Este CPF ou CNPJ já está cadastrado."
        );
    }

    const validadoOriginal =
        validarArquivo(
            recebido
                .arquivoOriginal,
            "original"
        );

    const validadoConvertido =
        validarArquivo(
            recebido
                .arquivoConvertido,
            "convertido"
        );

    let salvoOriginal =
        null;

    let salvoConvertido =
        null;

    try {
        salvoOriginal =
            await salvarArquivo(
                validadoOriginal
            );

        salvoConvertido =
            await salvarArquivo(
                validadoConvertido
            );

        const agora =
            new Date()
                .toISOString();

        const id =
            randomUUID();

        consultasClientes
            .inserir
            .run(
                id,

                dados.nome,

                dados.cpf,

                dados.cpfNumeros,

                dados.telefone,

                dados.telefoneNumeros,

                dados.linha,

                salvoOriginal
                    ?.nomeOriginal ||
                    "",

                salvoOriginal
                    ?.caminhoRelativo ||
                    "",

                salvoConvertido
                    ?.nomeOriginal ||
                    "",

                salvoConvertido
                    ?.caminhoRelativo ||
                    "",

                dados.observacoes,

                agora,

                agora
            );

        enviarJson(
            response,
            201,
            {
                sucesso:
                    true,

                mensagem:
                    "Cliente e arquivos cadastrados com sucesso.",

                cliente:
                    converterCliente(
                        consultasClientes
                            .porId
                            .get(
                                id
                            )
                    )
            }
        );
    } catch (erro) {
        await apagarArquivo(
            salvoOriginal
                ?.caminhoRelativo
        );

        await apagarArquivo(
            salvoConvertido
                ?.caminhoRelativo
        );

        throw erro;
    }
}

async function editarCliente(
    request,
    response,
    id
) {
    const clienteBanco =
        consultasClientes
            .porId
            .get(
                id
            );

    if (!clienteBanco) {
        throw new ErroHttp(
            404,
            "Cliente não encontrado."
        );
    }

    const recebido =
        await lerDadosRecebidos(
            request
        );

    const dados =
        validarDadosCliente(
            recebido.dados
        );

    if (
        consultasClientes
            .cpfOutroCliente
            .get(
                dados.cpfNumeros,
                id
            )
    ) {
        throw new ErroHttp(
            409,
            "Este CPF ou CNPJ já está cadastrado para outro cliente."
        );
    }

    const validadoOriginal =
        validarArquivo(
            recebido
                .arquivoOriginal,
            "original"
        );

    const validadoConvertido =
        validarArquivo(
            recebido
                .arquivoConvertido,
            "convertido"
        );

    let salvoOriginal =
        null;

    let salvoConvertido =
        null;

    try {
        salvoOriginal =
            await salvarArquivo(
                validadoOriginal
            );

        salvoConvertido =
            await salvarArquivo(
                validadoConvertido
            );

        const nomeOriginal =
            salvoOriginal
                ?.nomeOriginal ||
            clienteBanco
                .logo_original;

        const caminhoOriginal =
            salvoOriginal
                ?.caminhoRelativo ||
            clienteBanco
                .logo_original_arquivo;

        const nomeConvertido =
            salvoConvertido
                ?.nomeOriginal ||
            clienteBanco
                .logo_convertida;

        const caminhoConvertido =
            salvoConvertido
                ?.caminhoRelativo ||
            clienteBanco
                .logo_convertida_arquivo;

        const agora =
            new Date()
                .toISOString();

        consultasClientes
            .atualizar
            .run(
                dados.nome,

                dados.cpf,

                dados.cpfNumeros,

                dados.telefone,

                dados.telefoneNumeros,

                dados.linha,

                nomeOriginal,

                caminhoOriginal,

                nomeConvertido,

                caminhoConvertido,

                dados.observacoes,

                agora,

                id
            );

        if (salvoOriginal) {
            await apagarArquivo(
                clienteBanco
                    .logo_original_arquivo
            );
        }

        if (salvoConvertido) {
            await apagarArquivo(
                clienteBanco
                    .logo_convertida_arquivo
            );
        }

        enviarJson(
            response,
            200,
            {
                sucesso:
                    true,

                mensagem:
                    "Cliente e arquivos atualizados com sucesso.",

                cliente:
                    converterCliente(
                        consultasClientes
                            .porId
                            .get(
                                id
                            )
                    )
            }
        );
    } catch (erro) {
        await apagarArquivo(
            salvoOriginal
                ?.caminhoRelativo
        );

        await apagarArquivo(
            salvoConvertido
                ?.caminhoRelativo
        );

        throw erro;
    }
}

async function removerArquivoCliente(
    response,
    id,
    tipo
) {
    const cliente =
        consultasClientes
            .porId
            .get(
                id
            );

    if (!cliente) {
        throw new ErroHttp(
            404,
            "Cliente não encontrado."
        );
    }

    const configuracoes = {
        original: {
            nome:
                cliente
                    .logo_original,

            caminho:
                cliente
                    .logo_original_arquivo,

            consulta:
                consultasClientes
                    .removerLogoOriginal,

            mensagem:
                "A logo original foi removida com sucesso."
        },

        convertido: {
            nome:
                cliente
                    .logo_convertida,

            caminho:
                cliente
                    .logo_convertida_arquivo,

            consulta:
                consultasClientes
                    .removerLogoConvertida,

            mensagem:
                "O arquivo convertido foi removido com sucesso."
        }
    };

    const configuracao =
        configuracoes[
            tipo
        ];

    if (!configuracao) {
        throw new ErroHttp(
            400,
            "Tipo de arquivo inválido."
        );
    }

    if (
        !configuracao.nome &&
        !configuracao.caminho
    ) {
        throw new ErroHttp(
            404,

            tipo === "original"
                ? "Este cliente não possui uma logo original."
                : "Este cliente não possui um arquivo convertido."
        );
    }

    configuracao
        .consulta
        .run(
            new Date()
                .toISOString(),

            id
        );

    await apagarArquivo(
        configuracao.caminho
    );

    enviarJson(
        response,
        200,
        {
            sucesso:
                true,

            mensagem:
                configuracao
                    .mensagem,

            arquivoRemovido: {
                tipo,

                nome:
                    configuracao
                        .nome ||
                    ""
            },

            cliente:
                converterCliente(
                    consultasClientes
                        .porId
                        .get(
                            id
                        )
                )
        }
    );
}

async function removerCliente(
    response,
    id
) {
    const cliente =
        consultasClientes
            .porId
            .get(
                id
            );

    if (!cliente) {
        throw new ErroHttp(
            404,
            "Cliente não encontrado."
        );
    }

    consultasClientes
        .excluir
        .run(
            id
        );

    await apagarArquivo(
        cliente
            .logo_original_arquivo
    );

    await apagarArquivo(
        cliente
            .logo_convertida_arquivo
    );

    enviarJson(
        response,
        200,
        {
            sucesso:
                true,

            mensagem:
                "Cliente e arquivos excluídos com sucesso."
        }
    );
}

async function removerTodosClientes(
    response
) {
    const registros =
        consultasClientes
            .todos
            .all();

    const resultado =
        consultasClientes
            .excluirTodos
            .run();

    await Promise.all(
        registros.flatMap(
            cliente => [
                apagarArquivo(
                    cliente
                        .logo_original_arquivo
                ),

                apagarArquivo(
                    cliente
                        .logo_convertida_arquivo
                )
            ]
        )
    );

    enviarJson(
        response,
        200,
        {
            sucesso:
                true,

            mensagem:
                "Todos os clientes e arquivos foram excluídos.",

            quantidade:
                resultado.changes
        }
    );
}

/*
|--------------------------------------------------------------------------
| Arquivos públicos
|--------------------------------------------------------------------------
*/

async function servirArquivoEstatico(
    request,
    response,
    pathname
) {
    let caminhoRelativo =
        pathname === "/"
            ? "index.html"
            : pathname.slice(
                1
            );

    try {
        caminhoRelativo =
            decodeURIComponent(
                caminhoRelativo
            );
    } catch {
        throw new ErroHttp(
            400,
            "Endereço inválido."
        );
    }

    const caminhoArquivo =
        path.resolve(
            PASTA_PUBLICA,
            caminhoRelativo
        );

    const prefixoPermitido =
        `${path.resolve(
            PASTA_PUBLICA
        )}${path.sep}`;

    const indexPermitido =
        path.resolve(
            PASTA_PUBLICA,
            "index.html"
        );

    if (
        caminhoArquivo !==
            indexPermitido &&

        !caminhoArquivo
            .startsWith(
                prefixoPermitido
            )
    ) {
        throw new ErroHttp(
            403,
            "Acesso não permitido."
        );
    }

    let arquivoFinal =
        caminhoArquivo;

    let estatisticas;

    try {
        estatisticas =
            await fsPromises.stat(
                arquivoFinal
            );

        if (
            estatisticas
                .isDirectory()
        ) {
            arquivoFinal =
                path.join(
                    arquivoFinal,
                    "index.html"
                );
        }

        estatisticas =
            await fsPromises.stat(
                arquivoFinal
            );
    } catch {
        throw new ErroHttp(
            404,
            "Arquivo não encontrado."
        );
    }

    const extensao =
        path
            .extname(
                arquivoFinal
            )
            .toLowerCase();

    response.writeHead(
        200,
        {
            "Content-Type":
                TIPOS_MIME[
                    extensao
                ] ||
                "application/octet-stream",

            "Content-Length":
                estatisticas.size,

"X-Content-Type-Options":
    "nosniff",

"Cache-Control":
    [
        ".html",
        ".css",
        ".js"
    ].includes(
        extensao
    )
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=300"
        }
    );

    if (
        request.method ===
        "HEAD"
    ) {
        response.end();

        return;
    }

    fs.createReadStream(
        arquivoFinal
    ).pipe(
        response
    );
}

/*
|--------------------------------------------------------------------------
| Roteador
|--------------------------------------------------------------------------
*/

async function tratarRequest(
    request,
    response
) {
    try {
        const url =
            new URL(
                request.url,

                `http://${
                    request.headers.host ||
                    "localhost"
                }`
            );

        const pathname =
            url.pathname;

        /*
        |--------------------------------------------------------------------------
        | Rotas públicas
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname === "/api/status"
        ) {
            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Servidor funcionando.",

                    banco:
                        "SQLite",

                    uploads:
                        true,

                    data:
                        new Date()
                            .toISOString()
                }
            );

            return;
        }

        if (
            request.method === "GET" &&
            pathname ===
                "/api/auth/status"
        ) {
            const status =
                servicoAutenticacao
                    .obterStatus(
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    ...status
                }
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/auth/configurar"
        ) {
            const dados =
                await lerJson(
                    request
                );

            const usuario =
                await servicoAutenticacao
                    .criarUsuarioInicial(
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                201,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Administrador criado com sucesso.",

                    usuario
                }
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/auth/login"
        ) {
            const dados =
                await lerJson(
                    request
                );

            const usuario =
                await servicoAutenticacao
                    .autenticar(
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Login realizado com sucesso.",

                    usuario
                }
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/auth/logout"
        ) {
            servicoAutenticacao
                .encerrarSessao(
                    request,
                    response
                );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Sessão encerrada com sucesso."
                }
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Proteção das páginas
        |--------------------------------------------------------------------------
        */

        if (
            [
                "GET",
                "HEAD"
            ].includes(
                request.method
            ) &&

            [
                "/",
                "/index.html"
            ].includes(
                pathname
            )
        ) {
            const status =
                servicoAutenticacao
                    .obterStatus(
                        request,
                        response
                    );

            if (
                !status.configurado ||
                !status.autenticado
            ) {
                redirecionar(
                    response,
                    "/login.html"
                );

                return;
            }
        }

        if (
            [
                "GET",
                "HEAD"
            ].includes(
                request.method
            ) &&

            pathname ===
                "/login.html"
        ) {
            const status =
                servicoAutenticacao
                    .obterStatus(
                        request,
                        response
                    );

            if (
                status.configurado &&
                status.autenticado
            ) {
                redirecionar(
                    response,
                    "/"
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Autenticação geral das APIs privadas
        |--------------------------------------------------------------------------
        */

        const basesApiProtegidas = [
            "/api/clientes",
            "/api/ordens",
            "/api/linhas",
            "/api/backup",
            "/api/usuarios"
        ];

        const rotaApiProtegida =
            basesApiProtegidas.some(
                base =>
                    pathname === base ||
                    pathname.startsWith(
                        `${base}/`
                    )
            ) ||

            [
                "/api/auth/perfil",
                "/api/auth/senha"
            ].includes(
                pathname
            );

        if (rotaApiProtegida) {
            servicoAutenticacao
                .exigirAutenticacao(
                    request,
                    response
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Gerenciamento de usuários
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname ===
                "/api/usuarios"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "usuarios.gerenciar"
                );

            const usuarios =
                servicoAutenticacao
                    .listarUsuarios(
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    usuarios
                }
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/usuarios"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "usuarios.gerenciar"
                );

            const dados =
                await lerJson(
                    request
                );

            const usuario =
                await servicoAutenticacao
                    .criarUsuarioGerenciado(
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                201,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Usuário criado com sucesso.",

                    usuario
                }
            );

            return;
        }

        const rotaSenhaUsuario =
            pathname.match(
                /^\/api\/usuarios\/([^/]+)\/senha$/
            );

        if (
            rotaSenhaUsuario &&
            request.method ===
                "PUT"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "usuarios.gerenciar"
                );

            const id =
                decodeURIComponent(
                    rotaSenhaUsuario[
                        1
                    ]
                );

            const dados =
                await lerJson(
                    request
                );

            const usuario =
                await servicoAutenticacao
                    .redefinirSenhaGerenciada(
                        id,
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Senha redefinida com sucesso. As sessões anteriores foram encerradas.",

                    usuario
                }
            );

            return;
        }

        const rotaUsuario =
            pathname.match(
                /^\/api\/usuarios\/([^/]+)$/
            );

        if (rotaUsuario) {
            const id =
                decodeURIComponent(
                    rotaUsuario[
                        1
                    ]
                );

            if (
                request.method ===
                    "PUT"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "usuarios.gerenciar"
                    );

                const dados =
                    await lerJson(
                        request
                    );

                const usuario =
                    servicoAutenticacao
                        .editarUsuarioGerenciado(
                            id,
                            dados,
                            request,
                            response
                        );

                enviarJson(
                    response,
                    200,
                    {
                        sucesso:
                            true,

                        mensagem:
                            "Usuário atualizado com sucesso.",

                        usuario
                    }
                );

                return;
            }

            if (
                request.method ===
                    "DELETE"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "usuarios.gerenciar"
                    );

                servicoAutenticacao
                    .excluirUsuarioGerenciado(
                        id,
                        request,
                        response
                    );

                enviarJson(
                    response,
                    200,
                    {
                        sucesso:
                            true,

                        mensagem:
                            "Usuário excluído com sucesso."
                    }
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Própria conta
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "PUT" &&
            pathname ===
                "/api/auth/perfil"
        ) {
            const dados =
                await lerJson(
                    request
                );

            const usuario =
                servicoAutenticacao
                    .atualizarPerfil(
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Os dados da conta foram atualizados com sucesso.",

                    usuario
                }
            );

            return;
        }

        if (
            request.method === "PUT" &&
            pathname ===
                "/api/auth/senha"
        ) {
            const dados =
                await lerJson(
                    request
                );

            const usuario =
                await servicoAutenticacao
                    .alterarSenha(
                        dados,
                        request,
                        response
                    );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    mensagem:
                        "Sua senha foi alterada com sucesso.",

                    usuario
                }
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Catálogo de linhas
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname ===
                "/api/linhas"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "linhas.visualizar"
                );

            servicoLinhas.listar(
                url,
                response
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/linhas"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "linhas.criar"
                );

            await servicoLinhas.criar(
                request,
                response
            );

            return;
        }

        const rotaLinha =
            pathname.match(
                /^\/api\/linhas\/([^/]+)$/
            );

        if (rotaLinha) {
            const id =
                decodeURIComponent(
                    rotaLinha[
                        1
                    ]
                );

            if (
                request.method ===
                    "GET"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "linhas.visualizar"
                    );

                servicoLinhas.obter(
                    response,
                    id
                );

                return;
            }

            if (
                request.method ===
                    "PUT"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "linhas.editar"
                    );

                await servicoLinhas.editar(
                    request,
                    response,
                    id
                );

                return;
            }

            if (
                request.method ===
                    "DELETE"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "linhas.excluir"
                    );

                servicoLinhas.remover(
                    response,
                    id
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Ordens
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname ===
                "/api/ordens"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "ordens.visualizar"
                );

            servicoOrdens.listar(
                url,
                response
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/ordens"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "ordens.criar"
                );

            await servicoOrdens.criar(
                request,
                response
            );

            return;
        }

        const rotaOrdem =
            pathname.match(
                /^\/api\/ordens\/([^/]+)$/
            );

        if (rotaOrdem) {
            const id =
                decodeURIComponent(
                    rotaOrdem[
                        1
                    ]
                );

            if (
                request.method ===
                    "GET"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "ordens.visualizar"
                    );

                servicoOrdens.obter(
                    response,
                    id
                );

                return;
            }

            if (
                request.method ===
                    "PUT"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "ordens.editar"
                    );

                await servicoOrdens.editar(
                    request,
                    response,
                    id
                );

                return;
            }

            if (
                request.method ===
                    "DELETE"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "ordens.excluir"
                    );

                servicoOrdens.remover(
                    response,
                    id
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Backup
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname ===
                "/api/backup/status"
        ) {
            exigirUmaDasPermissoes(
                request,
                response,
                [
                    "backup.criar",
                    "backup.restaurar"
                ]
            );

            await servicoBackup
                .obterStatus(
                    response
                );

            return;
        }

        if (
            request.method === "GET" &&
            pathname ===
                "/api/backup"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "backup.criar"
                );

            await servicoBackup
                .baixarBackup(
                    response
                );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/backup/restaurar"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "backup.restaurar"
                );

            await servicoBackup
                .restaurarBackup(
                    request,
                    response
                );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Clientes
        |--------------------------------------------------------------------------
        */

        if (
            request.method === "GET" &&
            pathname ===
                "/api/clientes"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "clientes.visualizar"
                );

            enviarJson(
                response,
                200,
                {
                    sucesso:
                        true,

                    clientes:
                        listarClientes(
                            url
                        )
                }
            );

            return;
        }

        if (
            request.method === "POST" &&
            pathname ===
                "/api/clientes"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "clientes.criar"
                );

            await criarCliente(
                request,
                response
            );

            return;
        }

        if (
            request.method === "DELETE" &&
            pathname ===
                "/api/clientes"
        ) {
            servicoAutenticacao
                .exigirPermissao(
                    request,
                    response,
                    "clientes.excluir"
                );

            await removerTodosClientes(
                response
            );

            return;
        }

        const rotaArquivo =
            pathname.match(
                /^\/api\/clientes\/([^/]+)\/arquivos\/(original|convertido)$/
            );

        if (rotaArquivo) {
            const id =
                decodeURIComponent(
                    rotaArquivo[
                        1
                    ]
                );

            const tipo =
                rotaArquivo[
                    2
                ];

            if (
                [
                    "GET",
                    "HEAD"
                ].includes(
                    request.method
                )
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "arquivos.baixar"
                    );

                await servirArquivoCliente(
                    request,
                    response,
                    id,
                    tipo
                );

                return;
            }

            if (
                request.method ===
                    "DELETE"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "arquivos.remover"
                    );

                await removerArquivoCliente(
                    response,
                    id,
                    tipo
                );

                return;
            }
        }

        const rotaCliente =
            pathname.match(
                /^\/api\/clientes\/([^/]+)$/
            );

        if (rotaCliente) {
            const id =
                decodeURIComponent(
                    rotaCliente[
                        1
                    ]
                );

            if (
                request.method ===
                    "GET"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "clientes.visualizar"
                    );

                const cliente =
                    consultasClientes
                        .porId
                        .get(
                            id
                        );

                if (!cliente) {
                    throw new ErroHttp(
                        404,
                        "Cliente não encontrado."
                    );
                }

                enviarJson(
                    response,
                    200,
                    {
                        sucesso:
                            true,

                        cliente:
                            converterCliente(
                                cliente
                            )
                    }
                );

                return;
            }

            if (
                request.method ===
                    "PUT"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "clientes.editar"
                    );

                await editarCliente(
                    request,
                    response,
                    id
                );

                return;
            }

            if (
                request.method ===
                    "DELETE"
            ) {
                servicoAutenticacao
                    .exigirPermissao(
                        request,
                        response,
                        "clientes.excluir"
                    );

                await removerCliente(
                    response,
                    id
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Finalização das rotas
        |--------------------------------------------------------------------------
        */

        if (
            pathname.startsWith(
                "/api/"
            )
        ) {
            throw new ErroHttp(
                404,
                "Rota da API não encontrada."
            );
        }

        if (
            [
                "GET",
                "HEAD"
            ].includes(
                request.method
            )
        ) {
            await servirArquivoEstatico(
                request,
                response,
                pathname
            );

            return;
        }

        throw new ErroHttp(
            405,
            "Método não permitido."
        );
    } catch (erro) {
        enviarErro(
            response,
            erro
        );
    }
}

/*
|--------------------------------------------------------------------------
| Inicialização e encerramento
|--------------------------------------------------------------------------
*/

const servidor =
    http.createServer(
        tratarRequest
    );

servidor.listen(
    PORTA,
    "0.0.0.0",
    () => {
        console.log("");

        console.log(
            "Sistema de Bordados iniciado."
        );

        console.log(
            `Acesse: http://localhost:${PORTA}`
        );

        console.log(
            `Banco: ${CAMINHO_BANCO}`
        );

        console.log(
            `Uploads: ${PASTA_UPLOADS}`
        );

        console.log(
            "Para encerrar, pressione Ctrl + C."
        );

        console.log("");
    }
);

let encerrando =
    false;

function encerrarServidor() {
    if (encerrando) {
        return;
    }

    encerrando =
        true;

    console.log(
        "\nEncerrando o sistema..."
    );

    servidor.close(
        () => {
            try {
                servicoAutenticacao
                    .encerrar();
            } catch (erro) {
                console.error(
                    "Falha ao encerrar autenticação:",
                    erro
                );
            }

            try {
                banco.close();
            } catch (erro) {
                console.error(
                    "Falha ao fechar o banco:",
                    erro
                );
            }

            process.exit(0);
        }
    );
}

process.on(
    "SIGINT",
    encerrarServidor
);

process.on(
    "SIGTERM",
    encerrarServidor
);