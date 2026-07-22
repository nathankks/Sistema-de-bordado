/*
|--------------------------------------------------------------------------
| Estado das ordens
|--------------------------------------------------------------------------
*/

let ordens = [];
let carregandoOrdens = true;
let buscaOrdemAtual = "";
let statusOrdemAtual = "todos";
let ordemDetalhesAtualId = "";
let cadastrandoClientePelaOrdem = false;

/*
|--------------------------------------------------------------------------
| Alertas de prazo
|--------------------------------------------------------------------------
*/

const DIAS_ANTECEDENCIA_ALERTA_ORDEM =
    2;

let assinaturaUltimoAlertaPrazos =
    "";

/*
|--------------------------------------------------------------------------
| Elementos
|--------------------------------------------------------------------------
*/

const botaoNovaOrdem =
    $("#botaoNovaOrdem");

const modalOrdem =
    $("#modalOrdem");

const modalDetalhesOrdem =
    $("#modalDetalhesOrdem");

const tituloDetalhesOrdem =
    $("#tituloDetalhesOrdem");

const conteudoDetalhesOrdem =
    $("#conteudoDetalhesOrdem");

const botaoFecharDetalhesOrdem =
    $("#botaoFecharDetalhesOrdem");

const statusDetalhesOrdem =
    $("#statusDetalhesOrdem");

const resumoDetalhesOrdem =
    $("#resumoDetalhesOrdem");

const atualizacaoDetalhesOrdem =
    $("#atualizacaoDetalhesOrdem");

const botaoImprimirDetalhesOrdem =
    $("#botaoImprimirDetalhesOrdem");

const botaoEditarDetalhesOrdem =
    $("#botaoEditarDetalhesOrdem");

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

const botaoCadastrarClienteOrdem =
    $("#botaoCadastrarClienteOrdem");

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

const modalAlertaPrazosOrdens =
    $("#modalAlertaPrazosOrdens");

const listaAlertaPrazosOrdens =
    $("#listaAlertaPrazosOrdens");

const quantidadeOrdensAtrasadas =
    $("#quantidadeOrdensAtrasadas");

const quantidadeOrdensProximas =
    $("#quantidadeOrdensProximas");

const botaoFecharAlertaPrazos =
    $("#botaoFecharAlertaPrazos");

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

function criarCartaoArquivoClienteOrdem(
    cliente,
    tipo,
    podeAcessarArquivos
) {
    const original =
        tipo === "original";

    const nomeArquivo =
        String(
            (
                original
                    ? cliente.logoOriginal
                    : cliente.logoConvertida
            ) || ""
        ).trim();

    const urlArquivo =
        String(
            (
                original
                    ? cliente.logoOriginalUrl
                    : cliente.logoConvertidaUrl
            ) || ""
        ).trim();

    const titulo =
        original
            ? "Logo original"
            : "Arquivo convertido";

    const descricao =
        original
            ? "Imagem usada como referência"
            : "Arquivo pronto para bordado";

    const possuiArquivo =
        Boolean(
            nomeArquivo
        );

    const arquivoDisponivel =
        Boolean(
            nomeArquivo &&
            urlArquivo
        );

    /*
     * Arquivo não cadastrado.
     */

    if (!possuiArquivo) {
        return `
            <article
                class="arquivo-cliente-ordem arquivo-cliente-ordem-vazio"
            >
                <span class="logo-cliente-ordem-icone">
                    ${icone(
                        original
                            ? "file"
                            : "check-file"
                    )}
                </span>

                <div class="logo-cliente-ordem-informacoes">
                    <span class="logo-cliente-ordem-etiqueta">
                        ${escaparHtml(
                            titulo
                        )}
                    </span>

                    <strong>
                        Nenhum arquivo cadastrado
                    </strong>

                    <small>
                        ${escaparHtml(
                            descricao
                        )}
                    </small>
                </div>
            </article>
        `;
    }

    const extensao =
        obterExtensaoLogoOrdem(
            nomeArquivo
        );

    const rotuloExtensao =
        obterRotuloExtensaoLogoOrdem(
            nomeArquivo
        );

    const possuiPreview =
        original &&
        arquivoDisponivel &&
        podeAcessarArquivos &&
        logoOrdemEhImagem(
            nomeArquivo
        );

    const podeVisualizar =
        original &&
        arquivoDisponivel &&
        podeAcessarArquivos &&
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
        arquivoDisponivel
            ? `${urlArquivo}${
                urlArquivo.includes("?")
                    ? "&"
                    : "?"
            }download=1`
            : "";

    return `
        <article
            class="arquivo-cliente-ordem ${
                arquivoDisponivel
                    ? "arquivo-cliente-ordem-disponivel"
                    : "arquivo-cliente-ordem-indisponivel"
            }"
        >
            <div class="logo-cliente-ordem-preview">
                ${
                    possuiPreview
                        ? `
                            <img
                                src="${escaparHtml(
                                    urlArquivo
                                )}"
                                alt="${escaparHtml(
                                    titulo
                                )} de ${escaparHtml(
                                    cliente.nome ||
                                    "cliente"
                                )}"
                                data-preview-arquivo-ordem
                                data-extensao-arquivo-ordem="${escaparHtml(
                                    rotuloExtensao
                                )}"
                                loading="lazy"
                            >
                        `
                        : `
                            <span class="logo-cliente-ordem-extensao">
                                ${escaparHtml(
                                    rotuloExtensao
                                )}
                            </span>
                        `
                }
            </div>

            <div class="logo-cliente-ordem-informacoes">
                <span class="logo-cliente-ordem-etiqueta">
                    ${escaparHtml(
                        titulo
                    )}
                </span>

                <strong
                    title="${escaparHtml(
                        nomeArquivo
                    )}"
                >
                    ${escaparHtml(
                        nomeArquivo
                    )}
                </strong>

                <small>
                    ${escaparHtml(
                        descricao
                    )}
                </small>
            </div>

            <div class="logo-cliente-ordem-acoes">
                ${
                    !arquivoDisponivel
                        ? `
                            <span class="logo-cliente-ordem-status">
                                Arquivo indisponível
                            </span>
                        `
                        : !podeAcessarArquivos
                            ? `
                                <span class="logo-cliente-ordem-status">
                                    Sem permissão
                                </span>
                            `
                            : `
                                ${
                                    podeVisualizar
                                        ? `
                                            <a
                                                class="logo-cliente-ordem-botao"
                                                href="${escaparHtml(
                                                    urlArquivo
                                                )}"
                                                target="_blank"
                                                rel="noopener"
                                                title="Visualizar ${escaparHtml(
                                                    titulo.toLowerCase()
                                                )}"
                                            >
                                                ${icone("eye")}

                                                <span>
                                                    Visualizar
                                                </span>
                                            </a>
                                        `
                                        : ""
                                }

                                <a
                                    class="logo-cliente-ordem-botao logo-cliente-ordem-botao-principal"
                                    href="${escaparHtml(
                                        urlDownload
                                    )}"
                                    title="Baixar ${escaparHtml(
                                        titulo.toLowerCase()
                                    )}"
                                >
                                    ${icone("file")}

                                    <span>
                                        Baixar
                                    </span>
                                </a>
                            `
                }
            </div>
        </article>
    `;
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
                    Os arquivos cadastrados aparecerão aqui.
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

    logoClienteOrdem.className =
        "logo-cliente-ordem logo-cliente-ordem-lista";

    logoClienteOrdem.innerHTML = `
        ${criarCartaoArquivoClienteOrdem(
            cliente,
            "original",
            podeAcessarArquivos
        )}

        ${criarCartaoArquivoClienteOrdem(
            cliente,
            "convertido",
            podeAcessarArquivos
        )}
    `;

    /*
     * Mostra a extensão caso a prévia
     * da imagem não carregue.
     */

    logoClienteOrdem
        .querySelectorAll(
            "[data-preview-arquivo-ordem]"
        )
        .forEach(
            imagem => {
                imagem.addEventListener(
                    "error",
                    () => {
                        const preview =
                            imagem.closest(
                                ".logo-cliente-ordem-preview"
                            );

                        if (!preview) {
                            return;
                        }

                        preview.innerHTML = `
                            <span class="logo-cliente-ordem-extensao">
                                ${escaparHtml(
                                    imagem.dataset
                                        .extensaoArquivoOrdem ||
                                    "ARQ"
                                )}
                            </span>
                        `;
                    },
                    {
                        once: true
                    }
                );
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

function formatarDataHoraOrdem(
    valor
) {
    if (!valor) {
        return "Não informado";
    }

    const data =
        new Date(
            valor
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "Não informado";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    ).format(
        data
    );
}

function formatarValorDetalhesOrdem(
    valorCentavos
) {
    const valor =
        Number(
            valorCentavos || 0
        ) / 100;

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL"
        }
    ).format(
        valor
    );
}

function criarArquivoDetalhesOrdem({
    nome,
    tipo,
    clienteId
}) {
    const original =
        tipo ===
        "original";

    const titulo =
        original
            ? "Logo original"
            : "Arquivo convertido";

    const disponivel =
        Boolean(
            nome &&
            clienteId
        );

    const podeBaixar =
        typeof possuiPermissaoSistema !==
            "function" ||

        possuiPermissaoSistema(
            "arquivos.baixar"
        );

    const endereco =
        disponivel
            ? `/api/clientes/${
                encodeURIComponent(
                    clienteId
                )
            }/arquivos/${
                original
                    ? "original"
                    : "convertido"
            }`
            : "";

    return `
        <article
            class="ordem-arquivo ${
                disponivel
                    ? "ordem-arquivo-disponivel"
                    : "ordem-arquivo-ausente"
            }"
        >
            <span class="ordem-arquivo-icone">
                <svg aria-hidden="true">
                    <use href="#${
                        original
                            ? "icon-file"
                            : "icon-check-file"
                    }"></use>
                </svg>
            </span>

            <div class="ordem-arquivo-informacoes">
                <span>
                    ${escaparHtml(
                        titulo
                    )}
                </span>

                <strong>
                    ${escaparHtml(
                        nome ||
                        "Nenhum arquivo enviado"
                    )}
                </strong>
            </div>

            ${
                disponivel &&
                podeBaixar
                    ? `
                        <a
                            class="ordem-arquivo-acao"
                            href="${escaparHtml(
                                endereco
                            )}"
                            target="_blank"
                            rel="noopener"
                            title="Abrir ${escaparHtml(
                                titulo.toLowerCase()
                            )}"
                        >
                            <svg aria-hidden="true">
                                <use href="#icon-eye"></use>
                            </svg>

                            <span>
                                Abrir
                            </span>
                        </a>
                    `
                    : `
                        <span class="ordem-arquivo-status">
                            ${
                                disponivel
                                    ? "Sem permissão"
                                    : "Não enviado"
                            }
                        </span>
                    `
            }
        </article>
    `;
}

function abrirDetalhesOrdem(
    id
) {
    const ordem =
        ordens.find(
            item =>
                item.id === id
        );

    if (
        !ordem ||
        !modalDetalhesOrdem ||
        !conteudoDetalhesOrdem
    ) {
        mostrarNotificacao(
            "Ordem não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    ordemDetalhesAtualId =
        ordem.id;

    /*
     * Cabeçalho
     */

    if (tituloDetalhesOrdem) {
        tituloDetalhesOrdem.textContent =
            ordem.codigo ||
            "Detalhes da ordem";
    }

    if (statusDetalhesOrdem) {
        statusDetalhesOrdem.className =
            `status-ordem status-ordem-${
                ordem.status || ""
            }`;

        statusDetalhesOrdem.textContent =
            ordem.statusTexto ||
            "Status não informado";
    }

    if (resumoDetalhesOrdem) {
        const quantidade =
            Number(
                ordem.quantidade || 0
            );

        resumoDetalhesOrdem.textContent =
            `${
                ordem.clienteNome ||
                "Cliente não informado"
            } · ${quantidade} ${
                quantidade === 1
                    ? "unidade"
                    : "unidades"
            }`;
    }

    if (atualizacaoDetalhesOrdem) {
        atualizacaoDetalhesOrdem.textContent =
            formatarDataHoraOrdem(
                ordem.atualizadoEm
            );
    }

    /*
     * Permissão para editar
     */

    if (botaoEditarDetalhesOrdem) {
        botaoEditarDetalhesOrdem.hidden =
            typeof possuiPermissaoSistema ===
                "function" &&

            !possuiPermissaoSistema(
                "ordens.editar"
            );
    }

    /*
     * Conteúdo
     */

    conteudoDetalhesOrdem.innerHTML = `
        <section class="ordem-resumo-grade">
            <article class="ordem-resumo-item">
                <span class="ordem-resumo-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-check-file"></use>
                    </svg>
                </span>

                <div>
                    <span>
                        Quantidade
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.quantidade ||
                            0
                        )}
                        ${
                            Number(
                                ordem.quantidade
                            ) === 1
                                ? "unidade"
                                : "unidades"
                        }
                    </strong>
                </div>
            </article>

            <article class="ordem-resumo-item">
                <span class="ordem-resumo-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-clock"></use>
                    </svg>
                </span>

                <div>
                    <span>
                        Prazo de entrega
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarPrazoOrdem(
                                ordem.prazoEntrega
                            )
                        )}
                    </strong>
                </div>
            </article>

            <article class="ordem-resumo-item">
                <span class="ordem-resumo-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-file"></use>
                    </svg>
                </span>

                <div>
                    <span>
                        Valor
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarValorDetalhesOrdem(
                                ordem.valorCentavos
                            )
                        )}
                    </strong>
                </div>
            </article>
        </section>

        <section class="ordem-detalhes-secao">
            <header class="ordem-detalhes-secao-cabecalho">
                <span class="ordem-detalhes-secao-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-users"></use>
                    </svg>
                </span>

                <div>
                    <h3>
                        Cliente
                    </h3>

                    <p>
                        Dados do cliente vinculado à ordem.
                    </p>
                </div>
            </header>

            <div class="ordem-detalhes-grade">
                <div class="ordem-detalhe ordem-detalhe-largo">
                    <span>
                        Nome ou razão social
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.clienteNome ||
                            "Não informado"
                        )}
                    </strong>
                </div>

                <div class="ordem-detalhe">
                    <span>
                        CPF ou CNPJ
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.clienteCpf ||
                            "Não informado"
                        )}
                    </strong>
                </div>

                <div class="ordem-detalhe">
                    <span>
                        Número da ordem
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.codigo ||
                            "Não informado"
                        )}
                    </strong>
                </div>
            </div>
        </section>

        <section class="ordem-detalhes-secao">
            <header class="ordem-detalhes-secao-cabecalho">
                <span class="ordem-detalhes-secao-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-linha"></use>
                    </svg>
                </span>

                <div>
                    <h3>
                        Produção
                    </h3>

                    <p>
                        Informações técnicas e materiais utilizados.
                    </p>
                </div>
            </header>

            <div class="ordem-detalhes-grade">
                <div class="ordem-detalhe ordem-detalhe-largo">
                    <span>
                        Descrição do serviço
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.descricao ||
                            "Não informado"
                        )}
                    </strong>
                </div>

                <div class="ordem-detalhe">
                    <span>
                        Quantidade
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.quantidade ||
                            0
                        )}
                        unidade(s)
                    </strong>
                </div>

                <div class="ordem-detalhe">
                    <span>
                        Prazo
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarPrazoOrdem(
                                ordem.prazoEntrega
                            )
                        )}
                    </strong>
                </div>

                <div class="ordem-detalhe ordem-detalhe-largo">
                    <span>
                        Linhas utilizadas
                    </span>

                    <div class="ordem-detalhe-linhas">
                        ${criarHtmlLinhasOrdem(
                            ordem.linha
                        )}
                    </div>
                </div>
            </div>
        </section>

        <section class="ordem-detalhes-secao">
            <header class="ordem-detalhes-secao-cabecalho">
                <span class="ordem-detalhes-secao-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-folder"></use>
                    </svg>
                </span>

                <div>
                    <h3>
                        Arquivos
                    </h3>

                    <p>
                        Arquivos vinculados ao cadastro do cliente.
                    </p>
                </div>
            </header>

            <div class="ordem-arquivos-grade">
                ${criarArquivoDetalhesOrdem({
                    nome:
                        ordem.arquivoOriginal,

                    tipo:
                        "original",

                    clienteId:
                        ordem.clienteId
                })}

                ${criarArquivoDetalhesOrdem({
                    nome:
                        ordem.arquivoConvertido,

                    tipo:
                        "convertido",

                    clienteId:
                        ordem.clienteId
                })}
            </div>
        </section>

        <section class="ordem-detalhes-secao">
            <header class="ordem-detalhes-secao-cabecalho">
                <span class="ordem-detalhes-secao-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-file"></use>
                    </svg>
                </span>

                <div>
                    <h3>
                        Observações
                    </h3>

                    <p>
                        Informações adicionais da ordem.
                    </p>
                </div>
            </header>

            <div class="ordem-observacoes">
                ${
                    escaparHtml(
                        ordem.observacoes ||
                        "Nenhuma observação cadastrada."
                    )
                }
            </div>
        </section>

        <section class="ordem-detalhes-secao ordem-detalhes-secao-final">
            <header class="ordem-detalhes-secao-cabecalho">
                <span class="ordem-detalhes-secao-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-clock"></use>
                    </svg>
                </span>

                <div>
                    <h3>
                        Histórico
                    </h3>

                    <p>
                        Datas de criação e atualização do registro.
                    </p>
                </div>
            </header>

            <div class="ordem-detalhes-grade">
                <div class="ordem-detalhe">
                    <span>
                        Cadastrada em
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarDataHoraOrdem(
                                ordem.criadoEm
                            )
                        )}
                    </strong>
                </div>

                <div class="ordem-detalhe">
                    <span>
                        Atualizada em
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarDataHoraOrdem(
                                ordem.atualizadoEm
                            )
                        )}
                    </strong>
                </div>
            </div>
        </section>
    `;

    modalDetalhesOrdem.classList.add(
        "aberto"
    );

    modalDetalhesOrdem.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(
        () => {
            botaoFecharDetalhesOrdem
                ?.focus();
        },
        50
    );
}

function fecharDetalhesOrdem() {
    modalDetalhesOrdem
        ?.classList.remove(
            "aberto"
        );

    modalDetalhesOrdem
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        "";

    ordemDetalhesAtualId =
        "";
}

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
        data-visualizar-ordem="${escaparHtml(
            ordem.id
        )}"
        type="button"
        title="Visualizar ordem"
        aria-label="Visualizar ordem"
    >
        ${icone("eye")}
    </button>

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

        notificarPrazosDasOrdens();
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

function converterDataIsoEmDias(
    valor
) {
    const correspondencia =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(
                String(
                    valor || ""
                )
            );

    if (!correspondencia) {
        return null;
    }

    const ano =
        Number(
            correspondencia[1]
        );

    const mes =
        Number(
            correspondencia[2]
        );

    const dia =
        Number(
            correspondencia[3]
        );

    const tempo =
        Date.UTC(
            ano,
            mes - 1,
            dia
        );

    if (
        Number.isNaN(
            tempo
        )
    ) {
        return null;
    }

    return Math.floor(
        tempo /
        (
            1000 *
            60 *
            60 *
            24
        )
    );
}

function calcularDiasAtePrazo(
    prazo
) {
    const diaPrazo =
        converterDataIsoEmDias(
            prazo
        );

    const diaAtual =
        converterDataIsoEmDias(
            obterDataAtualIso()
        );

    if (
        diaPrazo === null ||
        diaAtual === null
    ) {
        return null;
    }

    return (
        diaPrazo -
        diaAtual
    );
}

function ordemEstaPertoDeAtrasar(
    ordem
) {
    if (
        !ordem.prazoEntrega ||
        ordemEstaFinalizada(
            ordem
        ) ||
        ordemEstaAtrasada(
            ordem
        )
    ) {
        return false;
    }

    const diasRestantes =
        calcularDiasAtePrazo(
            ordem.prazoEntrega
        );

    return (
        diasRestantes !== null &&
        diasRestantes >= 0 &&
        diasRestantes <=
            DIAS_ANTECEDENCIA_ALERTA_ORDEM
    );
}

function resumirCodigosOrdens(
    lista
) {
    const codigos =
        lista
            .slice(
                0,
                3
            )
            .map(
                ordem =>
                    ordem.codigo
            )
            .filter(
                Boolean
            );

    if (!codigos.length) {
        return "";
    }

    const restantes =
        lista.length -
        codigos.length;

    return [
        codigos.join(
            ", "
        ),

        restantes > 0
            ? `e mais ${restantes}`
            : ""
    ]
        .filter(
            Boolean
        )
        .join(
            " "
        );
}

function criarItemAlertaPrazoOrdem(
    ordem
) {
    const diasRestantes =
        calcularDiasAtePrazo(
            ordem.prazoEntrega
        );

    const atrasada =
        diasRestantes !== null &&
        diasRestantes < 0;

    let textoPrazo =
        "Prazo não informado";

    if (diasRestantes === 0) {
        textoPrazo =
            "Vence hoje";
    } else if (diasRestantes === 1) {
        textoPrazo =
            "Vence amanhã";
    } else if (
        diasRestantes !== null &&
        diasRestantes > 1
    ) {
        textoPrazo =
            `Vence em ${diasRestantes} dias`;
    } else if (diasRestantes === -1) {
        textoPrazo =
            "Atrasada há 1 dia";
    } else if (
        diasRestantes !== null &&
        diasRestantes < -1
    ) {
        textoPrazo =
            `Atrasada há ${Math.abs(
                diasRestantes
            )} dias`;
    }

    return `
        <article
            class="alerta-prazo-ordem ${
                atrasada
                    ? "alerta-prazo-ordem-atrasada"
                    : "alerta-prazo-ordem-proxima"
            }"
        >
            <div class="alerta-prazo-ordem-principal">
                <div class="alerta-prazo-ordem-identificacao">
                    <strong>
                        ${escaparHtml(
                            ordem.codigo ||
                            "Ordem sem código"
                        )}
                    </strong>

                    <span>
                        ${escaparHtml(
                            ordem.clienteNome ||
                            "Cliente não informado"
                        )}
                    </span>
                </div>

                <span
                    class="alerta-prazo-situacao ${
                        atrasada
                            ? "atrasada"
                            : "proxima"
                    }"
                >
                    ${escaparHtml(
                        textoPrazo
                    )}
                </span>
            </div>

            <div class="alerta-prazo-ordem-detalhes">
                <div>
                    <span>
                        Entrega
                    </span>

                    <strong>
                        ${escaparHtml(
                            formatarPrazoOrdem(
                                ordem.prazoEntrega
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Status
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.statusTexto ||
                            "Não informado"
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Quantidade
                    </span>

                    <strong>
                        ${escaparHtml(
                            ordem.quantidade ||
                            0
                        )}
                    </strong>
                </div>
            </div>

                        <div class="alerta-prazo-ordem-acoes">
                <button
                    class="botao-abrir-ordem-alerta"
                    data-abrir-ordem-alerta="${escaparHtml(
                        ordem.id
                    )}"
                    type="button"
                    aria-label="Abrir ${escaparHtml(
                        ordem.codigo ||
                        "ordem"
                    )}"
                >
                    <svg aria-hidden="true">
                        <use href="#icon-eye"></use>
                    </svg>

                    <span>
                        Abrir ordem
                    </span>
                </button>
            </div>

        </article>
    `;
}

function fecharAlertaPrazosOrdens() {
    modalAlertaPrazosOrdens
        ?.classList.remove(
            "aberto"
        );

    modalAlertaPrazosOrdens
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        "";
}

function abrirAlertaPrazosOrdens(
    atrasadas,
    proximasDoPrazo
) {
    if (
        !modalAlertaPrazosOrdens ||
        !listaAlertaPrazosOrdens
    ) {
        return;
    }

    const todasAsOrdens = [
        ...atrasadas,
        ...proximasDoPrazo
    ];

    if (quantidadeOrdensAtrasadas) {
        quantidadeOrdensAtrasadas.textContent =
            String(
                atrasadas.length
            );
    }

    if (quantidadeOrdensProximas) {
        quantidadeOrdensProximas.textContent =
            String(
                proximasDoPrazo.length
            );
    }

    listaAlertaPrazosOrdens.innerHTML =
        todasAsOrdens
            .map(
                criarItemAlertaPrazoOrdem
            )
            .join("");

    modalAlertaPrazosOrdens.classList.add(
        "aberto"
    );

    modalAlertaPrazosOrdens.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(
        () => {
            botaoFecharAlertaPrazos
                ?.focus();
        },
        50
    );
}

function notificarPrazosDasOrdens() {
    const atrasadas =
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

    const proximasDoPrazo =
        ordens
            .filter(
                ordemEstaPertoDeAtrasar
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

    const assinatura = [
        ...atrasadas.map(
            ordem =>
                `atrasada:${
                    ordem.id
                }:${
                    ordem.prazoEntrega
                }`
        ),

        ...proximasDoPrazo.map(
            ordem =>
                `proxima:${
                    ordem.id
                }:${
                    ordem.prazoEntrega
                }`
        )
    ]
        .sort()
        .join("|");

    if (!assinatura) {
        assinaturaUltimoAlertaPrazos =
            "";

        return;
    }

    if (
        assinatura ===
        assinaturaUltimoAlertaPrazos
    ) {
        return;
    }

    assinaturaUltimoAlertaPrazos =
        assinatura;

    abrirAlertaPrazosOrdens(
        atrasadas,
        proximasDoPrazo
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

$$(
    "[data-fechar-detalhes-ordem]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            fecharDetalhesOrdem
        );
    }
);

$$(
    "[data-fechar-alerta-prazos]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            fecharAlertaPrazosOrdens
        );
    }
);

listaAlertaPrazosOrdens
    ?.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-abrir-ordem-alerta]"
                );

            if (!botao) {
                return;
            }

            const ordemId =
                botao.dataset
                    .abrirOrdemAlerta;

            const ordem =
                ordens.find(
                    item =>
                        item.id ===
                        ordemId
                );

            if (!ordem) {
                mostrarNotificacao(
                    "Ordem não encontrada",
                    "Atualize a página e tente novamente.",
                    "erro"
                );

                return;
            }

            fecharAlertaPrazosOrdens();

            setTimeout(
                () => {
                    abrirDetalhesOrdem(
                        ordem.id
                    );
                },
                120
            );
        }
    );

botaoImprimirDetalhesOrdem
    ?.addEventListener(
        "click",
        () => {
            if (
                !ordemDetalhesAtualId
            ) {
                return;
            }

            imprimirFichaOrdem(
                ordemDetalhesAtualId
            );
        }
    );

botaoEditarDetalhesOrdem
    ?.addEventListener(
        "click",
        () => {
            const id =
                ordemDetalhesAtualId;

            if (!id) {
                return;
            }

            fecharDetalhesOrdem();

            editarOrdem(
                id
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

botaoCadastrarClienteOrdem
    ?.addEventListener(
        "click",
        () => {
            if (
                !possuiPermissaoSistema(
                    "clientes.criar"
                )
            ) {
                mostrarNotificacao(
                    "Acesso negado",
                    "Você não possui permissão para cadastrar clientes.",
                    "aviso"
                );

                return;
            }

            fecharMenuClienteOrdem();

            cadastrandoClientePelaOrdem =
                true;

            modalCliente
                ?.classList.add(
                    "modal-cliente-sobre-ordem"
                );

            abrirModalCliente();
        }
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

            const botaoVisualizar =
            evento.target.closest(
            "[data-visualizar-ordem]"
            );

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

            if (botaoVisualizar) {
            abrirDetalhesOrdem(
            botaoVisualizar.dataset
            .visualizarOrdem
            );

            return;
            }

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
    modalAlertaPrazosOrdens
        ?.classList.contains(
            "aberto"
        )
) {
    fecharAlertaPrazosOrdens();

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
        modalDetalhesOrdem
        ?.classList.contains(
            "aberto"
        )
        ) {
        fecharDetalhesOrdem();

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
    "cliente-salvo",
    evento => {
        if (
            !cadastrandoClientePelaOrdem
        ) {
            return;
        }

        const cliente =
            evento.detail?.cliente;

        if (!cliente?.id) {
            return;
        }

        selecionarClienteDaOrdem(
            cliente.id
        );

        if (mensagemClienteOrdem) {
            mensagemClienteOrdem.textContent =
                "Cliente cadastrado e selecionado na ordem.";
        }
    }
);

window.addEventListener(
    "modal-cliente-fechado",
    () => {
        if (
            !cadastrandoClientePelaOrdem
        ) {
            return;
        }

        cadastrandoClientePelaOrdem =
            false;

        modalCliente
            ?.classList.remove(
                "modal-cliente-sobre-ordem"
            );

        if (
            modalOrdem
                ?.classList.contains(
                    "aberto"
                )
        ) {
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
