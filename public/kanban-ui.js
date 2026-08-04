/*
|--------------------------------------------------------------------------
| Painel de produção em Kanban
|--------------------------------------------------------------------------
*/

const ETAPAS_KANBAN_PRODUCAO = [
    {
        status: "aguardando-arquivo",
        titulo: "Aguardando arquivo"
    },
    {
        status: "aguardando-aprovacao",
        titulo: "Aguardando aprovação"
    },
    {
        status: "pronto-producao",
        titulo: "Pronto para produzir"
    },
    {
        status: "em-producao",
        titulo: "Em produção"
    },
    {
        status: "concluido",
        titulo: "Concluído"
    },
    {
        status: "entregue",
        titulo: "Entregue"
    }
];

const PROXIMO_STATUS_KANBAN_PRODUCAO = {
    "aguardando-arquivo":
        "aguardando-aprovacao",

    "aguardando-aprovacao":
        "pronto-producao",

    "pronto-producao":
        "em-producao",

    "em-producao":
        "concluido",

    concluido:
        "entregue"
};

const PESOS_PRIORIDADE_KANBAN = {
    urgente: 3,
    alta: 2,
    normal: 1
};

function obterRotuloPrioridadeKanban(
    prioridade
) {
    const rotulos = {
        urgente:
            "Urgente",

        alta:
            "Alta",

        normal:
            "Normal"
    };

    return rotulos[prioridade] ||
        "Normal";
}

function criarTempoEstimadoKanban(
    ordem
) {
    if (
        typeof window
            .calcularTempoEstimadoOrdemSistema !==
            "function"
    ) {
        return "";
    }

    const estimativa =
        window
            .calcularTempoEstimadoOrdemSistema(
                ordem
            );

    if (!estimativa) {
        return "";
    }

    const texto =
        typeof window
            .formatarDuracaoProducaoSistema ===
            "function"
            ? window
                .formatarDuracaoProducaoSistema(
                    estimativa.totalMinutos
                )
            : `${estimativa.totalMinutos} min`;

    return `
        <span
            class="tempo-cartao-kanban-producao"
            title="Tempo estimado de produção"
        >
            ${icone("clock")}
            ${escaparHtml(texto)}
        </span>
    `;
}

let ordensKanbanProducao = [];
let kanbanProducaoCarregado = false;
let mostrarEntreguesKanbanProducao = false;
let ordemArrastadaKanbanProducaoId = "";
let ordemMovendoKanbanProducaoId = "";

const kanbanProducao =
    document.querySelector(
        "#kanbanProducao"
    );

const buscaKanbanProducao =
    document.querySelector(
        "#buscaKanbanProducao"
    );

const quantidadeKanbanProducao =
    document.querySelector(
        "#quantidadeKanbanProducao"
    );

const ajudaKanbanProducao =
    document.querySelector(
        "#ajudaKanbanProducao"
    );

const botaoAtualizarKanbanProducao =
    document.querySelector(
        "#botaoAtualizarKanbanProducao"
    );

const botaoMostrarEntreguesKanban =
    document.querySelector(
        "#botaoMostrarEntreguesKanban"
    );

function normalizarTextoKanbanProducao(
    valor
) {
    return String(
        valor ?? ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}

function podeEditarKanbanProducao() {
    return (
        typeof possuiPermissaoSistema !==
            "function" ||
        possuiPermissaoSistema(
            "ordens.editar"
        )
    );
}

function obterHojeIsoKanbanProducao() {
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

function converterDataKanbanEmDias(
    valor
) {
    const partes =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(
                String(
                    valor || ""
                )
            );

    if (!partes) {
        return null;
    }

    const tempo =
        Date.UTC(
            Number(partes[1]),
            Number(partes[2]) - 1,
            Number(partes[3])
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

function calcularDiasPrazoKanbanProducao(
    prazo
) {
    const diaPrazo =
        converterDataKanbanEmDias(
            prazo
        );

    const diaAtual =
        converterDataKanbanEmDias(
            obterHojeIsoKanbanProducao()
        );

    if (
        diaPrazo === null ||
        diaAtual === null
    ) {
        return null;
    }

    return diaPrazo - diaAtual;
}

function formatarDataKanbanProducao(
    valor
) {
    const partes =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(
                String(
                    valor || ""
                )
            );

    if (!partes) {
        return "Sem prazo";
    }

    return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

function obterPrazoKanbanProducao(
    ordem
) {
    if (!ordem.prazoEntrega) {
        return {
            texto:
                "Sem prazo",

            classe:
                "sem-prazo"
        };
    }

    const prazoFormatado =
        formatarDataKanbanProducao(
            ordem.prazoEntrega
        );

    if (
        [
            "concluido",
            "entregue",
            "cancelado"
        ].includes(
            ordem.status
        )
    ) {
        return {
            texto:
                prazoFormatado,

            classe:
                "normal"
        };
    }

    const dias =
        calcularDiasPrazoKanbanProducao(
            ordem.prazoEntrega
        );

    if (dias === null) {
        return {
            texto:
                prazoFormatado,

            classe:
                "normal"
        };
    }

    if (dias < 0) {
        return {
            texto:
                dias === -1
                    ? "Atrasada há 1 dia"
                    : `Atrasada há ${Math.abs(
                        dias
                    )} dias`,

            classe:
                "atrasada"
        };
    }

    if (dias === 0) {
        return {
            texto:
                "Vence hoje",

            classe:
                "vence-logo"
        };
    }

    if (dias === 1) {
        return {
            texto:
                "Vence amanhã",

            classe:
                "vence-logo"
        };
    }

    if (dias <= 2) {
        return {
            texto:
                `Vence em ${dias} dias`,

            classe:
                "vence-logo"
        };
    }

    return {
        texto:
            prazoFormatado,

        classe:
            "normal"
    };
}

function obterIniciaisKanbanProducao(
    nome
) {
    return String(
        nome || "Cliente"
    )
        .trim()
        .split(/\s+/)
        .slice(
            0,
            2
        )
        .map(
            parte =>
                parte[0] || ""
        )
        .join("")
        .toUpperCase() ||
        "CL";
}

function obterRotuloStatusKanbanProducao(
    status
) {
    return (
        ETAPAS_KANBAN_PRODUCAO
            .find(
                etapa =>
                    etapa.status ===
                    status
            )
            ?.titulo ||
        status
    );
}

function obterOrdensVisiveisKanbanProducao() {
    const busca =
        normalizarTextoKanbanProducao(
            buscaKanbanProducao
                ?.value
        );

    const statusPermitidos =
        new Set(
            ETAPAS_KANBAN_PRODUCAO
                .filter(
                    etapa =>
                        mostrarEntreguesKanbanProducao ||
                        etapa.status !==
                            "entregue"
                )
                .map(
                    etapa =>
                        etapa.status
                )
        );

    return ordensKanbanProducao
        .filter(
            ordem =>
                statusPermitidos.has(
                    ordem.status
                )
        )
        .filter(
            ordem => {
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
                    ordem.statusTexto,
                    ordem.prioridadeTexto,
                    ordem.prioridade
                    ].some(
                    valor =>
                        normalizarTextoKanbanProducao(
                            valor
                        ).includes(
                            busca
                        )
                );
            }
        );
}

function ordenarOrdensKanbanProducao(
    lista
) {
    return [
        ...lista
    ].sort(
        (
            ordemA,
            ordemB
        ) => {
    const prioridadeA =
        PESOS_PRIORIDADE_KANBAN[
            ordemA.prioridade
        ] || 1;

    const prioridadeB =
        PESOS_PRIORIDADE_KANBAN[
            ordemB.prioridade
        ] || 1;

    if (
        prioridadeA !==
        prioridadeB
    ) {
        return (
            prioridadeB -
            prioridadeA
        );
    }

    const prazoA =
                ordemA.prazoEntrega ||
                "9999-12-31";

            const prazoB =
                ordemB.prazoEntrega ||
                "9999-12-31";

            const comparacaoPrazo =
                prazoA.localeCompare(
                    prazoB
                );

            if (comparacaoPrazo) {
                return comparacaoPrazo;
            }

            return (
                Number(
                    ordemA.numero ||
                    0
                ) -
                Number(
                    ordemB.numero ||
                    0
                )
            );
        }
    );
}

function criarCartaoKanbanProducao(
    ordem
) {
    const prazo =
        obterPrazoKanbanProducao(
            ordem
        );

    const podeEditar =
        podeEditarKanbanProducao();

    const proximoStatus =
        PROXIMO_STATUS_KANBAN_PRODUCAO[
            ordem.status
        ] ||
        "";

    const movendo =
        ordemMovendoKanbanProducaoId ===
        ordem.id;

    const quantidade =
        Number(
            ordem.quantidade ||
            0
        );

    return `
        <article
            class="cartao-kanban-producao prazo-${escaparHtml(
                prazo.classe
            )} prioridade-kanban-${escaparHtml(
                ordem.prioridade ||
                "normal"
            )} ${
                movendo
                    ? "movendo"
                    : ""
            }"
            data-ordem-kanban-producao="${escaparHtml(
                ordem.id
            )}"
            draggable="${
                podeEditar &&
                !movendo
                    ? "true"
                    : "false"
            }"
        >
            <header class="topo-cartao-kanban-producao">
                <div>
                    <strong>
                        ${escaparHtml(
                            ordem.codigo ||
                            "Ordem"
                        )}
                    </strong>

                    <span class="prazo-cartao-kanban-producao">
                        ${icone("clock")}

                        ${escaparHtml(
                            prazo.texto
                        )}
                    </span>
                </div>

                ${
                    podeEditar
                        ? `
                            <span
                                class="alca-cartao-kanban-producao"
                                title="Arraste para mudar de etapa"
                                aria-hidden="true"
                            >
                                ⋮⋮
                            </span>
                        `
                        : ""
                }
            </header>

            <div class="cliente-cartao-kanban-producao">
                <span class="avatar-cartao-kanban-producao">
                    ${escaparHtml(
                        obterIniciaisKanbanProducao(
                            ordem.clienteNome
                        )
                    )}
                </span>

                <div>
                    <strong>
                        ${escaparHtml(
                            ordem.clienteNome ||
                            "Cliente não informado"
                        )}
                    </strong>

                    <small>
                        ${escaparHtml(
                            ordem.clienteCpf ||
                            "Documento não informado"
                        )}
                    </small>
                </div>
            </div>

            <p class="servico-cartao-kanban-producao">
                ${escaparHtml(
                    ordem.descricao ||
                    "Serviço não informado"
                )}
            </p>

            <div class="metadados-cartao-kanban-producao">
                <span
                    class="prioridade-cartao-kanban prioridade-cartao-kanban-${escaparHtml(
                        ordem.prioridade ||
                        "normal"
                    )}"
                >
                    ${escaparHtml(
                        ordem.prioridadeTexto ||
                        obterRotuloPrioridadeKanban(
                            ordem.prioridade
                        )
                    )}
                </span>

                ${criarTempoEstimadoKanban(
                    ordem
                )}

                <span>
                    ${quantidade}
                    ${
                        quantidade === 1
                            ? "peça"
                            : "peças"
                    }
                </span>

                <span title="Linha utilizada">
                    ${escaparHtml(
                        ordem.linha ||
                        "Linha não informada"
                    )}
                </span>

                <span
                    class="${
                        ordem.matrizId
                            ? "matriz-vinculada"
                            : "matriz-pendente"
                    }"
                >
                    ${
                        ordem.matrizId
                            ? "Matriz vinculada"
                            : "Sem matriz"
                    }
                </span>
            </div>

            <footer class="acoes-cartao-kanban-producao">
                <button
                    class="botao-acao"
                    data-abrir-ordem-kanban="${escaparHtml(
                        ordem.id
                    )}"
                    type="button"
                    title="Visualizar ordem"
                    aria-label="Visualizar ordem"
                >
                    ${icone("eye")}
                </button>

                ${
                    podeEditar &&
                    proximoStatus
                        ? `
                            <button
                                class="botao-acao botao-avancar-kanban-producao"
                                data-avancar-ordem-kanban="${escaparHtml(
                                    ordem.id
                                )}"
                                data-proximo-status-kanban="${escaparHtml(
                                    proximoStatus
                                )}"
                                type="button"
                                title="Avançar para ${escaparHtml(
                                    obterRotuloStatusKanbanProducao(
                                        proximoStatus
                                    )
                                )}"
                                aria-label="Avançar ordem para ${escaparHtml(
                                    obterRotuloStatusKanbanProducao(
                                        proximoStatus
                                    )
                                )}"
                            >
                                ${icone("arrow-right")}
                            </button>
                        `
                        : ""
                }
            </footer>
        </article>
    `;
}

function criarColunaKanbanProducao(
    etapa,
    ordensVisiveis
) {
    const ordensDaEtapa =
        ordenarOrdensKanbanProducao(
            ordensVisiveis.filter(
                ordem =>
                    ordem.status ===
                    etapa.status
            )
        );

    return `
        <section
            class="coluna-kanban-producao"
            data-status-kanban-producao="${escaparHtml(
                etapa.status
            )}"
        >
            <header class="cabecalho-coluna-kanban-producao">
                <div>
                    <span class="indicador-coluna-kanban-producao"></span>

                    <strong>
                        ${escaparHtml(
                            etapa.titulo
                        )}
                    </strong>
                </div>

                <span class="quantidade-coluna-kanban-producao">
                    ${ordensDaEtapa.length}
                </span>
            </header>

            <div class="lista-coluna-kanban-producao">
                ${
                    ordensDaEtapa.length
                        ? ordensDaEtapa
                            .map(
                                criarCartaoKanbanProducao
                            )
                            .join("")
                        : `
                            <div class="vazio-coluna-kanban-producao">
                                ${icone("check-file")}

                                <span>
                                    Nenhuma ordem nesta etapa
                                </span>
                            </div>
                        `
                }
            </div>
        </section>
    `;
}

function atualizarControlesKanbanProducao(
    total
) {
    if (quantidadeKanbanProducao) {
        quantidadeKanbanProducao
            .textContent =
                `${total} ${
                    total === 1
                        ? "ordem no painel"
                        : "ordens no painel"
                }`;
    }

    if (ajudaKanbanProducao) {
        ajudaKanbanProducao
            .textContent =
                podeEditarKanbanProducao()
                    ? "Arraste os cartões entre as colunas ou use a seta para avançar a etapa."
                    : "Você possui acesso somente para visualizar o andamento da produção.";
    }

    if (botaoMostrarEntreguesKanban) {
        botaoMostrarEntreguesKanban
            .setAttribute(
                "aria-pressed",
                mostrarEntreguesKanbanProducao
                    ? "true"
                    : "false"
            );

        botaoMostrarEntreguesKanban
            .classList.toggle(
                "ativo",
                mostrarEntreguesKanbanProducao
            );

        const texto =
            botaoMostrarEntreguesKanban
                .querySelector(
                    "span"
                );

        if (texto) {
            texto.textContent =
                mostrarEntreguesKanbanProducao
                    ? "Ocultar entregues"
                    : "Mostrar entregues";
        }
    }
}

function renderizarKanbanProducao() {
    if (!kanbanProducao) {
        return;
    }

    if (!kanbanProducaoCarregado) {
        atualizarControlesKanbanProducao(
            0
        );

        if (quantidadeKanbanProducao) {
            quantidadeKanbanProducao
                .textContent =
                    "Carregando ordens...";
        }

        kanbanProducao.innerHTML = `
            <div class="carregando-kanban-producao">
                ${icone("clock")}

                <span>
                    Carregando painel de produção...
                </span>
            </div>
        `;

        return;
    }

    const ordensVisiveis =
        obterOrdensVisiveisKanbanProducao();

    const etapasVisiveis =
        ETAPAS_KANBAN_PRODUCAO
            .filter(
                etapa =>
                    mostrarEntreguesKanbanProducao ||
                    etapa.status !==
                        "entregue"
            );

    atualizarControlesKanbanProducao(
        ordensVisiveis.length
    );

    kanbanProducao.innerHTML =
        etapasVisiveis
            .map(
                etapa =>
                    criarColunaKanbanProducao(
                        etapa,
                        ordensVisiveis
                    )
            )
            .join("");
}

async function moverOrdemKanbanProducao(
    ordemId,
    novoStatus
) {
    if (
        !ordemId ||
        !novoStatus
    ) {
        return;
    }

    if (!podeEditarKanbanProducao()) {
        mostrarNotificacao(
            "Acesso negado",
            "Você não possui permissão para alterar as etapas das ordens.",
            "aviso"
        );

        return;
    }

    const ordem =
        ordensKanbanProducao
            .find(
                item =>
                    item.id ===
                    ordemId
            );

    if (!ordem) {
        mostrarNotificacao(
            "Ordem não encontrada",
            "Atualize o painel e tente novamente.",
            "erro"
        );

        return;
    }

    if (
        ordem.status ===
        novoStatus
    ) {
        renderizarKanbanProducao();
        return;
    }

    if (
        novoStatus ===
            "entregue" &&
        typeof confirmarAcao ===
            "function"
    ) {
        const confirmou =
            await confirmarAcao({
                tipo:
                    "sucesso",

                icone:
                    "check",

                titulo:
                    `Marcar ${ordem.codigo} como entregue?`,

                mensagem:
                    `A ordem de ${ordem.clienteNome} será finalizada como entregue.`,

                textoConfirmar:
                    "Confirmar entrega"
            });

        if (!confirmou) {
            renderizarKanbanProducao();
            return;
        }
    }

    if (
        typeof window
            .atualizarStatusOrdemSistema !==
        "function"
    ) {
        mostrarNotificacao(
            "Painel indisponível",
            "Não foi possível localizar a função de atualização das ordens.",
            "erro"
        );

        return;
    }

    ordemMovendoKanbanProducaoId =
        ordemId;

    renderizarKanbanProducao();

    try {
        const resposta =
            await window
                .atualizarStatusOrdemSistema(
                    ordemId,
                    novoStatus
                );

        mostrarNotificacao(
            "Etapa atualizada",
            resposta?.mensagem ||
            `${ordem.codigo} foi movida para ${obterRotuloStatusKanbanProducao(
                novoStatus
            )}.`
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível mover a ordem",
            erro.message,
            "erro"
        );
    } finally {
        ordemMovendoKanbanProducaoId =
            "";

        renderizarKanbanProducao();
    }
}

async function atualizarKanbanProducao() {
    if (
        typeof window
            .recarregarOrdensSistema !==
        "function"
    ) {
        return;
    }

    botaoAtualizarKanbanProducao
        ?.setAttribute(
            "disabled",
            ""
        );

    kanbanProducaoCarregado =
        false;

    renderizarKanbanProducao();

    try {
        await window
            .recarregarOrdensSistema({
                mostrarErro:
                    true
            });
    } finally {
        botaoAtualizarKanbanProducao
            ?.removeAttribute(
                "disabled"
            );
    }
}

buscaKanbanProducao
    ?.addEventListener(
        "input",
        renderizarKanbanProducao
    );

botaoAtualizarKanbanProducao
    ?.addEventListener(
        "click",
        atualizarKanbanProducao
    );

botaoMostrarEntreguesKanban
    ?.addEventListener(
        "click",
        () => {
            mostrarEntreguesKanbanProducao =
                !mostrarEntreguesKanbanProducao;

            renderizarKanbanProducao();
        }
    );

kanbanProducao
    ?.addEventListener(
        "click",
        evento => {
            const botaoAbrir =
                evento.target.closest(
                    "[data-abrir-ordem-kanban]"
                );

            if (botaoAbrir) {
                window
                    .abrirOrdemSistema
                    ?.(
                        botaoAbrir.dataset
                            .abrirOrdemKanban
                    );

                return;
            }

            const botaoAvancar =
                evento.target.closest(
                    "[data-avancar-ordem-kanban]"
                );

            if (botaoAvancar) {
                moverOrdemKanbanProducao(
                    botaoAvancar.dataset
                        .avancarOrdemKanban,

                    botaoAvancar.dataset
                        .proximoStatusKanban
                );
            }
        }
    );

kanbanProducao
    ?.addEventListener(
        "dragstart",
        evento => {
            const cartao =
                evento.target.closest(
                    "[data-ordem-kanban-producao]"
                );

            if (
                !cartao ||
                !podeEditarKanbanProducao()
            ) {
                evento.preventDefault();
                return;
            }

            ordemArrastadaKanbanProducaoId =
                cartao.dataset
                    .ordemKanbanProducao;

            cartao.classList.add(
                "arrastando"
            );

            evento.dataTransfer
                .setData(
                    "text/plain",
                    ordemArrastadaKanbanProducaoId
                );

            evento.dataTransfer.effectAllowed =
                "move";
        }
    );

kanbanProducao
    ?.addEventListener(
        "dragend",
        evento => {
            evento.target
                .closest(
                    "[data-ordem-kanban-producao]"
                )
                ?.classList.remove(
                    "arrastando"
                );

            ordemArrastadaKanbanProducaoId =
                "";

            kanbanProducao
                .querySelectorAll(
                    ".recebendo-cartao"
                )
                .forEach(
                    coluna =>
                        coluna.classList.remove(
                            "recebendo-cartao"
                        )
                );
        }
    );

kanbanProducao
    ?.addEventListener(
        "dragover",
        evento => {
            if (!podeEditarKanbanProducao()) {
                return;
            }

            const coluna =
                evento.target.closest(
                    "[data-status-kanban-producao]"
                );

            if (!coluna) {
                return;
            }

            evento.preventDefault();
            evento.dataTransfer.dropEffect =
                "move";

            kanbanProducao
                .querySelectorAll(
                    ".recebendo-cartao"
                )
                .forEach(
                    item => {
                        if (item !== coluna) {
                            item.classList.remove(
                                "recebendo-cartao"
                            );
                        }
                    }
                );

            coluna.classList.add(
                "recebendo-cartao"
            );
        }
    );

kanbanProducao
    ?.addEventListener(
        "dragleave",
        evento => {
            const coluna =
                evento.target.closest(
                    "[data-status-kanban-producao]"
                );

            if (
                !coluna ||
                coluna.contains(
                    evento.relatedTarget
                )
            ) {
                return;
            }

            coluna.classList.remove(
                "recebendo-cartao"
            );
        }
    );

kanbanProducao
    ?.addEventListener(
        "drop",
        evento => {
            const coluna =
                evento.target.closest(
                    "[data-status-kanban-producao]"
                );

            if (!coluna) {
                return;
            }

            evento.preventDefault();

            const ordemId =
                evento.dataTransfer
                    .getData(
                        "text/plain"
                    ) ||
                ordemArrastadaKanbanProducaoId;

            const novoStatus =
                coluna.dataset
                    .statusKanbanProducao;

            coluna.classList.remove(
                "recebendo-cartao"
            );

            moverOrdemKanbanProducao(
                ordemId,
                novoStatus
            );
        }
    );

window.addEventListener(
    "ordens-atualizadas",
    evento => {
        ordensKanbanProducao =
            Array.isArray(
                evento.detail?.ordens
            )
                ? evento.detail.ordens
                : [];

        kanbanProducaoCarregado =
            true;

        renderizarKanbanProducao();
    }
);

window.addEventListener(
    "configuracao-producao-atualizada",
    renderizarKanbanProducao
);

window.addEventListener(
    "permissoes-carregadas",
    renderizarKanbanProducao
);

window.renderizarKanbanProducao =
    renderizarKanbanProducao;

renderizarKanbanProducao();
