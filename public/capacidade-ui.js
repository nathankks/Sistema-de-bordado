/*
|--------------------------------------------------------------------------
| Tempo estimado e capacidade da máquina
|--------------------------------------------------------------------------
*/

const STATUS_FILA_CAPACIDADE =
    new Set([
        "pronto-producao",
        "em-producao"
    ]);

let configuracaoProducao = null;
let ordensCapacidadeProducao = [];
let salvandoConfiguracaoProducao = false;

const botaoConfigurarMaquina =
    document.querySelector(
        "#botaoConfigurarMaquina"
    );

const modalConfiguracaoMaquina =
    document.querySelector(
        "#modalConfiguracaoMaquina"
    );

const formularioConfiguracaoMaquina =
    document.querySelector(
        "#formularioConfiguracaoMaquina"
    );

const maquinaNome =
    document.querySelector(
        "#maquinaNome"
    );

const maquinaCabecas =
    document.querySelector(
        "#maquinaCabecas"
    );

const maquinaVelocidade =
    document.querySelector(
        "#maquinaVelocidade"
    );

const maquinaEficiencia =
    document.querySelector(
        "#maquinaEficiencia"
    );

const maquinaHorasDia =
    document.querySelector(
        "#maquinaHorasDia"
    );

const maquinaPreparacao =
    document.querySelector(
        "#maquinaPreparacao"
    );

const maquinaTrocaCor =
    document.querySelector(
        "#maquinaTrocaCor"
    );

const botaoSalvarConfiguracaoMaquina =
    document.querySelector(
        "#botaoSalvarConfiguracaoMaquina"
    );

const nomeMaquinaCapacidade =
    document.querySelector(
        "#nomeMaquinaCapacidade"
    );

const capacidadeDiariaMaquina =
    document.querySelector(
        "#capacidadeDiariaMaquina"
    );

const tempoFilaProducao =
    document.querySelector(
        "#tempoFilaProducao"
    );

const diasFilaProducao =
    document.querySelector(
        "#diasFilaProducao"
    );

const percentualCapacidadeMaquina =
    document.querySelector(
        "#percentualCapacidadeMaquina"
    );

const barraCapacidadeMaquina =
    document.querySelector(
        "#barraCapacidadeMaquina"
    );

const statusCapacidadeMaquina =
    document.querySelector(
        "#statusCapacidadeMaquina"
    );

const observacaoCapacidadeMaquina =
    document.querySelector(
        "#observacaoCapacidadeMaquina"
    );

function obterNumeroProducao(
    valor,
    padrao = 0
) {
    const numero =
        Number(
            valor
        );

    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;
}

function formatarDuracaoProducao(
    minutos
) {
    const total =
        Math.max(
            0,
            Math.round(
                obterNumeroProducao(
                    minutos
                )
            )
        );

    if (total < 60) {
        return `${total} min`;
    }

    const horas =
        Math.floor(
            total / 60
        );

    const minutosRestantes =
        total % 60;

    if (!minutosRestantes) {
        return `${horas}h`;
    }

    return `${horas}h ${minutosRestantes}min`;
}

function encontrarMatrizParaEstimativa(
    ordem
) {
    const matrizId =
        String(
            ordem?.matrizId ||
            ""
        ).trim();

    if (
        !matrizId ||
        typeof window
            .obterMatrizesSistema !==
            "function"
    ) {
        return null;
    }

    return window
        .obterMatrizesSistema()
        .find(
            matriz =>
                String(
                    matriz?.id ||
                    ""
                ) === matrizId
        ) || null;
}

function obterDadosTecnicosOrdem(
    ordem
) {
    const matriz =
        encontrarMatrizParaEstimativa(
            ordem
        );

    const quantidadePontos =
        obterNumeroProducao(
            ordem?.matrizQuantidadePontos ??
            matriz?.quantidadePontos,
            0
        );

    const quantidadeCores =
        Math.max(
            1,
            Math.round(
                obterNumeroProducao(
                    ordem?.matrizQuantidadeCores ??
                    matriz?.quantidadeCores,
                    1
                )
            )
        );

    return {
        quantidadePontos,
        quantidadeCores
    };
}

function calcularTempoEstimadoOrdem(
    ordem
) {
    if (!configuracaoProducao) {
        return null;
    }

    const {
        quantidadePontos,
        quantidadeCores
    } = obterDadosTecnicosOrdem(
        ordem
    );

    if (
        !Number.isFinite(
            quantidadePontos
        ) ||
        quantidadePontos <= 0
    ) {
        return null;
    }

    const quantidadePecas =
        Math.max(
            1,
            Math.round(
                obterNumeroProducao(
                    ordem?.quantidade,
                    1
                )
            )
        );

    const quantidadeCabecas =
        Math.max(
            1,
            Math.round(
                obterNumeroProducao(
                    configuracaoProducao
                        .quantidadeCabecas,
                    1
                )
            )
        );

    const velocidadeConfigurada =
        Math.max(
            1,
            obterNumeroProducao(
                configuracaoProducao
                    .velocidadePontosMinuto,
                700
            )
        );

    const eficiencia =
        Math.min(
            100,
            Math.max(
                10,
                obterNumeroProducao(
                    configuracaoProducao
                        .eficienciaPercentual,
                    85
                )
            )
        ) / 100;

    const velocidadeEfetiva =
        velocidadeConfigurada *
        eficiencia;

    const ciclos =
        Math.ceil(
            quantidadePecas /
            quantidadeCabecas
        );

    const minutosBordado =
        ciclos *
        (
            quantidadePontos /
            velocidadeEfetiva
        );

    const trocasPorCiclo =
        Math.max(
            0,
            quantidadeCores - 1
        );

    const minutosTrocasCor =
        ciclos *
        trocasPorCiclo *
        (
            obterNumeroProducao(
                configuracaoProducao
                    .segundosTrocaCor,
                0
            ) /
            60
        );

    const minutosPreparacao =
        Math.max(
            0,
            obterNumeroProducao(
                configuracaoProducao
                    .minutosPreparacaoOrdem,
                0
            )
        );

    const totalMinutos =
        Math.max(
            1,
            Math.ceil(
                minutosPreparacao +
                minutosBordado +
                minutosTrocasCor
            )
        );

    return {
        totalMinutos,
        minutosBordado,
        minutosTrocasCor,
        minutosPreparacao,
        ciclos,
        quantidadePecas,
        quantidadeCabecas,
        quantidadePontos,
        quantidadeCores,
        velocidadeEfetiva
    };
}

function obterResumoCapacidade() {
    if (!configuracaoProducao) {
        return null;
    }

    const capacidadeDiariaMinutos =
        Math.round(
            Math.max(
                0.5,
                obterNumeroProducao(
                    configuracaoProducao
                        .horasProdutivasDia,
                    8
                )
            ) *
            60
        );

    const ordensDaFila =
        ordensCapacidadeProducao
            .filter(
                ordem =>
                    STATUS_FILA_CAPACIDADE
                        .has(
                            ordem.status
                        )
            );

    let tempoTotalMinutos = 0;
    let ordensSemEstimativa = 0;

    for (
        const ordem
        of ordensDaFila
    ) {
        const estimativa =
            calcularTempoEstimadoOrdem(
                ordem
            );

        if (!estimativa) {
            ordensSemEstimativa += 1;
            continue;
        }

        tempoTotalMinutos +=
            estimativa.totalMinutos;
    }

    const percentual =
        capacidadeDiariaMinutos > 0
            ? (
                tempoTotalMinutos /
                capacidadeDiariaMinutos
            ) * 100
            : 0;

    const diasEstimados =
        capacidadeDiariaMinutos > 0
            ? tempoTotalMinutos /
                capacidadeDiariaMinutos
            : 0;

    return {
        capacidadeDiariaMinutos,
        ordensDaFila,
        tempoTotalMinutos,
        ordensSemEstimativa,
        percentual,
        diasEstimados
    };
}

function obterClassificacaoCapacidade(
    percentual
) {
    if (percentual > 100) {
        return {
            classe:
                "sobrecarregada",

            texto:
                "Fila acima da capacidade diária"
        };
    }

    if (percentual >= 75) {
        return {
            classe:
                "atencao",

            texto:
                "Capacidade próxima do limite"
        };
    }

    return {
        classe:
            "disponivel",

        texto:
            "Capacidade disponível"
    };
}

function renderizarCapacidadeProducao() {
    if (!configuracaoProducao) {
        if (nomeMaquinaCapacidade) {
            nomeMaquinaCapacidade.textContent =
                "Carregando...";
        }

        return;
    }

    const resumo =
        obterResumoCapacidade();

    if (!resumo) {
        return;
    }

    const classificacao =
        obterClassificacaoCapacidade(
            resumo.percentual
        );

    if (nomeMaquinaCapacidade) {
        nomeMaquinaCapacidade.textContent =
            configuracaoProducao
                .nomeMaquina;
    }

    if (capacidadeDiariaMaquina) {
        capacidadeDiariaMaquina.textContent =
            formatarDuracaoProducao(
                resumo
                    .capacidadeDiariaMinutos
            );
    }

    if (tempoFilaProducao) {
        tempoFilaProducao.textContent =
            formatarDuracaoProducao(
                resumo.tempoTotalMinutos
            );
    }

    if (diasFilaProducao) {
        diasFilaProducao.textContent =
            new Intl.NumberFormat(
                "pt-BR",
                {
                    minimumFractionDigits:
                        resumo.diasEstimados > 0 &&
                        resumo.diasEstimados < 1
                            ? 1
                            : 0,

                    maximumFractionDigits: 1
                }
            ).format(
                resumo.diasEstimados
            );
    }

    if (percentualCapacidadeMaquina) {
        percentualCapacidadeMaquina.textContent =
            `${Math.round(
                resumo.percentual
            )}% de um dia`;
    }

    if (barraCapacidadeMaquina) {
        barraCapacidadeMaquina.style.width =
            `${Math.min(
                100,
                Math.max(
                    0,
                    resumo.percentual
                )
            )}%`;
    }

    if (statusCapacidadeMaquina) {
        statusCapacidadeMaquina.className =
            `status-capacidade-maquina ${classificacao.classe}`;

        statusCapacidadeMaquina.textContent =
            classificacao.texto;

        const painelProgresso =
            statusCapacidadeMaquina
                .closest(
                    ".capacidade-maquina-progresso"
                );

        if (painelProgresso) {
            painelProgresso.className =
                `capacidade-maquina-progresso ${classificacao.classe}`;
        }
    }

    if (observacaoCapacidadeMaquina) {
        const totalFila =
            resumo.ordensDaFila.length;

        const textoOrdens =
            `${totalFila} ${
                totalFila === 1
                    ? "ordem pronta ou em produção"
                    : "ordens prontas ou em produção"
            }`;

        const textoSemEstimativa =
            resumo.ordensSemEstimativa
                ? ` · ${resumo.ordensSemEstimativa} sem quantidade de pontos na matriz`
                : "";

        observacaoCapacidadeMaquina.textContent =
            `${textoOrdens}${textoSemEstimativa}.`;
    }
}

function preencherFormularioConfiguracao() {
    if (!configuracaoProducao) {
        return;
    }

    maquinaNome.value =
        configuracaoProducao
            .nomeMaquina;

    maquinaCabecas.value =
        configuracaoProducao
            .quantidadeCabecas;

    maquinaVelocidade.value =
        configuracaoProducao
            .velocidadePontosMinuto;

    maquinaEficiencia.value =
        configuracaoProducao
            .eficienciaPercentual;

    maquinaHorasDia.value =
        configuracaoProducao
            .horasProdutivasDia;

    maquinaPreparacao.value =
        configuracaoProducao
            .minutosPreparacaoOrdem;

    maquinaTrocaCor.value =
        configuracaoProducao
            .segundosTrocaCor;
}

function abrirConfiguracaoMaquina() {
    if (!modalConfiguracaoMaquina) {
        return;
    }

    if (
        typeof possuiPermissaoSistema ===
            "function" &&
        !possuiPermissaoSistema(
            "ordens.editar"
        )
    ) {
        mostrarNotificacao(
            "Acesso negado",
            "Você não possui permissão para configurar a máquina.",
            "aviso"
        );

        return;
    }

    preencherFormularioConfiguracao();

    modalConfiguracaoMaquina
        .classList.add(
            "aberto"
        );

    modalConfiguracaoMaquina
        .setAttribute(
            "aria-hidden",
            "false"
        );

    document.body.style.overflow =
        "hidden";

    setTimeout(
        () => {
            maquinaNome
                ?.focus();
        },
        50
    );
}

function fecharConfiguracaoMaquina() {
    modalConfiguracaoMaquina
        ?.classList.remove(
            "aberto"
        );

    modalConfiguracaoMaquina
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    document.body.style.overflow =
        "";
}

async function carregarConfiguracaoProducao({
    mostrarErro = true
} = {}) {
    try {
        const resposta =
            await requisicaoApi(
                "/api/producao/configuracao"
            );

        configuracaoProducao =
            resposta.configuracao;

        renderizarCapacidadeProducao();

        window.dispatchEvent(
            new CustomEvent(
                "configuracao-producao-atualizada",
                {
                    detail: {
                        configuracao:
                            configuracaoProducao
                    }
                }
            )
        );
    } catch (erro) {
        if (mostrarErro) {
            mostrarNotificacao(
                "Não foi possível carregar a capacidade",
                erro.message,
                "erro"
            );
        }
    }
}

async function salvarConfiguracaoMaquina(
    evento
) {
    evento.preventDefault();

    if (
        salvandoConfiguracaoProducao ||
        !formularioConfiguracaoMaquina
            .checkValidity()
    ) {
        formularioConfiguracaoMaquina
            ?.reportValidity();

        return;
    }

    salvandoConfiguracaoProducao =
        true;

    const textoBotao =
        botaoSalvarConfiguracaoMaquina
            ?.querySelector(
                "span"
            );

    const textoOriginal =
        textoBotao
            ?.textContent ||
        "Salvar configuração";

    if (botaoSalvarConfiguracaoMaquina) {
        botaoSalvarConfiguracaoMaquina.disabled =
            true;
    }

    if (textoBotao) {
        textoBotao.textContent =
            "Salvando...";
    }

    try {
        const resposta =
            await requisicaoApi(
                "/api/producao/configuracao",

                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({
                            nomeMaquina:
                                maquinaNome.value,

                            quantidadeCabecas:
                                Number(
                                    maquinaCabecas.value
                                ),

                            velocidadePontosMinuto:
                                Number(
                                    maquinaVelocidade.value
                                ),

                            eficienciaPercentual:
                                Number(
                                    maquinaEficiencia.value
                                ),

                            horasProdutivasDia:
                                Number(
                                    maquinaHorasDia.value
                                ),

                            minutosPreparacaoOrdem:
                                Number(
                                    maquinaPreparacao.value
                                ),

                            segundosTrocaCor:
                                Number(
                                    maquinaTrocaCor.value
                                )
                        })
                }
            );

        configuracaoProducao =
            resposta.configuracao;

        fecharConfiguracaoMaquina();
        renderizarCapacidadeProducao();

        window.dispatchEvent(
            new CustomEvent(
                "configuracao-producao-atualizada",
                {
                    detail: {
                        configuracao:
                            configuracaoProducao
                    }
                }
            )
        );

        mostrarNotificacao(
            "Configuração atualizada",
            resposta.mensagem ||
            "Os cálculos de produção foram atualizados."
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível salvar",
            erro.message,
            "erro"
        );
    } finally {
        salvandoConfiguracaoProducao =
            false;

        if (botaoSalvarConfiguracaoMaquina) {
            botaoSalvarConfiguracaoMaquina.disabled =
                false;
        }

        if (textoBotao) {
            textoBotao.textContent =
                textoOriginal;
        }
    }
}

botaoConfigurarMaquina
    ?.addEventListener(
        "click",
        abrirConfiguracaoMaquina
    );

modalConfiguracaoMaquina
    ?.querySelectorAll(
        "[data-fechar-configuracao-maquina]"
    )
    .forEach(
        elemento => {
            elemento.addEventListener(
                "click",
                fecharConfiguracaoMaquina
            );
        }
    );

formularioConfiguracaoMaquina
    ?.addEventListener(
        "submit",
        salvarConfiguracaoMaquina
    );

window.addEventListener(
    "ordens-atualizadas",
    evento => {
        ordensCapacidadeProducao =
            Array.isArray(
                evento.detail?.ordens
            )
                ? evento.detail.ordens
                : [];

        renderizarCapacidadeProducao();
    }
);

window.addEventListener(
    "matrizes-atualizadas",
    renderizarCapacidadeProducao
);

window.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key === "Escape" &&
            modalConfiguracaoMaquina
                ?.classList.contains(
                    "aberto"
                )
        ) {
            fecharConfiguracaoMaquina();
        }
    }
);

window.obterConfiguracaoProducaoSistema =
    function () {
        return configuracaoProducao
            ? {
                ...configuracaoProducao
            }
            : null;
    };

window.calcularTempoEstimadoOrdemSistema =
    calcularTempoEstimadoOrdem;

window.formatarDuracaoProducaoSistema =
    formatarDuracaoProducao;

window.renderizarCapacidadeProducaoSistema =
    renderizarCapacidadeProducao;

ordensCapacidadeProducao =
    typeof window
        .obterOrdensSistema ===
        "function"
        ? window.obterOrdensSistema()
        : [];

carregarConfiguracaoProducao();
