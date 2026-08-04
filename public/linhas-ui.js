/*
|--------------------------------------------------------------------------
| Estado do catálogo
|--------------------------------------------------------------------------
*/

let linhasCatalogo = [];
let carregandoLinhasCatalogo = true;
let linhaMovimentacaoAtualId = "";
let tipoMovimentacaoLinhaAtual = "entrada";
let dadosMovimentacaoLinhaAtual = null;
let salvandoMovimentacaoLinha = false;

/*
|--------------------------------------------------------------------------
| Integração com outros formulários
|--------------------------------------------------------------------------
*/

window.catalogoLinhasCarregado =
    false;

window.obterLinhasAtivasCatalogo =
    function () {
        return [...linhasCatalogo]
            .filter(
                linha =>
                    linha.ativo
            )
            .sort(
                (
                    linhaA,
                    linhaB
                ) => {
                    const marca =
                        String(
                            linhaA.marca || ""
                        ).localeCompare(
                            String(
                                linhaB.marca || ""
                            ),
                            "pt-BR"
                        );

                    if (marca !== 0) {
                        return marca;
                    }

                    return String(
                        linhaA.codigo || ""
                    ).localeCompare(
                        String(
                            linhaB.codigo || ""
                        ),
                        "pt-BR",
                        {
                            numeric: true
                        }
                    );
                }
            );
    };

let buscaLinhaAtual = "";
let filtroEstoqueLinhaAtual = "todos";
let filtroAtivoLinhaAtual = "todos";

/*
|--------------------------------------------------------------------------
| Elementos
|--------------------------------------------------------------------------
*/

const botaoNovaLinha =
    $("#botaoNovaLinha");

const modalLinhaCatalogo =
    $("#modalLinhaCatalogo");

const formularioLinhaCatalogo =
    $("#formularioLinhaCatalogo");

const tituloModalLinhaCatalogo =
    $("#tituloModalLinhaCatalogo");

const linhaCatalogoId =
    $("#linhaCatalogoId");

const linhaMarca =
    $("#linhaMarca");

const linhaCodigo =
    $("#linhaCodigo");

const linhaNome =
    $("#linhaNome");

const linhaFornecedor =
    $("#linhaFornecedor");

const linhaValor =
    $("#linhaValor");

const linhaCor =
    $("#linhaCor");

const textoCorLinha =
    $("#textoCorLinha");

const linhaUnidade =
    $("#linhaUnidade");

const linhaEstoque =
    $("#linhaEstoque");

const campoEstoqueLinhaCatalogo =
    $("#campoEstoqueLinhaCatalogo");

const rotuloEstoqueLinhaCatalogo =
    $("#rotuloEstoqueLinhaCatalogo");

const ajudaEstoqueLinhaCatalogo =
    $("#ajudaEstoqueLinhaCatalogo");

const linhaEstoqueMinimo =
    $("#linhaEstoqueMinimo");

const linhaAtiva =
    $("#linhaAtiva");

const linhaObservacoes =
    $("#linhaObservacoes");

const botaoSalvarLinha =
    $("#botaoSalvarLinha");

const buscaCatalogoLinhas =
    $("#buscaCatalogoLinhas");

const filtroEstoqueLinhas =
    $("#filtroEstoqueLinhas");

const filtroAtivoLinhas =
    $("#filtroAtivoLinhas");

const quantidadeLinhasCatalogo =
    $("#quantidadeLinhasCatalogo");

const corpoTabelaLinhas =
    $("#corpoTabelaLinhas");

const totalLinhasAtivas =
    $("#totalLinhasAtivas");

const totalLinhasDisponiveis =
    $("#totalLinhasDisponiveis");

const totalLinhasEstoqueBaixo =
    $("#totalLinhasEstoqueBaixo");

const totalLinhasZeradas =
    $("#totalLinhasZeradas");

const modalMovimentacaoLinha =
    $("#modalMovimentacaoLinha");

const tituloMovimentacaoLinha =
    $("#tituloMovimentacaoLinha");

const subtituloMovimentacaoLinha =
    $("#subtituloMovimentacaoLinha");

const amostraMovimentacaoLinha =
    $("#amostraMovimentacaoLinha");

const marcaCodigoMovimentacaoLinha =
    $("#marcaCodigoMovimentacaoLinha");

const nomeMovimentacaoLinha =
    $("#nomeMovimentacaoLinha");

const estoqueAtualMovimentacaoLinha =
    $("#estoqueAtualMovimentacaoLinha");

const formularioMovimentacaoLinha =
    $("#formularioMovimentacaoLinha");

const movimentacaoLinhaId =
    $("#movimentacaoLinhaId");

const movimentacaoLinhaTipo =
    $("#movimentacaoLinhaTipo");

const quantidadeMovimentacaoLinha =
    $("#quantidadeMovimentacaoLinha");

const rotuloQuantidadeMovimentacaoLinha =
    $("#rotuloQuantidadeMovimentacaoLinha");

const ajudaQuantidadeMovimentacaoLinha =
    $("#ajudaQuantidadeMovimentacaoLinha");

const campoOrdemMovimentacaoLinha =
    $("#campoOrdemMovimentacaoLinha");

const ordemMovimentacaoLinha =
    $("#ordemMovimentacaoLinha");

const ajudaOrdemMovimentacaoLinha =
    $("#ajudaOrdemMovimentacaoLinha");

const motivoMovimentacaoLinha =
    $("#motivoMovimentacaoLinha");

const observacoesMovimentacaoLinha =
    $("#observacoesMovimentacaoLinha");

const previsaoMovimentacaoLinha =
    $("#previsaoMovimentacaoLinha");

const botaoSalvarMovimentacaoLinha =
    $("#botaoSalvarMovimentacaoLinha");

const quantidadeMovimentacoesLinha =
    $("#quantidadeMovimentacoesLinha");

const listaMovimentacoesLinha =
    $("#listaMovimentacoesLinha");

/*
|--------------------------------------------------------------------------
| Formatação
|--------------------------------------------------------------------------
*/

function formatarQuantidadeLinha(
    valor
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(
        Number(valor || 0)
    );
}

function formatarUnidadeLinha(
    unidade,
    quantidade
) {
    const unidades = {
        cone: [
            "cone",
            "cones"
        ],

        carretel: [
            "carretel",
            "carretéis"
        ],

        metro: [
            "metro",
            "metros"
        ],

        unidade: [
            "unidade",
            "unidades"
        ]
    };

    const opcoes =
        unidades[unidade] ||
        unidades.unidade;

    return Number(quantidade) === 1
        ? opcoes[0]
        : opcoes[1];
}

function converterValorLinhaParaNumero(
    valor
) {
    let texto =
        String(
            valor ?? ""
        )
            .trim()
            .replace(
                /R\$/gi,
                ""
            )
            .replace(
                /\s/g,
                ""
            )
            .replace(
                /[^\d,.-]/g,
                ""
            );

    if (!texto) {
        return 0;
    }

    /*
     * Formato brasileiro:
     * 1.234,56 vira 1234.56.
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
        Number(
            texto
        );

    if (
        !Number.isFinite(
            numero
        ) ||
        numero < 0
    ) {
        return 0;
    }

    return numero;
}

function formatarCampoValorLinha(
    valor
) {
    const texto =
        String(
            valor ?? ""
        ).trim();

    if (!texto) {
        return "";
    }

    const numero =
        converterValorLinhaParaNumero(
            texto
        );

    return new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        numero
    );
}

function formatarMoedaLinha(
    valorCentavos
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(
        Number(
            valorCentavos || 0
        ) / 100
    );
}

function obterTextoStatusEstoque(
    linha
) {
    if (
        linha.statusEstoque ===
        "zerado"
    ) {
        return "Estoque zerado";
    }

    if (
        linha.statusEstoque ===
        "baixo"
    ) {
        return "Estoque baixo";
    }

    return "Disponível";
}

/*
|--------------------------------------------------------------------------
| Filtros
|--------------------------------------------------------------------------
*/

function filtrarCatalogoLinhas() {
    const busca =
        normalizarTexto(
            buscaLinhaAtual
        );

    return linhasCatalogo.filter(
        linha => {
            const correspondeBusca =
                !busca ||
                [
                    linha.marca,
                    linha.codigo,
                    linha.nome,
                    linha.fornecedor,
                    linha.corHex
                ].some(
                    valor =>
                        normalizarTexto(
                            valor
                        ).includes(
                            busca
                        )
                );

            const correspondeEstoque =
                filtroEstoqueLinhaAtual ===
                    "todos" ||
                linha.statusEstoque ===
                    filtroEstoqueLinhaAtual;

            const correspondeAtivo =
                filtroAtivoLinhaAtual ===
                    "todos" ||

                (
                    filtroAtivoLinhaAtual ===
                        "ativos" &&
                    linha.ativo
                ) ||

                (
                    filtroAtivoLinhaAtual ===
                        "inativos" &&
                    !linha.ativo
                );

            return (
                correspondeBusca &&
                correspondeEstoque &&
                correspondeAtivo
            );
        }
    );
}

/*
|--------------------------------------------------------------------------
| Resumo
|--------------------------------------------------------------------------
*/

function atualizarResumoCatalogoLinhas() {
    const ativas =
        linhasCatalogo.filter(
            linha =>
                linha.ativo
        );

    const disponiveis =
        ativas.filter(
            linha =>
                linha.statusEstoque ===
                "disponivel"
        );

    const baixo =
        ativas.filter(
            linha =>
                linha.statusEstoque ===
                "baixo"
        );

    const zeradas =
        ativas.filter(
            linha =>
                linha.statusEstoque ===
                "zerado"
        );

    if (totalLinhasAtivas) {
        totalLinhasAtivas.textContent =
            ativas.length;
    }

    if (totalLinhasDisponiveis) {
        totalLinhasDisponiveis.textContent =
            disponiveis.length;
    }

    if (totalLinhasEstoqueBaixo) {
        totalLinhasEstoqueBaixo.textContent =
            baixo.length;
    }

    if (totalLinhasZeradas) {
        totalLinhasZeradas.textContent =
            zeradas.length;
    }
}

/*
|--------------------------------------------------------------------------
| Tabela
|--------------------------------------------------------------------------
*/

function renderizarCatalogoLinhas() {
    if (
        !corpoTabelaLinhas ||
        !quantidadeLinhasCatalogo
    ) {
        return;
    }

    if (carregandoLinhasCatalogo) {
        quantidadeLinhasCatalogo
            .textContent =
                "Carregando...";

        corpoTabelaLinhas.innerHTML = `
            <tr>
                <td colspan="7">
                    ${htmlCarregando()}
                </td>
            </tr>
        `;

        return;
    }

    const lista =
        filtrarCatalogoLinhas();

    quantidadeLinhasCatalogo
        .textContent =
            `${lista.length} ${
                lista.length === 1
                    ? "linha"
                    : "linhas"
            }`;

    if (!lista.length) {
        const possuiFiltro =
            Boolean(
                buscaLinhaAtual.trim()
            ) ||
            filtroEstoqueLinhaAtual !==
                "todos" ||
            filtroAtivoLinhaAtual !==
                "todos";

        corpoTabelaLinhas.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="estado-vazio">
                        <div class="estado-vazio-icone">
                            ${icone(
                                possuiFiltro
                                    ? "search"
                                    : "file"
                            )}
                        </div>

                        <p>
                            ${
                                possuiFiltro
                                    ? "Nenhuma linha encontrada"
                                    : "Nenhuma linha cadastrada"
                            }
                        </p>

                        <small>
                            ${
                                possuiFiltro
                                    ? "Altere a busca ou os filtros."
                                    : "Clique em “Nova linha” para cadastrar a primeira cor."
                            }
                        </small>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    corpoTabelaLinhas.innerHTML =
        lista
            .map(
                linha => `
                    <tr class="${
                        linha.ativo
                            ? ""
                            : "linha-inativa"
                    }">
                        <td>
                            <span
                                class="amostra-cor-linha"
                                style="--cor-linha: ${
                                    escaparHtml(
                                        linha.corHex ||
                                        "#777777"
                                    )
                                }"
                                title="${escaparHtml(
                                    linha.corHex ||
                                    "Cor não informada"
                                )}"
                            ></span>
                        </td>

                        <td>
                            <div class="dados-linha-catalogo">
                                <strong>
                                    ${escaparHtml(
                                        linha.nome
                                    )}
                                </strong>

<span>
    ${escaparHtml(
        linha.marca
    )}

    ${
        linha.fornecedor
            ? `
                ·
                ${escaparHtml(
                    linha.fornecedor
                )}
            `
            : ""
    }

    ${
        linha.ativo
            ? ""
            : " · Inativa"
    }
</span>
                            </div>
                        </td>

                        <td>
                            <strong>
                                ${escaparHtml(
                                    linha.codigo
                                )}
                            </strong>
                        </td>

                        <td>
                            <div class="dados-linha-catalogo">
                                <strong>
                                    ${escaparHtml(
                                        formatarQuantidadeLinha(
                                            linha.estoque
                                        )
                                    )}

                                    ${escaparHtml(
                                        formatarUnidadeLinha(
                                            linha.unidade,
                                            linha.estoque
                                        )
                                    )}
                                </strong>

                                <span>
                                    Mínimo:
                                    ${escaparHtml(
                                        formatarQuantidadeLinha(
                                            linha.estoqueMinimo
                                        )
                                    )}
                                </span>

                                ${
    Number(
        linha.valorCentavos || 0
    ) > 0
        ? `
            <span>
                Valor:
                ${escaparHtml(
                    formatarMoedaLinha(
                        linha.valorCentavos
                    )
                )}
            </span>
        `
        : ""
}

                            </div>
                        </td>

                        <td>
                            <span
                                class="status-estoque-linha ${escaparHtml(
                                    linha.statusEstoque
                                )}"
                            >
                                ${escaparHtml(
                                    obterTextoStatusEstoque(
                                        linha
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            ${escaparHtml(
                                formatarData(
                                    linha.atualizadoEm
                                )
                            )}
                        </td>

                        <td>
                            <div class="acoes-linha-catalogo">
                                    <button
                                        class="botao-acao movimentar-estoque"
                                        data-movimentar-linha="${escaparHtml(
                                            linha.id
                                        )}"
                                        type="button"
                                        title="Movimentar estoque"
                                    >
                                        ${icone("arrow-right")}
                                    </button>

                                    <button
                                        class="botao-acao"
                                        data-editar-linha="${escaparHtml(
                                            linha.id
                                        )}"
                                    type="button"
                                    title="Editar linha"
                                >
                                    ${icone("edit")}
                                </button>

                                <button
                                    class="botao-acao perigo"
                                    data-excluir-linha="${escaparHtml(
                                        linha.id
                                    )}"
                                    type="button"
                                    title="Excluir linha"
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
| Carregamento
|--------------------------------------------------------------------------
*/

async function carregarCatalogoLinhas({
    mostrarErro = true
} = {}) {
    carregandoLinhasCatalogo =
        true;

    renderizarCatalogoLinhas();

    try {
        const resposta =
            await requisicaoApi(
                "/api/linhas"
            );

        linhasCatalogo =
            Array.isArray(
                resposta.linhas
            )
                ? resposta.linhas
                : [];
    } catch (erro) {
        linhasCatalogo = [];

        if (mostrarErro) {
            mostrarNotificacao(
                "Não foi possível carregar as linhas",
                erro.message,
                "erro"
            );
        }
} finally {
    carregandoLinhasCatalogo =
        false;

    window.catalogoLinhasCarregado =
        true;

    atualizarResumoCatalogoLinhas();
    renderizarCatalogoLinhas();

    /*
     * Atualiza também o campo do
     * cadastro de clientes.
     */
    window
        .atualizarSelectLinhasCliente
        ?.();
}
}

/*
|--------------------------------------------------------------------------
| Movimentações de estoque
|--------------------------------------------------------------------------
*/

function encontrarLinhaCatalogo(
    id
) {
    return linhasCatalogo.find(
        linha =>
            String(
                linha.id
            ) ===
            String(
                id || ""
            )
    ) || null;
}

function formatarDataHoraMovimentacaoLinha(
    valor
) {
    const data =
        new Date(
            valor
        );

    if (
        !valor ||
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "Data não informada";
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

function fecharModalMovimentacaoLinha() {
    modalMovimentacaoLinha
        ?.classList.remove(
            "aberto"
        );

    modalMovimentacaoLinha
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        "";

    linhaMovimentacaoAtualId =
        "";

    dadosMovimentacaoLinhaAtual =
        null;

    formularioMovimentacaoLinha
        ?.reset();
}

function obterEstoqueAtualMovimentacaoLinha() {
    return Number(
        dadosMovimentacaoLinhaAtual
            ?.linha
            ?.estoque ||
        0
    );
}

function atualizarPrevisaoMovimentacaoLinha() {
    if (
        !previsaoMovimentacaoLinha ||
        !quantidadeMovimentacaoLinha
    ) {
        return;
    }

    const estoqueAtual =
        obterEstoqueAtualMovimentacaoLinha();

    const quantidade =
        Number(
            quantidadeMovimentacaoLinha
                .value
        );

    const unidade =
        dadosMovimentacaoLinhaAtual
            ?.linha
            ?.unidade ||
        "unidade";

    if (
        !Number.isFinite(
            quantidade
        ) ||
        quantidade < 0 ||
        (
            tipoMovimentacaoLinhaAtual !==
                "ajuste" &&
            quantidade <= 0
        )
    ) {
        previsaoMovimentacaoLinha.className =
            "previsao-movimentacao-linha";

        previsaoMovimentacaoLinha.innerHTML = `
            <span>
                Saldo após a movimentação
            </span>

            <strong>—</strong>
        `;

        return;
    }

    let estoquePosterior =
        estoqueAtual;

    if (
        tipoMovimentacaoLinhaAtual ===
        "entrada"
    ) {
        estoquePosterior +=
            quantidade;
    } else if (
        tipoMovimentacaoLinhaAtual ===
        "saida"
    ) {
        estoquePosterior -=
            quantidade;
    } else {
        estoquePosterior =
            quantidade;
    }

    const invalida =
        estoquePosterior < 0;

    previsaoMovimentacaoLinha.className =
        `previsao-movimentacao-linha${
            invalida
                ? " invalida"
                : " valida"
        }`;

    previsaoMovimentacaoLinha.innerHTML = `
        <span>
            ${
                invalida
                    ? "Movimentação inválida"
                    : "Saldo após a movimentação"
            }
        </span>

        <strong>
            ${
                invalida
                    ? "Saída maior que o estoque"
                    : `${escaparHtml(
                        formatarQuantidadeLinha(
                            estoquePosterior
                        )
                    )} ${escaparHtml(
                        formatarUnidadeLinha(
                            unidade,
                            estoquePosterior
                        )
                    )}`
            }
        </strong>
    `;
}

function obterOrdemMovimentacaoLinhaSelecionada() {
    const id =
        String(
            ordemMovimentacaoLinha
                ?.value ||
            ""
        );

    return dadosMovimentacaoLinhaAtual
        ?.ordensDisponiveis
        ?.find(
            ordem =>
                String(
                    ordem.id
                ) === id
        ) ||
        null;
}

function renderizarOrdensMovimentacaoLinha(
    ordens
) {
    if (!ordemMovimentacaoLinha) {
        return;
    }

    const valorAtual =
        ordemMovimentacaoLinha.value;

    const lista =
        Array.isArray(
            ordens
        )
            ? ordens
            : [];

    ordemMovimentacaoLinha.innerHTML = `
        <option value="">
            Saída sem ordem vinculada
        </option>

        ${lista
            .map(
                ordem => {
                    const consumido =
                        Number(
                            ordem
                                .quantidadeConsumida ||
                            0
                        );

                    const complemento =
                        consumido > 0
                            ? ` · já retirado ${formatarQuantidadeLinha(
                                consumido
                            )}`
                            : "";

                    return `
                        <option
                            value="${escaparHtml(
                                ordem.id
                            )}"
                        >
                            ${escaparHtml(
                                `${ordem.numeroTexto} · ${ordem.clienteNome} · ${ordem.statusTexto}${complemento}`
                            )}
                        </option>
                    `;
                }
            )
            .join("")}
    `;

    if (
        lista.some(
            ordem =>
                String(
                    ordem.id
                ) ===
                String(
                    valorAtual
                )
        )
    ) {
        ordemMovimentacaoLinha.value =
            valorAtual;
    }

    if (
        typeof window
            .atualizarSelectPadraoSistema ===
        "function"
    ) {
        window
            .atualizarSelectPadraoSistema(
                ordemMovimentacaoLinha
            );
    }

    ajudaOrdemMovimentacaoLinha
        .textContent =
            lista.length
                ? "Selecione a ordem que utilizou esta linha ou deixe sem vínculo."
                : "Nenhuma ordem de produção utiliza esta linha no momento.";
}

function atualizarMotivoOrdemMovimentacaoLinha() {
    if (
        tipoMovimentacaoLinhaAtual !==
            "saida" ||
        !motivoMovimentacaoLinha
    ) {
        return;
    }

    const ordem =
        obterOrdemMovimentacaoLinhaSelecionada();

    const motivoAtual =
        String(
            motivoMovimentacaoLinha
                .value ||
            ""
        ).trim();

    if (!ordem) {
        if (
            motivoAtual.startsWith(
                "Consumo na produção da ordem"
            )
        ) {
            motivoMovimentacaoLinha.value =
                "";
        }

        return;
    }

    if (
        !motivoAtual ||
        motivoAtual ===
            "Uso na produção" ||
        motivoAtual.startsWith(
            "Consumo na produção da ordem"
        )
    ) {
        motivoMovimentacaoLinha.value =
            `Consumo na produção da ordem ${ordem.numeroTexto}`;
    }
}

function selecionarTipoMovimentacaoLinha(
    tipo
) {
    const tiposValidos =
        new Set([
            "entrada",
            "saida",
            "ajuste"
        ]);

    tipoMovimentacaoLinhaAtual =
        tiposValidos.has(
            tipo
        )
            ? tipo
            : "entrada";

    movimentacaoLinhaTipo.value =
        tipoMovimentacaoLinhaAtual;

    const vinculacaoOrdemDisponivel =
        tipoMovimentacaoLinhaAtual ===
        "saida";

    if (campoOrdemMovimentacaoLinha) {
        campoOrdemMovimentacaoLinha.hidden =
            !vinculacaoOrdemDisponivel;
    }

    if (ordemMovimentacaoLinha) {
        ordemMovimentacaoLinha.disabled =
            !vinculacaoOrdemDisponivel;

        if (!vinculacaoOrdemDisponivel) {
            ordemMovimentacaoLinha.value =
                "";
        }

        if (
            typeof window
                .atualizarSelectPadraoSistema ===
            "function"
        ) {
            window
                .atualizarSelectPadraoSistema(
                    ordemMovimentacaoLinha
                );
        }
    }

    if (
        !vinculacaoOrdemDisponivel &&
        String(
            motivoMovimentacaoLinha
                ?.value ||
            ""
        )
            .trim()
            .startsWith(
                "Consumo na produção da ordem"
            )
    ) {
        motivoMovimentacaoLinha.value =
            "";
    }

    modalMovimentacaoLinha
        ?.querySelectorAll(
            "[data-tipo-movimentacao-linha]"
        )
        .forEach(
            botao => {
                const ativo =
                    botao.dataset
                        .tipoMovimentacaoLinha ===
                    tipoMovimentacaoLinhaAtual;

                botao.classList.toggle(
                    "ativo",
                    ativo
                );

                botao.setAttribute(
                    "aria-pressed",
                    String(
                        ativo
                    )
                );
            }
        );

    const configuracoes = {
        entrada: {
            rotulo:
                "Quantidade da entrada",

            ajuda:
                "O valor será somado ao estoque atual.",

            placeholder:
                "Ex: 5",

            textoBotao:
                "Registrar entrada",

            motivo:
                "Ex: Compra de novo cone"
        },

        saida: {
            rotulo:
                "Quantidade da saída",

            ajuda:
                "O valor será retirado do estoque atual.",

            placeholder:
                "Ex: 1",

            textoBotao:
                "Registrar saída",

            motivo:
                "Ex: Uso na produção"
        },

        ajuste: {
            rotulo:
                "Novo estoque contado",

            ajuda:
                "Informe o saldo físico encontrado no inventário.",

            placeholder:
                "Ex: 8",

            textoBotao:
                "Registrar ajuste",

            motivo:
                "Ex: Conferência de inventário"
        }
    };

    const configuracao =
        configuracoes[
            tipoMovimentacaoLinhaAtual
        ];

    rotuloQuantidadeMovimentacaoLinha
        .textContent =
            configuracao.rotulo;

    ajudaQuantidadeMovimentacaoLinha
        .textContent =
            configuracao.ajuda;

    quantidadeMovimentacaoLinha
        .placeholder =
            configuracao.placeholder;

    quantidadeMovimentacaoLinha.min =
        tipoMovimentacaoLinhaAtual ===
            "ajuste"
            ? "0"
            : "0.01";

    motivoMovimentacaoLinha.placeholder =
        configuracao.motivo;

    const textoBotao =
        botaoSalvarMovimentacaoLinha
            ?.querySelector(
                "span"
            );

    if (textoBotao) {
        textoBotao.textContent =
            configuracao.textoBotao;
    }

    atualizarPrevisaoMovimentacaoLinha();
}

function atualizarResumoModalMovimentacaoLinha(
    linha
) {
    if (!linha) {
        return;
    }

    tituloMovimentacaoLinha.textContent =
        `Estoque — ${linha.nome}`;

    subtituloMovimentacaoLinha.textContent =
        "Registre entradas, saídas e ajustes sem perder o histórico.";

    marcaCodigoMovimentacaoLinha.textContent =
        `${linha.marca} · Código ${linha.codigo}`;

    nomeMovimentacaoLinha.textContent =
        linha.nome;

    amostraMovimentacaoLinha.style
        .setProperty(
            "--cor-linha",
            linha.corHex ||
            "#777777"
        );

    estoqueAtualMovimentacaoLinha.textContent =
        `${formatarQuantidadeLinha(
            linha.estoque
        )} ${formatarUnidadeLinha(
            linha.unidade,
            linha.estoque
        )}`;
}

function renderizarHistoricoMovimentacoesLinha(
    movimentacoes
) {
    const lista =
        Array.isArray(
            movimentacoes
        )
            ? movimentacoes
            : [];

    quantidadeMovimentacoesLinha.textContent =
        `${lista.length} ${
            lista.length === 1
                ? "registro"
                : "registros"
        }`;

    if (!lista.length) {
        listaMovimentacoesLinha.innerHTML = `
            <div class="estado-historico-linha">
                <span class="estado-historico-linha-icone">
                    ${icone("clock")}
                </span>

                <strong>
                    Nenhuma movimentação registrada
                </strong>

                <small>
                    A primeira entrada, saída ou ajuste aparecerá aqui.
                </small>
            </div>
        `;

        return;
    }

    const unidade =
        dadosMovimentacaoLinhaAtual
            ?.linha
            ?.unidade ||
        "unidade";

    listaMovimentacoesLinha.innerHTML =
        lista
            .map(
                movimentacao => {
                    const quantidade =
                        Number(
                            movimentacao
                                .quantidadeMovimentada ||
                            0
                        );

                    const sinal =
                        quantidade > 0
                            ? "+"
                            : "";

                    const iconeMovimentacao =
                        movimentacao.tipo ===
                            "entrada" ||
                        movimentacao.tipo ===
                            "estoque-inicial"
                            ? "plus"
                            : movimentacao.tipo ===
                                "saida"
                                ? "arrow-right"
                                : "edit";

                    return `
                        <article
                            class="item-historico-linha tipo-${escaparHtml(
                                movimentacao.tipo
                            )}"
                        >
                            <span class="icone-historico-linha">
                                ${icone(
                                    iconeMovimentacao
                                )}
                            </span>

                            <div class="conteudo-historico-linha">
                                <div class="topo-historico-linha">
                                    <div>
                                        <strong>
                                            ${escaparHtml(
                                                movimentacao.tipoTexto
                                            )}
                                        </strong>

                                        <span>
                                            ${escaparHtml(
                                                formatarDataHoraMovimentacaoLinha(
                                                    movimentacao.criadoEm
                                                )
                                            )}
                                        </span>
                                    </div>

                                    <span class="quantidade-historico-linha">
                                        ${escaparHtml(
                                            `${sinal}${formatarQuantidadeLinha(
                                                quantidade
                                            )}`
                                        )}
                                    </span>
                                </div>

                                <p>
                                    ${escaparHtml(
                                        movimentacao.motivo
                                    )}
                                </p>

                                ${
                                    movimentacao.ordemVinculada
                                        ? `
                                            <div class="ordem-historico-linha">
                                                <span>
                                                    Ordem vinculada
                                                </span>

                                                <strong>
                                                    ${escaparHtml(
                                                        movimentacao
                                                            .ordemNumeroTexto
                                                    )}
                                                    ·
                                                    ${escaparHtml(
                                                        movimentacao
                                                            .ordemClienteNome ||
                                                        "Cliente não informado"
                                                    )}
                                                </strong>
                                            </div>
                                        `
                                        : ""
                                }

                                ${
                                    movimentacao.observacoes
                                        ? `
                                            <small class="observacao-historico-linha">
                                                ${escaparHtml(
                                                    movimentacao.observacoes
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                                <footer class="rodape-historico-linha">
                                    <span>
                                        ${escaparHtml(
                                            formatarQuantidadeLinha(
                                                movimentacao.estoqueAnterior
                                            )
                                        )}
                                        →
                                        ${escaparHtml(
                                            formatarQuantidadeLinha(
                                                movimentacao.estoquePosterior
                                            )
                                        )}
                                        ${escaparHtml(
                                            formatarUnidadeLinha(
                                                unidade,
                                                movimentacao.estoquePosterior
                                            )
                                        )}
                                    </span>

                                    <span>
                                        Por
                                        ${escaparHtml(
                                            movimentacao.usuarioNome ||
                                            "Sistema"
                                        )}
                                    </span>
                                </footer>
                            </div>
                        </article>
                    `;
                }
            )
            .join("");
}

async function carregarMovimentacoesLinha(
    id,
    {
        mostrarErro = true
    } = {}
) {
    listaMovimentacoesLinha.innerHTML = `
        <div class="estado-historico-linha">
            ${htmlCarregando()}
        </div>
    `;

    try {
        const resposta =
            await requisicaoApi(
                `/api/linhas/${
                    encodeURIComponent(
                        id
                    )
                }/movimentacoes?limite=150`
            );

        dadosMovimentacaoLinhaAtual =
            resposta;

        renderizarOrdensMovimentacaoLinha(
            resposta.ordensDisponiveis
        );

        atualizarResumoModalMovimentacaoLinha(
            resposta.linha
        );

        renderizarHistoricoMovimentacoesLinha(
            resposta.movimentacoes
        );

        atualizarPrevisaoMovimentacaoLinha();
    } catch (erro) {
        listaMovimentacoesLinha.innerHTML = `
            <div class="estado-historico-linha erro">
                <strong>
                    Não foi possível carregar o histórico
                </strong>

                <small>
                    ${escaparHtml(
                        erro.message
                    )}
                </small>
            </div>
        `;

        if (mostrarErro) {
            mostrarNotificacao(
                "Não foi possível carregar o estoque",
                erro.message,
                "erro"
            );
        }
    }
}

async function abrirModalMovimentacaoLinha(
    id
) {
    if (
        typeof possuiPermissaoSistema ===
            "function" &&
        !possuiPermissaoSistema(
            "linhas.editar"
        )
    ) {
        mostrarNotificacao(
            "Acesso negado",
            "Você não possui permissão para movimentar o estoque.",
            "aviso"
        );

        return;
    }

    const linha =
        encontrarLinhaCatalogo(
            id
        );

    if (!linha) {
        mostrarNotificacao(
            "Linha não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    linhaMovimentacaoAtualId =
        linha.id;

    dadosMovimentacaoLinhaAtual = {
        linha: {
            ...linha
        },

        movimentacoes: []
    };

    formularioMovimentacaoLinha.reset();

    renderizarOrdensMovimentacaoLinha(
        []
    );

    movimentacaoLinhaId.value =
        linha.id;

    atualizarResumoModalMovimentacaoLinha(
        linha
    );

    selecionarTipoMovimentacaoLinha(
        "entrada"
    );

    modalMovimentacaoLinha.classList.add(
        "aberto"
    );

    modalMovimentacaoLinha.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    await carregarMovimentacoesLinha(
        linha.id
    );

    setTimeout(
        () => {
            quantidadeMovimentacaoLinha
                ?.focus();
        },
        50
    );
}

async function salvarMovimentacaoLinha(
    evento
) {
    evento.preventDefault();

    if (
        salvandoMovimentacaoLinha ||
        !formularioMovimentacaoLinha
            .checkValidity()
    ) {
        formularioMovimentacaoLinha
            ?.reportValidity();

        return;
    }

    const id =
        String(
            movimentacaoLinhaId.value ||
            linhaMovimentacaoAtualId ||
            ""
        ).trim();

    salvandoMovimentacaoLinha =
        true;

    const textoBotao =
        botaoSalvarMovimentacaoLinha
            ?.querySelector(
                "span"
            );

    const textoOriginal =
        textoBotao?.textContent ||
        "Registrar movimentação";

    botaoSalvarMovimentacaoLinha.disabled =
        true;

    if (textoBotao) {
        textoBotao.textContent =
            "Registrando...";
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/linhas/${
                    encodeURIComponent(
                        id
                    )
                }/movimentacoes`,

                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            tipo:
                                tipoMovimentacaoLinhaAtual,

                            quantidade:
                                quantidadeMovimentacaoLinha.value,

                            motivo:
                                motivoMovimentacaoLinha.value,

                            observacoes:
                                observacoesMovimentacaoLinha.value,

                            ordemId:
                                tipoMovimentacaoLinhaAtual ===
                                    "saida"
                                    ? ordemMovimentacaoLinha
                                        ?.value ||
                                        ""
                                    : ""

                            
                        })
                }
            );

        quantidadeMovimentacaoLinha.value =
            "";

        motivoMovimentacaoLinha.value =
            "";

        observacoesMovimentacaoLinha.value =
            "";

        if (ordemMovimentacaoLinha) {
            ordemMovimentacaoLinha.value =
                "";

            if (
                typeof window
                    .atualizarSelectPadraoSistema ===
                "function"
            ) {
                window
                    .atualizarSelectPadraoSistema(
                        ordemMovimentacaoLinha
                    );
            }
        }

        await carregarCatalogoLinhas({
            mostrarErro:
                false
        });

        await carregarMovimentacoesLinha(
            id,
            {
                mostrarErro:
                    false
            }
        );

        mostrarNotificacao(
            "Estoque atualizado",
            resposta.mensagem ||
            "A movimentação foi registrada."
        );

        quantidadeMovimentacaoLinha.focus();
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível movimentar o estoque",
            erro.message,
            "erro"
        );
    } finally {
        salvandoMovimentacaoLinha =
            false;

        botaoSalvarMovimentacaoLinha.disabled =
            false;

        if (textoBotao) {
            textoBotao.textContent =
                textoOriginal;
        }

        selecionarTipoMovimentacaoLinha(
            tipoMovimentacaoLinhaAtual
        );
    }
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

function abrirModalLinhaCatalogo(
    linha = null
) {
    formularioLinhaCatalogo.reset();

    if (linha) {
        tituloModalLinhaCatalogo
            .textContent =
                "Editar linha";

        botaoSalvarLinha
            .querySelector("span")
            .textContent =
                "Salvar alterações";

        linhaCatalogoId.value =
            linha.id;

        linhaMarca.value =
            linha.marca;

        linhaCodigo.value =
            linha.codigo;

        linhaNome.value =
            linha.nome;

        linhaFornecedor.value =
    linha.fornecedor || "";

linhaValor.value =
    Number(
        linha.valorCentavos || 0
    ) > 0
        ? formatarCampoValorLinha(
            linha.valor
        )
        : "";

        linhaCor.value =
            /^#[0-9A-F]{6}$/i.test(
                linha.corHex
            )
                ? linha.corHex
                : "#000000";

        linhaUnidade.value =
            linha.unidade;

        linhaEstoque.value =
            linha.estoque;

        linhaEstoque.readOnly =
            true;

        campoEstoqueLinhaCatalogo
            ?.classList.add(
                "estoque-somente-leitura"
            );

        rotuloEstoqueLinhaCatalogo.textContent =
            "Estoque atual";

        ajudaEstoqueLinhaCatalogo.textContent =
            "Use o botão de movimentação para registrar entrada, saída ou ajuste.";

        linhaEstoqueMinimo.value =
            linha.estoqueMinimo;

        linhaAtiva.checked =
            linha.ativo;

        linhaObservacoes.value =
            linha.observacoes || "";
    } else {
        tituloModalLinhaCatalogo
            .textContent =
                "Nova linha";

        botaoSalvarLinha
            .querySelector("span")
            .textContent =
                "Cadastrar linha";

        linhaCatalogoId.value = "";
        linhaFornecedor.value = "";
        linhaValor.value = "";
        linhaCor.value = "#000000";
        linhaUnidade.value = "cone";
        linhaEstoque.value = 0;
        linhaEstoque.readOnly = false;

        campoEstoqueLinhaCatalogo
            ?.classList.remove(
                "estoque-somente-leitura"
            );

        rotuloEstoqueLinhaCatalogo.textContent =
            "Estoque inicial";

        ajudaEstoqueLinhaCatalogo.textContent =
            "Informe o saldo disponível no primeiro cadastro.";

        linhaEstoqueMinimo.value = 0;
        linhaAtiva.checked = true;
    }

    textoCorLinha.textContent =
        linhaCor.value.toUpperCase();

    modalLinhaCatalogo.classList.add(
        "aberto"
    );

    modalLinhaCatalogo.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(
        () => {
            linhaMarca.focus();
        },
        50
    );
}

function fecharModalLinhaCatalogo() {
    modalLinhaCatalogo
        ?.classList.remove(
            "aberto"
        );

    modalLinhaCatalogo
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        "";

    formularioLinhaCatalogo?.reset();

    if (linhaCatalogoId) {
        linhaCatalogoId.value = "";
    }
}

/*
|--------------------------------------------------------------------------
| Cadastro e edição
|--------------------------------------------------------------------------
*/

async function salvarLinhaCatalogo(
    evento
) {
    evento.preventDefault();

    if (
        !formularioLinhaCatalogo
            .checkValidity()
    ) {
        formularioLinhaCatalogo
            .reportValidity();

        return;
    }

    const id =
        String(
            linhaCatalogoId.value ||
            ""
        ).trim();

    const dados = {
    marca:
        linhaMarca.value,

    codigo:
        linhaCodigo.value,

    nome:
        linhaNome.value,

    fornecedor:
        linhaFornecedor.value,

    valor:
        linhaValor.value,

    corHex:
        linhaCor.value,

    unidade:
        linhaUnidade.value,

    estoque:
        linhaEstoque.value,

    estoqueMinimo:
        linhaEstoqueMinimo.value,

    ativo:
        linhaAtiva.checked,

    observacoes:
        linhaObservacoes.value
    };

    const textoBotao =
        botaoSalvarLinha
            .querySelector("span");

    const textoOriginal =
        textoBotao.textContent;

    botaoSalvarLinha.disabled =
        true;

    textoBotao.textContent =
        id
            ? "Salvando..."
            : "Cadastrando...";

    try {
        const resposta =
            await requisicaoApi(
                id
                    ? `/api/linhas/${
                        encodeURIComponent(id)
                    }`
                    : "/api/linhas",

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

        fecharModalLinhaCatalogo();

        await carregarCatalogoLinhas({
            mostrarErro: false
        });

        mostrarNotificacao(
            id
                ? "Linha atualizada"
                : "Linha cadastrada",

            resposta.mensagem ||
            "As informações foram salvas."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível salvar a linha",
            erro.message,
            "erro"
        );
    } finally {
        botaoSalvarLinha.disabled =
            false;

        textoBotao.textContent =
            textoOriginal;
    }
}

function editarLinhaCatalogo(
    id
) {
    const linha =
        linhasCatalogo.find(
            item =>
                item.id === id
        );

    if (!linha) {
        mostrarNotificacao(
            "Linha não encontrada",
            "Atualize a página e tente novamente.",
            "erro"
        );

        return;
    }

    abrirModalLinhaCatalogo(
        linha
    );
}

async function excluirLinhaCatalogo(
    id
) {
    const linha =
        linhasCatalogo.find(
            item =>
                item.id === id
        );

    if (!linha) {
        return;
    }

    const confirmou =
        await confirmarAcao({
            tipo:
                "perigo",

            titulo:
                "Excluir linha?",

            mensagem:
                [
                    `Linha: ${linha.marca} ${linha.codigo}`,
                    `Cor: ${linha.nome}`,
                    "O cadastro será excluído permanentemente."
                ].join("\n\n"),

            textoConfirmar:
                "Excluir linha"
        });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/linhas/${
                    encodeURIComponent(id)
                }`,

                {
                    method:
                        "DELETE"
                }
            );

        await carregarCatalogoLinhas({
            mostrarErro: false
        });

        mostrarNotificacao(
            "Linha excluída",
            resposta.mensagem ||
            "A linha foi removida."
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
| Eventos
|--------------------------------------------------------------------------
*/

botaoNovaLinha
    ?.addEventListener(
        "click",
        () => {
            abrirModalLinhaCatalogo();
        }
    );

$$(
    "[data-fechar-modal-linha]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            fecharModalLinhaCatalogo
        );
    }
);

formularioLinhaCatalogo
    ?.addEventListener(
        "submit",
        salvarLinhaCatalogo
    );

linhaCor
    ?.addEventListener(
        "input",
        evento => {
            textoCorLinha.textContent =
                evento.target.value
                    .toUpperCase();
        }
    );

linhaValor
    ?.addEventListener(
        "input",
        evento => {
            evento.target.value =
                evento.target.value
                    .replace(
                        /[^\d,.]/g,
                        ""
                    )
                    .slice(
                        0,
                        15
                    );
        }
    );

linhaValor
    ?.addEventListener(
        "blur",
        () => {
            linhaValor.value =
                formatarCampoValorLinha(
                    linhaValor.value
                );
        }
    );

buscaCatalogoLinhas
    ?.addEventListener(
        "input",
        evento => {
            buscaLinhaAtual =
                evento.target.value;

            renderizarCatalogoLinhas();
        }
    );

filtroEstoqueLinhas
    ?.addEventListener(
        "change",
        evento => {
            filtroEstoqueLinhaAtual =
                evento.target.value;

            renderizarCatalogoLinhas();
        }
    );

filtroAtivoLinhas
    ?.addEventListener(
        "change",
        evento => {
            filtroAtivoLinhaAtual =
                evento.target.value;

            renderizarCatalogoLinhas();
        }
    );

corpoTabelaLinhas
    ?.addEventListener(
        "click",
        evento => {

            const botaoMovimentar =
                evento.target.closest(
                    "[data-movimentar-linha]"
                );

            const botaoEditar =
                evento.target.closest(
                    "[data-editar-linha]"
                );

            const botaoExcluir =
                evento.target.closest(
                    "[data-excluir-linha]"
                );

            if (botaoMovimentar) {
                abrirModalMovimentacaoLinha(
                    botaoMovimentar.dataset
                        .movimentarLinha
                );

                return;
            }

            if (botaoEditar) {
                editarLinhaCatalogo(
                    botaoEditar.dataset
                        .editarLinha
                );

                return;
            }

            if (botaoExcluir) {
                excluirLinhaCatalogo(
                    botaoExcluir.dataset
                        .excluirLinha
                );
            }
        }
    );

$$(
    "[data-fechar-movimentacao-linha]"
).forEach(
    elemento => {
        elemento.addEventListener(
            "click",
            fecharModalMovimentacaoLinha
        );
    }
);

modalMovimentacaoLinha
    ?.querySelectorAll(
        "[data-tipo-movimentacao-linha]"
    )
    .forEach(
        botao => {
            botao.addEventListener(
                "click",
                () => {
                    selecionarTipoMovimentacaoLinha(
                        botao.dataset
                            .tipoMovimentacaoLinha
                    );

                    quantidadeMovimentacaoLinha
                        ?.focus();
                }
            );
        }
    );

formularioMovimentacaoLinha
    ?.addEventListener(
        "submit",
        salvarMovimentacaoLinha
    );

ordemMovimentacaoLinha
    ?.addEventListener(
        "change",
        atualizarMotivoOrdemMovimentacaoLinha
    );

quantidadeMovimentacaoLinha
    ?.addEventListener(
        "input",
        atualizarPrevisaoMovimentacaoLinha
    );

$$(
    '.menu-item[data-secao="linhas"]'
).forEach(
    item => {
        item.addEventListener(
            "click",
            () => {
                carregarCatalogoLinhas({
                    mostrarErro: false
                });
            }
        );
    }
);

document.addEventListener(
    "keydown",
    evento => {
        if (evento.key !== "Escape") {
            return;
        }

        if (
            modalMovimentacaoLinha
                ?.classList.contains(
                    "aberto"
                )
        ) {
            fecharModalMovimentacaoLinha();

            return;
        }

        if (
            modalLinhaCatalogo
                ?.classList.contains(
                    "aberto"
                )
        ) {
            fecharModalLinhaCatalogo();
        }
    }
);

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

carregarCatalogoLinhas();
