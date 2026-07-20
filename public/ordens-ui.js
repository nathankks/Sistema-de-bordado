/*
|--------------------------------------------------------------------------
| Estado das ordens
|--------------------------------------------------------------------------
*/

let ordens = [];
let carregandoOrdens = true;
let buscaOrdemAtual = "";
let statusOrdemAtual = "todos";

/*
|--------------------------------------------------------------------------
| Elementos
|--------------------------------------------------------------------------
*/

const botaoNovaOrdem =
    $("#botaoNovaOrdem");

const modalOrdem =
    $("#modalOrdem");

const formularioOrdem =
    $("#formularioOrdem");

const tituloModalOrdem =
    $("#tituloModalOrdem");

const ordemId =
    $("#ordemId");

const ordemCliente =
    $("#ordemCliente");

const seletorClienteOrdem =
    $("#seletorClienteOrdem");

const botaoClienteOrdem =
    $("#botaoClienteOrdem");

const textoClienteOrdem =
    $("#textoClienteOrdem");

const subtextoClienteOrdem =
    $("#subtextoClienteOrdem");

const avatarClienteOrdem =
    $("#avatarClienteOrdem");

const menuClienteOrdem =
    $("#menuClienteOrdem");

const buscaClienteOrdem =
    $("#buscaClienteOrdem");

const listaClientesOrdem =
    $("#listaClientesOrdem");

const mensagemClienteOrdem =
    $("#mensagemClienteOrdem");

const logoClienteOrdem =
    $("#logoClienteOrdem");

const ordemDescricao =
    $("#ordemDescricao");

const ordemQuantidade =
    $("#ordemQuantidade");

const ordemLinha =
    $("#ordemLinha");

const seletorLinhaOrdem =
    $("#seletorLinhaOrdem");

const botaoLinhaOrdem =
    $("#botaoLinhaOrdem");

const textoLinhaOrdem =
    $("#textoLinhaOrdem");

const subtextoLinhaOrdem =
    $("#subtextoLinhaOrdem");

const amostraLinhaOrdem =
    $("#amostraLinhaOrdem");

const menuLinhaOrdem =
    $("#menuLinhaOrdem");

const buscaLinhaOrdem =
    $("#buscaLinhaOrdem");

const listaLinhasOrdem =
    $("#listaLinhasOrdem");

const mensagemLinhaOrdem =
    $("#mensagemLinhaOrdem");

const linhasSelecionadasOrdem =
    $("#linhasSelecionadasOrdem");

const quantidadeLinhasSelecionadasOrdem =
    $("#quantidadeLinhasSelecionadasOrdem");

const botaoLimparLinhasOrdem =
    $("#botaoLimparLinhasOrdem");

const botaoConcluirLinhasOrdem =
    $("#botaoConcluirLinhasOrdem");

const ordemPrazo =
    $("#ordemPrazo");

const ordemStatus =
    $("#ordemStatus");

const ordemObservacoes =
    $("#ordemObservacoes");

const botaoSalvarOrdem =
    $("#botaoSalvarOrdem");

const corpoTabelaOrdens =
    $("#corpoTabelaOrdens");

const buscaOrdens =
    $("#buscaOrdens");

const filtroStatusOrdens =
    $("#filtroStatusOrdens");

const quantidadeOrdens =
    $("#quantidadeOrdens");

const totalOrdensAbertas =
    $("#totalOrdensAbertas");

const totalOrdensProducao =
    $("#totalOrdensProducao");

const totalOrdensAtrasadas =
    $("#totalOrdensAtrasadas");

const totalOrdensConcluidasMes =
    $("#totalOrdensConcluidasMes");

const listaOrdensAtrasadasDashboard =
    $("#listaOrdensAtrasadasDashboard");

const botaoVerOrdensDashboard =
    $("#botaoVerOrdensDashboard");

const cartaoOrdensAtrasadas =
    $("#cartaoOrdensAtrasadas");

/*
|--------------------------------------------------------------------------
| Formatação
|--------------------------------------------------------------------------
*/

function formatarPrazoOrdem(
    prazo
) {
    const partes =
        String(prazo || "")
            .split("-")
            .map(Number);

    if (
        partes.length !== 3 ||
        partes.some(
            parte =>
                !Number.isInteger(parte)
        )
    ) {
        return "Prazo não informado";
    }

    const [
        ano,
        mes,
        dia
    ] = partes;

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "Prazo não informado";
    }

    return new Intl.DateTimeFormat(
        "pt-BR"
    ).format(data);
}

function obterStatusInicialOrdem(
    cliente
) {
    if (
        cliente?.logoConvertida
    ) {
        return "pronto-producao";
    }

    if (
        cliente?.logoOriginal
    ) {
        return "aguardando-aprovacao";
    }

    return "aguardando-arquivo";
}

/*
|--------------------------------------------------------------------------
| Seletor múltiplo de linhas da ordem
|--------------------------------------------------------------------------
*/

const SEPARADOR_LINHAS_ORDEM =
    "\n";

let linhasAntigasOrdem = [];

function criarValorLinhaOrdem(
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

function obterLinhasDisponiveisOrdem() {
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

function encontrarLinhaOrdem(
    valor
) {
    return (
        obterLinhasDisponiveisOrdem()
            .find(
                linha =>
                    criarValorLinhaOrdem(
                        linha
                    ) === valor
            ) ||
        null
    );
}

function normalizarListaLinhasOrdem(
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

function obterLinhasSelecionadasOrdem() {
    return normalizarListaLinhasOrdem(
        ordemLinha?.value ||
        ""
    );
}

function obterNomeLinhaOrdem(
    valor
) {
    const linha =
        encontrarLinhaOrdem(
            valor
        );

    return (
        linha?.nome ||
        valor
    );
}

function definirLinhasSelecionadasOrdem(
    valores
) {
    if (!ordemLinha) {
        return;
    }

    const lista =
        normalizarListaLinhasOrdem(
            valores
        );

    ordemLinha.value =
        lista.join(
            SEPARADOR_LINHAS_ORDEM
        );

    linhasAntigasOrdem =
        lista.filter(
            valor =>
                !encontrarLinhaOrdem(
                    valor
                )
        );

    atualizarVisualLinhaOrdem();
}

function obterStatusLinhaOrdem(
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

function renderizarLinhasSelecionadasOrdem() {
    if (!linhasSelecionadasOrdem) {
        return;
    }

    const selecionadas =
        obterLinhasSelecionadasOrdem();

    linhasSelecionadasOrdem.hidden =
        !selecionadas.length;

    linhasSelecionadasOrdem.innerHTML =
        selecionadas
            .map(
                valor => {
                    const linha =
                        encontrarLinhaOrdem(
                            valor
                        );

                    const nome =
                        obterNomeLinhaOrdem(
                            valor
                        );

                    const cor =
                        linha?.corHex ||
                        "#777777";

                    return `
                        <button
                            class="linha-selecionada-ordem"
                            data-remover-linha-ordem="${encodeURIComponent(
                                valor
                            )}"
                            type="button"
                            title="Remover ${escaparHtml(
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

function atualizarVisualLinhaOrdem() {
    if (
        !ordemLinha ||
        !textoLinhaOrdem ||
        !subtextoLinhaOrdem
    ) {
        return;
    }

    const selecionadas =
        obterLinhasSelecionadasOrdem();

    const quantidade =
        selecionadas.length;

    if (
        quantidadeLinhasSelecionadasOrdem
    ) {
        quantidadeLinhasSelecionadasOrdem
            .textContent =
                `${quantidade} ${
                    quantidade === 1
                        ? "linha selecionada"
                        : "linhas selecionadas"
                }`;
    }

    renderizarLinhasSelecionadasOrdem();

    if (!quantidade) {
        textoLinhaOrdem.textContent =
            window.catalogoLinhasCarregado
                ? "Selecione uma ou mais linhas"
                : "Carregando catálogo...";

        subtextoLinhaOrdem.textContent =
            "Pesquise e clique nas linhas desejadas";

        if (amostraLinhaOrdem) {
            amostraLinhaOrdem.hidden =
                true;
        }

        if (
            mensagemLinhaOrdem &&
            !mensagemLinhaOrdem
                .classList
                .contains(
                    "erro"
                )
        ) {
            mensagemLinhaOrdem.textContent =
                "Selecione pelo menos uma linha para a ordem.";
        }

        return;
    }

    if (quantidade === 1) {
        const valor =
            selecionadas[0];

        const linha =
            encontrarLinhaOrdem(
                valor
            );

        if (linha) {
            const status =
                obterStatusLinhaOrdem(
                    linha
                );

            textoLinhaOrdem.textContent =
                linha.nome;

            subtextoLinhaOrdem.textContent =
                `${linha.marca} · Código ${linha.codigo} · ${status.texto}`;

            if (amostraLinhaOrdem) {
                amostraLinhaOrdem.hidden =
                    false;

                amostraLinhaOrdem.style
                    .backgroundColor =
                        linha.corHex ||
                        "#777777";
            }
        } else {
            textoLinhaOrdem.textContent =
                valor;

            subtextoLinhaOrdem.textContent =
                "Linha anterior — fora do catálogo";

            if (amostraLinhaOrdem) {
                amostraLinhaOrdem.hidden =
                    false;

                amostraLinhaOrdem.style
                    .backgroundColor =
                        "#777777";
            }
        }
    } else {
        const nomes =
            selecionadas
                .map(
                    obterNomeLinhaOrdem
                );

        textoLinhaOrdem.textContent =
            `${quantidade} linhas selecionadas`;

        subtextoLinhaOrdem.textContent =
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

        if (amostraLinhaOrdem) {
            amostraLinhaOrdem.hidden =
                true;
        }
    }

    if (mensagemLinhaOrdem) {
        mensagemLinhaOrdem.textContent =
            `${quantidade} ${
                quantidade === 1
                    ? "linha selecionada"
                    : "linhas selecionadas"
            }. Clique novamente em uma opção para remover.`;

        mensagemLinhaOrdem
            .classList.remove(
                "erro"
            );
    }
}

function criarOpcaoLinhaOrdem(
    linha
) {
    const valor =
        criarValorLinhaOrdem(
            linha
        );

    const status =
        obterStatusLinhaOrdem(
            linha
        );

    const selecionada =
        obterLinhasSelecionadasOrdem()
            .includes(
                valor
            );

    const estoque =
        new Intl.NumberFormat(
            "pt-BR",
            {
                maximumFractionDigits: 2
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
            data-valor-linha-ordem="${encodeURIComponent(
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

function criarOpcaoLinhaAntigaOrdem(
    valor
) {
    const selecionada =
        obterLinhasSelecionadasOrdem()
            .includes(
                valor
            );

    return `
        <button
            class="opcao-menu-linha ${
                selecionada
                    ? "selecionada"
                    : ""
            }"
            data-valor-linha-ordem="${encodeURIComponent(
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

function renderizarOpcoesLinhaOrdem() {
    if (!listaLinhasOrdem) {
        return;
    }

    const termo =
        normalizarTexto(
            buscaLinhaOrdem?.value ||
            ""
        );

    const linhas =
        obterLinhasDisponiveisOrdem()
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
        linhasAntigasOrdem
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
                criarOpcaoLinhaAntigaOrdem
            )
            .join("");

    html += linhas
        .map(
            criarOpcaoLinhaOrdem
        )
        .join("");

    if (!html) {
        html = `
            <div class="menu-linha-vazio">
                <strong>
                    Nenhuma linha encontrada
                </strong>

                <span>
                    Pesquise por outro código,
                    marca ou nome da cor.
                </span>
            </div>
        `;
    }

    listaLinhasOrdem.innerHTML =
        html;
}

function abrirMenuLinhaOrdem() {
    if (
        !menuLinhaOrdem ||
        !botaoLinhaOrdem
    ) {
        return;
    }

    menuLinhaOrdem.hidden =
        false;

    seletorLinhaOrdem
        ?.classList.add(
            "aberto"
        );

    botaoLinhaOrdem.setAttribute(
        "aria-expanded",
        "true"
    );

    if (buscaLinhaOrdem) {
        buscaLinhaOrdem.value =
            "";
    }

    renderizarOpcoesLinhaOrdem();

    setTimeout(
        () => {
            buscaLinhaOrdem
                ?.focus();
        },
        30
    );
}

function fecharMenuLinhaOrdem() {
    if (
        !menuLinhaOrdem ||
        !botaoLinhaOrdem
    ) {
        return;
    }

    menuLinhaOrdem.hidden =
        true;

    seletorLinhaOrdem
        ?.classList.remove(
            "aberto"
        );

    botaoLinhaOrdem.setAttribute(
        "aria-expanded",
        "false"
    );
}

function selecionarLinhaOrdem(
    valor
) {
    const selecionadas =
        obterLinhasSelecionadasOrdem();

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

    definirLinhasSelecionadasOrdem(
        novaLista
    );

    botaoLinhaOrdem
        ?.classList.remove(
            "invalido"
        );

    mensagemLinhaOrdem
        ?.classList.remove(
            "erro"
        );

    renderizarOpcoesLinhaOrdem();
}

function removerLinhaOrdem(
    valor
) {
    const novaLista =
        obterLinhasSelecionadasOrdem()
            .filter(
                item =>
                    item !== valor
            );

    definirLinhasSelecionadasOrdem(
        novaLista
    );

    if (
        menuLinhaOrdem &&
        !menuLinhaOrdem.hidden
    ) {
        renderizarOpcoesLinhaOrdem();
    }
}

function limparLinhasOrdem() {
    definirLinhasSelecionadasOrdem(
        []
    );

    renderizarOpcoesLinhaOrdem();
}

function preencherLinhaOrdem(
    valorSelecionado = ""
) {
    definirLinhasSelecionadasOrdem(
        normalizarListaLinhasOrdem(
            valorSelecionado
        )
    );
}

function formatarResumoLinhasOrdem(
    valor
) {
    const nomes =
        normalizarListaLinhasOrdem(
            valor
        ).map(
            obterNomeLinhaOrdem
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

function criarHtmlLinhasOrdem(
    valor
) {
    const nomes =
        normalizarListaLinhasOrdem(
            valor
        ).map(
            obterNomeLinhaOrdem
        );

    if (!nomes.length) {
        return "—";
    }

    return nomes
        .map(
            nome =>
                escaparHtml(
                    nome
                )
        )
        .join("<br>");
}

/*
|--------------------------------------------------------------------------
| Clientes do formulário
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Cliente pesquisável do formulário
|--------------------------------------------------------------------------
*/

function obterClientesOrdenadosDaOrdem() {
    if (!Array.isArray(clientes)) {
        return [];
    }

    return [...clientes].sort(
        (
            clienteA,
            clienteB
        ) =>
            String(
                clienteA.nome || ""
            ).localeCompare(
                String(
                    clienteB.nome || ""
                ),
                "pt-BR"
            )
    );
}

function encontrarClienteDaOrdem(
    id
) {
    return (
        clientes.find(
            cliente =>
                String(
                    cliente.id
                ) ===
                String(
                    id || ""
                )
        ) ||
        null
    );
}

function atualizarVisualClienteOrdem() {
    if (
        !ordemCliente ||
        !textoClienteOrdem ||
        !subtextoClienteOrdem
    ) {
        return;
    }

    const cliente =
        encontrarClienteDaOrdem(
            ordemCliente.value
        );

    if (!cliente) {
        textoClienteOrdem.textContent =
            "Selecione um cliente";

        subtextoClienteOrdem.textContent =
            "Pesquise pelo nome do cliente";

        if (avatarClienteOrdem) {
            avatarClienteOrdem.hidden =
                true;
        }

        renderizarLogoClienteOrdem();

        return;
    }

    textoClienteOrdem.textContent =
        cliente.nome ||
        "Cliente";

    subtextoClienteOrdem.textContent =
        "Cliente selecionado";

    if (avatarClienteOrdem) {
        avatarClienteOrdem.textContent =
            obterIniciais(
                cliente.nome
            );

        avatarClienteOrdem.hidden =
            false;
    }

    renderizarLogoClienteOrdem();
}

/*
|--------------------------------------------------------------------------
| Logo do cliente na ordem
|--------------------------------------------------------------------------
*/

function obterExtensaoLogoOrdem(
    nomeArquivo
) {
    const nome =
        String(
            nomeArquivo ||
            ""
        );

    const indice =
        nome.lastIndexOf(
            "."
        );

    if (
        indice === -1
    ) {
        return "";
    }

    return nome
        .slice(
            indice
        )
        .toLowerCase();
}

function logoOrdemEhImagem(
    nomeArquivo
) {
    return [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp"
    ].includes(
        obterExtensaoLogoOrdem(
            nomeArquivo
        )
    );
}

function obterRotuloExtensaoLogoOrdem(
    nomeArquivo
) {
    return (
        obterExtensaoLogoOrdem(
            nomeArquivo
        )
            .replace(
                ".",
                ""
            )
            .toUpperCase() ||
        "ARQ"
    );
}

function renderizarLogoClienteOrdem() {
    if (!logoClienteOrdem) {
        return;
    }

    const cliente =
        encontrarClienteDaOrdem(
            ordemCliente?.value
        );

    /*
     * Nenhum cliente selecionado.
     */

    if (!cliente) {
        logoClienteOrdem.className =
            "logo-cliente-ordem logo-cliente-ordem-vazia";

        logoClienteOrdem.innerHTML = `
            <span class="logo-cliente-ordem-icone">
                ${icone("file")}
            </span>

            <div class="logo-cliente-ordem-mensagem">
                <strong>
                    Selecione um cliente
                </strong>

                <span>
                    A logo cadastrada aparecerá aqui.
                </span>
            </div>
        `;

        return;
    }

    const nomeLogo =
        String(
            cliente.logoOriginal ||
            ""
        ).trim();

    const urlLogo =
        String(
            cliente.logoOriginalUrl ||
            ""
        ).trim();

    /*
     * Cliente selecionado, mas sem logo.
     */

    if (
        !nomeLogo ||
        !urlLogo
    ) {
        logoClienteOrdem.className =
            "logo-cliente-ordem logo-cliente-ordem-sem-arquivo";

        logoClienteOrdem.innerHTML = `
            <span class="logo-cliente-ordem-icone">
                ${icone("file")}
            </span>

            <div class="logo-cliente-ordem-mensagem">
                <strong>
                    Nenhuma logo cadastrada
                </strong>

                <span>
                    ${escaparHtml(
                        cliente.nome ||
                        "Este cliente"
                    )}
                    não possui uma logo original.
                </span>
            </div>
        `;

        return;
    }

    const podeAcessarArquivos =
        typeof window
            .possuiPermissaoSistema !==
            "function" ||

        window
            .possuiPermissaoSistema(
                "arquivos.baixar"
            );

    /*
     * Não tenta carregar a imagem quando
     * o usuário não pode acessar arquivos.
     */

    if (!podeAcessarArquivos) {
        logoClienteOrdem.className =
            "logo-cliente-ordem logo-cliente-ordem-sem-permissao";

        logoClienteOrdem.innerHTML = `
            <span class="logo-cliente-ordem-icone">
                ${icone("alert")}
            </span>

            <div class="logo-cliente-ordem-mensagem">
                <strong>
                    Logo cadastrada
                </strong>

                <span>
                    Você não possui permissão para
                    visualizar ou baixar este arquivo.
                </span>
            </div>
        `;

        return;
    }

    const extensao =
        obterExtensaoLogoOrdem(
            nomeLogo
        );

    const possuiPreview =
        logoOrdemEhImagem(
            nomeLogo
        );

    const podeVisualizarNoNavegador =
        [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".pdf"
        ].includes(
            extensao
        );

    const urlDownload =
        `${urlLogo}${
            urlLogo.includes(
                "?"
            )
                ? "&"
                : "?"
        }download=1`;

    logoClienteOrdem.className =
        "logo-cliente-ordem logo-cliente-ordem-disponivel";

    logoClienteOrdem.innerHTML = `
        <div class="logo-cliente-ordem-preview">
            ${
                possuiPreview
                    ? `
                        <img
                            src="${escaparHtml(
                                urlLogo
                            )}"
                            alt="Logo original de ${escaparHtml(
                                cliente.nome ||
                                "cliente"
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <span class="logo-cliente-ordem-extensao">
                            ${escaparHtml(
                                obterRotuloExtensaoLogoOrdem(
                                    nomeLogo
                                )
                            )}
                        </span>
                    `
            }
        </div>

        <div class="logo-cliente-ordem-informacoes">
            <span class="logo-cliente-ordem-etiqueta">
                Logo original
            </span>

            <strong
                title="${escaparHtml(
                    nomeLogo
                )}"
            >
                ${escaparHtml(
                    nomeLogo
                )}
            </strong>

            <small>
                Cliente:
                ${escaparHtml(
                    cliente.nome ||
                    "Não informado"
                )}
            </small>
        </div>

        <div class="logo-cliente-ordem-acoes">
            <a
                class="logo-cliente-ordem-botao"
                href="${escaparHtml(
                    urlLogo
                )}"
                target="_blank"
                rel="noopener"
                title="${
                    podeVisualizarNoNavegador
                        ? "Visualizar logo"
                        : "Abrir arquivo"
                }"
            >
                ${icone("eye")}

                <span>
                    ${
                        podeVisualizarNoNavegador
                            ? "Visualizar"
                            : "Abrir arquivo"
                    }
                </span>
            </a>

            <a
                class="logo-cliente-ordem-botao logo-cliente-ordem-botao-principal"
                href="${escaparHtml(
                    urlDownload
                )}"
                title="Baixar logo"
            >
                ${icone("file")}

                <span>
                    Baixar
                </span>
            </a>
        </div>
    `;

    /*
     * Caso a imagem não possa ser carregada,
     * mantém a caixa utilizável com o nome
     * da extensão.
     */

    const imagem =
        logoClienteOrdem
            .querySelector(
                "img"
            );

    imagem?.addEventListener(
        "error",
        () => {
            const preview =
                logoClienteOrdem
                    .querySelector(
                        ".logo-cliente-ordem-preview"
                    );

            if (!preview) {
                return;
            }

            preview.innerHTML = `
                <span class="logo-cliente-ordem-extensao">
                    ${escaparHtml(
                        obterRotuloExtensaoLogoOrdem(
                            nomeLogo
                        )
                    )}
                </span>
            `;
        },
        {
            once: true
        }
    );
}

function criarOpcaoClienteOrdem(
    cliente
) {
    const selecionado =
        String(
            ordemCliente?.value ||
            ""
        ) ===
        String(
            cliente.id
        );

    return `
        <button
            class="opcao-menu-linha opcao-cliente-ordem ${
                selecionado
                    ? "selecionada"
                    : ""
            }"
            data-cliente-ordem="${encodeURIComponent(
                cliente.id
            )}"
            type="button"
            role="option"
            aria-selected="${selecionado}"
        >
            <span class="avatar-cliente avatar-opcao-cliente">
                ${escaparHtml(
                    obterIniciais(
                        cliente.nome
                    )
                )}
            </span>

            <span class="informacoes-opcao-linha">
                <strong>
                    ${escaparHtml(
                        cliente.nome ||
                        "Cliente"
                    )}
                </strong>

                <span>
                    Selecionar cliente
                </span>
            </span>
        </button>
    `;
}

function renderizarClientesDaOrdem() {
    if (!listaClientesOrdem) {
        return;
    }

    const termo =
        normalizarTexto(
            buscaClienteOrdem
                ?.value ||
            ""
        );

    const lista =
        obterClientesOrdenadosDaOrdem()
            .filter(
                cliente => {
                    if (!termo) {
                        return true;
                    }

                    return normalizarTexto(
                        cliente.nome
                    ).includes(
                        termo
                    );
                }
            );

    if (!lista.length) {
        listaClientesOrdem.innerHTML = `
            <div class="menu-linha-vazio">
                <strong>
                    Nenhum cliente encontrado
                </strong>

                <span>
                    Pesquise usando outro nome.
                </span>
            </div>
        `;

        return;
    }

    listaClientesOrdem.innerHTML =
        lista
            .map(
                criarOpcaoClienteOrdem
            )
            .join("");
}

function preencherClientesDaOrdem(
    clienteSelecionadoId = ""
) {
    if (!ordemCliente) {
        return;
    }

    ordemCliente.value =
        String(
            clienteSelecionadoId ||
            ""
        );

    atualizarVisualClienteOrdem();

    if (
        menuClienteOrdem &&
        !menuClienteOrdem.hidden
    ) {
        renderizarClientesDaOrdem();
    }
}

function abrirMenuClienteOrdem() {
    if (
        !menuClienteOrdem ||
        !botaoClienteOrdem
    ) {
        return;
    }

    menuClienteOrdem.hidden =
        false;

    seletorClienteOrdem
        ?.classList.add(
            "aberto"
        );

    botaoClienteOrdem.setAttribute(
        "aria-expanded",
        "true"
    );

    if (buscaClienteOrdem) {
        buscaClienteOrdem.value =
            "";
    }

    renderizarClientesDaOrdem();

    setTimeout(
        () => {
            buscaClienteOrdem
                ?.focus();
        },
        30
    );
}

function fecharMenuClienteOrdem() {
    if (
        !menuClienteOrdem ||
        !botaoClienteOrdem
    ) {
        return;
    }

    menuClienteOrdem.hidden =
        true;

    seletorClienteOrdem
        ?.classList.remove(
            "aberto"
        );

    botaoClienteOrdem.setAttribute(
        "aria-expanded",
        "false"
    );
}

function selecionarClienteDaOrdem(
    clienteId
) {
    const cliente =
        encontrarClienteDaOrdem(
            clienteId
        );

    if (!cliente) {
        return;
    }

    ordemCliente.value =
        cliente.id;

    botaoClienteOrdem
        ?.classList.remove(
            "invalido"
        );

    mensagemClienteOrdem
        ?.classList.remove(
            "erro"
        );

    if (mensagemClienteOrdem) {
        mensagemClienteOrdem.textContent =
            "Cliente selecionado.";
    }

    atualizarVisualClienteOrdem();
    fecharMenuClienteOrdem();

    /*
     * Em uma nova ordem, a linha e o
     * status são preenchidos automaticamente.
     *
     * Durante a edição, os valores atuais
     * da ordem são preservados.
     */
    if (!ordemId.value) {
        atualizarDadosPeloCliente();
    }
}

function atualizarDadosPeloCliente() {
    const cliente =
        encontrarClienteDaOrdem(
            ordemCliente.value
        );

    if (!cliente) {
        preencherLinhaOrdem(
            ""
        );

        ordemStatus.value =
            "aguardando-arquivo";

        return;
    }

    /*
     * A linha cadastrada no cliente entra
     * como primeira seleção da ordem.
     */
    preencherLinhaOrdem(
        cliente.linha ||
        ""
    );

    ordemStatus.value =
        obterStatusInicialOrdem(
            cliente
        );
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

function abrirModalOrdem(
    ordem = null
) {
    if (
        typeof carregandoClientes !==
            "undefined" &&
        carregandoClientes
    ) {
        mostrarNotificacao(
            "Aguarde",
            "Os clientes ainda estão sendo carregados.",
            "info"
        );

        return;
    }

    if (
        !Array.isArray(clientes) ||
        !clientes.length
    ) {
        mostrarNotificacao(
            "Cadastre um cliente primeiro",
            "Uma ordem precisa estar vinculada a um cliente.",
            "aviso"
        );

        navegarPara(
            "clientes"
        );

        return;
    }

    formularioOrdem.reset();
    fecharMenuLinhaOrdem();
    fecharMenuClienteOrdem();
    preencherClientesDaOrdem();

    if (ordem) {
        tituloModalOrdem.textContent =
            `Editar ${ordem.codigo}`;

        botaoSalvarOrdem
            .querySelector("span")
            .textContent =
                "Salvar alterações";

        ordemId.value =
            ordem.id;

        preencherClientesDaOrdem(
            ordem.clienteId
        );

        ordemDescricao.value =
            ordem.descricao || "";

        ordemQuantidade.value =
            ordem.quantidade || 1;

preencherLinhaOrdem(
    ordem.linha || ""
);

        ordemPrazo.value =
            ordem.prazoEntrega || "";

        ordemStatus.value =
            ordem.status ||
            "aguardando-arquivo";

        ordemObservacoes.value =
            ordem.observacoes || "";
} else {
    tituloModalOrdem.textContent =
        "Nova ordem";

    ordemId.value = "";
    ordemQuantidade.value = 1;

    preencherClientesDaOrdem();
    preencherLinhaOrdem("");
}

    modalOrdem.classList.add(
        "aberto"
    );

    modalOrdem.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(
    () => {
        botaoClienteOrdem
            ?.focus();
    },
    50
);
}

function fecharModalOrdem() {
    fecharMenuClienteOrdem();
    fecharMenuLinhaOrdem();

    modalOrdem?.classList.remove(
        "aberto"
    );

    modalOrdem?.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    formularioOrdem?.reset();

    preencherLinhaOrdem(
        ""
    );

    preencherClientesDaOrdem();

    if (ordemId) {
        ordemId.value =
            "";
    }
}   

/*
|--------------------------------------------------------------------------
| Filtros
|--------------------------------------------------------------------------
*/

function filtrarOrdens() {
    const busca =
        normalizarTexto(
            buscaOrdemAtual
        );

    return ordens.filter(
        ordem => {
            const correspondeStatus =
                statusOrdemAtual ===
                    "todos" ||
                ordem.status ===
                    statusOrdemAtual;

            if (!correspondeStatus) {
                return false;
            }

            if (!busca) {
                return true;
            }

            return [
                ordem.codigo,
                ordem.numero,
                ordem.clienteNome,
                ordem.clienteCpf,
                ordem.descricao,
                ordem.linha,
                ordem.statusTexto
            ].some(
                valor =>
                    normalizarTexto(
                        valor
                    ).includes(
                        busca
                    )
            );
        }
    );
}

/*
|--------------------------------------------------------------------------
| Fluxo de produção
|--------------------------------------------------------------------------
*/

const FLUXO_STATUS_ORDENS = {
    "aguardando-arquivo": {
        proximoStatus:
            "aguardando-aprovacao",

        proximoTexto:
            "Aguardando aprovação"
    },

    "aguardando-aprovacao": {
        proximoStatus:
            "pronto-producao",

        proximoTexto:
            "Pronto para produzir"
    },

    "pronto-producao": {
        proximoStatus:
            "em-producao",

        proximoTexto:
            "Em produção"
    },

    "em-producao": {
        proximoStatus:
            "concluido",

        proximoTexto:
            "Concluído"
    },

    concluido: {
        proximoStatus:
            "entregue",

        proximoTexto:
            "Entregue"
    }
};

function obterProximaEtapaOrdem(
    ordem
) {
    return (
        FLUXO_STATUS_ORDENS[
            ordem?.status
        ] || null
    );
}

async function avancarEtapaOrdem(
    id,
    botao
) {
    const ordem =
        ordens.find(
            item =>
                item.id === id
        );

    if (!ordem) {
        mostrarNotificacao(
            "Ordem não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    const proximaEtapa =
        obterProximaEtapaOrdem(
            ordem
        );

    if (!proximaEtapa) {
        mostrarNotificacao(
            "Etapa final",
            "Esta ordem não possui uma próxima etapa.",
            "aviso"
        );

        return;
    }

const confirmou =
    await confirmarAcao({
        tipo:
            "sucesso",

        icone:
            "check",

        titulo:
            `Avançar ${ordem.codigo}?`,

        mensagem:
            [
                `Status atual: ${ordem.statusTexto}`,

                `Próximo status: ${proximaEtapa.proximoTexto}`
            ].join("\n\n"),

        textoConfirmar:
            "Avançar etapa"
    });

    if (!confirmou) {
        return;
    }

    if (botao) {
        botao.disabled = true;
        botao.classList.add(
            "carregando"
        );
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/ordens/${
                    encodeURIComponent(id)
                }`,

                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            status:
                                proximaEtapa
                                    .proximoStatus
                        })
                }
            );

        await carregarOrdensDoServidor({
            mostrarErro: false
        });

        mostrarNotificacao(
            "Etapa atualizada",
            resposta.mensagem ||
            `${ordem.codigo} avançou para ${proximaEtapa.proximoTexto}.`
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível avançar",
            erro.message,
            "erro"
        );
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.classList.remove(
                "carregando"
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| Tabela
|--------------------------------------------------------------------------
*/

function renderizarOrdens() {
    if (
        !corpoTabelaOrdens ||
        !quantidadeOrdens
    ) {
        return;
    }

    if (carregandoOrdens) {
        quantidadeOrdens.textContent =
            "Carregando...";

        corpoTabelaOrdens.innerHTML = `
            <tr>
                <td colspan="6">
                    ${htmlCarregando()}
                </td>
            </tr>
        `;

        return;
    }

    const lista =
        filtrarOrdens();

    quantidadeOrdens.textContent =
        `${lista.length} ${
            lista.length === 1
                ? "ordem"
                : "ordens"
        }`;

if (!lista.length) {
    const possuiFiltro =
        Boolean(
            buscaOrdemAtual.trim()
        ) ||
        statusOrdemAtual !==
            "todos";

    corpoTabelaOrdens.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="estado-vazio">
                    <div class="estado-vazio-icone">
                        ${icone(
                            possuiFiltro
                                ? "search"
                                : "check-file"
                        )}
                    </div>

                    <p>
                        ${
                            possuiFiltro
                                ? "Nenhuma ordem encontrada"
                                : "Nenhuma ordem cadastrada"
                        }
                    </p>

                    <small>
                        ${
                            possuiFiltro
                                ? "Altere a busca ou o filtro de status."
                                : "Clique em “Nova ordem” para cadastrar o primeiro serviço."
                        }
                    </small>
                </div>
            </td>
        </tr>
    `;

    return;
}

    corpoTabelaOrdens.innerHTML =
        lista
            .map(
                ordem => `
                    <tr>
                        <td>
                            <strong class="codigo-ordem">
                                ${escaparHtml(
                                    ordem.codigo
                                )}
                            </strong>
                        </td>

                        <td>
                            <div class="ordem-cliente">
                                <strong>
                                    ${escaparHtml(
                                        ordem.clienteNome
                                    )}
                                </strong>
                            </div>
                        </td>

                        <td>
                            <div class="ordem-servico">
                                <strong>
                                    ${escaparHtml(
                                        ordem.descricao
                                    )}
                                </strong>

                                <span>
                                    ${escaparHtml(
                                        ordem.quantidade
                                    )}
                                    unidade(s)
                                    ·
                                    ${escaparHtml(
    formatarResumoLinhasOrdem(
        ordem.linha
    )
)}
                                </span>
                            </div>
                        </td>

                        <td>
                            ${escaparHtml(
                                formatarPrazoOrdem(
                                    ordem.prazoEntrega
                                )
                            )}
                        </td>

                        <td>
                            <span
                                class="status-ordem status-ordem-${escaparHtml(
                                    ordem.status
                                )}"
                            >
                                ${escaparHtml(
                                    ordem.statusTexto
                                )}
                            </span>
                        </td>

                        <td class="coluna-acoes-ordem">
                            <div class="acoes-ordem">
                                ${
                                    obterProximaEtapaOrdem(
                                        ordem
                                    )
                                        ? `
                                            <button
                                                class="botao-acao botao-avancar-ordem"
                                                data-avancar-ordem="${escaparHtml(
                                                    ordem.id
                                                )}"
                                                type="button"
                                                title="Avançar para ${escaparHtml(
                                                    obterProximaEtapaOrdem(
                                                        ordem
                                                    ).proximoTexto
                                                )}"
                                                aria-label="Avançar etapa da ordem"
                                            >
                                                ${icone("check")}
                                            </button>
                                        `
                                        : ""
                                }

                                <button
                                    class="botao-acao"
                                    data-editar-ordem="${escaparHtml(
                                        ordem.id
                                    )}"
                                    type="button"
                                    title="Editar ordem"
                                    aria-label="Editar ordem"
                                >
                                    ${icone("edit")}
                                </button>

                                <button
                                    class="botao-acao perigo"
                                    data-excluir-ordem="${escaparHtml(
                                        ordem.id
                                    )}"
                                    type="button"
                                    title="Excluir ordem"
                                    aria-label="Excluir ordem"
                                >
                                    ${icone("trash")}
                                </button>

                                <button
                                    class="botao-acao"
                                    data-imprimir-ordem="${escaparHtml(
                                        ordem.id
                                    )}"
                                    type="button"
                                    title="Imprimir ficha de produção"
                                    aria-label="Imprimir ficha de produção"
                                >
                                    ${icone("file")}
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
| Carregamento
|--------------------------------------------------------------------------
*/

async function carregarOrdensDoServidor(
    {
        mostrarErro = true
    } = {}
) {
    if (!corpoTabelaOrdens) {
        return;
    }

    carregandoOrdens = true;

    renderizarOrdens();

    try {
        const dados =
            await requisicaoApi(
                "/api/ordens"
            );

        ordens =
            Array.isArray(
                dados.ordens
            )
                ? dados.ordens
                : [];
    } catch (erro) {
        ordens = [];

        if (mostrarErro) {
            mostrarNotificacao(
                "Não foi possível carregar as ordens",
                erro.message,
                "erro"
            );
        }
} finally {
    carregandoOrdens = false;

    renderizarOrdens();
    atualizarDashboardOrdens();
}
}

/*
|--------------------------------------------------------------------------
| Cadastro e edição
|--------------------------------------------------------------------------
*/

async function salvarOrdem(
    evento
) {
    evento.preventDefault();

if (
    !String(
        ordemCliente?.value ||
        ""
    ).trim()
) {
    botaoClienteOrdem
        ?.classList.add(
            "invalido"
        );

    if (mensagemClienteOrdem) {
        mensagemClienteOrdem.textContent =
            "Pesquise e selecione um cliente.";

        mensagemClienteOrdem
            .classList.add(
                "erro"
            );
    }

    mostrarNotificacao(
        "Selecione um cliente",
        "Escolha o cliente vinculado à ordem.",
        "aviso"
    );

    abrirMenuClienteOrdem();

    return;
}

if (
    !formularioOrdem.checkValidity()
) {
    formularioOrdem
        .reportValidity();

    return;
}

    if (
        !formularioOrdem.checkValidity()
    ) {
        formularioOrdem
            .reportValidity();

        return;
    }

    if (
    !String(
        ordemLinha?.value ||
        ""
    ).trim()
) {
    botaoLinhaOrdem
        ?.classList.add(
            "invalido"
        );

    if (mensagemLinhaOrdem) {
        mensagemLinhaOrdem.textContent =
            "Selecione pelo menos uma linha.";

        mensagemLinhaOrdem
            .classList.add(
                "erro"
            );
    }

    mostrarNotificacao(
        "Selecione uma linha",
        "Escolha uma ou mais linhas do catálogo para esta ordem.",
        "aviso"
    );

    abrirMenuLinhaOrdem();

    return;
}

    const id =
        String(
            ordemId.value || ""
        ).trim();

    const dados = {
        clienteId:
            ordemCliente.value,

        descricao:
            ordemDescricao.value,

        quantidade:
            Number(
                ordemQuantidade.value
            ),

        linha:
    String(
        ordemLinha.value ||
        ""
    ).trim(),

        prazoEntrega:
            ordemPrazo.value,

        valor:
            "0",

        status:
            ordemStatus.value,

        observacoes:
            ordemObservacoes.value
    };

    const textoBotao =
        botaoSalvarOrdem
            .querySelector("span");

    const textoOriginal =
        textoBotao.textContent;

    botaoSalvarOrdem.disabled =
        true;

    textoBotao.textContent =
        id
            ? "Salvando..."
            : "Criando...";

    try {
        const resposta =
            await requisicaoApi(
                id
                    ? `/api/ordens/${
                        encodeURIComponent(id)
                    }`
                    : "/api/ordens",

                {
                    method:
                        id
                            ? "PUT"
                            : "POST",

                    body:
                        JSON.stringify(
                            dados
                        )
                }
            );

        fecharModalOrdem();

        fecharMenuLinhaOrdem();

        await carregarOrdensDoServidor({
            mostrarErro: false
        });

        mostrarNotificacao(
            id
                ? "Ordem atualizada"
                : "Ordem criada",

            resposta.mensagem ||
            "As informações foram salvas."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível salvar a ordem",
            erro.message,
            "erro"
        );
    } finally {
        botaoSalvarOrdem.disabled =
            false;

        textoBotao.textContent =
            textoOriginal;
    }
}

function editarOrdem(
    id
) {
    const ordem =
        ordens.find(
            item =>
                item.id === id
        );

    if (!ordem) {
        mostrarNotificacao(
            "Ordem não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    abrirModalOrdem(
        ordem
    );
}

async function excluirOrdem(
    id
) {
    const ordem =
        ordens.find(
            item =>
                item.id === id
        );

    if (!ordem) {
        return;
    }

const confirmou =
    await confirmarAcao({
        tipo:
            "perigo",

        titulo:
            `Excluir ${ordem.codigo}?`,

        mensagem:
            [
                `Cliente: ${ordem.clienteNome}`,

                `Serviço: ${ordem.descricao}`,

                "A ordem será excluída permanentemente."
            ].join("\n\n"),

        textoConfirmar:
            "Excluir ordem"
    });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/ordens/${
                    encodeURIComponent(id)
                }`,
                {
                    method: "DELETE"
                }
            );

        await carregarOrdensDoServidor({
            mostrarErro: false
        });

        mostrarNotificacao(
            "Ordem excluída",
            resposta.mensagem ||
            "A ordem foi removida."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível excluir",
            erro.message,
            "erro"
        );
    }
}

/*
|--------------------------------------------------------------------------
| Dashboard das ordens
|--------------------------------------------------------------------------
*/

function obterDataAtualIso() {
    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}

function ordemEstaFinalizada(
    ordem
) {
    return [
        "concluido",
        "entregue",
        "cancelado"
    ].includes(
        ordem.status
    );
}

function ordemEstaAtrasada(
    ordem
) {
    if (
        !ordem.prazoEntrega ||
        ordemEstaFinalizada(ordem)
    ) {
        return false;
    }

    return (
        ordem.prazoEntrega <
        obterDataAtualIso()
    );
}

function ordemFoiConcluidaNesteMes(
    ordem
) {
    if (
        ![
            "concluido",
            "entregue"
        ].includes(
            ordem.status
        )
    ) {
        return false;
    }

    const data =
        new Date(
            ordem.atualizadoEm
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return false;
    }

    const hoje =
        new Date();

    return (
        data.getFullYear() ===
            hoje.getFullYear() &&

        data.getMonth() ===
            hoje.getMonth()
    );
}

function calcularDiasDeAtraso(
    prazo
) {
    const prazoData =
        new Date(
            `${prazo}T00:00:00`
        );

    const hojeTexto =
        obterDataAtualIso();

    const hoje =
        new Date(
            `${hojeTexto}T00:00:00`
        );

    const diferenca =
        hoje.getTime() -
        prazoData.getTime();

    return Math.max(
        0,
        Math.floor(
            diferenca /
            (
                1000 *
                60 *
                60 *
                24
            )
        )
    );
}

function atualizarDashboardOrdens() {
    const ordensAbertas =
        ordens.filter(
            ordem =>
                !ordemEstaFinalizada(
                    ordem
                )
        );

    const ordensProducao =
        ordens.filter(
            ordem =>
                ordem.status ===
                "em-producao"
        );

    const ordensAtrasadas =
        ordens
            .filter(
                ordemEstaAtrasada
            )
            .sort(
                (
                    ordemA,
                    ordemB
                ) =>
                    String(
                        ordemA.prazoEntrega
                    ).localeCompare(
                        String(
                            ordemB.prazoEntrega
                        )
                    )
            );

    cartaoOrdensAtrasadas
    ?.classList.toggle(
        "destaque-atraso",
        ordensAtrasadas.length > 0
    );

    const concluidasMes =
        ordens.filter(
            ordemFoiConcluidaNesteMes
        );

    if (totalOrdensAbertas) {
        totalOrdensAbertas
            .textContent =
                ordensAbertas.length;
    }

    if (totalOrdensProducao) {
        totalOrdensProducao
            .textContent =
                ordensProducao.length;
    }

    if (totalOrdensAtrasadas) {
        totalOrdensAtrasadas
            .textContent =
                ordensAtrasadas.length;
    }

    if (totalOrdensConcluidasMes) {
        totalOrdensConcluidasMes
            .textContent =
                concluidasMes.length;
    }

    if (
        !listaOrdensAtrasadasDashboard
    ) {
        return;
    }

    if (!ordensAtrasadas.length) {
        listaOrdensAtrasadasDashboard
            .innerHTML = `
                <div class="estado-vazio estado-vazio-compacto">
                    <p>
                        Nenhuma ordem atrasada
                    </p>

                    <small>
                        Os serviços estão dentro do prazo.
                    </small>
                </div>
            `;

        return;
    }

    listaOrdensAtrasadasDashboard
        .innerHTML =
            ordensAtrasadas
                .slice(
                    0,
                    5
                )
                .map(
                    ordem => {
                        const diasAtraso =
                            calcularDiasDeAtraso(
                                ordem.prazoEntrega
                            );

                        return `
                            <div class="item-ordem-atrasada">
                                <strong>
                                    ${escaparHtml(
                                        ordem.codigo
                                    )}
                                </strong>

                                <div class="item-ordem-atrasada-cliente">
                                    <strong>
                                        ${escaparHtml(
                                            ordem.clienteNome
                                        )}
                                    </strong>
                                </div>

                                <div class="item-ordem-atrasada-servico">
                                    <strong>
                                        ${escaparHtml(
                                            ordem.descricao
                                        )}
                                    </strong>

                                    <span>
                                        ${escaparHtml(
                                            ordem.quantidade
                                        )}
                                        unidade(s)
                                    </span>
                                </div>

                                <span class="prazo-atrasado">
                                    ${
                                        diasAtraso === 1
                                            ? "1 dia atrasada"
                                            : `${diasAtraso} dias atrasada`
                                    }
                                </span>

                                <button
                                    class="botao-acao"
                                    data-abrir-ordem-dashboard="${escaparHtml(
                                        ordem.id
                                    )}"
                                    type="button"
                                    title="Abrir ordem"
                                >
                                    ${icone("edit")}
                                </button>
                            </div>
                        `;
                    }
                )
                .join("");
}

/*
|--------------------------------------------------------------------------
| Ficha de produção
|--------------------------------------------------------------------------
*/

function imprimirFichaOrdem(
    id
) {
    const ordem =
        ordens.find(
            item =>
                item.id === id
        );

    if (!ordem) {
        mostrarNotificacao(
            "Ordem não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    const cliente =
        clientes.find(
            item =>
                item.id ===
                ordem.clienteId
        );

    const telefone =
        cliente?.telefone ||
        "Não informado";

    const cpf =
        ordem.clienteCpf ||
        cliente?.cpf ||
        "Não informado";

    const arquivoOriginal =
        ordem.arquivoOriginal ||
        cliente?.logoOriginal ||
        "Não enviado";

    const arquivoConvertido =
        ordem.arquivoConvertido ||
        cliente?.logoConvertida ||
        "Não enviado";

    const observacoes =
        ordem.observacoes ||
        "Nenhuma observação cadastrada.";

    const dataImpressao =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(
            new Date()
        );

    const janela =
        window.open(
            "",
            "_blank",
            "width=950,height=750"
        );

    if (!janela) {
        mostrarNotificacao(
            "Janela bloqueada",
            "Permita pop-ups para imprimir a ficha.",
            "aviso"
        );

        return;
    }

    janela.document.write(`
        <!DOCTYPE html>

        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
            >

            <title>
                ${escaparHtml(
                    ordem.codigo
                )} — Ficha de produção
            </title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 38px;

                    color: #111;
                    background: #fff;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                }

                .cabecalho {
                    display: flex;

                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;

                    padding-bottom: 22px;

                    border-bottom: 2px solid #111;
                }

                .cabecalho span {
                    display: block;

                    margin-bottom: 8px;

                    color: #555;

                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .cabecalho h1 {
                    margin: 0;

                    font-size: 28px;
                    line-height: 1.1;
                }

                .codigo {
                    padding: 12px 16px;

                    border: 1px solid #bbb;
                    border-radius: 10px;

                    font-size: 16px;
                    font-weight: 800;

                    white-space: nowrap;
                }

                .grade {
                    display: grid;

                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));

                    gap: 14px;

                    margin-top: 24px;
                }

                .campo {
                    min-height: 78px;
                    padding: 14px;

                    border: 1px solid #ccc;
                    border-radius: 10px;
                }

                .campo-largo {
                    grid-column: 1 / -1;
                }

                .campo span {
                    display: block;

                    margin-bottom: 7px;

                    color: #666;

                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.7px;
                    text-transform: uppercase;
                }

                .campo strong {
                    display: block;

                    font-size: 14px;
                    line-height: 1.5;
                }

                .observacoes {
                    min-height: 120px;

                    white-space: pre-wrap;
                }

                .assinaturas {
                    display: grid;

                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));

                    gap: 50px;

                    margin-top: 70px;
                }

                .assinatura {
                    padding-top: 9px;

                    border-top: 1px solid #111;

                    font-size: 11px;
                    text-align: center;
                }

                .rodape {
                    display: flex;

                    justify-content: space-between;
                    gap: 20px;

                    margin-top: 40px;
                    padding-top: 15px;

                    border-top: 1px solid #ddd;

                    color: #666;

                    font-size: 10px;
                }

                .acoes-impressao {
                    display: flex;

                    justify-content: flex-end;

                    margin-bottom: 22px;
                }

                .acoes-impressao button {
                    padding: 11px 18px;

                    color: #fff;
                    background: #111;

                    border: 0;
                    border-radius: 8px;

                    font-size: 12px;
                    font-weight: 700;

                    cursor: pointer;
                }

                @media print {
                    @page {
                        margin: 15mm;
                    }

                    body {
                        max-width: none;
                        padding: 0;
                    }

                    .acoes-impressao {
                        display: none;
                    }
                }

                @media max-width: 650px {
                    .grade,
                    .assinaturas {
                        grid-template-columns: 1fr;
                    }

                    .campo-largo {
                        grid-column: auto;
                    }
                }
            </style>
        </head>

        <body>
            <div class="acoes-impressao">
                <button
                    type="button"
                    onclick="window.print()"
                >
                    Imprimir ficha
                </button>
            </div>

            <header class="cabecalho">
                <div>
                    <span>
                        Ficha de produção
                    </span>

                    <h1>
                        Ordem de bordado
                    </h1>
                </div>

                <div class="codigo">
                    ${escaparHtml(
                        ordem.codigo
                    )}
                </div>
            </header>

            <main class="grade">
                <div class="campo">
                    <span>Cliente</span>

                    <strong>
                        ${escaparHtml(
                            ordem.clienteNome
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>CPF</span>

                    <strong>
                        ${escaparHtml(
                            cpf
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>Telefone</span>

                    <strong>
                        ${escaparHtml(
                            telefone
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>Status</span>

                    <strong>
                        ${escaparHtml(
                            ordem.statusTexto
                        )}
                    </strong>
                </div>

                <div class="campo campo-largo">
                    <span>Descrição do serviço</span>

                    <strong>
                        ${escaparHtml(
                            ordem.descricao
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>Quantidade</span>

                    <strong>
                        ${escaparHtml(
                            ordem.quantidade
                        )}
                        unidade(s)
                    </strong>
                </div>

                <div class="campo">
                    <span>Linhas utilizadas</span>

<strong>
    ${criarHtmlLinhasOrdem(
        ordem.linha
    )}
</strong>
                </div>

                <div class="campo">
                    <span>Prazo de entrega</span>

                    <strong>
                        ${escaparHtml(
                            formatarPrazoOrdem(
                                ordem.prazoEntrega
                            )
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>Logo original</span>

                    <strong>
                        ${escaparHtml(
                            arquivoOriginal
                        )}
                    </strong>
                </div>

                <div class="campo">
                    <span>Arquivo convertido</span>

                    <strong>
                        ${escaparHtml(
                            arquivoConvertido
                        )}
                    </strong>
                </div>

                <div class="campo campo-largo observacoes">
                    <span>Observações</span>

                    <strong>
                        ${escaparHtml(
                            observacoes
                        )}
                    </strong>
                </div>
            </main>

            <div class="assinaturas">
                <div class="assinatura">
                    Responsável pela produção
                </div>

                <div class="assinatura">
                    Cliente ou responsável
                </div>
            </div>

            <footer class="rodape">
                <span>
                    Gerada em
                    ${escaparHtml(
                        dataImpressao
                    )}
                </span>

                <span>
                    Sistema de Bordado
                </span>
            </footer>

            <script>
                setTimeout(
                    function () {
                        window.focus();
                        window.print();
                    },
                    300
                );
            <\/script>
        </body>
        </html>
    `);

    janela.document.close();
}

/*
|--------------------------------------------------------------------------
| Eventos
|--------------------------------------------------------------------------
*/

botaoNovaOrdem
    ?.addEventListener(
        "click",
        () => abrirModalOrdem()
    );

$$(
    "[data-fechar-ordem]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            fecharModalOrdem
        );
    }
);

botaoLinhaOrdem
    ?.addEventListener(
        "click",
        () => {
            if (
                menuLinhaOrdem?.hidden
            ) {
                abrirMenuLinhaOrdem();
            } else {
                fecharMenuLinhaOrdem();
            }
        }
    );

buscaLinhaOrdem
    ?.addEventListener(
        "input",
        renderizarOpcoesLinhaOrdem
    );

listaLinhasOrdem
    ?.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-valor-linha-ordem]"
                );

            if (!botao) {
                return;
            }

            const valor =
                decodeURIComponent(
                    botao.dataset
                        .valorLinhaOrdem
                );

            selecionarLinhaOrdem(
                valor
            );
        }
    );

linhasSelecionadasOrdem
    ?.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-remover-linha-ordem]"
                );

            if (!botao) {
                return;
            }

            removerLinhaOrdem(
                decodeURIComponent(
                    botao.dataset
                        .removerLinhaOrdem
                )
            );
        }
    );

botaoLimparLinhasOrdem
    ?.addEventListener(
        "click",
        limparLinhasOrdem
    );

botaoConcluirLinhasOrdem
    ?.addEventListener(
        "click",
        () => {
            fecharMenuLinhaOrdem();

            botaoLinhaOrdem
                ?.focus();
        }
    );

document.addEventListener(
    "click",
    evento => {
        if (
            seletorLinhaOrdem &&
            !seletorLinhaOrdem.contains(
                evento.target
            )
        ) {
            fecharMenuLinhaOrdem();
        }
    }
);

botaoVerOrdensDashboard
    ?.addEventListener(
        "click",
        () => {
            navegarPara(
                "ordens"
            );
        }
    );

listaOrdensAtrasadasDashboard
    ?.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-abrir-ordem-dashboard]"
                );

            if (!botao) {
                return;
            }

            const ordem =
                ordens.find(
                    item =>
                        item.id ===
                        botao.dataset
                            .abrirOrdemDashboard
                );

            if (!ordem) {
                return;
            }

            navegarPara(
                "ordens"
            );

            abrirModalOrdem(
                ordem
            );
        }
    );

formularioOrdem
    ?.addEventListener(
        "submit",
        salvarOrdem
    );

botaoClienteOrdem
    ?.addEventListener(
        "click",
        () => {
            if (
                menuClienteOrdem
                    ?.hidden
            ) {
                abrirMenuClienteOrdem();
            } else {
                fecharMenuClienteOrdem();
            }
        }
    );

buscaClienteOrdem
    ?.addEventListener(
        "input",
        renderizarClientesDaOrdem
    );

listaClientesOrdem
    ?.addEventListener(
        "click",
        evento => {
            const opcao =
                evento.target.closest(
                    "[data-cliente-ordem]"
                );

            if (!opcao) {
                return;
            }

            selecionarClienteDaOrdem(
                decodeURIComponent(
                    opcao.dataset
                        .clienteOrdem
                )
            );
        }
    );

document.addEventListener(
    "click",
    evento => {
        if (
            seletorClienteOrdem &&
            !seletorClienteOrdem
                .contains(
                    evento.target
                )
        ) {
            fecharMenuClienteOrdem();
        }
    }
);

buscaOrdens
    ?.addEventListener(
        "input",
        evento => {
            buscaOrdemAtual =
                evento.target.value;

            renderizarOrdens();
        }
    );

filtroStatusOrdens
    ?.addEventListener(
        "change",
        evento => {
            statusOrdemAtual =
                evento.target.value;

            renderizarOrdens();
        }
    );

corpoTabelaOrdens
    ?.addEventListener(
        "click",
        evento => {
            const botaoAvancar =
                evento.target.closest(
                    "[data-avancar-ordem]"
                );

            const botaoImprimir =
                evento.target.closest(
                    "[data-imprimir-ordem]"
                );

            const botaoEditar =
                evento.target.closest(
                    "[data-editar-ordem]"
                );

            const botaoExcluir =
                evento.target.closest(
                    "[data-excluir-ordem]"
                );

            if (botaoAvancar) {
                avancarEtapaOrdem(
                    botaoAvancar.dataset
                        .avancarOrdem,

                    botaoAvancar
                );

                return;
            }

if (botaoImprimir) {
    imprimirFichaOrdem(
        botaoImprimir.dataset
            .imprimirOrdem
    );

    return;
}

if (botaoEditar) {
    editarOrdem(
        botaoEditar.dataset
            .editarOrdem
    );

    return;
}

if (botaoExcluir) {
    excluirOrdem(
        botaoExcluir.dataset
            .excluirOrdem
    );
}
        }
    );

$$(
    '.menu-item[data-secao="ordens"]'
).forEach(
    item => {
        item.addEventListener(
            "click",
            () => {
                carregarOrdensDoServidor({
                    mostrarErro: false
                });
            }
        );
    }
);

document.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key !==
            "Escape"
        ) {
            return;
        }

        if (
            menuClienteOrdem &&
            !menuClienteOrdem.hidden
        ) {
            fecharMenuClienteOrdem();

            botaoClienteOrdem
                ?.focus();

            return;
        }

        if (
            modalOrdem
                ?.classList.contains(
                    "aberto"
                )
        ) {
            fecharModalOrdem();
        }
    }
);

window.addEventListener(
    "permissoes-carregadas",
    () => {
        if (
            modalOrdem
                ?.classList
                .contains(
                    "aberto"
                )
        ) {
            renderizarLogoClienteOrdem();
        }
    }
);window.addEventListener(
    "permissoes-carregadas",
    () => {
        if (
            modalOrdem
                ?.classList
                .contains(
                    "aberto"
                )
        ) {
            renderizarLogoClienteOrdem();
        }
    }
);

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

carregarOrdensDoServidor();