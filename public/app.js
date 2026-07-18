/*
|--------------------------------------------------------------------------
| Seletores
|--------------------------------------------------------------------------
*/

const $ = seletor =>
    document.querySelector(seletor);

const $$ = seletor =>
    document.querySelectorAll(seletor);

/*
|--------------------------------------------------------------------------
| Estado do sistema
|--------------------------------------------------------------------------
*/

const CHAVE_TEMA =
    "temaSistemaBordado";

let clientes = [];
let filtroAtual = "";
let clienteDetalhadoId = null;
let carregandoClientes = true;

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
    arquivos: "Arquivos",
    configuracoes: "Configurações"
};

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
| Validação de CPF
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

function atualizarEstadoCpf() {
    const numeros =
        somenteNumeros(
            campoCpf.value
        );

    campoCpf.classList.remove(
        "invalido"
    );

    mensagemCpf.classList.remove(
        "erro",
        "valido"
    );

    if (!numeros) {
        mensagemCpf.textContent =
            "Digite um CPF válido.";

        return;
    }

    if (numeros.length < 11) {
        mensagemCpf.textContent =
            "O CPF precisa ter 11 números.";

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    if (!validarCpf(numeros)) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            "Este CPF não é válido.";

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    const duplicado =
        clientes.some(
            cliente =>
                somenteNumeros(
                    cliente.cpf
                ) === numeros &&

                cliente.id !==
                    clienteId.value
        );

    if (duplicado) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            "Este CPF já está cadastrado.";

        mensagemCpf.classList.add(
            "erro"
        );

        return;
    }

    mensagemCpf.textContent =
        "CPF válido.";

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
    sidebar.classList.add(
        "aberto"
    );

    fundoMenuMobile.classList.add(
        "aberto"
    );
}

function fecharMenuMobile() {
    sidebar.classList.remove(
        "aberto"
    );

    fundoMenuMobile.classList.remove(
        "aberto"
    );
}

function navegarPara(secao) {
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

function abrirModalCliente(
    cliente = null
) {
    formularioCliente.reset();

    campoCpf.classList.remove(
        "invalido"
    );

    mensagemCpf.classList.remove(
        "erro",
        "valido"
    );

    mensagemCpf.textContent =
        "Digite um CPF válido.";

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
            cliente.cpf || "";

        campoTelefone.value =
            cliente.telefone || "";

        $("#linha").value =
            cliente.linha || "";

        $("#observacoes").value =
            cliente.observacoes || "";

        atualizarEstadoCpf();
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
        cliente.linha || "—";

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
        confirm(
            [
                configuracao.pergunta,
                "",
                configuracao.nome
                    ? `Arquivo: ${configuracao.nome}`
                    : "",
                "",
                "O cadastro do cliente será mantido."
            ]
                .filter(Boolean)
                .join("\n")
        );

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

function filtrarClientes() {
    const busca =
        normalizarTexto(
            filtroAtual
        );

    if (!busca) {
        return [...clientes];
    }

    return clientes.filter(
        cliente =>
            [
                cliente.nome,
                cliente.cpf,
                cliente.telefone,
                cliente.linha
            ].some(
                campo =>
                    normalizarTexto(
                        campo
                    ).includes(busca)
            )
    );
}

function atualizarFiltro(valor) {
    filtroAtual =
        String(valor || "");

    buscaGlobal.value =
        filtroAtual;

    buscaClientes.value =
        filtroAtual;

    renderizarClientes();

    if (filtroAtual.trim()) {
        navegarPara("clientes");
    }
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
    if (carregandoClientes) {
        quantidadeResultados.textContent =
            "Carregando...";

        corpoTabelaClientes.innerHTML = `
            <tr>
                <td colspan="6">
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
                <td colspan="6">
                    <div class="estado-vazio">
                        <div class="estado-vazio-icone">
                            ${icone("search")}
                        </div>

                        <p>
                            Nenhum cliente encontrado
                        </p>

                        <small>
                            Pesquise usando o nome,
                            telefone ou somente os
                            números do CPF.
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
                        <td>
                            <div class="tabela-cliente">
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
                                        ${formatarData(
                                            cliente.criadoEm
                                        )}
                                    </span>
                                </div>
                            </div>
                        </td>

                        <td>
                            ${escaparHtml(
                                cliente.cpf
                            )}
                        </td>

                        <td>
                            ${escaparHtml(
                                cliente.telefone
                            )}
                        </td>

                        <td>
                            ${escaparHtml(
                                cliente.linha
                            )}
                        </td>

                        <td>
                            ${
                                cliente.logoConvertidaUrl
                                    ? `
                                        <a
                                            class="etiqueta-arquivo etiqueta-link"
                                            href="${escaparHtml(
                                                cliente.logoConvertidaUrl
                                            )}"
                                            title="Baixar arquivo convertido"
                                        >
                                            ${escaparHtml(
                                                cliente.logoConvertida
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

                        <td>
                            <div class="acoes-cliente">
                                <button
                                    class="botao-acao"
                                    data-visualizar="${cliente.id}"
                                    type="button"
                                    title="Visualizar cliente"
                                >
                                    ${icone("eye")}
                                </button>

                                <button
                                    class="botao-acao"
                                    data-editar="${cliente.id}"
                                    type="button"
                                    title="Editar cliente"
                                >
                                    ${icone("edit")}
                                </button>

                                <button
                                    class="botao-acao perigo"
                                    data-excluir="${cliente.id}"
                                    type="button"
                                    title="Excluir cliente"
                                >
                                    ${icone("trash")}
                                </button>
                            </div>
                        </td>
                    </tr>
                `
            )
            .join("");
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
                style="grid-column: 1 / -1"
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

    const cpf =
        campoCpf.value.trim();

    if (!validarCpf(cpf)) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            "Este CPF não é válido.";

        mensagemCpf.classList.remove(
            "valido"
        );

        mensagemCpf.classList.add(
            "erro"
        );

        campoCpf.focus();

        mostrarNotificacao(
            "CPF inválido",
            "Revise o CPF antes de salvar.",
            "erro"
        );

        return;
    }

    const duplicado =
        clientes.some(
            cliente =>
                somenteNumeros(
                    cliente.cpf
                ) ===
                    somenteNumeros(cpf) &&

                cliente.id !== id
        );

    if (duplicado) {
        campoCpf.classList.add(
            "invalido"
        );

        mensagemCpf.textContent =
            "Este CPF já está cadastrado.";

        mensagemCpf.classList.remove(
            "valido"
        );

        mensagemCpf.classList.add(
            "erro"
        );

        campoCpf.focus();

        mostrarNotificacao(
            "CPF já cadastrado",
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
    const cliente =
        clientes.find(
            item =>
                item.id === id
        );

    if (!cliente) {
        return;
    }

    const confirmou =
        confirm(
            `Excluir o cadastro de ${cliente.nome} e todos os arquivos dele?`
        );

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
    if (!clientes.length) {
        mostrarNotificacao(
            "Nada para apagar",
            "Não existem clientes cadastrados.",
            "erro"
        );

        return;
    }

    const confirmou =
        confirm(
            "Apagar permanentemente todos os clientes e arquivos?"
        );

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
        confirm(
            [
                `Restaurar o backup "${arquivo.name}"?`,
                "",
                "Todos os clientes e arquivos atuais serão substituídos.",
                "Esta ação não poderá ser desfeita."
            ].join("\n")
        );

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

async function carregarUsuarioAtual() {
    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/status"
            );

        if (!resposta.autenticado) {
            window.location.replace(
                "/login.html"
            );

            return false;
        }

        const usuario =
            resposta.usuario;

        nomeUsuarioLogado.textContent =
            usuario?.nome ||
            "Administrador";

        perfilUsuarioLogado.textContent =
            formatarPerfilUsuario(
                usuario?.perfil
            );

        iniciaisUsuarioLogado.textContent =
            obterIniciaisUsuario(
                usuario?.nome
            );

        return true;
    } catch {
        return false;
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

botaoMenuMobile.addEventListener(
    "click",
    abrirMenuMobile
);

fundoMenuMobile.addEventListener(
    "click",
    fecharMenuMobile
);

botaoSair
    ?.addEventListener(
        "click",
        sairDoSistema
);

campoCpf.addEventListener(
    "input",
    evento => {
        evento.target.value =
            formatarCpf(
                evento.target.value
            );

        atualizarEstadoCpf();
    }
);

campoCpf.addEventListener(
    "blur",
    atualizarEstadoCpf
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

buscaGlobal.addEventListener(
    "input",
    evento =>
        atualizarFiltro(
            evento.target.value
        )
);

buscaClientes.addEventListener(
    "input",
    evento => {
        filtroAtual =
            evento.target.value;

        buscaGlobal.value =
            evento.target.value;

        renderizarClientes();
    }
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
| Inicialização
|--------------------------------------------------------------------------
*/

async function inicializarSistema() {
    carregarTema();

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