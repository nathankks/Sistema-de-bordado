/*
|--------------------------------------------------------------------------
| Seletores
|--------------------------------------------------------------------------
*/

const $ = seletor =>
    document.querySelector(seletor);

const $$ = seletor =>
    document.querySelectorAll(seletor);

const iconeConfirmacao =
    $("#iconeConfirmacao");

const iconeConfirmacaoUse =
    $("#iconeConfirmacaoUse");

const anoCreditos =
    $("#anoCreditos");



/*
|--------------------------------------------------------------------------
| Estado do sistema
|--------------------------------------------------------------------------
*/

const CHAVE_TEMA =
    "temaSistemaBordado";

let clientes = [];
let filtroAtual = "";
let tipoPessoaCliente =
    "fisica";
let clienteDetalhadoId = null;
let carregandoClientes = true;
let statusClienteAtual =
    "todos";

let ordenacaoClienteAtual =
    "recentes";

/*
|--------------------------------------------------------------------------
| Permissões do usuário atual
|--------------------------------------------------------------------------
*/

let usuarioAtualSistema =
    null;

let permissoesUsuarioSistema =
    Object.create(
        null
    );

function possuiPermissaoSistema(
    permissao
) {
    return Boolean(
        permissoesUsuarioSistema[
            permissao
        ]
    );
}

function exigirPermissaoInterface(
    permissao,
    mensagem =
        "Você não possui permissão para realizar esta ação."
) {
    if (
        possuiPermissaoSistema(
            permissao
        )
    ) {
        return true;
    }

    mostrarNotificacao(
        "Acesso não permitido",
        mensagem,
        "erro"
    );

    return false;
}

function definirVisibilidadePorPermissao(
    elemento,
    permitido
) {
    if (!elemento) {
        return;
    }

    elemento.hidden =
        !permitido;

    elemento.classList.toggle(
        "permissao-oculta",
        !permitido
    );

    elemento.setAttribute(
        "aria-hidden",
        permitido
            ? "false"
            : "true"
    );

    if (
        elemento instanceof
        HTMLButtonElement
    ) {
        elemento.disabled =
            !permitido;
    }
}

function alterarVisibilidadePermissao(
    seletor,
    permitido
) {
    document
        .querySelectorAll(
            seletor
        )
        .forEach(
            elemento => {
                definirVisibilidadePorPermissao(
                    elemento,
                    permitido
                );
            }
        );
}

/*
|--------------------------------------------------------------------------
| Permissões declaradas diretamente no HTML
|--------------------------------------------------------------------------
*/

function verificarPermissoesElemento(
    elemento
) {
    const valor =
        String(
            elemento.dataset
                .permissaoExigida ||
            ""
        );

    const permissoes =
        valor
            .split(",")
            .map(
                permissao =>
                    permissao.trim()
            )
            .filter(
                Boolean
            );

    if (!permissoes.length) {
        return true;
    }

    const modo =
        elemento.dataset
            .permissaoModo ||
        "todas";

    if (modo === "alguma") {
        return permissoes.some(
            permissao =>
                possuiPermissaoSistema(
                    permissao
                )
        );
    }

    return permissoes.every(
        permissao =>
            possuiPermissaoSistema(
                permissao
            )
    );
}

function aplicarPermissoesDeclarativas(
    raiz = document
) {
    const elementos = [];

    if (
        raiz instanceof Element &&
        raiz.matches(
            "[data-permissao-exigida]"
        )
    ) {
        elementos.push(
            raiz
        );
    }

    if (
        raiz.querySelectorAll
    ) {
        elementos.push(
            ...raiz.querySelectorAll(
                "[data-permissao-exigida]"
            )
        );
    }

    elementos.forEach(
        elemento => {
            const permitido =
                verificarPermissoesElemento(
                    elemento
                );

            definirVisibilidadePorPermissao(
                elemento,
                permitido
            );
        }
    );
}

window.aplicarPermissoesDeclarativas =
    aplicarPermissoesDeclarativas;

function aplicarPermissoesNaInterface() {
    const podeVisualizarClientes =
        possuiPermissaoSistema(
            "clientes.visualizar"
        );

    const podeCriarClientes =
        possuiPermissaoSistema(
            "clientes.criar"
        );

    const podeEditarClientes =
        possuiPermissaoSistema(
            "clientes.editar"
        );

    const podeExcluirClientes =
        possuiPermissaoSistema(
            "clientes.excluir"
        );

    const podeVisualizarOrdens =
        possuiPermissaoSistema(
            "ordens.visualizar"
        );

    const podeCriarOrdens =
        possuiPermissaoSistema(
            "ordens.criar"
        );

    const podeVisualizarLinhas =
        possuiPermissaoSistema(
            "linhas.visualizar"
        );

    const podeCriarLinhas =
        possuiPermissaoSistema(
            "linhas.criar"
        );

    const podeBaixarArquivos =
        possuiPermissaoSistema(
            "arquivos.baixar"
        );

    const podeCriarBackup =
        possuiPermissaoSistema(
            "backup.criar"
        );

    const podeRestaurarBackup =
        possuiPermissaoSistema(
            "backup.restaurar"
        );

    const podeGerenciarUsuarios =
        possuiPermissaoSistema(
            "usuarios.gerenciar"
        );

    aplicarPermissoesDeclarativas(
        document
        );

    /*
     * Menus e seções.
     */

    alterarVisibilidadePermissao(
        '.menu-item[data-secao="clientes"]',
        podeVisualizarClientes
    );

    alterarVisibilidadePermissao(
        "#secao-clientes",
        podeVisualizarClientes
    );

    alterarVisibilidadePermissao(
        '.menu-item[data-secao="ordens"]',
        podeVisualizarOrdens
    );

    alterarVisibilidadePermissao(
        "#secao-ordens",
        podeVisualizarOrdens
    );

    alterarVisibilidadePermissao(
        '.menu-item[data-secao="linhas"]',
        podeVisualizarLinhas
    );

    alterarVisibilidadePermissao(
        "#secao-linhas",
        podeVisualizarLinhas
    );

    alterarVisibilidadePermissao(
        '.menu-item[data-secao="arquivos"]',
        podeBaixarArquivos &&
        podeVisualizarClientes
    );

    alterarVisibilidadePermissao(
        "#secao-arquivos",
        podeBaixarArquivos &&
        podeVisualizarClientes
    );

    alterarVisibilidadePermissao(
        "#menuUsuarios",
        podeGerenciarUsuarios
    );

    alterarVisibilidadePermissao(
        "#secao-usuarios",
        podeGerenciarUsuarios
    );

    /*
     * Cadastro de clientes.
     */

    alterarVisibilidadePermissao(
        `
        #menuNovoCliente,
        #botaoNovoCliente,
        #botaoCadastrarDestaque,
        #acaoNovoCliente,
        #botaoNovoClienteSecao
        `,
        podeCriarClientes
    );

    /*
     * Cadastro de ordens e linhas.
     */

    alterarVisibilidadePermissao(
        "#botaoNovaOrdem",
        podeCriarOrdens
    );

    alterarVisibilidadePermissao(
        "#botaoNovaLinha",
        podeCriarLinhas
    );

    /*
     * Edição e exclusão de clientes.
     */

    if (botaoEditarDetalhes) {
        botaoEditarDetalhes.hidden =
            !podeEditarClientes;
    }

    alterarVisibilidadePermissao(
        "#botaoApagarTudo",
        podeExcluirClientes
    );

    /*
     * Backup.
     */

    const cardBackup =
        document.querySelector(
            ".config-card-backup"
        );

    const blocoCriarBackup =
        botaoCriarBackup
            ?.closest(
                ".config-backup-bloco"
            );

    const blocoRestaurarBackup =
        botaoRestaurarBackup
            ?.closest(
                ".config-backup-bloco"
            );

    if (cardBackup) {
        cardBackup.hidden =
            !podeCriarBackup &&
            !podeRestaurarBackup;
    }

    if (blocoCriarBackup) {
        blocoCriarBackup.hidden =
            !podeCriarBackup;
    }

    if (blocoRestaurarBackup) {
        blocoRestaurarBackup.hidden =
            !podeRestaurarBackup;
    }

    /*
     * Sai de uma seção que ficou bloqueada.
     */

    const secaoAtiva =
        document.querySelector(
            ".secao.ativa"
        );

    if (
        secaoAtiva?.hidden
    ) {
        navegarPara(
            "dashboard"
        );
    }

    /*
     * Avisa os outros arquivos JavaScript.
     */

    window.dispatchEvent(
        new CustomEvent(
            "permissoes-carregadas",
            {
                detail: {
                    usuario:
                        usuarioAtualSistema,

                    permissoes:
                        permissoesUsuarioSistema
                }
            }
        )
    );
}

/*
 * Disponibiliza o controle para
 * ordens-ui.js e linhas-ui.js.
 */

window.possuiPermissaoSistema =
    possuiPermissaoSistema;

window.exigirPermissaoInterface =
    exigirPermissaoInterface;

const observadorPermissoes =
    new MutationObserver(
        alteracoes => {
            for (
                const alteracao
                of alteracoes
            ) {
                for (
                    const elemento
                    of alteracao.addedNodes
                ) {
                    if (
                        elemento instanceof
                        Element
                    ) {
                        aplicarPermissoesDeclarativas(
                            elemento
                        );
                    }
                }
            }
        }
    );

if (document.body) {
    observadorPermissoes.observe(
        document.body,
        {
            childList:
                true,

            subtree:
                true
        }
    );
}

/*
|--------------------------------------------------------------------------
| Usuário autenticado
|--------------------------------------------------------------------------
*/

const nomeUsuarioLogado =
    $("#nomeUsuarioLogado");

const perfilUsuarioLogado =
    $("#perfilUsuarioLogado");

const iniciaisUsuarioLogado =
    $("#iniciaisUsuarioLogado");

const botaoSair =
    $("#botaoSair");

/*
|--------------------------------------------------------------------------
| Elementos principais
|--------------------------------------------------------------------------
*/


const html =
    document.documentElement;

const sidebar =
    $("#sidebar");

const fundoMenuMobile =
    $("#fundoMenuMobile");

const botaoMenuMobile =
    $("#botaoMenuMobile");

const tituloPagina =
    $("#tituloPagina");

const secoes =
    $$(".secao");

const itensMenu =
    $$(".menu-item[data-secao]");

const modalCliente =
    $("#modalCliente");

const formularioCliente =
    $("#formularioCliente");

const tituloModalCliente =
    $("#tituloModalCliente");

const clienteId =
    $("#clienteId");

const botaoSalvarCliente =
    $("#botaoSalvarCliente");

const modalDetalhes =
    $("#modalDetalhes");

const detalhesNome =
    $("#detalhesNome");

const detalhesAvatar =
    $("#detalhesAvatar");

const detalhesCpf =
    $("#detalhesCpf");

const detalhesTelefone =
    $("#detalhesTelefone");

const detalhesLinha =
    $("#detalhesLinha");

const detalhesData =
    $("#detalhesData");

const detalhesOriginal =
    $("#detalhesOriginal");

const detalhesConvertido =
    $("#detalhesConvertido");

const detalhesObservacoes =
    $("#detalhesObservacoes");

const botaoEditarDetalhes =
    $("#botaoEditarDetalhes");

const corpoTabelaClientes =
    $("#corpoTabelaClientes");

const listaRecentes =
    $("#listaRecentes");

const gradeArquivos =
    $("#gradeArquivos");

const buscaGlobal =
    $("#buscaGlobal");

const buscaClientes =
    $("#buscaClientes");

const quantidadeResultados =
    $("#quantidadeResultados");

const filtroStatusCliente =
    $("#filtroStatusCliente");

const ordenacaoClientes =
    $("#ordenacaoClientes");

const botaoExportarClientes =
    $("#botaoExportarClientes");

const totalClientes =
    $("#totalClientes");

const totalConvertidos =
    $("#totalConvertidos");

const totalRecentes =
    $("#totalRecentes");

const totalConfiguracoes =
    $("#totalConfiguracoes");

const campoCpf =
    $("#cpf");

const rotuloDocumentoCliente =
    $("#rotuloDocumentoCliente");

const botoesTipoPessoa =
    $$("[data-tipo-pessoa]");

const campoLinhaCliente =
    $("#linha");

const seletorLinhaCliente =
    $("#seletorLinhaCliente");

const botaoLinhaCliente =
    $("#botaoLinhaCliente");

const textoLinhaCliente =
    $("#textoLinhaCliente");

const subtextoLinhaCliente =
    $("#subtextoLinhaCliente");

const amostraLinhaCliente =
    $("#amostraLinhaCliente");

const menuLinhaCliente =
    $("#menuLinhaCliente");

const buscaLinhaCliente =
    $("#buscaLinhaCliente");

const listaLinhasCliente =
    $("#listaLinhasCliente");

const mensagemLinhaCliente =
    $("#mensagemLinhaCliente");

const linhasSelecionadasCliente =
    $("#linhasSelecionadasCliente");

const quantidadeLinhasSelecionadasCliente =
    $("#quantidadeLinhasSelecionadasCliente");

const botaoLimparLinhasCliente =
    $("#botaoLimparLinhasCliente");

const botaoConcluirLinhasCliente =
    $("#botaoConcluirLinhasCliente");

const campoTelefone =
    $("#telefone");

const mensagemCpf =
    $("#mensagemCpf");

const notificacoes =
    $("#notificacoes");

const botaoTema =
    $("#botaoTema");

const textoTema =
    $("#textoTema");

const iconeTema =
    $("#iconeTema");

const campoLogoOriginal =
    $("#logoOriginal");

const campoLogoConvertida =
    $("#logoConvertida");

/*
|--------------------------------------------------------------------------
| Elementos da área Minha conta
|--------------------------------------------------------------------------
*/

const formularioPerfil =
    $("#formularioPerfil");

const nomeConta =
    $("#nomeConta");

const usuarioConta =
    $("#usuarioConta");

const botaoSalvarPerfil =
    $("#botaoSalvarPerfil");

const formularioSenha =
    $("#formularioSenha");

const senhaAtualConta =
    $("#senhaAtualConta");

const novaSenhaConta =
    $("#novaSenhaConta");

const confirmarNovaSenhaConta =
    $("#confirmarNovaSenhaConta");

const botaoSalvarSenha =
    $("#botaoSalvarSenha");

/*
|--------------------------------------------------------------------------
| Elementos da área de backup
|--------------------------------------------------------------------------
*/

const ultimoBackup =
    $("#ultimoBackup");

const ultimoRestauro =
    $("#ultimoRestauro");

const botaoCriarBackup =
    $("#botaoCriarBackup");

const inputBackup =
    $("#inputBackup");

const botaoSelecionarBackup =
    $("#botaoSelecionarBackup");

const nomeBackupSelecionado =
    $("#nomeBackupSelecionado");

const botaoRestaurarBackup =
    $("#botaoRestaurarBackup");

const titulosSecoes = {
    dashboard: "Visão geral",
    clientes: "Clientes",
    ordens: "Ordens",
    arquivos: "Arquivos",
    linhas: "Catálogo de linhas",
    usuarios: "Gerenciamento de usuários",
    configuracoes: "Configurações"
};

const modalConfirmacao =
    $("#modalConfirmacao");

const tituloConfirmacao =
    $("#tituloConfirmacao");

const mensagemConfirmacao =
    $("#mensagemConfirmacao");

const botaoCancelarConfirmacao =
    $("#botaoCancelarConfirmacao");

const botaoConfirmarAcao =
    $("#botaoConfirmarAcao");

/*
|--------------------------------------------------------------------------
| Comunicação com a API
|--------------------------------------------------------------------------
*/

async function requisicaoApi(
    caminho,
    opcoes = {}
) {
    const configuracao = {
        ...opcoes,

        headers: {
            ...(opcoes.headers || {})
        }
    };

    /*
     * Quando o conteúdo não for FormData,
     * ele será enviado como JSON.
     *
     * Quando for FormData, o navegador cria
     * automaticamente o Content-Type com boundary.
     */
    if (
        opcoes.body &&
        !(opcoes.body instanceof FormData)
    ) {
        configuracao.headers[
            "Content-Type"
        ] = "application/json";
    }

    let resposta;

    try {
        resposta = await fetch(
            caminho,
            configuracao
        );
    } catch {
        throw new Error(
            "Não foi possível conectar ao servidor. Confirme se o comando node server.js está em execução."
        );
    }

    let dados = null;

    try {
        dados =
            await resposta.json();
    } catch {
        dados = null;
    }

    if (
    resposta.status === 401
) {
    window.location.replace(
        "/login.html"
    );

    throw new Error(
        dados?.mensagem ||
        "Sua sessão foi encerrada."
    );
}

    if (!resposta.ok) {
        throw new Error(
            dados?.mensagem ||
            `O servidor respondeu com o erro ${resposta.status}.`
        );
    }

    return dados;
}

async function carregarClientesDoServidor(
    {
        mostrarErro = true
    } = {}
) {

    if (
    !possuiPermissaoSistema(
        "clientes.visualizar"
    )
) {
    clientes =
        [];

    carregandoClientes =
        false;

    renderizarTudo();

    return;
}

    carregandoClientes = true;

    renderizarTudo();

    try {
        const dados =
            await requisicaoApi(
                "/api/clientes"
            );

        clientes =
            Array.isArray(
                dados.clientes
            )
                ? dados.clientes
                : [];
    } catch (erro) {
        clientes = [];

        if (mostrarErro) {
            mostrarNotificacao(
                "Servidor indisponível",
                erro.message,
                "erro"
            );
        }
    } finally {
        carregandoClientes = false;

        renderizarTudo();
    }
}

/*
|--------------------------------------------------------------------------
| Ícones
|--------------------------------------------------------------------------
*/

function icone(nome) {
    return `
        <svg aria-hidden="true">
            <use
                href="#icon-${nome}"
            ></use>
        </svg>
    `;
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

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );
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

    /*
     * As primeiras 12 posições podem
     * ter letras ou números.
     *
     * Os dois dígitos verificadores
     * finais continuam numéricos.
     */
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

    return (
        base +
        digitos
    );
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
    tipo =
        tipoPessoaCliente
) {
    if (
        tipo ===
        "juridica"
    ) {
        return normalizarCnpj(
            valor
        );
    }

    return somenteNumeros(
        valor
    ).slice(
        0,
        11
    );
}

function formatarDocumentoPorTipo(
    valor,
    tipo =
        tipoPessoaCliente
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
| Validação de CPF e CNPJ
|--------------------------------------------------------------------------
*/

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
        let soma = 0;

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
        )
    ) {
        return false;
    }

    if (
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

    const primeiroDigito =
        calcularDigito(
            base,
            [
                5,
                4,
                3,
                2,
                9,
                8,
                7,
                6,
                5,
                4,
                3,
                2
            ]
        );

    const segundoDigito =
        calcularDigito(
            base +
            primeiroDigito,
            [
                6,
                5,
                4,
                3,
                2,
                9,
                8,
                7,
                6,
                5,
                4,
                3,
                2
            ]
        );

    return (
        cnpj.slice(
            -2
        ) ===
        `${primeiroDigito}${segundoDigito}`
    );
}

function obterRotuloDocumentoAtual() {
    return tipoPessoaCliente ===
        "juridica"
        ? "CNPJ"
        : "CPF";
}

function validarDocumentoAtual(
    valor
) {
    return tipoPessoaCliente ===
        "juridica"
        ? validarCnpj(
            valor
        )
        : validarCpf(
            valor
        );
}

function definirTipoPessoaCliente(
    tipo,
    {
        limparCampo = true
    } = {}
) {
    tipoPessoaCliente =
        tipo ===
        "juridica"
            ? "juridica"
            : "fisica";

    const juridica =
        tipoPessoaCliente ===
        "juridica";

    if (
        rotuloDocumentoCliente
    ) {
        rotuloDocumentoCliente
            .textContent =
                juridica
                    ? "CNPJ"
                    : "CPF";
    }

    campoCpf.maxLength =
        juridica
            ? 18
            : 14;

    campoCpf.placeholder =
        juridica
            ? "00.000.000/0000-00"
            : "000.000.000-00";

    campoCpf.inputMode =
        juridica
            ? "text"
            : "numeric";

    campoCpf.setAttribute(
        "autocapitalize",
        juridica
            ? "characters"
            : "off"
    );

    botoesTipoPessoa
        .forEach(
            botao => {
                const ativo =
                    botao.dataset
                        .tipoPessoa ===
                    tipoPessoaCliente;

                botao.classList.toggle(
                    "ativo",
                    ativo
                );

                botao.setAttribute(
                    "aria-pressed",
                    ativo
                        ? "true"
                        : "false"
                );
            }
        );

    if (limparCampo) {
        campoCpf.value =
            "";
    } else {
        campoCpf.value =
            formatarDocumentoPorTipo(
                campoCpf.value
            );
    }

    atualizarEstadoDocumento();
}

function atualizarEstadoDocumento() {
    const rotulo =
        obterRotuloDocumentoAtual();

    const documento =
        normalizarDocumentoPorTipo(
            campoCpf.value
        );

    const quantidadeEsperada =
        tipoPessoaCliente ===
        "juridica"
            ? 14
            : 11;

    campoCpf.classList.remove(
        "invalido"
    );

    mensagemCpf.classList.remove(
        "erro",
        "valido"
    );

    if (!documento) {
        mensagemCpf.textContent =
            `Digite um ${rotulo} válido.`;

        return;
    }

    if (
        documento.length <
        quantidadeEsperada
    ) {
        mensagemCpf.textContent =
            `O ${rotulo} precisa ter ${quantidadeEsperada} caracteres.`;

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    if (
        !validarDocumentoAtual(
            documento
        )
    ) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            `Este ${rotulo} não é válido.`;

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    const duplicado =
        clientes.some(
            cliente => {
                const tipoCliente =
                    identificarTipoPessoaPorDocumento(
                        cliente.cpf
                    );

                return (
                    normalizarDocumentoPorTipo(
                        cliente.cpf,
                        tipoCliente
                    ) ===
                        documento &&

                    cliente.id !==
                        clienteId.value
                );
            }
        );

    if (duplicado) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            `Este ${rotulo} já está cadastrado.`;

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    mensagemCpf.textContent =
        `${rotulo} válido.`;

    mensagemCpf.classList.add(
        "valido"
    );
}

/*
|--------------------------------------------------------------------------
| Validação dos arquivos no navegador
|--------------------------------------------------------------------------
*/

function obterExtensao(nome) {
    const partes =
        String(nome || "")
            .toLowerCase()
            .split(".");

    if (partes.length < 2) {
        return "";
    }

    return `.${partes.pop()}`;
}

function validarArquivosSelecionados() {
    const arquivoOriginal =
        campoLogoOriginal.files[0];

    const arquivoConvertido =
        campoLogoConvertida.files[0];

    const extensoesOriginais = [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".svg",
        ".pdf"
    ];

    const extensoesConvertidas = [
        ".dst",
        ".pes",
        ".jef",
        ".exp",
        ".vp3",
        ".zip"
    ];

    if (arquivoOriginal) {
        const extensao =
            obterExtensao(
                arquivoOriginal.name
            );

        if (
            !extensoesOriginais.includes(
                extensao
            )
        ) {
            throw new Error(
                "O formato da logo original não é permitido."
            );
        }

        if (
            arquivoOriginal.size >
            12 * 1024 * 1024
        ) {
            throw new Error(
                "A logo original deve ter no máximo 12 MB."
            );
        }
    }

    if (arquivoConvertido) {
        const extensao =
            obterExtensao(
                arquivoConvertido.name
            );

        if (
            !extensoesConvertidas.includes(
                extensao
            )
        ) {
            throw new Error(
                "O formato do arquivo convertido não é permitido."
            );
        }

        if (
            arquivoConvertido.size >
            20 * 1024 * 1024
        ) {
            throw new Error(
                "O arquivo convertido deve ter no máximo 20 MB."
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| Utilitários
|--------------------------------------------------------------------------
*/

function escaparHtml(texto = "") {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto);

    return elemento.innerHTML;
}

function obterIniciais(nome = "") {
    return (
        String(nome)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                parte =>
                    parte
                        .charAt(0)
                        .toUpperCase()
            )
            .join("")
        ||
        "CL"
    );
}

function formatarData(data) {
    const dataConvertida =
        new Date(data);

    if (
        !data ||
        Number.isNaN(
            dataConvertida.getTime()
        )
    ) {
        return "Data não informada";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(dataConvertida);
}

function arquivoEhImagem(nome) {
    return [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp"
    ].includes(
        obterExtensao(nome)
    );
}

function arquivoEhPdf(nome) {
    return (
        obterExtensao(nome) === ".pdf"
    );
}

function criarLinkArquivo(
    url,
    nome,
    texto,
    principal = false
) {
    if (!url) {
        return "";
    }

    return `
        <a
            class="botao ${
                principal
                    ? "botao-principal"
                    : "botao-secundario"
            } botao-arquivo"
            href="${escaparHtml(url)}"
            target="_blank"
            rel="noopener"
        >
            ${icone(
                principal
                    ? "check-file"
                    : "eye"
            )}

            ${escaparHtml(texto)}
        </a>
    `;
}

/*
|--------------------------------------------------------------------------
| Notificações profissionais
|--------------------------------------------------------------------------
*/

function mostrarNotificacao(
    titulo,
    mensagem,
    tipo = "sucesso",
    duracao = 4500
) {
    if (!notificacoes) {
        return;
    }

    const configuracoes = {
        sucesso: {
            icone: "check",
            rotulo: "Sucesso"
        },

        erro: {
            icone: "alert",
            rotulo: "Erro"
        },

        aviso: {
            icone: "alert",
            rotulo: "Atenção"
        },

        info: {
            icone: "clock",
            rotulo: "Informação"
        }
    };

    const tipoValido =
        configuracoes[tipo]
            ? tipo
            : "sucesso";

    const configuracao =
        configuracoes[tipoValido];

    /*
     * Mantém no máximo quatro notificações
     * visíveis ao mesmo tempo.
     */
    while (
        notificacoes.children.length >= 4
    ) {
        notificacoes
            .firstElementChild
            ?.remove();
    }

    const toast =
        document.createElement(
            "article"
        );

    toast.className =
        `toast-profissional toast-${tipoValido}`;

    toast.setAttribute(
        "role",
        tipoValido === "erro"
            ? "alert"
            : "status"
    );

    toast.style.setProperty(
        "--duracao-toast",
        `${duracao}ms`
    );

    toast.innerHTML = `
        <span
            class="toast-acento"
            aria-hidden="true"
        ></span>

        <span
            class="toast-icone"
            aria-hidden="true"
        >
            ${icone(
                configuracao.icone
            )}
        </span>

        <span class="toast-conteudo">
            <span class="toast-cabecalho">
                <span class="toast-tipo">
                    ${escaparHtml(
                        configuracao.rotulo
                    )}
                </span>
            </span>

            <strong class="toast-titulo">
                ${escaparHtml(
                    titulo
                )}
            </strong>

            ${
                mensagem
                    ? `
                        <span class="toast-mensagem">
                            ${escaparHtml(
                                mensagem
                            )}
                        </span>
                    `
                    : ""
            }
        </span>

        <button
            class="toast-fechar"
            type="button"
            aria-label="Fechar notificação"
            title="Fechar"
        >
            <span aria-hidden="true">
                ×
            </span>
        </button>

        <span
            class="toast-progresso"
            aria-hidden="true"
        >
            <span></span>
        </span>
    `;

    const botaoFechar =
        toast.querySelector(
            ".toast-fechar"
        );

    const barraProgresso =
        toast.querySelector(
            ".toast-progresso span"
        );

    let temporizador = null;

    let inicioTemporizador =
        Date.now();

    let tempoRestante =
        duracao;

    let fechando =
        false;

    function removerToast() {
        toast.remove();
    }

    function fecharToast() {
        if (fechando) {
            return;
        }

        fechando = true;

        clearTimeout(
            temporizador
        );

        toast.classList.remove(
            "toast-visivel"
        );

        toast.classList.add(
            "toast-saindo"
        );

        toast.addEventListener(
            "animationend",
            removerToast,
            {
                once: true
            }
        );

        /*
         * Segurança caso o navegador não
         * execute a animação.
         */
        setTimeout(
            removerToast,
            400
        );
    }

    function iniciarTemporizador() {
        inicioTemporizador =
            Date.now();

        temporizador =
            setTimeout(
                fecharToast,
                tempoRestante
            );
    }

    function pausarTemporizador() {
        if (fechando) {
            return;
        }

        clearTimeout(
            temporizador
        );

        const tempoPassado =
            Date.now() -
            inicioTemporizador;

        tempoRestante =
            Math.max(
                0,
                tempoRestante -
                tempoPassado
            );

        if (barraProgresso) {
            barraProgresso
                .style
                .animationPlayState =
                    "paused";
        }
    }

    function continuarTemporizador() {
        if (fechando) {
            return;
        }

        if (
            tempoRestante <= 0
        ) {
            fecharToast();
            return;
        }

        if (barraProgresso) {
            barraProgresso
                .style
                .animationPlayState =
                    "running";
        }

        iniciarTemporizador();
    }

    botaoFechar.addEventListener(
        "click",
        fecharToast
    );

    toast.addEventListener(
        "mouseenter",
        pausarTemporizador
    );

    toast.addEventListener(
        "mouseleave",
        continuarTemporizador
    );

    toast.addEventListener(
        "focusin",
        pausarTemporizador
    );

    toast.addEventListener(
        "focusout",
        continuarTemporizador
    );

    notificacoes.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {
            toast.classList.add(
                "toast-visivel"
            );
        }
    );

    iniciarTemporizador();
}

/*
|--------------------------------------------------------------------------
| Tema
|--------------------------------------------------------------------------
*/

function aplicarTema(tema) {
    const temaValido =
        tema === "dark"
            ? "dark"
            : "light";

    html.dataset.theme =
        temaValido;

    localStorage.setItem(
        CHAVE_TEMA,
        temaValido
    );


    $$(".opcao-tema")
        .forEach(botao => {
            botao.classList.toggle(
                "selecionado",
                botao.dataset.tema ===
                    temaValido
            );
        });
}

function carregarTema() {
    const temaSalvo =
        localStorage.getItem(
            CHAVE_TEMA
        );

    const sistemaEscuro =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    aplicarTema(
        temaSalvo ||
        (
            sistemaEscuro
                ? "dark"
                : "light"
        )
    );
}

function alternarTema() {
    aplicarTema(
        html.dataset.theme === "dark"
            ? "light"
            : "dark"
    );
}

/*
|--------------------------------------------------------------------------
| Navegação
|--------------------------------------------------------------------------
*/

function abrirMenuMobile() {
    sidebar?.classList.add(
        "aberto"
    );

    fundoMenuMobile?.classList.add(
        "aberto"
    );

    botaoMenuMobile?.setAttribute(
        "aria-expanded",
        "true"
    );

    botaoMenuMobile?.setAttribute(
        "aria-label",
        "Fechar menu"
    );
}

function fecharMenuMobile() {
    sidebar?.classList.remove(
        "aberto"
    );

    fundoMenuMobile?.classList.remove(
        "aberto"
    );

    botaoMenuMobile?.setAttribute(
        "aria-expanded",
        "false"
    );

    botaoMenuMobile?.setAttribute(
        "aria-label",
        "Abrir menu"
    );
}

function navegarPara(secao) {

    const permissoesSecoes = {
    clientes:
        "clientes.visualizar",

    ordens:
        "ordens.visualizar",

    linhas:
        "linhas.visualizar",

    arquivos:
        "arquivos.baixar",

    usuarios:
        "usuarios.gerenciar"
};

const permissaoNecessaria =
    permissoesSecoes[
        secao
    ];

if (
    permissaoNecessaria &&
    !exigirPermissaoInterface(
        permissaoNecessaria
    )
) {
    return;
}

    secoes.forEach(elemento => {
        elemento.classList.toggle(
            "ativa",
            elemento.id ===
                `secao-${secao}`
        );
    });

    itensMenu.forEach(item => {
        item.classList.toggle(
            "ativo",
            item.dataset.secao ===
                secao
        );
    });

    tituloPagina.textContent =
        titulosSecoes[secao] ||
        "Sistema de Bordados";

    fecharMenuMobile();

    renderizarTudo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/*
|--------------------------------------------------------------------------
| Modal de cadastro
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Seletor múltiplo de linhas do cliente
|--------------------------------------------------------------------------
*/

const SEPARADOR_LINHAS_CLIENTE =
    "\n";

let linhasAntigasCliente = [];

function criarValorLinhaCatalogo(
    linha
) {
    return [
        linha.marca,
        linha.codigo,
        linha.nome
    ]
        .filter(Boolean)
        .join(" — ");
}

function obterLinhasDisponiveisCliente() {
    if (
        typeof window
            .obterLinhasAtivasCatalogo !==
        "function"
    ) {
        return [];
    }

    return window
        .obterLinhasAtivasCatalogo();
}

function encontrarLinhaCliente(
    valor
) {
    return (
        obterLinhasDisponiveisCliente()
            .find(
                linha =>
                    criarValorLinhaCatalogo(
                        linha
                    ) === valor
            ) ||
        null
    );
}

function normalizarListaLinhasCliente(
    valor
) {
    const valores =
        Array.isArray(valor)
            ? valor
            : String(
                valor || ""
            ).split(
                /\r?\n/
            );

    return [
        ...new Set(
            valores
                .map(
                    item =>
                        String(
                            item || ""
                        ).trim()
                )
                .filter(Boolean)
        )
    ];
}

function obterLinhasSelecionadasCliente() {
    return normalizarListaLinhasCliente(
        campoLinhaCliente?.value ||
        ""
    );
}

function obterNomeLinhaCliente(
    valor
) {
    const linha =
        encontrarLinhaCliente(
            valor
        );

    return (
        linha?.nome ||
        valor
    );
}

function obterStatusLinhaCliente(
    linha
) {
    if (
        linha.statusEstoque ===
        "zerado"
    ) {
        return {
            texto: "Sem estoque",
            classe: "zerado"
        };
    }

    if (
        linha.statusEstoque ===
        "baixo"
    ) {
        return {
            texto: "Estoque baixo",
            classe: "baixo"
        };
    }

    return {
        texto: "Disponível",
        classe: "disponivel"
    };
}

function definirLinhasSelecionadasCliente(
    valores
) {
    if (!campoLinhaCliente) {
        return;
    }

    const lista =
        normalizarListaLinhasCliente(
            valores
        );

    campoLinhaCliente.value =
        lista.join(
            SEPARADOR_LINHAS_CLIENTE
        );

    linhasAntigasCliente =
        lista.filter(
            valor =>
                !encontrarLinhaCliente(
                    valor
                )
        );

    atualizarVisualLinhaCliente();
}

function renderizarLinhasSelecionadasCliente() {
    if (
        !linhasSelecionadasCliente
    ) {
        return;
    }

    const selecionadas =
        obterLinhasSelecionadasCliente();

    linhasSelecionadasCliente.hidden =
        !selecionadas.length;

    linhasSelecionadasCliente.innerHTML =
        selecionadas
            .map(
                valor => {
                    const linha =
                        encontrarLinhaCliente(
                            valor
                        );

                    const nome =
                        obterNomeLinhaCliente(
                            valor
                        );

                    const cor =
                        linha?.corHex ||
                        "#777777";

                    return `
                        <button
                            class="linha-selecionada-ordem"
                            data-remover-linha-cliente="${encodeURIComponent(
                                valor
                            )}"
                            type="button"
                            title="Remover ${escaparHtml(
                                nome
                            )}"
                            aria-label="Remover ${escaparHtml(
                                nome
                            )}"
                        >
                            <span
                                class="amostra-chip-linha-ordem"
                                style="background-color: ${escaparHtml(
                                    cor
                                )}"
                            ></span>

                            <span>
                                ${escaparHtml(
                                    nome
                                )}
                            </span>

                            ${icone("x")}
                        </button>
                    `;
                }
            )
            .join("");
}

function atualizarVisualLinhaCliente() {
    if (
        !campoLinhaCliente ||
        !textoLinhaCliente ||
        !subtextoLinhaCliente
    ) {
        return;
    }

    const selecionadas =
        obterLinhasSelecionadasCliente();

    const quantidade =
        selecionadas.length;

    if (
        quantidadeLinhasSelecionadasCliente
    ) {
        quantidadeLinhasSelecionadasCliente
            .textContent =
                `${quantidade} ${
                    quantidade === 1
                        ? "linha selecionada"
                        : "linhas selecionadas"
                }`;
    }

    renderizarLinhasSelecionadasCliente();

    if (!quantidade) {
        textoLinhaCliente.textContent =
            window.catalogoLinhasCarregado
                ? "Nenhuma linha selecionada"
                : "Carregando catálogo...";

        subtextoLinhaCliente.textContent =
            window.catalogoLinhasCarregado
                ? "Pesquise e selecione uma ou mais linhas"
                : "Aguarde o carregamento das linhas";

        if (amostraLinhaCliente) {
            amostraLinhaCliente.hidden =
                true;
        }

        if (mensagemLinhaCliente) {
            mensagemLinhaCliente.textContent =
                "Você pode selecionar várias linhas ou concluir sem nenhuma.";

            mensagemLinhaCliente
                .classList.remove(
                    "erro"
                );
        }

        return;
    }

    if (quantidade === 1) {
        const valor =
            selecionadas[0];

        const linha =
            encontrarLinhaCliente(
                valor
            );

        if (linha) {
            const status =
                obterStatusLinhaCliente(
                    linha
                );

            textoLinhaCliente.textContent =
                linha.nome;

            subtextoLinhaCliente.textContent =
                `${linha.marca} · Código ${linha.codigo} · ${status.texto}`;

            if (amostraLinhaCliente) {
                amostraLinhaCliente.hidden =
                    false;

                amostraLinhaCliente.style
                    .backgroundColor =
                        linha.corHex ||
                        "#777777";
            }
        } else {
            textoLinhaCliente.textContent =
                valor;

            subtextoLinhaCliente.textContent =
                "Linha anterior — fora do catálogo";

            if (amostraLinhaCliente) {
                amostraLinhaCliente.hidden =
                    false;

                amostraLinhaCliente.style
                    .backgroundColor =
                        "#777777";
            }
        }
    } else {
        const nomes =
            selecionadas.map(
                obterNomeLinhaCliente
            );

        textoLinhaCliente.textContent =
            `${quantidade} linhas selecionadas`;

        subtextoLinhaCliente.textContent =
            nomes
                .slice(
                    0,
                    3
                )
                .join(" · ") +
            (
                quantidade > 3
                    ? ` · +${quantidade - 3}`
                    : ""
            );

        if (amostraLinhaCliente) {
            amostraLinhaCliente.hidden =
                true;
        }
    }

    if (mensagemLinhaCliente) {
        mensagemLinhaCliente.textContent =
            `${quantidade} ${
                quantidade === 1
                    ? "linha selecionada"
                    : "linhas selecionadas"
            }. Clique em uma etiqueta para remover.`;

        mensagemLinhaCliente
            .classList.remove(
                "erro"
            );
    }
}

function criarOpcaoLinhaCliente(
    linha
) {
    const valor =
        criarValorLinhaCatalogo(
            linha
        );

    const selecionada =
        obterLinhasSelecionadasCliente()
            .includes(
                valor
            );

    const status =
        obterStatusLinhaCliente(
            linha
        );

    const estoque =
        new Intl.NumberFormat(
            "pt-BR",
            {
                maximumFractionDigits:
                    2
            }
        ).format(
            Number(
                linha.estoque || 0
            )
        );

    return `
        <button
            class="opcao-menu-linha ${
                selecionada
                    ? "selecionada"
                    : ""
            }"
            data-valor-linha="${encodeURIComponent(
                valor
            )}"
            type="button"
            role="option"
            aria-selected="${selecionada}"
        >
            <span
                class="amostra-opcao-linha"
                style="background-color: ${escaparHtml(
                    linha.corHex ||
                    "#777777"
                )}"
            ></span>

            <span class="informacoes-opcao-linha">
                <strong>
                    ${escaparHtml(
                        linha.nome
                    )}
                </strong>

                <span>
                    ${escaparHtml(
                        linha.marca
                    )}
                    · Código
                    ${escaparHtml(
                        linha.codigo
                    )}
                    · Estoque:
                    ${escaparHtml(
                        estoque
                    )}
                    ${escaparHtml(
                        linha.unidade
                    )}
                </span>
            </span>

            <span class="opcao-linha-ordem-final">
                <span
                    class="status-opcao-linha ${status.classe}"
                >
                    ${escaparHtml(
                        status.texto
                    )}
                </span>

                <span class="marcador-linha-ordem">
                    ${
                        selecionada
                            ? icone("check")
                            : ""
                    }
                </span>
            </span>
        </button>
    `;
}

function criarOpcaoLinhaAntigaCliente(
    valor
) {
    const selecionada =
        obterLinhasSelecionadasCliente()
            .includes(
                valor
            );

    return `
        <button
            class="opcao-menu-linha linha-legada ${
                selecionada
                    ? "selecionada"
                    : ""
            }"
            data-valor-linha="${encodeURIComponent(
                valor
            )}"
            type="button"
            role="option"
            aria-selected="${selecionada}"
        >
            <span
                class="amostra-opcao-linha"
                style="background-color: #777777"
            ></span>

            <span class="informacoes-opcao-linha">
                <strong>
                    ${escaparHtml(
                        valor
                    )}
                </strong>

                <span>
                    Linha utilizada anteriormente
                </span>
            </span>

            <span class="opcao-linha-ordem-final">
                <span class="status-opcao-linha legado">
                    Fora do catálogo
                </span>

                <span class="marcador-linha-ordem">
                    ${
                        selecionada
                            ? icone("check")
                            : ""
                    }
                </span>
            </span>
        </button>
    `;
}

function renderizarOpcoesLinhaCliente() {
    if (!listaLinhasCliente) {
        return;
    }

    const termo =
        normalizarTexto(
            buscaLinhaCliente?.value ||
            ""
        );

    const linhas =
        obterLinhasDisponiveisCliente()
            .filter(
                linha => {
                    if (!termo) {
                        return true;
                    }

                    const conteudo =
                        normalizarTexto(
                            [
                                linha.marca,
                                linha.codigo,
                                linha.nome,
                                linha.fornecedor,
                                linha.corHex
                            ]
                                .filter(Boolean)
                                .join(" ")
                        );

                    return conteudo.includes(
                        termo
                    );
                }
            );

    let html =
        linhasAntigasCliente
            .filter(
                valor =>
                    !termo ||
                    normalizarTexto(
                        valor
                    ).includes(
                        termo
                    )
            )
            .map(
                criarOpcaoLinhaAntigaCliente
            )
            .join("");

    html += linhas
        .map(
            criarOpcaoLinhaCliente
        )
        .join("");

    if (!html) {
        html = `
            <div class="menu-linha-vazio">
                <strong>
                    Nenhuma linha encontrada
                </strong>

                <span>
                    Pesquise usando outro código,
                    marca ou nome da cor.
                </span>
            </div>
        `;
    }

    listaLinhasCliente.innerHTML =
        html;
}

function abrirMenuLinhaCliente() {
    if (
        !menuLinhaCliente ||
        !botaoLinhaCliente
    ) {
        return;
    }

    menuLinhaCliente.hidden =
        false;

    seletorLinhaCliente
        ?.classList.add(
            "aberto"
        );

    botaoLinhaCliente.setAttribute(
        "aria-expanded",
        "true"
    );

    if (buscaLinhaCliente) {
        buscaLinhaCliente.value =
            "";
    }

    renderizarOpcoesLinhaCliente();

    setTimeout(
        () => {
            buscaLinhaCliente
                ?.focus();
        },
        30
    );
}

function fecharMenuLinhaCliente() {
    if (
        !menuLinhaCliente ||
        !botaoLinhaCliente
    ) {
        return;
    }

    menuLinhaCliente.hidden =
        true;

    seletorLinhaCliente
        ?.classList.remove(
            "aberto"
        );

    botaoLinhaCliente.setAttribute(
        "aria-expanded",
        "false"
    );
}

function selecionarLinhaCliente(
    valor
) {
    const selecionadas =
        obterLinhasSelecionadasCliente();

    const jaSelecionada =
        selecionadas.includes(
            valor
        );

    const novaLista =
        jaSelecionada
            ? selecionadas.filter(
                item =>
                    item !== valor
            )
            : [
                ...selecionadas,
                valor
            ];

    definirLinhasSelecionadasCliente(
        novaLista
    );

    botaoLinhaCliente
        ?.classList.remove(
            "invalido"
        );

    mensagemLinhaCliente
        ?.classList.remove(
            "erro"
        );

    renderizarOpcoesLinhaCliente();
}

function removerLinhaCliente(
    valor
) {
    const novaLista =
        obterLinhasSelecionadasCliente()
            .filter(
                item =>
                    item !== valor
            );

    definirLinhasSelecionadasCliente(
        novaLista
    );

    if (
        menuLinhaCliente &&
        !menuLinhaCliente.hidden
    ) {
        renderizarOpcoesLinhaCliente();
    }
}

function limparLinhasCliente() {
    definirLinhasSelecionadasCliente(
        []
    );

    renderizarOpcoesLinhaCliente();
}

function preencherCampoLinhaCliente(
    valorSelecionado = ""
) {
    definirLinhasSelecionadasCliente(
        normalizarListaLinhasCliente(
            valorSelecionado
        )
    );

    botaoLinhaCliente
        ?.classList.remove(
            "invalido"
        );

    mensagemLinhaCliente
        ?.classList.remove(
            "erro"
        );
}

function formatarResumoLinhasCliente(
    valor
) {
    const nomes =
        normalizarListaLinhasCliente(
            valor
        ).map(
            obterNomeLinhaCliente
        );

    if (!nomes.length) {
        return "—";
    }

    if (nomes.length <= 2) {
        return nomes.join(
            ", "
        );
    }

    return `${
        nomes
            .slice(
                0,
                2
            )
            .join(", ")
    } +${nomes.length - 2}`;
}

function formatarLinhasClienteDetalhes(
    valor
) {
    const nomes =
        normalizarListaLinhasCliente(
            valor
        ).map(
            obterNomeLinhaCliente
        );

    return nomes.length
        ? nomes.join("\n")
        : "—";
}

window.atualizarSelectLinhasCliente =
    function () {
        preencherCampoLinhaCliente(
            campoLinhaCliente?.value ||
            ""
        );

        if (
            menuLinhaCliente &&
            !menuLinhaCliente.hidden
        ) {
            renderizarOpcoesLinhaCliente();
        }
    };

function abrirModalCliente(
    cliente = null
) {

    const permissaoNecessaria =
    cliente
        ? "clientes.editar"
        : "clientes.criar";

if (
    !exigirPermissaoInterface(
        permissaoNecessaria,

        cliente
            ? "Você não possui permissão para editar clientes."
            : "Você não possui permissão para cadastrar clientes."
    )
) {
    return;
}

    formularioCliente.reset();

    const tipoDocumentoCliente =
    cliente
        ? identificarTipoPessoaPorDocumento(
            cliente.cpf
        )
        : "fisica";

definirTipoPessoaCliente(
    tipoDocumentoCliente,
    {
        limparCampo:
            true
    }
);

    fecharMenuLinhaCliente();

    preencherCampoLinhaCliente(
        cliente?.linha || ""
    );

    campoCpf.classList.remove(
        "invalido"
    );

    mensagemCpf.classList.remove(
        "erro",
        "valido"
    );

mensagemCpf.textContent =
    `Digite um ${
        obterRotuloDocumentoAtual()
    } válido.`;

    if (cliente) {
        tituloModalCliente.textContent =
            "Editar cliente";

        botaoSalvarCliente
            .querySelector("span")
            .textContent =
                "Salvar alterações";

        clienteId.value =
            cliente.id;

        $("#nome").value =
            cliente.nome || "";

        campoCpf.value =
    formatarDocumentoPorTipo(
        cliente.cpf || "",
        tipoDocumentoCliente
    );

        campoTelefone.value =
            cliente.telefone || "";

        $("#observacoes").value =
            cliente.observacoes || "";

        atualizarEstadoDocumento();
    } else {
        tituloModalCliente.textContent =
            "Novo cliente";

        botaoSalvarCliente
            .querySelector("span")
            .textContent =
                "Salvar cliente";

        clienteId.value = "";
    }

    modalCliente.classList.add(
        "aberto"
    );

    modalCliente.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(() => {
        $("#nome").focus();
    }, 150);
}

function fecharModalCliente() {
    fecharMenuLinhaCliente();

    modalCliente.classList.remove(
        "aberto"
    );

    modalCliente.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}

/*
|--------------------------------------------------------------------------
| Modal de detalhes
|--------------------------------------------------------------------------
*/

function renderizarArquivoDetalhes(
    cliente,
    tipo
) {
    const original =
        tipo === "original";

    const nome =
        original
            ? cliente.logoOriginal
            : cliente.logoConvertida;

    const url =
        original
            ? cliente.logoOriginalUrl
            : cliente.logoConvertidaUrl;

    const possuiArquivo =
        Boolean(nome);

    const arquivoDisponivel =
        Boolean(url);

    let textoStatus =
        "Não enviado";

    let classeStatus =
        "arquivo-status-pendente";

    if (
        possuiArquivo &&
        arquivoDisponivel
    ) {
        textoStatus =
            "Disponível";

        classeStatus =
            "arquivo-status-disponivel";
    } else if (possuiArquivo) {
        textoStatus =
            "Indisponível";

        classeStatus =
            "arquivo-status-indisponivel";
    }

    const textoAbrir =
        original
            ? (
                arquivoEhPdf(nome)
                    ? "Abrir PDF"
                    : "Abrir original"
            )
            : "Baixar convertido";

    return `
        <div class="arquivo-detalhes-gerenciado">
            <div class="arquivo-detalhes-cabecalho">
                <div class="arquivo-detalhes-identificacao">
                    <span class="arquivo-detalhes-icone">
                        ${icone(
                            original
                                ? "file"
                                : "check-file"
                        )}
                    </span>

                    <div>
                        <strong
                            class="nome-arquivo-detalhes"
                            title="${escaparHtml(
                                nome ||
                                "Nenhum arquivo enviado"
                            )}"
                        >
                            ${escaparHtml(
                                nome ||
                                "Nenhum arquivo enviado"
                            )}
                        </strong>

                        <small>
                            ${
                                original
                                    ? "Logo original do cliente"
                                    : "Arquivo pronto para bordado"
                            }
                        </small>
                    </div>
                </div>

<span
    class="arquivo-status ${classeStatus}"
>
    <span class="arquivo-status-texto">
        ${textoStatus}
    </span>
</span>
            </div>

            ${
                possuiArquivo &&
                !arquivoDisponivel
                    ? `
                        <div class="arquivo-aviso-indisponivel">
                            ${icone("alert")}

                            <span>
                                O registro existe, mas o arquivo
                                físico não foi encontrado.
                            </span>
                        </div>
                    `
                    : ""
            }

            <div class="arquivo-detalhes-acoes">
                ${
                    arquivoDisponivel
                        ? criarLinkArquivo(
                            url,
                            nome,
                            textoAbrir,
                            !original
                        )
                        : ""
                }

                <button
                    class="botao botao-secundario"
                    data-substituir-arquivo="${tipo}"
                    data-cliente-arquivo="${escaparHtml(
                        cliente.id
                    )}"
                    type="button"
                >
                    ${icone(
                        possuiArquivo
                            ? "edit"
                            : "plus"
                    )}

                    <span>
                        ${
                            possuiArquivo
                                ? "Substituir"
                                : "Adicionar arquivo"
                        }
                    </span>
                </button>

                ${
                    possuiArquivo
                        ? `
                            <button
                                class="botao botao-remover-arquivo"
                                data-remover-arquivo="${tipo}"
                                data-cliente-arquivo="${escaparHtml(
                                    cliente.id
                                )}"
                                type="button"
                            >
                                ${icone("trash")}

                                <span>
                                    Remover
                                </span>
                            </button>
                        `
                        : ""
                }
            </div>
        </div>
    `;
}

function abrirDetalhes(id) {
    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        return;
    }

    clienteDetalhadoId = id;

    detalhesNome.textContent =
        cliente.nome || "Cliente";

    detalhesAvatar.textContent =
        obterIniciais(
            cliente.nome
        );

    detalhesCpf.textContent =
        cliente.cpf || "—";

    detalhesTelefone.textContent =
        cliente.telefone || "—";

    detalhesLinha.textContent =
    formatarLinhasClienteDetalhes(
        cliente.linha
    );

    detalhesData.textContent =
        formatarData(
            cliente.criadoEm
        );

    detalhesObservacoes.textContent =
        cliente.observacoes ||
        "Nenhuma observação.";

    detalhesOriginal.innerHTML =
        renderizarArquivoDetalhes(
            cliente,
            "original"
        );

    detalhesConvertido.innerHTML =
        renderizarArquivoDetalhes(
            cliente,
            "convertido"
        );

    modalDetalhes.classList.add(
        "aberto"
    );

    modalDetalhes.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}

function fecharDetalhes() {
    modalDetalhes.classList.remove(
        "aberto"
    );

    modalDetalhes.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    clienteDetalhadoId = null;
}

function editarCliente(id) {

    if (
    !exigirPermissaoInterface(
        "clientes.editar",
        "Você não possui permissão para editar clientes."
    )
) {
    return;
}

    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        return;
    }

    fecharDetalhes();

    abrirModalCliente(cliente);
}

/*
|--------------------------------------------------------------------------
| Gerenciamento individual dos arquivos
|--------------------------------------------------------------------------
*/

async function removerArquivoIndividual(
    id,
    tipo,
    botao = null
) {

    if (
    !exigirPermissaoInterface(
        "arquivos.remover",
        "Você não possui permissão para remover arquivos."
    )
) {
    return;
}

    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        mostrarNotificacao(
            "Cliente não encontrado",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    const configuracoes = {
        original: {
            nome:
                cliente.logoOriginal,

            pergunta:
                `Remover a logo original de ${cliente.nome}?`,

            sucesso:
                "A logo original foi removida."
        },

        convertido: {
            nome:
                cliente.logoConvertida,

            pergunta:
                `Remover o arquivo convertido de ${cliente.nome}?`,

            sucesso:
                "O arquivo convertido foi removido."
        }
    };

    const configuracao =
        configuracoes[tipo];

    if (!configuracao) {
        mostrarNotificacao(
            "Arquivo inválido",
            "Não foi possível identificar o arquivo.",
            "erro"
        );

        return;
    }

const confirmou =
    await confirmarAcao({
        tipo:
            "perigo",

        titulo:
        tipo === "original"
        ? "Remover logo original?"
        : "Remover arquivo convertido?",

        mensagem:
            [
                configuracao.pergunta,

                configuracao.nome
                    ? `Arquivo: ${configuracao.nome}`
                    : "",

                "O cadastro do cliente será mantido."
            ]
                .filter(Boolean)
                .join("\n\n"),

        textoConfirmar:
            "Remover arquivo"
    });
    if (!confirmou) {
        return;
    }

    const textoBotao =
        botao?.querySelector(
            "span"
        );

    const textoOriginal =
        textoBotao?.textContent
            ?.trim() ||
        "Remover";

    if (botao) {
        botao.disabled = true;
    }

    if (textoBotao) {
        textoBotao.textContent =
            "Removendo...";
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/clientes/${
                    encodeURIComponent(id)
                }/arquivos/${tipo}`,

                {
                    method: "DELETE"
                }
            );

        await carregarClientesDoServidor({
            mostrarErro: false
        });

        /*
         * Mantém o modal aberto com
         * os dados atualizados.
         */
        abrirDetalhes(id);

        mostrarNotificacao(
            "Arquivo removido",
            resposta.mensagem ||
            configuracao.sucesso
        );
    } catch (erro) {
        if (botao) {
            botao.disabled = false;
        }

        if (textoBotao) {
            textoBotao.textContent =
                textoOriginal;
        }

        mostrarNotificacao(
            "Não foi possível remover",
            erro.message,
            "erro"
        );
    }
}

function substituirArquivoIndividual(
    id,
    tipo
) {
    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        mostrarNotificacao(
            "Cliente não encontrado",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    fecharDetalhes();

    abrirModalCliente(
        cliente
    );

    const campoArquivo =
        tipo === "original"
            ? campoLogoOriginal
            : campoLogoConvertida;

    campoArquivo?.click();
}

/*
|--------------------------------------------------------------------------
| Busca
|--------------------------------------------------------------------------
*/

function atualizarFiltro(
    valor,
    abrirClientes = false
) {
    filtroAtual =
        String(valor ?? "");

    if (
        buscaGlobal &&
        buscaGlobal.value !== filtroAtual
    ) {
        buscaGlobal.value =
            filtroAtual;
    }

    if (
        buscaClientes &&
        buscaClientes.value !== filtroAtual
    ) {
        buscaClientes.value =
            filtroAtual;
    }

    if (
        abrirClientes &&
        filtroAtual.trim()
    ) {
        navegarPara(
            "clientes"
        );

        return;
    }

    renderizarClientes();
}

function filtrarClientes() {
    const busca =
        normalizarTexto(
            filtroAtual
        );

    let lista =
        clientes.filter(
            cliente => {
                /*
                 * A pesquisa da seção Clientes
                 * considera somente nome e CPF.
                 */
                const correspondeBusca =
                    !busca ||
                    [
                        cliente.nome,
                        cliente.cpf
                    ].some(
                        campo =>
                            normalizarTexto(
                                campo
                            ).includes(
                                busca
                            )
                    );

                if (!correspondeBusca) {
                    return false;
                }

                const possuiOriginal =
                    Boolean(
                        cliente.logoOriginal
                    );

                const possuiConvertido =
                    Boolean(
                        cliente.logoConvertida
                    );

                switch (
                    statusClienteAtual
                ) {
                    case "convertidos":
                        return possuiConvertido;

                    case "pendentes":
                        return !possuiConvertido;

                    case "com-original":
                        return possuiOriginal;

                    case "sem-arquivos":
                        return (
                            !possuiOriginal &&
                            !possuiConvertido
                        );

                    default:
                        return true;
                }
            }
        );

    lista =
        [...lista].sort(
            (
                clienteA,
                clienteB
            ) => {
                switch (
                    ordenacaoClienteAtual
                ) {
                    case "antigos":
                        return (
                            new Date(
                                clienteA.criadoEm ||
                                0
                            ) -
                            new Date(
                                clienteB.criadoEm ||
                                0
                            )
                        );

                    case "nome-az":
                        return String(
                            clienteA.nome ||
                            ""
                        ).localeCompare(
                            String(
                                clienteB.nome ||
                                ""
                            ),
                            "pt-BR"
                        );

                    case "nome-za":
                        return String(
                            clienteB.nome ||
                            ""
                        ).localeCompare(
                            String(
                                clienteA.nome ||
                                ""
                            ),
                            "pt-BR"
                        );

                    case "recentes":
                    default:
                        return (
                            new Date(
                                clienteB.criadoEm ||
                                0
                            ) -
                            new Date(
                                clienteA.criadoEm ||
                                0
                            )
                        );
                }
            }
        );

    return lista;
}

/*
|--------------------------------------------------------------------------
| Exportação dos clientes para CSV
|--------------------------------------------------------------------------
*/

function escaparCampoCsv(
    valor
) {
    let texto =
        String(
            valor ?? ""
        )
            .replace(
                /\r?\n/g,
                " "
            )
            .trim();

    /*
     * Evita que programas de planilha
     * interpretem o conteúdo como fórmula.
     */
    if (
        /^[=+\-@]/.test(
            texto
        )
    ) {
        texto =
            `'${texto}`;
    }

    return `"${texto.replace(
        /"/g,
        '""'
    )}"`;
}

function formatarDataCsv(
    valor
) {
    if (!valor) {
        return "";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    ).format(data);
}

function obterStatusClienteCsv(
    cliente
) {
    if (
        cliente.logoConvertida
    ) {
        return "Convertido";
    }

    if (
        cliente.logoOriginal
    ) {
        return "Aguardando conversão";
    }

    return "Sem arquivos";
}

function exportarClientesCsv() {
    const lista =
        filtrarClientes();

    if (!lista.length) {
        mostrarNotificacao(
            "Nenhum cliente para exportar",
            "Altere os filtros ou cadastre um cliente.",
            "aviso"
        );

        return;
    }

    const cabecalho = [
        "Nome",
        "CPF",
        "Telefone",
        "Linha",
        "Logo original",
        "Arquivo convertido",
        "Status",
        "Data do cadastro"
    ]
        .map(
            escaparCampoCsv
        )
        .join(";");

    const linhas =
        lista.map(
            cliente =>
                [
                    cliente.nome,
                    cliente.cpf,
                    cliente.telefone,
                    cliente.linha,
                    cliente.logoOriginal ||
                        "Não enviado",
                    cliente.logoConvertida ||
                        "Não enviado",
                    obterStatusClienteCsv(
                        cliente
                    ),
                    formatarDataCsv(
                        cliente.criadoEm
                    )
                ]
                    .map(
                        escaparCampoCsv
                    )
                    .join(";")
        );

    /*
     * O BOM ajuda o Excel a reconhecer
     * corretamente acentos e caracteres
     * da língua portuguesa.
     */
    const conteudo =
        "\uFEFF" +
        [
            cabecalho,
            ...linhas
        ].join("\r\n");

    const arquivo =
        new Blob(
            [conteudo],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(
            arquivo
        );

    const link =
        document.createElement(
            "a"
        );

    const dataAtual =
        new Date()
            .toISOString()
            .slice(0, 10);

    link.href =
        url;

    link.download =
        `clientes-${dataAtual}.csv`;

    document.body.appendChild(
        link
    );

    link.click();
    link.remove();

    setTimeout(
        () => {
            URL.revokeObjectURL(
                url
            );
        },
        1000
    );

    mostrarNotificacao(
        "Lista exportada",
        `${lista.length} ${
            lista.length === 1
                ? "cliente foi exportado"
                : "clientes foram exportados"
        } para CSV.`
    );
}

/*
|--------------------------------------------------------------------------
| Resumo
|--------------------------------------------------------------------------
*/

function atualizarResumo() {
    const seteDiasAtras =
        new Date();

    seteDiasAtras.setDate(
        seteDiasAtras.getDate() - 7
    );

    totalClientes.textContent =
        clientes.length;

    totalConvertidos.textContent =
        clientes.filter(
            cliente =>
                cliente.logoConvertidaUrl
        ).length;

    totalRecentes.textContent =
        clientes.filter(
            cliente => {
                const data =
                    new Date(
                        cliente.criadoEm
                    );

                return (
                    !Number.isNaN(
                        data.getTime()
                    ) &&
                    data >= seteDiasAtras
                );
            }
        ).length;

    totalConfiguracoes.textContent =
        clientes.length;
}

/*
|--------------------------------------------------------------------------
| Estado de carregamento
|--------------------------------------------------------------------------
*/

function htmlCarregando() {
    return `
        <div class="estado-vazio compacto">
            <div class="estado-vazio-icone">
                ${icone("clock")}
            </div>

            <p>
                Carregando dados do servidor...
            </p>

            <small>
                Aguarde alguns instantes.
            </small>
        </div>
    `;
}

/*
|--------------------------------------------------------------------------
| Clientes recentes
|--------------------------------------------------------------------------
*/

function renderizarRecentes() {
    if (carregandoClientes) {
        listaRecentes.innerHTML =
            htmlCarregando();

        return;
    }

    const recentes =
        [...clientes]
            .sort(
                (a, b) =>
                    new Date(
                        b.criadoEm || 0
                    ) -
                    new Date(
                        a.criadoEm || 0
                    )
            )
            .slice(0, 5);

    if (!recentes.length) {
        listaRecentes.innerHTML = `
            <div class="estado-vazio compacto">
                <div class="estado-vazio-icone">
                    ${icone("users")}
                </div>

                <p>
                    Nenhum cliente cadastrado
                </p>

                <small>
                    Cadastre o primeiro cliente
                    para começar a organizar
                    seus arquivos.
                </small>
            </div>
        `;

        return;
    }

    listaRecentes.innerHTML =
        recentes
            .map(
                cliente => `
                    <article class="cliente-recente">
                        <div class="avatar-cliente">
                            ${escaparHtml(
                                obterIniciais(
                                    cliente.nome
                                )
                            )}
                        </div>

                        <div>
                            <strong>
                                ${escaparHtml(
                                    cliente.nome
                                )}
                            </strong>

                            <span>
                                ${escaparHtml(
                                    cliente.cpf
                                )}
                                ·
                                ${escaparHtml(
                                    cliente.telefone
                                )}
                            </span>
                        </div>

                        <div class="status">
                            ${
                                cliente.logoConvertidaUrl
                                    ? "Convertido"
                                    : "Pendente"
                            }
                        </div>
                    </article>
                `
            )
            .join("");
}

/*
|--------------------------------------------------------------------------
| Tabela de clientes
|--------------------------------------------------------------------------
*/

function renderizarClientes() {
    const podeVerDadosPessoais =
        possuiPermissaoSistema(
            "clientes.dados_pessoais"
        );

    const podeVisualizarDetalhes =
        possuiPermissaoSistema(
            "clientes.dados_pessoais"
        );

    const podeEditar =
        possuiPermissaoSistema(
            "clientes.editar"
        );

    const podeExcluir =
        possuiPermissaoSistema(
            "clientes.excluir"
        );

    const podeBaixarArquivos =
        possuiPermissaoSistema(
            "arquivos.baixar"
        );

    /*
     * Sempre aparecem:
     * Cliente, CPF e Ações.
     *
     * Telefone e linha dependem dos
     * dados pessoais.
     *
     * Arquivo depende também da
     * permissão para baixar.
     */
const totalColunasVisiveis =
    2 +
    (
        podeVerDadosPessoais
            ? 2
            : 0
    ) +
    (
        podeVerDadosPessoais &&
        podeBaixarArquivos
            ? 1
            : 0
    );

    if (carregandoClientes) {
        quantidadeResultados.textContent =
            "Carregando...";

        corpoTabelaClientes.innerHTML = `
            <tr>
                <td colspan="${totalColunasVisiveis}">
                    ${htmlCarregando()}
                </td>
            </tr>
        `;

        return;
    }

    const lista =
        filtrarClientes();

    quantidadeResultados.textContent =
        `${lista.length} ${
            lista.length === 1
                ? "resultado"
                : "resultados"
        }`;

    if (!lista.length) {
        corpoTabelaClientes.innerHTML = `
            <tr>
                <td colspan="${totalColunasVisiveis}">
                    <div class="estado-vazio">
                        <div class="estado-vazio-icone">
                            ${icone("search")}
                        </div>

                        <p>
                            Nenhum cliente encontrado
                        </p>

                        <small>
                            Pesquise pelo nome, CPF ou CNPJ do cliente.
                        </small>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    corpoTabelaClientes.innerHTML =
        lista
            .map(
                cliente => `
                    <tr>
                        <td class="coluna-cliente-clientes">
                            <div class="tabela-cliente">
                                <div class="avatar-cliente">
                                    ${escaparHtml(
                                        obterIniciais(
                                            cliente.nome
                                        )
                                    )}
                                </div>

                                <div class="tabela-cliente-informacoes">
    <strong>
        ${escaparHtml(
            cliente.nome ||
            "Cliente"
        )}
    </strong>

    <span class="cpf-cliente-tabela">
        ${escaparHtml(
            cliente.cpf ||
                "CPF/CNPJ não informado"
        )}
    </span>

    ${
        podeVerDadosPessoais
            ? `
                <small class="data-cliente-tabela">
                    Cadastrado em
                    ${formatarData(
                        cliente.criadoEm
                    )}
                </small>
            `
            : ""
    }
</div>
                            </div>
                        </td>

                        <td
                            class="coluna-telefone-clientes"
                            data-permissao-exigida="clientes.dados_pessoais"
                        >
                            ${escaparHtml(
                                cliente.telefone ||
                                "—"
                            )}
                        </td>

                        <td
                            class="coluna-linha-clientes"
                            data-permissao-exigida="clientes.dados_pessoais"
                        >
                            ${escaparHtml(
    formatarResumoLinhasCliente(
        cliente.linha
    )
)}
                        </td>

                        <td
                            class="coluna-arquivo-clientes"
                            data-permissao-exigida="clientes.dados_pessoais,arquivos.baixar"
                        >
                            ${
                                podeBaixarArquivos &&
                                cliente.logoConvertidaUrl
                                    ? `
                                        <a
                                            class="etiqueta-arquivo etiqueta-link"
                                            href="${escaparHtml(
                                                cliente.logoConvertidaUrl
                                            )}"
                                            target="_blank"
                                            rel="noopener"
                                            title="Baixar arquivo convertido"
                                        >
                                            ${escaparHtml(
                                                cliente.logoConvertida ||
                                                "Baixar arquivo"
                                            )}
                                        </a>
                                    `
                                    : `
                                        <span class="etiqueta-arquivo">
                                            Não enviado
                                        </span>
                                    `
                            }
                        </td>

                        <td class="coluna-acoes-clientes">
                            <div class="acoes-cliente">
                                ${
                                    podeVisualizarDetalhes
                                        ? `
                                            <button
                                                class="botao-acao"
                                                data-visualizar="${escaparHtml(
                                                    cliente.id
                                                )}"
                                                type="button"
                                                title="Visualizar cliente"
                                                aria-label="Visualizar cliente"
                                            >
                                                ${icone("eye")}
                                            </button>
                                        `
                                        : ""
                                }

                                ${
                                    podeEditar
                                        ? `
                                            <button
                                                class="botao-acao"
                                                data-editar="${escaparHtml(
                                                    cliente.id
                                                )}"
                                                type="button"
                                                title="Editar cliente"
                                                aria-label="Editar cliente"
                                            >
                                                ${icone("edit")}
                                            </button>
                                        `
                                        : ""
                                }

                                ${
                                    podeExcluir
                                        ? `
                                            <button
                                                class="botao-acao perigo"
                                                data-excluir="${escaparHtml(
                                                    cliente.id
                                                )}"
                                                type="button"
                                                title="Excluir cliente"
                                                aria-label="Excluir cliente"
                                            >
                                                ${icone("trash")}
                                            </button>
                                        `
                                        : ""
                                }
                            </div>
                        </td>
                    </tr>
                `
            )
            .join("");

    aplicarPermissoesDeclarativas(
        corpoTabelaClientes
    );
}

/*
|--------------------------------------------------------------------------
| Visualização dos arquivos
|--------------------------------------------------------------------------
*/

function criarPreviewOriginal(
    cliente
) {
    if (
        cliente.logoOriginalUrl &&
        arquivoEhImagem(
            cliente.logoOriginal
        )
    ) {
        return `
            <a
                class="preview-logo"
                href="${escaparHtml(
                    cliente.logoOriginalUrl
                )}"
                target="_blank"
                rel="noopener"
                title="Abrir logo original"
            >
                <img
                    src="${escaparHtml(
                        cliente.logoOriginalUrl
                    )}"
                    alt="Logo original de ${escaparHtml(
                        cliente.nome
                    )}"
                    loading="lazy"
                >
            </a>
        `;
    }

    if (
        cliente.logoOriginalUrl &&
        arquivoEhPdf(
            cliente.logoOriginal
        )
    ) {
        return `
            <a
                class="preview-logo preview-documento"
                href="${escaparHtml(
                    cliente.logoOriginalUrl
                )}"
                target="_blank"
                rel="noopener"
                title="Abrir PDF"
            >
                ${icone("file")}

                <span>PDF</span>
            </a>
        `;
    }

    return `
        <div class="preview-logo preview-documento">
            ${icone("file")}

            <span>
                ${
                    cliente.logoOriginal
                        ? obterExtensao(
                            cliente.logoOriginal
                        )
                            .replace(".", "")
                            .toUpperCase()
                        : "SEM ARQUIVO"
                }
            </span>
        </div>
    `;
}

function renderizarArquivos() {
    if (carregandoClientes) {
        gradeArquivos.innerHTML =
            htmlCarregando();

        return;
    }

    const lista =
        clientes.filter(
            cliente =>
                cliente.logoOriginal ||
                cliente.logoConvertida
        );

    if (!lista.length) {
        gradeArquivos.innerHTML = `
            <div
                class="estado-vazio"
            >
                <div class="estado-vazio-icone">
                    ${icone("folder")}
                </div>

                <p>
                    Nenhum arquivo cadastrado
                </p>

                <small>
                    Envie a logo original ou o
                    arquivo convertido durante
                    o cadastro do cliente.
                </small>
            </div>
        `;

        return;
    }

    gradeArquivos.innerHTML =
        lista
            .map(
                cliente => `
                    <article class="card-arquivo card-arquivo-completo">
                        ${criarPreviewOriginal(
                            cliente
                        )}

                        <div class="card-arquivo-conteudo">
                            <div class="card-arquivo-topo">
                                <div class="card-arquivo-icone">
                                    ${icone("folder")}
                                </div>

                                <span class="status">
                                    ${
                                        cliente.logoConvertidaUrl
                                            ? "Pronto"
                                            : "Pendente"
                                    }
                                </span>
                            </div>

                            <h3>
                                ${escaparHtml(
                                    cliente.nome
                                )}
                            </h3>

                            <p>
                                ${escaparHtml(
                                    cliente.cpf
                                )}
                                ·
                                ${escaparHtml(
                                    cliente.linha
                                )}
                            </p>

                            <div class="card-arquivo-dados">
                                <div>
                                    <span>
                                        Original
                                    </span>

                                    <strong title="${escaparHtml(
                                        cliente.logoOriginal ||
                                        "Não enviado"
                                    )}">
                                        ${escaparHtml(
                                            cliente.logoOriginal ||
                                            "Não enviado"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Convertido
                                    </span>

                                    <strong title="${escaparHtml(
                                        cliente.logoConvertida ||
                                        "Não enviado"
                                    )}">
                                        ${escaparHtml(
                                            cliente.logoConvertida ||
                                            "Não enviado"
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div class="acoes-arquivo">
                                ${
                                    cliente.logoOriginalUrl
                                        ? criarLinkArquivo(
                                            cliente.logoOriginalUrl,
                                            cliente.logoOriginal,
                                            arquivoEhPdf(
                                                cliente.logoOriginal
                                            )
                                                ? "Abrir PDF"
                                                : "Abrir original"
                                        )
                                        : ""
                                }

                                ${
                                    cliente.logoConvertidaUrl
                                        ? criarLinkArquivo(
                                            cliente.logoConvertidaUrl,
                                            cliente.logoConvertida,
                                            "Baixar convertido",
                                            true
                                        )
                                        : ""
                                }
                            </div>
                        </div>
                    </article>
                `
            )
            .join("");
}

function renderizarTudo() {
    atualizarResumo();
    renderizarRecentes();
    renderizarClientes();
    renderizarArquivos();
}

/*
|--------------------------------------------------------------------------
| Cadastro e edição com upload real
|--------------------------------------------------------------------------
*/

async function cadastrarOuEditarCliente(
    evento
) {
    evento.preventDefault();

    const clienteEmEdicao =
    Boolean(
        String(
            clienteId
                ?.value ||
            ""
        ).trim()
    );

const permissaoNecessaria =
    clienteEmEdicao
        ? "clientes.editar"
        : "clientes.criar";

if (
    !exigirPermissaoInterface(
        permissaoNecessaria,

        clienteEmEdicao
            ? "Você não possui permissão para editar clientes."
            : "Você não possui permissão para cadastrar clientes."
    )
) {
    return;
}

    if (
        !formularioCliente.checkValidity()
    ) {
        formularioCliente
            .reportValidity();

        return;
    }

    const id =
        String(
            clienteId.value || ""
        ).trim();

    const documento =
    campoCpf.value.trim();

const rotuloDocumento =
    obterRotuloDocumentoAtual();

if (
    !validarDocumentoAtual(
        documento
    )
) {
    campoCpf.classList.add(
        "invalido"
    );

    mensagemCpf.textContent =
        `Este ${rotuloDocumento} não é válido.`;

    mensagemCpf.classList.remove(
        "valido"
    );

    mensagemCpf.classList.add(
        "erro"
    );

    campoCpf.focus();

    mostrarNotificacao(
        `${rotuloDocumento} inválido`,
        `Revise o ${rotuloDocumento} antes de salvar.`,
        "erro"
    );

    return;
}

    const documentoNormalizado =
    normalizarDocumentoPorTipo(
        documento
    );

const duplicado =
    clientes.some(
        cliente => {
            const tipoCliente =
                identificarTipoPessoaPorDocumento(
                    cliente.cpf
                );

            return (
                normalizarDocumentoPorTipo(
                    cliente.cpf,
                    tipoCliente
                ) ===
                    documentoNormalizado &&

                cliente.id !== id
            );
        }
    );

if (duplicado) {
    campoCpf.classList.add(
        "invalido"
    );

    mensagemCpf.textContent =
        `Este ${rotuloDocumento} já está cadastrado.`;

    mensagemCpf.classList.remove(
        "valido"
    );

    mensagemCpf.classList.add(
        "erro"
    );

    campoCpf.focus();

    mostrarNotificacao(
        `${rotuloDocumento} já cadastrado`,
        "Procure o cadastro existente.",
        "erro"
    );

    return;
}

    try {
        validarArquivosSelecionados();
    } catch (erro) {
        mostrarNotificacao(
            "Arquivo inválido",
            erro.message,
            "erro"
        );

        return;
    }

    /*
     * FormData envia os textos e os arquivos reais.
     */
    const dadosFormulario =
        new FormData(
            formularioCliente
        );

    dadosFormulario.set(
    "cpf",
    formatarDocumentoPorTipo(
        documento
    )
);

    dadosFormulario.delete(
        "clienteId"
    );

    const textoOriginalBotao =
        botaoSalvarCliente
            .querySelector("span")
            .textContent;

    botaoSalvarCliente.disabled =
        true;

    botaoSalvarCliente
        .querySelector("span")
        .textContent =
            "Enviando arquivos...";

    try {
        const resposta =
            await requisicaoApi(
                id
                    ? `/api/clientes/${
                        encodeURIComponent(id)
                    }`
                    : "/api/clientes",

                {
                    method:
                        id
                            ? "PUT"
                            : "POST",

                    body:
                        dadosFormulario
                }
            );

        await carregarClientesDoServidor(
            {
                mostrarErro: false
            }
        );

        fecharModalCliente();

        mostrarNotificacao(
            id
                ? "Cliente atualizado"
                : "Cliente cadastrado",

            resposta.mensagem ||
            "Os dados e arquivos foram salvos."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível salvar",
            erro.message,
            "erro"
        );
    } finally {
        botaoSalvarCliente.disabled =
            false;

        botaoSalvarCliente
            .querySelector("span")
            .textContent =
                textoOriginalBotao;
    }
}

/*
|--------------------------------------------------------------------------
| Exclusão
|--------------------------------------------------------------------------
*/

async function excluirCliente(id) {

    if (
    !exigirPermissaoInterface(
        "clientes.excluir",
        "Você não possui permissão para excluir clientes."
    )
) {
    return;
}

    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        return;
    }

const confirmou =
    await confirmarAcao({
        titulo:
            "Excluir cadastro?",

        mensagem:
            `O cadastro de ${cliente.nome} e todos os arquivos vinculados serão excluídos permanentemente.`,

        textoConfirmar:
            "Excluir cliente"
    });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/clientes/${
                    encodeURIComponent(id)
                }`,

                {
                    method: "DELETE"
                }
            );

        if (
            clienteDetalhadoId === id
        ) {
            fecharDetalhes();
        }

        await carregarClientesDoServidor(
            {
                mostrarErro: false
            }
        );

        mostrarNotificacao(
            "Cadastro excluído",
            resposta.mensagem
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível excluir",
            erro.message,
            "erro"
        );
    }
}

async function apagarTudo() {

    if (
    !exigirPermissaoInterface(
        "clientes.excluir",
        "Você não possui permissão para apagar os dados dos clientes."
    )
) {
    return;
}

    if (!clientes.length) {
        mostrarNotificacao(
            "Nada para apagar",
            "Não existem clientes cadastrados.",
            "erro"
        );

        return;
    }

const confirmou =
    await confirmarAcao({
        tipo:
            "perigo",

        titulo:
            "Apagar todos os dados?",

        mensagem:
            [
                `${clientes.length} ${
                    clientes.length === 1
                        ? "cliente será excluído"
                        : "clientes serão excluídos"
                }, junto com todos os arquivos vinculados.`,

                "Esta ação não poderá ser desfeita."
            ].join("\n\n"),

        textoConfirmar:
            "Apagar tudo"
    });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                "/api/clientes",
                {
                    method: "DELETE"
                }
            );

        fecharDetalhes();

        await carregarClientesDoServidor(
            {
                mostrarErro: false
            }
        );

        mostrarNotificacao(
            "Dados apagados",
            resposta.mensagem
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível apagar",
            erro.message,
            "erro"
        );
    }
}

/*
|--------------------------------------------------------------------------
| Backup e restauração
|--------------------------------------------------------------------------
*/

function formatarDataHoraBackup(
    valor,
    mensagemVazia
) {
    if (!valor) {
        return mensagemVazia;
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "Data indisponível";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(data);
}

async function carregarStatusBackup(
    {
        mostrarErro = false
    } = {}
) {
    if (
        !ultimoBackup ||
        !ultimoRestauro
    ) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                "/api/backup/status"
            );

        ultimoBackup.textContent =
            formatarDataHoraBackup(
                resposta.backup
                    ?.ultimoBackup,

                "Nenhum backup realizado"
            );

        ultimoRestauro.textContent =
            formatarDataHoraBackup(
                resposta.backup
                    ?.ultimoRestauro,

                "Nenhuma restauração realizada"
            );
    } catch (erro) {
        ultimoBackup.textContent =
            "Não foi possível consultar";

        ultimoRestauro.textContent =
            "Não foi possível consultar";

        if (mostrarErro) {
            mostrarNotificacao(
                "Status indisponível",
                erro.message,
                "erro"
            );
        }
    }
}

function extrairNomeBackup(
    resposta
) {
    const disposicao =
        resposta.headers.get(
            "content-disposition"
        ) || "";

    const nomeUtf8 =
        disposicao.match(
            /filename\*=UTF-8''([^;]+)/i
        );

    if (nomeUtf8?.[1]) {
        try {
            return decodeURIComponent(
                nomeUtf8[1]
            );
        } catch {
            return nomeUtf8[1];
        }
    }

    const nomeNormal =
        disposicao.match(
            /filename="?([^";]+)"?/i
        );

    if (nomeNormal?.[1]) {
        return nomeNormal[1];
    }

    const agora =
        new Date();

    const data =
        agora
            .toISOString()
            .replace(
                /[:.]/g,
                "-"
            );

    return (
        `backup-bordado-${data}.bordado`
    );
}

async function criarBackupSistema() {

    if (
    !exigirPermissaoInterface(
        "backup.criar",
        "Você não possui permissão para criar backups."
    )
) {
    return;
}

    if (!botaoCriarBackup) {
        return;
    }

    const texto =
        botaoCriarBackup
            .querySelector("span");

    const textoOriginal =
        texto?.textContent ||
        "Criar e baixar backup";

    botaoCriarBackup.disabled =
        true;

    botaoCriarBackup.classList.add(
        "backup-processando"
    );

    if (texto) {
        texto.textContent =
            "Preparando backup...";
    }

    try {
        let resposta;

        try {
            resposta =
                await fetch(
                    "/api/backup"
                );
        } catch {
            throw new Error(
                "Não foi possível conectar ao servidor."
            );
        }

        if (!resposta.ok) {
            let erroServidor = null;

            try {
                erroServidor =
                    await resposta.json();
            } catch {
                erroServidor = null;
            }

            throw new Error(
                erroServidor?.mensagem ||
                "Não foi possível criar o backup."
            );
        }

        const arquivo =
            await resposta.blob();

        const nomeArquivo =
            extrairNomeBackup(
                resposta
            );

        const urlTemporaria =
            URL.createObjectURL(
                arquivo
            );

        const link =
            document.createElement("a");

        link.href =
            urlTemporaria;

        link.download =
            nomeArquivo;

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(
                urlTemporaria
            );
        }, 1000);

        await carregarStatusBackup();

        mostrarNotificacao(
            "Backup criado",
            `${nomeArquivo} foi baixado com sucesso.`
        );
    } catch (erro) {
        mostrarNotificacao(
            "Erro ao criar backup",
            erro.message,
            "erro"
        );
    } finally {
        botaoCriarBackup.disabled =
            false;

        botaoCriarBackup.classList.remove(
            "backup-processando"
        );

        if (texto) {
            texto.textContent =
                textoOriginal;
        }
    }
}

function limparBackupSelecionado() {
    if (!inputBackup) {
        return;
    }

    inputBackup.value = "";

    if (nomeBackupSelecionado) {
        nomeBackupSelecionado
            .textContent =
                "Nenhum arquivo selecionado";
    }

    if (botaoRestaurarBackup) {
        botaoRestaurarBackup.disabled =
            true;
    }
}

function atualizarBackupSelecionado() {
    const arquivo =
        inputBackup
            ?.files?.[0];

    if (!arquivo) {
        limparBackupSelecionado();
        return;
    }

    const nome =
        arquivo.name.toLowerCase();

    if (
        !nome.endsWith(
            ".bordado"
        )
    ) {
        mostrarNotificacao(
            "Arquivo inválido",
            "Selecione um arquivo com a extensão .bordado.",
            "erro"
        );

        limparBackupSelecionado();

        return;
    }

    const limite =
        450 * 1024 * 1024;

    if (
        arquivo.size > limite
    ) {
        mostrarNotificacao(
            "Arquivo muito grande",
            "O backup deve ter no máximo 450 MB.",
            "erro"
        );

        limparBackupSelecionado();

        return;
    }

    nomeBackupSelecionado
        .textContent =
            arquivo.name;

    botaoRestaurarBackup.disabled =
        false;
}

async function restaurarBackupSistema() {

    if (
    !exigirPermissaoInterface(
        "backup.restaurar",
        "Você não possui permissão para restaurar backups."
    )
) {
    return;
}

    const arquivo =
        inputBackup
            ?.files?.[0];

    if (!arquivo) {
        mostrarNotificacao(
            "Selecione um backup",
            "Escolha um arquivo .bordado antes de restaurar.",
            "erro"
        );

        return;
    }

const confirmou =
    await confirmarAcao({
        tipo:
            "aviso",

        icone:
            "file",

        titulo:
            "Restaurar backup?",

        mensagem:
            [
                `Arquivo selecionado: ${arquivo.name}`,

                "Todos os clientes, ordens e arquivos atuais serão substituídos pelos dados do backup.",

                "Esta ação não poderá ser desfeita."
            ].join("\n\n"),

        textoConfirmar:
            "Restaurar backup"
    });

    if (!confirmou) {
        return;
    }

    const texto =
        botaoRestaurarBackup
            .querySelector("span");

    const textoOriginal =
        texto?.textContent ||
        "Restaurar backup selecionado";

    botaoRestaurarBackup.disabled =
        true;

    botaoSelecionarBackup.disabled =
        true;

    botaoCriarBackup.disabled =
        true;

    botaoRestaurarBackup
        .classList.add(
            "backup-processando"
        );

    if (texto) {
        texto.textContent =
            "Restaurando dados...";
    }

    const formulario =
        new FormData();

    formulario.append(
        "backup",
        arquivo
    );

    try {
        const resposta =
            await requisicaoApi(
                "/api/backup/restaurar",
                {
                    method: "POST",
                    body: formulario
                }
            );

        limparBackupSelecionado();

        await carregarClientesDoServidor(
            {
                mostrarErro: false
            }
        );

        await carregarStatusBackup();

        const clientesRestaurados =
            resposta.restauracao
                ?.clientes ?? 0;

        const arquivosRestaurados =
            resposta.restauracao
                ?.arquivos ?? 0;

        mostrarNotificacao(
            "Backup restaurado",
            `${clientesRestaurados} clientes e ${arquivosRestaurados} arquivos foram recuperados.`
        );
    } catch (erro) {
        mostrarNotificacao(
            "Erro ao restaurar",
            erro.message,
            "erro"
        );
    } finally {
        botaoSelecionarBackup.disabled =
            false;

        botaoCriarBackup.disabled =
            false;

        botaoRestaurarBackup
            .classList.remove(
                "backup-processando"
            );

        botaoRestaurarBackup.disabled =
            !inputBackup
                ?.files?.[0];

        if (texto) {
            texto.textContent =
                textoOriginal;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Sessão do usuário
|--------------------------------------------------------------------------
*/

function obterIniciaisUsuario(
    nome
) {
    return String(nome || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            parte =>
                parte[0]
                    ?.toUpperCase()
        )
        .join("") || "AD";
}

function formatarPerfilUsuario(
    perfil
) {
    const perfis = {
        administrador:
            "Administrador",

        operador:
            "Operador"
    };

    return (
        perfis[perfil] ||
        "Usuário"
    );
}

function aplicarUsuarioNaInterface(
    usuario
) {
    if (!usuario) {
        return;
    }

    if (nomeUsuarioLogado) {
        nomeUsuarioLogado.textContent =
            usuario.nome ||
            "Administrador";
    }

    if (perfilUsuarioLogado) {
        perfilUsuarioLogado.textContent =
            formatarPerfilUsuario(
                usuario.perfil
            );
    }

    if (iniciaisUsuarioLogado) {
        iniciaisUsuarioLogado.textContent =
            obterIniciaisUsuario(
                usuario.nome
            );
    }

    /*
     * Preenche os campos da área
     * Minha conta.
     */
    if (nomeConta) {
        nomeConta.value =
            usuario.nome || "";
    }

    if (usuarioConta) {
        usuarioConta.value =
            usuario.usuario || "";
    }
}

async function carregarUsuarioAtual() {
    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/status"
            );

        if (
            !resposta.autenticado
        ) {
            window.location.replace(
                "/login.html"
            );

            return false;
        }

        usuarioAtualSistema =
            resposta.usuario ||
            null;

        permissoesUsuarioSistema =
            usuarioAtualSistema
                ?.permissoes &&
            typeof usuarioAtualSistema
                .permissoes ===
                "object"

                ? {
                    ...usuarioAtualSistema
                        .permissoes
                }

                : Object.create(
                    null
                );

        window.usuarioAtualSistema =
            usuarioAtualSistema;

        aplicarUsuarioNaInterface(
            usuarioAtualSistema
        );

        aplicarPermissoesNaInterface();

        return true;
    } catch (erro) {
        console.error(
            "Falha ao carregar usuário:",
            erro
        );

        return false;
    }
}

/*
|--------------------------------------------------------------------------
| Atualização dos dados da conta
|--------------------------------------------------------------------------
*/

async function salvarPerfilConta(
    evento
) {
    evento.preventDefault();

    if (
        !formularioPerfil ||
        !nomeConta ||
        !usuarioConta ||
        !botaoSalvarPerfil
    ) {
        return;
    }

    if (
        !formularioPerfil
            .checkValidity()
    ) {
        formularioPerfil
            .reportValidity();

        return;
    }

    const nome =
        nomeConta.value.trim();

    const usuario =
        usuarioConta.value
            .trim()
            .toLowerCase();

    const formatoUsuario =
        /^[a-z0-9._-]+$/;

    if (
        !formatoUsuario.test(
            usuario
        )
    ) {
        mostrarNotificacao(
            "Usuário inválido",
            "Use somente letras sem acento, números, ponto, hífen ou underline.",
            "erro"
        );

        usuarioConta.focus();

        return;
    }

    const textoBotao =
        botaoSalvarPerfil
            .querySelector("span");

    const textoOriginal =
        textoBotao?.textContent ||
        "Salvar dados da conta";

    botaoSalvarPerfil.disabled =
        true;

    if (textoBotao) {
        textoBotao.textContent =
            "Salvando...";
    }

    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/perfil",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            nome,
                            usuario
                        })
                }
            );

        aplicarUsuarioNaInterface(
            resposta.usuario
        );

        mostrarNotificacao(
            "Conta atualizada",
            resposta.mensagem ||
            "Os dados da conta foram atualizados."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível atualizar",
            erro.message,
            "erro"
        );
    } finally {
        botaoSalvarPerfil.disabled =
            false;

        if (textoBotao) {
            textoBotao.textContent =
                textoOriginal;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Alteração da senha da conta
|--------------------------------------------------------------------------
*/

async function salvarNovaSenha(
    evento
) {
    evento.preventDefault();

    if (
        !formularioSenha ||
        !senhaAtualConta ||
        !novaSenhaConta ||
        !confirmarNovaSenhaConta ||
        !botaoSalvarSenha
    ) {
        return;
    }

    if (
        !formularioSenha
            .checkValidity()
    ) {
        formularioSenha
            .reportValidity();

        return;
    }

    const senhaAtual =
        senhaAtualConta.value;

    const novaSenha =
        novaSenhaConta.value;

    const confirmarNovaSenha =
        confirmarNovaSenhaConta.value;

    if (
        novaSenha !==
        confirmarNovaSenha
    ) {
        mostrarNotificacao(
            "Senhas diferentes",
            "A confirmação não corresponde à nova senha.",
            "erro"
        );

        confirmarNovaSenhaConta.focus();

        return;
    }

    if (
        novaSenha === senhaAtual
    ) {
        mostrarNotificacao(
            "Escolha outra senha",
            "A nova senha deve ser diferente da senha atual.",
            "erro"
        );

        novaSenhaConta.focus();

        return;
    }

    const possuiLetra =
        /[a-zA-Z]/.test(
            novaSenha
        );

    const possuiNumero =
        /\d/.test(
            novaSenha
        );

    if (
        novaSenha.length < 10 ||
        !possuiLetra ||
        !possuiNumero
    ) {
        mostrarNotificacao(
            "Senha pouco segura",
            "Use pelo menos 10 caracteres, contendo uma letra e um número.",
            "erro"
        );

        novaSenhaConta.focus();

        return;
    }

    const textoBotao =
        botaoSalvarSenha
            .querySelector("span");

    const textoOriginal =
        textoBotao?.textContent ||
        "Alterar minha senha";

    botaoSalvarSenha.disabled =
        true;

    if (textoBotao) {
        textoBotao.textContent =
            "Alterando senha...";
    }

    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/senha",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            senhaAtual,
                            novaSenha,
                            confirmarNovaSenha
                        })
                }
            );

        formularioSenha.reset();

        aplicarUsuarioNaInterface(
            resposta.usuario
        );

        mostrarNotificacao(
            "Senha alterada",
            resposta.mensagem ||
            "Sua senha foi alterada com sucesso."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível alterar",
            erro.message,
            "erro"
        );
    } finally {
        botaoSalvarSenha.disabled =
            false;

        if (textoBotao) {
            textoBotao.textContent =
                textoOriginal;
        }
    }
}

async function sairDoSistema() {
    if (!botaoSair) {
        return;
    }

    botaoSair.disabled = true;

    try {
        await requisicaoApi(
            "/api/auth/logout",
            {
                method: "POST",
                body: JSON.stringify({})
            }
        );

        window.location.replace(
            "/login.html"
        );
    } catch (erro) {
        botaoSair.disabled = false;

        mostrarNotificacao(
            "Não foi possível sair",
            erro.message,
            "erro"
        );
    }
}

/*
|--------------------------------------------------------------------------
| Eventos
|--------------------------------------------------------------------------
*/

$$(
    `
    #menuNovoCliente,
    #botaoNovoCliente,
    #botaoCadastrarDestaque,
    #acaoNovoCliente,
    #botaoNovoClienteSecao
    `
).forEach(botao => {
    botao.addEventListener(
        "click",
        () => abrirModalCliente()
    );
});

$$(
    "[data-fechar-modal]"
).forEach(elemento => {
    elemento.addEventListener(
        "click",
        fecharModalCliente
    );
});

botaoLinhaCliente
    ?.addEventListener(
        "click",
        () => {
            if (
                menuLinhaCliente?.hidden
            ) {
                abrirMenuLinhaCliente();
            } else {
                fecharMenuLinhaCliente();
            }
        }
    );

buscaLinhaCliente
    ?.addEventListener(
        "input",
        renderizarOpcoesLinhaCliente
    );

listaLinhasCliente
    ?.addEventListener(
        "click",
        evento => {
            const opcao =
                evento.target.closest(
                    "[data-valor-linha]"
                );

            if (!opcao) {
                return;
            }

            selecionarLinhaCliente(
                decodeURIComponent(
                    opcao.dataset
                        .valorLinha
                )
            );
        }
    );

document.addEventListener(
    "click",
    evento => {
        if (
            seletorLinhaCliente &&
            !seletorLinhaCliente.contains(
                evento.target
            )
        ) {
            fecharMenuLinhaCliente();
        }
    }
);

document.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key === "Escape" &&
            menuLinhaCliente &&
            !menuLinhaCliente.hidden
        ) {
            fecharMenuLinhaCliente();
            botaoLinhaCliente?.focus();
        }
    }
);

linhasSelecionadasCliente
    ?.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-remover-linha-cliente]"
                );

            if (!botao) {
                return;
            }

            removerLinhaCliente(
                decodeURIComponent(
                    botao.dataset
                        .removerLinhaCliente
                )
            );
        }
    );

botaoLimparLinhasCliente
    ?.addEventListener(
        "click",
        limparLinhasCliente
    );

botaoConcluirLinhasCliente
    ?.addEventListener(
        "click",
        () => {
            fecharMenuLinhaCliente();

            botaoLinhaCliente
                ?.focus();
        }
    );

botaoConfirmarAcao
    ?.addEventListener(
        "click",
        () => {
            finalizarConfirmacao(
                true
            );
        }
    );

botaoCancelarConfirmacao
    ?.addEventListener(
        "click",
        () => {
            finalizarConfirmacao(
                false
            );
        }
    );

$$(
    "[data-cancelar-confirmacao]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            () => {
                finalizarConfirmacao(
                    false
                );
            }
        );
    }
);

document.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key === "Escape" &&
            modalConfirmacao
                ?.classList.contains(
                    "aberto"
                )
        ) {
            finalizarConfirmacao(
                false
            );
        }
    }
);

botaoExportarClientes
    ?.addEventListener(
        "click",
        exportarClientesCsv
    );

filtroStatusCliente
    ?.addEventListener(
        "change",
        evento => {
            statusClienteAtual =
                evento.target.value;

            renderizarClientes();
        }
    );

ordenacaoClientes
    ?.addEventListener(
        "change",
        evento => {
            ordenacaoClienteAtual =
                evento.target.value;

            renderizarClientes();
        }
    );

[
    detalhesOriginal,
    detalhesConvertido
]
    .filter(Boolean)
    .forEach(container => {
        container.addEventListener(
            "click",
            evento => {
                const botaoRemover =
                    evento.target.closest(
                        "[data-remover-arquivo]"
                    );

                const botaoSubstituir =
                    evento.target.closest(
                        "[data-substituir-arquivo]"
                    );

                if (botaoRemover) {
                    removerArquivoIndividual(
                        botaoRemover.dataset
                            .clienteArquivo,

                        botaoRemover.dataset
                            .removerArquivo,

                        botaoRemover
                    );

                    return;
                }

                if (botaoSubstituir) {
                    substituirArquivoIndividual(
                        botaoSubstituir.dataset
                            .clienteArquivo,

                        botaoSubstituir.dataset
                            .substituirArquivo
                    );
                }
            }
        );
    });

$$(
    "[data-fechar-detalhes]"
).forEach(elemento => {
    elemento.addEventListener(
        "click",
        fecharDetalhes
    );
});

$("#botaoFecharModal")
    .addEventListener(
        "click",
        fecharModalCliente
    );

$("#botaoFecharDetalhes")
    .addEventListener(
        "click",
        fecharDetalhes
    );

botaoEditarDetalhes
    .addEventListener(
        "click",
        () => {
            if (clienteDetalhadoId) {
                editarCliente(
                    clienteDetalhadoId
                );
            }
        }
    );

itensMenu.forEach(item => {
    item.addEventListener(
        "click",
        () =>
            navegarPara(
                item.dataset.secao
            )
    );
});

$$(
    "[data-ir-para]"
).forEach(botao => {
    botao.addEventListener(
        "click",
        () =>
            navegarPara(
                botao.dataset.irPara
            )
    );
});

$$(
    ".opcao-tema"
).forEach(botao => {
    botao.addEventListener(
        "click",
        () =>
            aplicarTema(
                botao.dataset.tema
            )
    );
});

botaoTema
    ?.addEventListener(
        "click",
        alternarTema
    );

botaoMenuMobile
    ?.addEventListener(
        "click",
        () => {
            const estaAberto =
                sidebar
                    ?.classList
                    .contains(
                        "aberto"
                    );

            if (estaAberto) {
                fecharMenuMobile();
                return;
            }

            abrirMenuMobile();
        }
    );

fundoMenuMobile
    ?.addEventListener(
        "click",
        fecharMenuMobile
    );

botaoSair
    ?.addEventListener(
        "click",
        sairDoSistema
);

botoesTipoPessoa
    .forEach(
        botao => {
            botao.addEventListener(
                "click",
                () => {
                    definirTipoPessoaCliente(
                        botao.dataset
                            .tipoPessoa,
                        {
                            limparCampo:
                                true
                        }
                    );

                    campoCpf.focus();
                }
            );
        }
    );

campoCpf.addEventListener(
    "input",
    evento => {
        evento.target.value =
            formatarDocumentoPorTipo(
                evento.target.value
            );

        atualizarEstadoDocumento();
    }
);

campoCpf.addEventListener(
    "blur",
    atualizarEstadoDocumento
);

campoTelefone.addEventListener(
    "input",
    evento => {
        evento.target.value =
            formatarTelefone(
                evento.target.value
            );
    }
);

campoLogoOriginal.addEventListener(
    "change",
    () => {
        const arquivo =
            campoLogoOriginal.files[0];

        if (arquivo) {
            mostrarNotificacao(
                "Logo selecionada",
                arquivo.name
            );
        }
    }
);

campoLogoConvertida.addEventListener(
    "change",
    () => {
        const arquivo =
            campoLogoConvertida.files[0];

        if (arquivo) {
            mostrarNotificacao(
                "Arquivo selecionado",
                arquivo.name
            );
        }
    }
);

buscaGlobal
    ?.addEventListener(
        "input",
        evento => {
            atualizarFiltro(
                evento.target.value,
                true
            );
        }
    );

buscaGlobal
    ?.addEventListener(
        "search",
        evento => {
            atualizarFiltro(
                evento.target.value,
                Boolean(
                    evento.target.value
                        .trim()
                )
            );
        }
    );

buscaGlobal
    ?.addEventListener(
        "keydown",
        evento => {
            if (
                evento.key !== "Enter"
            ) {
                return;
            }

            evento.preventDefault();

            atualizarFiltro(
                evento.target.value,
                true
            );
        }
    );

buscaClientes
    ?.addEventListener(
        "input",
        evento => {
            atualizarFiltro(
                evento.target.value,
                false
            );
        }
    );

formularioPerfil
    ?.addEventListener(
        "submit",
        salvarPerfilConta
    );

formularioSenha
    ?.addEventListener(
        "submit",
        salvarNovaSenha
    );

formularioCliente.addEventListener(
    "submit",
    cadastrarOuEditarCliente
);


corpoTabelaClientes.addEventListener(
    "click",
    evento => {
        const visualizar =
            evento.target.closest(
                "[data-visualizar]"
            );

        const editar =
            evento.target.closest(
                "[data-editar]"
            );

        const excluir =
            evento.target.closest(
                "[data-excluir]"
            );

        if (visualizar) {
            abrirDetalhes(
                visualizar.dataset
                    .visualizar
            );

            return;
        }

        if (editar) {
            editarCliente(
                editar.dataset.editar
            );

            return;
        }

        if (excluir) {
            excluirCliente(
                excluir.dataset.excluir
            );
        }
    }
);

$("#botaoApagarTudo")
    .addEventListener(
        "click",
        apagarTudo
    );

document.addEventListener(
    "keydown",
    evento => {
        if (evento.key === "Escape") {
            fecharModalCliente();
            fecharDetalhes();
            fecharMenuMobile();
        }
    }
);

/*
|--------------------------------------------------------------------------
| Confirmação personalizada
|--------------------------------------------------------------------------
*/

let resolverConfirmacao = null;
let overflowAnteriorConfirmacao = "";

function finalizarConfirmacao(
    confirmou
) {
    if (!resolverConfirmacao) {
        return;
    }

    const resolver =
        resolverConfirmacao;

    resolverConfirmacao =
        null;

    modalConfirmacao
        ?.classList.remove(
            "aberto"
        );

    modalConfirmacao
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        overflowAnteriorConfirmacao;

    resolver(
        Boolean(confirmou)
    );
}

function confirmarAcao({
    titulo =
        "Confirmar ação?",

    mensagem =
        "Esta ação não poderá ser desfeita.",

    textoConfirmar =
        "Confirmar",

    tipo =
        "perigo",

    icone =
        ""
} = {}) {
    if (
        !modalConfirmacao ||
        !tituloConfirmacao ||
        !mensagemConfirmacao ||
        !botaoConfirmarAcao
    ) {
        console.error(
            "O modal de confirmação não foi encontrado."
        );

        return Promise.resolve(
            false
        );
    }

    /*
     * Cancela uma confirmação anterior,
     * caso ainda exista alguma aberta.
     */
    if (resolverConfirmacao) {
        finalizarConfirmacao(
            false
        );
    }

    const configuracoes = {
        perigo: {
            icone:
                "trash",

            classeBotao:
                "botao-perigo"
        },

        aviso: {
            icone:
                "file",

            classeBotao:
                "botao-aviso"
        },

        sucesso: {
            icone:
                "check",

            classeBotao:
                "botao-sucesso"
        }
    };

    const configuracao =
        configuracoes[tipo] ||
        configuracoes.perigo;

    tituloConfirmacao.textContent =
        titulo;

    mensagemConfirmacao.textContent =
        mensagem;

    botaoConfirmarAcao.textContent =
        textoConfirmar;

    modalConfirmacao.dataset.tipo =
        tipo;

    if (iconeConfirmacaoUse) {
        iconeConfirmacaoUse.setAttribute(
            "href",
            `#icon-${
                icone ||
                configuracao.icone
            }`
        );
    }

    botaoConfirmarAcao.classList.remove(
        "botao-perigo",
        "botao-aviso",
        "botao-sucesso"
    );

    botaoConfirmarAcao.classList.add(
        configuracao.classeBotao
    );

    overflowAnteriorConfirmacao =
        document.body.style.overflow;

    document.body.style.overflow =
        "hidden";

    modalConfirmacao.classList.add(
        "aberto"
    );

    modalConfirmacao.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(
        () => {
            botaoConfirmarAcao.focus();
        },
        50
    );

    return new Promise(
        resolver => {
            resolverConfirmacao =
                resolver;
        }
    );
}

/*
|--------------------------------------------------------------------------
| Eventos do backup
|--------------------------------------------------------------------------
*/

botaoCriarBackup
    ?.addEventListener(
        "click",
        criarBackupSistema
    );

botaoSelecionarBackup
    ?.addEventListener(
        "click",
        () => {
            inputBackup.click();
        }
    );

inputBackup
    ?.addEventListener(
        "change",
        atualizarBackupSelecionado
    );

botaoRestaurarBackup
    ?.addEventListener(
        "click",
        restaurarBackupSistema
    );

/*
|--------------------------------------------------------------------------
| Sidebar recolhível
|--------------------------------------------------------------------------
*/

(() => {
    const CHAVE_SIDEBAR =
        "sidebarSistemaRecolhida";

    const botao =
        document.querySelector(
            "#botaoRecolherSidebar"
        );

    if (!botao) {
        return;
    }

    const consultaDesktop =
        window.matchMedia(
            "(min-width: 1025px)"
        );

    function sidebarEstaRecolhida() {
        return document.body
            .classList
            .contains(
                "sidebar-recolhida"
            );
    }

    function aplicarEstadoSidebar(
        recolhida
    ) {
        document.body.classList.toggle(
            "sidebar-recolhida",
            recolhida &&
            consultaDesktop.matches
        );

        const estadoAtual =
            recolhida &&
            consultaDesktop.matches;

        botao.setAttribute(
            "aria-expanded",
            estadoAtual
                ? "false"
                : "true"
        );

        botao.setAttribute(
            "aria-label",
            estadoAtual
                ? "Expandir menu lateral"
                : "Recolher menu lateral"
        );

        botao.title =
            estadoAtual
                ? "Expandir menu"
                : "Recolher menu";

        const texto =
            botao.querySelector(
                "span"
            );

        if (texto) {
            texto.textContent =
                estadoAtual
                    ? "Expandir menu"
                    : "Recolher menu";
        }
    }

    function obterEstadoSalvo() {
        return (
            localStorage.getItem(
                CHAVE_SIDEBAR
            ) ===
            "true"
        );
    }

    /*
     * Adiciona título aos itens para que,
     * no menu recolhido, o navegador mostre
     * o nome ao passar o mouse.
     */
    document
        .querySelectorAll(
            ".sidebar .menu-item"
        )
        .forEach(
            item => {
                const texto =
                    item.querySelector(
                        ".menu-item-conteudo strong"
                    )
                        ?.textContent
                        ?.trim() ||

                    item.querySelector(
                        ":scope > span:last-child"
                    )
                        ?.textContent
                        ?.trim();

                if (
                    texto &&
                    !item.title
                ) {
                    item.title =
                        texto;
                }
            }
        );

    aplicarEstadoSidebar(
        obterEstadoSalvo()
    );

    botao.addEventListener(
        "click",
        () => {
            const novoEstado =
                !sidebarEstaRecolhida();

            localStorage.setItem(
                CHAVE_SIDEBAR,
                String(
                    novoEstado
                )
            );

            aplicarEstadoSidebar(
                novoEstado
            );
        }
    );

    function atualizarPorTamanho() {
        aplicarEstadoSidebar(
            obterEstadoSalvo()
        );
    }

    if (
        typeof consultaDesktop
            .addEventListener ===
        "function"
    ) {
        consultaDesktop.addEventListener(
            "change",
            atualizarPorTamanho
        );
    } else {
        consultaDesktop.addListener(
            atualizarPorTamanho
        );
    }
})();

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

async function inicializarSistema() {
    carregarTema();

    if (anoCreditos) {
    anoCreditos.textContent =
        new Date().getFullYear();
}

    const autenticado =
        await carregarUsuarioAtual();

    if (!autenticado) {
        return;
    }

    await Promise.all([
        carregarClientesDoServidor(),
        carregarStatusBackup()
    ]);
}

inicializarSistema();