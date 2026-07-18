const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const {criarServicoBackup} = require("./backup");
const {criarServicoAutenticacao} = require("./autenticacao");


/*
|--------------------------------------------------------------------------
| Configurações
|--------------------------------------------------------------------------
*/

const PORTA =
    Number(
        process.env.PORT ||
        3000
    );

const PASTA_RAIZ =
    __dirname;

/*
 * No computador, usa a pasta do projeto.
 * Na Railway, usa o volume persistente.
 */
const PASTA_ARMAZENAMENTO =
    process.env
        .RAILWAY_VOLUME_MOUNT_PATH ||
    process.env.STORAGE_PATH ||
    PASTA_RAIZ;

const PASTA_PUBLICA =
    path.join(
        PASTA_RAIZ,
        "public"
    );

const PASTA_DADOS =
    path.join(
        PASTA_ARMAZENAMENTO,
        "dados"
    );

const PASTA_UPLOADS =
    path.join(
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

/*
|--------------------------------------------------------------------------
| Verificação do Node.js
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

/*
|--------------------------------------------------------------------------
| Criação automática das pastas
|--------------------------------------------------------------------------
*/

const pastasNecessarias = [
    PASTA_DADOS,
    PASTA_PUBLICA,
    PASTA_UPLOADS,
    PASTA_ORIGINAIS,
    PASTA_CONVERTIDOS
];

for (
    const pasta
    of pastasNecessarias
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
| Banco de dados
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

/*
|--------------------------------------------------------------------------
| Atualização automática de bancos antigos
|--------------------------------------------------------------------------
*/

function garantirColuna(
    nome,
    definicao
) {
    const colunas =
        banco
            .prepare(
                "PRAGMA table_info(clientes)"
            )
            .all();

    const existe =
        colunas.some(
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

garantirColuna(
    "logo_original_arquivo",
    "TEXT NOT NULL DEFAULT ''"
);

garantirColuna(
    "logo_convertida_arquivo",
    "TEXT NOT NULL DEFAULT ''"
);

/*
|--------------------------------------------------------------------------
| Campos utilizados nas consultas
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Consultas preparadas
|--------------------------------------------------------------------------
*/

const consultaTodosClientes =
    banco.prepare(`
        SELECT
            ${CAMPOS_CLIENTE_SQL}
        FROM clientes
        ORDER BY criado_em DESC
    `);

const consultaClientePorId =
    banco.prepare(`
        SELECT
            ${CAMPOS_CLIENTE_SQL}
        FROM clientes
        WHERE id = ?
    `);

const consultaCpfExistente =
    banco.prepare(`
        SELECT id
        FROM clientes
        WHERE cpf_numeros = ?
    `);

const consultaCpfOutroCliente =
    banco.prepare(`
        SELECT id
        FROM clientes
        WHERE
            cpf_numeros = ?
            AND id <> ?
    `);

const inserirCliente =
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

const atualizarCliente =
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
    `);

const excluirCliente =
    banco.prepare(`
        DELETE FROM clientes
        WHERE id = ?
    `);

const excluirTodosClientes =
    banco.prepare(`
        DELETE FROM clientes
    `);

/*
|--------------------------------------------------------------------------
| Remoção individual de arquivos
|--------------------------------------------------------------------------
*/

const removerLogoOriginalCliente =
    banco.prepare(`
        UPDATE clientes
        SET
            logo_original = '',
            logo_original_arquivo = '',
            atualizado_em = ?
        WHERE id = ?
    `);

const removerLogoConvertidaCliente =
    banco.prepare(`
        UPDATE clientes
        SET
            logo_convertida = '',
            logo_convertida_arquivo = '',
            atualizado_em = ?
        WHERE id = ?
    `);

/*
|--------------------------------------------------------------------------
| Erros HTTP
|--------------------------------------------------------------------------
*/

class ErroHttp extends Error {
    constructor(
        status,
        mensagem,
        detalhes = null
    ) {
        super(mensagem);

        this.status = status;
        this.detalhes = detalhes;
    }
}

/*
|--------------------------------------------------------------------------
| Formatação
|--------------------------------------------------------------------------
*/

function somenteNumeros(valor) {
    return String(valor || "")
        .replace(/\D/g, "");
}

function limparTexto(valor) {
    return String(valor || "")
        .trim();
}

function formatarCpf(valor) {
    return somenteNumeros(valor)
        .slice(0, 11)
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

function formatarTelefone(valor) {
    const numeros =
        somenteNumeros(valor)
            .slice(0, 11);

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

/*
|--------------------------------------------------------------------------
| Validação do CPF
|--------------------------------------------------------------------------
*/

function validarCpf(valor) {
    const cpf =
        somenteNumeros(valor);

    if (
        cpf.length !== 11 ||
        /^(\d)\1{10}$/.test(cpf)
    ) {
        return false;
    }

    function calcularDigito(
        quantidade
    ) {
        let soma = 0;

        for (
            let indice = 0;
            indice < quantidade;
            indice += 1
        ) {
            soma +=
                Number(cpf[indice]) *
                (
                    quantidade +
                    1 -
                    indice
                );
        }

        const resto =
            (soma * 10) % 11;

        return resto === 10
            ? 0
            : resto;
    }

    return (
        calcularDigito(9) ===
            Number(cpf[9]) &&

        calcularDigito(10) ===
            Number(cpf[10])
    );
}

/*
|--------------------------------------------------------------------------
| Conversão do cliente para a interface
|--------------------------------------------------------------------------
*/

function converterCliente(cliente) {
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
            cliente.logo_original,

        logoOriginalUrl:
            cliente.logo_original_arquivo
                ? `/api/clientes/${
                    encodeURIComponent(
                        cliente.id
                    )
                }/arquivos/original`
                : "",

        logoConvertida:
            cliente.logo_convertida,

        logoConvertidaUrl:
            cliente.logo_convertida_arquivo
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
| Validação dos dados do cliente
|--------------------------------------------------------------------------
*/

function validarDadosCliente(dados) {
    const nome =
        limparTexto(
            dados.nome
        );

    const cpfNumeros =
        somenteNumeros(
            dados.cpf
        );

    const telefoneNumeros =
        somenteNumeros(
            dados.telefone
        );

    const linha =
        limparTexto(
            dados.linha
        );

    const observacoes =
        limparTexto(
            dados.observacoes
        );

    if (nome.length < 3) {
        throw new ErroHttp(
            400,
            "Informe o nome completo do cliente."
        );
    }

    if (!validarCpf(cpfNumeros)) {
        throw new ErroHttp(
            400,
            "O CPF informado não é válido."
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

    if (linha.length < 2) {
        throw new ErroHttp(
            400,
            "Informe a linha utilizada."
        );
    }

    if (nome.length > 150) {
        throw new ErroHttp(
            400,
            "O nome informado é muito grande."
        );
    }

    if (linha.length > 200) {
        throw new ErroHttp(
            400,
            "A descrição da linha é muito grande."
        );
    }

    if (observacoes.length > 3000) {
        throw new ErroHttp(
            400,
            "As observações ultrapassaram o limite permitido."
        );
    }

    return {
        nome,

        cpf:
            formatarCpf(
                cpfNumeros
            ),

        cpfNumeros,

        telefone:
            formatarTelefone(
                telefoneNumeros
            ),

        telefoneNumeros,

        linha,

        observacoes
    };
}

/*
|--------------------------------------------------------------------------
| Leitura de JSON
|--------------------------------------------------------------------------
*/

function lerJson(request) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            let corpo = "";
            let tamanho = 0;
            let limiteExcedido = false;

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

                    corpo += parte;
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

/*
|--------------------------------------------------------------------------
| Leitura de formulário com arquivos
|--------------------------------------------------------------------------
*/

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
        tamanho > LIMITE_UPLOAD_TOTAL
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
        formulario.get(campo);

    if (
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

        function texto(nome) {
            const valor =
                formulario.get(nome);

            return typeof valor ===
                "string"
                ? valor
                : "";
        }

        return {
            dados: {
                nome:
                    texto("nome"),

                cpf:
                    texto("cpf"),

                telefone:
                    texto("telefone"),

                linha:
                    texto("linha"),

                observacoes:
                    texto("observacoes")
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
        const dados =
            await lerJson(request);

        return {
            dados,
            arquivoOriginal: null,
            arquivoConvertido: null
        };
    }

    throw new ErroHttp(
        415,
        "Envie os dados como formulário multipart ou JSON."
    );
}

/*
|--------------------------------------------------------------------------
| Validação dos arquivos
|--------------------------------------------------------------------------
*/

function nomeSeguroOriginal(nome) {
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
        .slice(0, 180);
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

/*
|--------------------------------------------------------------------------
| Salvamento físico dos arquivos
|--------------------------------------------------------------------------
*/

async function salvarArquivo(
    arquivoValidado
) {
    if (!arquivoValidado) {
        return null;
    }

    const pasta =
        arquivoValidado.tipo ===
            "original"
            ? PASTA_ORIGINAIS
            : PASTA_CONVERTIDOS;

    const subpasta =
        arquivoValidado.tipo ===
            "original"
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
            flag: "wx"
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
        !caminhoAbsoluto.startsWith(
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
        if (erro.code !== "ENOENT") {
            console.error(
                "Falha ao apagar arquivo:",
                erro
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| Respostas HTTP
|--------------------------------------------------------------------------
*/

function enviarJson(
    response,
    status,
    dados
) {
    const conteudo =
        JSON.stringify(dados);

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

    response.end(conteudo);
}

function redirecionar(
    response,
    destino,
    status = 302
) {
    response.writeHead(
        status,
        {
            Location: destino,
            "Cache-Control": "no-store"
        }
    );

    response.end();
}

function enviarErro(
    response,
    erro
) {
    const status =
        erro instanceof ErroHttp
            ? erro.status
            : 500;

    if (status === 500) {
        console.error(erro);
    }

    enviarJson(
        response,
        status,
        {
            sucesso: false,

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
| Serviço de backup
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

/*
|--------------------------------------------------------------------------
| Serviço de autenticação
|--------------------------------------------------------------------------
*/

const servicoAutenticacao =
    criarServicoAutenticacao({
        banco,

        ErroHttp,

        /*
         * Em localhost deve permanecer false.
         * Quando o sistema usar HTTPS,
         * alteraremos para true.
         */
        usarCookieSeguro:
    process.env.NODE_ENV ===
    "production"
    });

/*
|--------------------------------------------------------------------------
| Listagem e busca
|--------------------------------------------------------------------------
*/

function listarClientes(url) {
    const busca =
        limparTexto(
            url.searchParams.get(
                "busca"
            )
        );

    if (!busca) {
        return consultaTodosClientes
            .all()
            .map(
                converterCliente
            );
    }

    const buscaNumeros =
        somenteNumeros(busca);

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
        ORDER BY criado_em DESC
    `;

    return banco
        .prepare(sql)
        .all(...termos)
        .map(
            converterCliente
        );
}

/*
|--------------------------------------------------------------------------
| Criação do cliente e upload
|--------------------------------------------------------------------------
*/

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

    const cpfExistente =
        consultaCpfExistente.get(
            dados.cpfNumeros
        );

    if (cpfExistente) {
        throw new ErroHttp(
            409,
            "Este CPF já está cadastrado."
        );
    }

    const validadoOriginal =
        validarArquivo(
            recebido.arquivoOriginal,
            "original"
        );

    const validadoConvertido =
        validarArquivo(
            recebido.arquivoConvertido,
            "convertido"
        );

    let salvoOriginal = null;
    let salvoConvertido = null;

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

        inserirCliente.run(
            id,

            dados.nome,

            dados.cpf,

            dados.cpfNumeros,

            dados.telefone,

            dados.telefoneNumeros,

            dados.linha,

            salvoOriginal
                ?.nomeOriginal || "",

            salvoOriginal
                ?.caminhoRelativo || "",

            salvoConvertido
                ?.nomeOriginal || "",

            salvoConvertido
                ?.caminhoRelativo || "",

            dados.observacoes,

            agora,

            agora
        );

        const clienteCriado =
            consultaClientePorId.get(
                id
            );

        enviarJson(
            response,
            201,
            {
                sucesso: true,

                mensagem:
                    "Cliente e arquivos cadastrados com sucesso.",

                cliente:
                    converterCliente(
                        clienteCriado
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

/*
|--------------------------------------------------------------------------
| Edição do cliente e substituição dos arquivos
|--------------------------------------------------------------------------
*/

async function editarCliente(
    request,
    response,
    id
) {
    const clienteBanco =
        consultaClientePorId.get(
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

    const cpfOutroCliente =
        consultaCpfOutroCliente.get(
            dados.cpfNumeros,
            id
        );

    if (cpfOutroCliente) {
        throw new ErroHttp(
            409,
            "Este CPF já está cadastrado para outro cliente."
        );
    }

    const validadoOriginal =
        validarArquivo(
            recebido.arquivoOriginal,
            "original"
        );

    const validadoConvertido =
        validarArquivo(
            recebido.arquivoConvertido,
            "convertido"
        );

    let salvoOriginal = null;
    let salvoConvertido = null;

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

        atualizarCliente.run(
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

        const clienteAtualizado =
            consultaClientePorId.get(
                id
            );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Cliente e arquivos atualizados com sucesso.",

                cliente:
                    converterCliente(
                        clienteAtualizado
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

/*
|--------------------------------------------------------------------------
| Exclusão de cliente e arquivos
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Remoção individual de um arquivo
|--------------------------------------------------------------------------
*/

async function removerArquivoCliente(
    response,
    id,
    tipo
) {
    const cliente =
        consultaClientePorId.get(
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
                cliente.logo_original,

            caminho:
                cliente
                    .logo_original_arquivo,

            consulta:
                removerLogoOriginalCliente,

            mensagem:
                "A logo original foi removida com sucesso."
        },

        convertido: {
            nome:
                cliente.logo_convertida,

            caminho:
                cliente
                    .logo_convertida_arquivo,

            consulta:
                removerLogoConvertidaCliente,

            mensagem:
                "O arquivo convertido foi removido com sucesso."
        }
    };

    const configuracao =
        configuracoes[tipo];

    if (!configuracao) {
        throw new ErroHttp(
            400,
            "Tipo de arquivo inválido."
        );
    }

    /*
     * Consideramos que o cliente não possui
     * o arquivo quando não há nome nem caminho.
     */
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

    const agora =
        new Date()
            .toISOString();

    /*
     * Primeiro removemos a referência do banco.
     * Assim, mesmo que o arquivo físico já não
     * exista, o cadastro continuará correto.
     */
    configuracao.consulta.run(
        agora,
        id
    );

    /*
     * Depois removemos o arquivo físico da pasta.
     * A função apagarArquivo já impede caminhos
     * fora da pasta uploads.
     */
    await apagarArquivo(
        configuracao.caminho
    );

    const clienteAtualizado =
        consultaClientePorId.get(
            id
        );

    enviarJson(
        response,
        200,
        {
            sucesso: true,

            mensagem:
                configuracao.mensagem,

            arquivoRemovido: {
                tipo,

                nome:
                    configuracao.nome ||
                    ""
            },

            cliente:
                converterCliente(
                    clienteAtualizado
                )
        }
    );
}

async function removerCliente(
    response,
    id
) {
    const cliente =
        consultaClientePorId.get(
            id
        );

    if (!cliente) {
        throw new ErroHttp(
            404,
            "Cliente não encontrado."
        );
    }

    excluirCliente.run(id);

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
            sucesso: true,

            mensagem:
                "Cliente e arquivos excluídos com sucesso."
        }
    );
}

async function removerTodosClientes(
    response
) {
    const registros =
        consultaTodosClientes.all();

    const resultado =
        excluirTodosClientes.run();

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
            sucesso: true,

            mensagem:
                "Todos os clientes e arquivos foram excluídos.",

            quantidade:
                resultado.changes
        }
    );
}

/*
|--------------------------------------------------------------------------
| Tipos dos arquivos
|--------------------------------------------------------------------------
*/

const tiposMime = {
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
| Cabeçalho de download
|--------------------------------------------------------------------------
*/

function cabecalhoDisposicao(
    nome,
    abrirNoNavegador = false
) {
    const nomeLimpo =
        nomeSeguroOriginal(nome);

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

/*
|--------------------------------------------------------------------------
| Visualização e download de arquivos
|--------------------------------------------------------------------------
*/

async function servirArquivoCliente(
    request,
    response,
    id,
    tipo
) {
    const cliente =
        consultaClientePorId.get(
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
        !caminhoAbsoluto.startsWith(
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
            .extname(nome)
            .toLowerCase();

    const podeAbrirNoNavegador =
        original &&
        [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".pdf"
        ].includes(extensao);

    response.writeHead(
        200,
        {
            "Content-Type":
                tiposMime[extensao] ||
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
        request.method === "HEAD"
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
            console.error(erro);

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

    leitura.pipe(response);
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
            : pathname.slice(1);

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
        !caminhoArquivo.startsWith(
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
            estatisticas.isDirectory()
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
                tiposMime[extensao] ||
                "application/octet-stream",

            "Content-Length":
                estatisticas.size,

            "X-Content-Type-Options":
                "nosniff"
        }
    );

    if (
        request.method === "HEAD"
    ) {
        response.end();
        return;
    }

    fs.createReadStream(
        arquivoFinal
    ).pipe(response);
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
         * Status do servidor.
         */
        if (
            request.method === "GET" &&
            pathname === "/api/status"
        ) {
            enviarJson(
                response,
                200,
                {
                    sucesso: true,

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

/*
|--------------------------------------------------------------------------
| Rotas públicas de autenticação
|--------------------------------------------------------------------------
*/

/*
 * Verifica se o sistema já possui administrador
 * e se o navegador está autenticado.
 */
if (
    request.method === "GET" &&
    pathname === "/api/auth/status"
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
            sucesso: true,
            ...status
        }
    );

    return;
}

/*
 * Cria o primeiro administrador.
 * Só funciona quando ainda não existe usuário.
 */
if (
    request.method === "POST" &&
    pathname === "/api/auth/configurar"
) {
    const dados =
        await lerJson(request);

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
            sucesso: true,

            mensagem:
                "Administrador criado com sucesso.",

            usuario
        }
    );

    return;
}

/*
 * Realiza o login.
 */
if (
    request.method === "POST" &&
    pathname === "/api/auth/login"
) {
    const dados =
        await lerJson(request);

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
            sucesso: true,

            mensagem:
                "Login realizado com sucesso.",

            usuario
        }
    );

    return;
}

/*
 * Encerra a sessão atual.
 */
if (
    request.method === "POST" &&
    pathname === "/api/auth/logout"
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
            sucesso: true,

            mensagem:
                "Sessão encerrada com sucesso."
        }
    );

    return;
}

/*
|--------------------------------------------------------------------------
| Proteção das páginas principais
|--------------------------------------------------------------------------
*/

if (
    ["GET", "HEAD"].includes(
        request.method
    ) &&
    (
        pathname === "/" ||
        pathname === "/index.html"
    )
) {
    const statusAutenticacao =
        servicoAutenticacao
            .obterStatus(
                request,
                response
            );

    if (
        !statusAutenticacao
            .configurado ||
        !statusAutenticacao
            .autenticado
    ) {
        redirecionar(
            response,
            "/login.html"
        );

        return;
    }
}

/*
 * Usuário autenticado não precisa
 * voltar para a tela de login.
 */
if (
    ["GET", "HEAD"].includes(
        request.method
    ) &&
    pathname === "/login.html"
) {
    const statusAutenticacao =
        servicoAutenticacao
            .obterStatus(
                request,
                response
            );

    if (
        statusAutenticacao
            .configurado &&
        statusAutenticacao
            .autenticado
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
| Proteção das APIs
|--------------------------------------------------------------------------
*/

const rotaApiProtegida =
    pathname === "/api/clientes" ||
    pathname.startsWith(
        "/api/clientes/"
    ) ||
    pathname === "/api/backup" ||
    pathname.startsWith(
        "/api/backup/"
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
| Rotas de backup
|--------------------------------------------------------------------------
*/

/*
 * Consultar o último backup e restauro.
 */
if (
    request.method === "GET" &&
    pathname === "/api/backup/status"
) {
    await servicoBackup
        .obterStatus(
            response
        );

    return;
}

/*
 * Criar e baixar backup completo.
 */
if (
    request.method === "GET" &&
    pathname === "/api/backup"
) {
    await servicoBackup
        .baixarBackup(
            response
        );

    return;
}

/*
 * Restaurar um backup.
 */
if (
    request.method === "POST" &&
    pathname === "/api/backup/restaurar"
) {
    await servicoBackup
        .restaurarBackup(
            request,
            response
        );

    return;
}

        /*
         * Lista de clientes.
         */
        if (
            request.method === "GET" &&
            pathname === "/api/clientes"
        ) {
            enviarJson(
                response,
                200,
                {
                    sucesso: true,

                    clientes:
                        listarClientes(
                            url
                        )
                }
            );

            return;
        }

        /*
         * Cadastro.
         */
        if (
            request.method === "POST" &&
            pathname === "/api/clientes"
        ) {
            await criarCliente(
                request,
                response
            );

            return;
        }

        /*
         * Apagar todos.
         */
        if (
            request.method ===
                "DELETE" &&
            pathname === "/api/clientes"
        ) {
            await removerTodosClientes(
                response
            );

            return;
        }

/*
 * Visualização, download ou remoção
 * individual dos arquivos do cliente.
 */
const rotaArquivo =
    pathname.match(
        /^\/api\/clientes\/([^/]+)\/arquivos\/(original|convertido)$/
    );

if (rotaArquivo) {
    const id =
        decodeURIComponent(
            rotaArquivo[1]
        );

    const tipo =
        rotaArquivo[2];

    /*
     * Abrir ou baixar o arquivo.
     */
    if (
        [
            "GET",
            "HEAD"
        ].includes(
            request.method
        )
    ) {
        await servirArquivoCliente(
            request,
            response,
            id,
            tipo
        );

        return;
    }

    /*
     * Remover somente este arquivo,
     * mantendo o cliente cadastrado.
     */
    if (
        request.method ===
        "DELETE"
    ) {
        await removerArquivoCliente(
            response,
            id,
            tipo
        );

        return;
    }
}

        /*
         * Cliente individual.
         */
        const rotaCliente =
            pathname.match(
                /^\/api\/clientes\/([^/]+)$/
            );

        if (rotaCliente) {
            const id =
                decodeURIComponent(
                    rotaCliente[1]
                );

            if (
                request.method === "GET"
            ) {
                const cliente =
                    consultaClientePorId.get(
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
                        sucesso: true,

                        cliente:
                            converterCliente(
                                cliente
                            )
                    }
                );

                return;
            }

            if (
                request.method === "PUT"
            ) {
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
                await removerCliente(
                    response,
                    id
                );

                return;
            }
        }

        /*
         * Rota inexistente da API.
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

        /*
         * HTML, CSS e JavaScript.
         */
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
| Inicialização
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

/*
|--------------------------------------------------------------------------
| Encerramento seguro
|--------------------------------------------------------------------------
*/

function encerrarServidor() {
    console.log(
        "\nEncerrando o sistema..."
    );

    servidor.close(
        () => {
            servicoAutenticacao
                .encerrar();

            banco.close();

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