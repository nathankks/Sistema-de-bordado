/*
|--------------------------------------------------------------------------
| Estado do catálogo
|--------------------------------------------------------------------------
*/

let linhasCatalogo = [];
let carregandoLinhasCatalogo = true;

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
            const botaoEditar =
                evento.target.closest(
                    "[data-editar-linha]"
                );

            const botaoExcluir =
                evento.target.closest(
                    "[data-excluir-linha]"
                );

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
        if (
            evento.key === "Escape" &&
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