/*
|--------------------------------------------------------------------------
| Primeiros passos e tutorial do sistema
|--------------------------------------------------------------------------
*/

(() => {
    const VERSAO_TUTORIAL =
        "2026.08.04.1";

    const card =
        document.querySelector(
            "#primeirosPassosDashboard"
        );

    const lista =
        document.querySelector(
            "#listaPrimeirosPassos"
        );

    const percentual =
        document.querySelector(
            "#percentualPrimeirosPassos"
        );

    const quantidade =
        document.querySelector(
            "#quantidadePrimeirosPassos"
        );

    const barra =
        document.querySelector(
            "#barraPrimeirosPassos"
        );

    const tituloCard =
        document.querySelector(
            "#tituloPrimeirosPassos"
        );

    const descricaoCard =
        document.querySelector(
            "#descricaoPrimeirosPassos"
        );

    const botaoContinuar =
        document.querySelector(
            "#botaoContinuarPrimeirosPassos"
        );

    const botaoAbrirTutorial =
        document.querySelector(
            "#botaoAbrirTutorialSistema"
        );

    const modal =
        document.querySelector(
            "#modalTutorialSistema"
        );

    const categoriaModal =
        document.querySelector(
            "#categoriaTutorialSistema"
        );

    const numeroModal =
        document.querySelector(
            "#numeroTutorialSistema"
        );

    const tituloModal =
        document.querySelector(
            "#tituloTutorialSistema"
        );

    const descricaoModal =
        document.querySelector(
            "#descricaoTutorialSistema"
        );

    const detalhesModal =
        document.querySelector(
            "#detalhesTutorialSistema"
        );

    const iconeModal =
        document.querySelector(
            "#iconeTutorialSistemaUse"
        );

    const barraModal =
        document.querySelector(
            "#barraTutorialSistema"
        );

    const botaoAnterior =
        document.querySelector(
            "#botaoAnteriorTutorialSistema"
        );

    const botaoProximo =
        document.querySelector(
            "#botaoProximoTutorialSistema"
        );

    const botaoAbrirArea =
        document.querySelector(
            "#botaoAbrirAreaTutorialSistema"
        );

    if (
        !card ||
        !lista ||
        !modal
    ) {
        return;
    }

    const STATUS_PRODUCAO =
        new Set([
            "em-producao",
            "concluido",
            "entregue"
        ]);

    const ETAPAS = [
        {
            id:
                "clientes",

            icone:
                "users",

            categoria:
                "Clientes",

            titulo:
                "Cadastre o primeiro cliente",

            resumo:
                "Centralize dados, logos e arquivos.",

            descricao:
                "Comece cadastrando o cliente. Nesse cadastro você poderá armazenar dados de contato, logos originais, arquivos convertidos e informações importantes para futuras ordens.",

            detalhes: [
                "Dados e contatos organizados",
                "Logos e matrizes no mesmo cadastro",
                "Reutilização dos arquivos em novas ordens"
            ],

            secao:
                "clientes",

            botao:
                "#botaoNovoClienteSecao",

            concluida:
                () =>
                    obterClientes().length >
                    0
        },

        {
            id:
                "linhas",

            icone:
                "linha",

            categoria:
                "Estoque",

            titulo:
                "Organize o catálogo de linhas",

            resumo:
                "Cadastre cores e estoque disponível.",

            descricao:
                "Cadastre as linhas utilizadas na produção. O sistema permitirá acompanhar estoque, entradas, saídas, ajustes e o histórico de cada movimentação.",

            detalhes: [
                "Controle de estoque por cor",
                "Entradas, saídas e inventário",
                "Histórico completo das movimentações"
            ],

            secao:
                "linhas",

            botao:
                "#botaoNovaLinha",

            concluida:
                () =>
                    obterLinhas().length >
                    0
        },

        {
            id:
                "maquina",

            icone:
                "settings",

            categoria:
                "Produção",

            titulo:
                "Configure a máquina",

            resumo:
                "Defina a capacidade real de produção.",

            descricao:
                "Informe quantidade de cabeças, velocidade, eficiência, horas produtivas e tempos operacionais para melhorar as estimativas das ordens.",

            detalhes: [
                "Capacidade diária da máquina",
                "Tempo acumulado da fila",
                "Estimativas mais próximas da produção real"
            ],

            secao:
                "producao",

            botao:
                "#botaoConfigurarMaquina",

            concluida:
                () => (
                    armazenamento(
                        "maquina-configurada"
                    ) === "sim" ||
                    configuracaoPersonalizada()
                )
        },

        {
            id:
                "ordem",

            icone:
                "check-file",

            categoria:
                "Ordens",

            titulo:
                "Crie a primeira ordem",

            resumo:
                "Registre todo o serviço de bordado.",

            descricao:
                "Crie uma ordem informando cliente, serviço, prazo, prioridade, quantidade, matriz e linhas utilizadas. O sistema organiza todas essas informações em um único fluxo.",

            detalhes: [
                "Prazo e prioridade do serviço",
                "Matriz e linhas vinculadas",
                "Tempo estimado de produção"
            ],

            secao:
                "ordens",

            botao:
                "#botaoNovaOrdem",

            concluida:
                () =>
                    obterOrdens().length >
                    0
        },

        {
            id:
                "producao",

            icone:
                "arrow-right",

            categoria:
                "Acompanhamento",

            titulo:
                "Acompanhe a produção",

            resumo:
                "Movimente as ordens até a entrega.",

            descricao:
                "Use o painel de produção para acompanhar a fila e movimentar as ordens conforme o trabalho avança, mantendo a equipe atualizada sobre cada etapa.",

            detalhes: [
                "Visualização por etapas no Kanban",
                "Controle das ordens em andamento",
                "Acompanhamento até a conclusão e entrega"
            ],

            secao:
                "producao",

            botao:
                null,

            concluida:
                () =>
                    obterOrdens().some(
                        ordem =>
                            STATUS_PRODUCAO.has(
                                String(
                                    ordem?.status ||
                                    ""
                                )
                            )
                    )
        }
    ];

    let indiceTutorial =
        0;

    let focoAnterior =
        null;

    let aguardandoSalvarMaquina =
        false;

    let temporizadorMaquina =
        null;

    function usuarioId() {
        const usuario =
            window.usuarioAtualSistema ||
            {};

        return String(
            usuario.id ||
            usuario.usuario ||
            usuario.email ||
            "usuario"
        )
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9_-]/g,
                "-"
            )
            .slice(
                0,
                100
            );
    }

    function chave(
        nome
    ) {
        return [
            "sistema-bordado",
            "tutorial",
            VERSAO_TUTORIAL,
            usuarioId(),
            nome
        ].join(
            ":"
        );
    }

    function armazenamento(
        nome,
        valor
    ) {
        try {
            if (
                valor === undefined
            ) {
                return localStorage
                    .getItem(
                        chave(
                            nome
                        )
                    );
            }

            localStorage.setItem(
                chave(
                    nome
                ),
                String(
                    valor
                )
            );

            return String(
                valor
            );
        } catch {
            return null;
        }
    }

    function obterClientes() {
        return typeof window
            .obterClientesSistema ===
            "function"

            ? window
                .obterClientesSistema()

            : [];
    }

    function obterLinhas() {
        return typeof window
            .obterLinhasAtivasCatalogo ===
            "function"

            ? window
                .obterLinhasAtivasCatalogo()

            : [];
    }

    function obterOrdens() {
        return typeof window
            .obterOrdensSistema ===
            "function"

            ? window
                .obterOrdensSistema()

            : [];
    }

    function configuracaoPersonalizada() {
        const configuracao =
            typeof window
                .obterConfiguracaoProducaoSistema ===
                "function"

                ? window
                    .obterConfiguracaoProducaoSistema()

                : null;

        if (!configuracao) {
            return false;
        }

        return (
            configuracao.nomeMaquina !==
                "Máquina principal" ||

            Number(
                configuracao
                    .quantidadeCabecas
            ) !== 1 ||

            Number(
                configuracao
                    .velocidadePontosMinuto
            ) !== 700 ||

            Number(
                configuracao
                    .eficienciaPercentual
            ) !== 85 ||

            Number(
                configuracao
                    .horasProdutivasDia
            ) !== 8 ||

            Number(
                configuracao
                    .minutosPreparacaoOrdem
            ) !== 10 ||

            Number(
                configuracao
                    .segundosTrocaCor
            ) !== 8
        );
    }

    function icone(
        nome
    ) {
        return `
            <svg aria-hidden="true">
                <use href="#icon-${nome}"></use>
            </svg>
        `;
    }

    function estadoEtapas() {
        return ETAPAS.map(
            etapa => ({
                ...etapa,

                estaConcluida:
                    Boolean(
                        etapa.concluida()
                    )
            })
        );
    }

    function renderizarCard() {
        const etapas =
            estadoEtapas();

        const concluidas =
            etapas.filter(
                etapa =>
                    etapa.estaConcluida
            ).length;

        const total =
            etapas.length;

        const valorPercentual =
            Math.round(
                (
                    concluidas /
                    total
                ) * 100
            );

        const proxima =
            etapas.find(
                etapa =>
                    !etapa.estaConcluida
            ) ||
            null;

        card.style.setProperty(
            "--progresso-primeiros-passos",
            `${valorPercentual}%`
        );

        card.classList.toggle(
            "concluido",
            valorPercentual === 100
        );

        percentual.textContent =
            `${valorPercentual}%`;

        quantidade.textContent =
            `${concluidas} de ${total} etapas`;

        barra.style.width =
            `${valorPercentual}%`;

        tituloCard.textContent =
            valorPercentual === 100

                ? "Configuração concluída"

                : "Prepare o sistema para produzir";

        descricaoCard.textContent =
            valorPercentual === 100

                ? "O fluxo principal já está pronto. O tutorial continua disponível para consulta."

                : "Conclua as etapas abaixo e acompanhe seu progresso automaticamente.";

        lista.innerHTML =
            etapas.map(
                (
                    etapa,
                    indice
                ) => `
                    <button
                        class="
                            etapa-primeiros-passos
                            ${
                                etapa.estaConcluida
                                    ? "concluida"
                                    : proxima?.id ===
                                        etapa.id
                                        ? "atual"
                                        : ""
                            }
                        "
                        data-etapa-primeiros-passos="${indice}"
                        type="button"
                    >
                        <span class="etapa-primeiros-passos-icone">
                            ${
                                icone(
                                    etapa.estaConcluida
                                        ? "check"
                                        : etapa.icone
                                )
                            }
                        </span>

                        <span class="etapa-primeiros-passos-texto">
                            <small>
                                Etapa ${
                                    String(
                                        indice + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )
                                }
                            </small>

                            <strong>
                                ${etapa.titulo}
                            </strong>

                            <span>
                                ${etapa.resumo}
                            </span>
                        </span>

                        <span class="etapa-primeiros-passos-situacao">
                            ${
                                etapa.estaConcluida

                                    ? "Concluída"

                                    : proxima?.id ===
                                        etapa.id

                                        ? "Próxima"

                                        : "Pendente"
                            }
                        </span>
                    </button>
                `
            )
                .join("");

        botaoContinuar.disabled =
            !proxima;

        botaoContinuar.innerHTML =
            proxima

                ? `
                    <span>
                        Continuar configuração
                    </span>

                    ${icone(
                        "arrow-right"
                    )}
                `

                : `
                    ${icone(
                        "check"
                    )}

                    <span>
                        Tudo configurado
                    </span>
                `;
    }

    function navegar(
        secao
    ) {
        document.querySelector(
            `.menu-item[data-secao="${secao}"]`
        )
            ?.click();
    }

    function abrirArea(
        etapa
    ) {
        navegar(
            etapa.secao
        );

        if (!etapa.botao) {
            fecharModal();
            return;
        }

        window.setTimeout(
            () => {
                const botao =
                    document.querySelector(
                        etapa.botao
                    );

                if (
                    botao &&
                    !botao.hidden &&
                    !botao.disabled
                ) {
                    botao.click();
                }
            },
            260
        );

        fecharModal();
    }

    function renderizarSlide() {
        const etapa =
            ETAPAS[
                indiceTutorial
            ];

        categoriaModal.textContent =
            etapa.categoria;

        numeroModal.textContent =
            `${indiceTutorial + 1} de ${ETAPAS.length}`;

        tituloModal.textContent =
            etapa.titulo;

        descricaoModal.textContent =
            etapa.descricao;

        iconeModal.setAttribute(
            "href",
            `#icon-${etapa.icone}`
        );

        barraModal.style.width =
            `${
                (
                    (
                        indiceTutorial +
                        1
                    ) /
                    ETAPAS.length
                ) * 100
            }%`;

        detalhesModal.innerHTML =
            etapa.detalhes.map(
                item => `
                    <li>
                        ${icone(
                            "check"
                        )}

                        <span>
                            ${item}
                        </span>
                    </li>
                `
            )
                .join("");

        botaoAnterior.disabled =
            indiceTutorial === 0;

        botaoAbrirArea.textContent =
            `Abrir ${etapa.categoria.toLowerCase()}`;

        botaoProximo.innerHTML =
            indiceTutorial ===
                ETAPAS.length - 1

                ? `
                    ${icone(
                        "check"
                    )}

                    <span>
                        Concluir tutorial
                    </span>
                `

                : `
                    <span>
                        Próximo
                    </span>

                    ${icone(
                        "arrow-right"
                    )}
                `;

        armazenamento(
            "etapa-atual",
            indiceTutorial
        );
    }

    function abrirModal({
        reiniciar = false,
        indiceInicial = null
    } = {}) {
        const salvo =
            Number(
                armazenamento(
                    "etapa-atual"
                )
            );

        if (
            Number.isInteger(
                indiceInicial
            )
        ) {
            indiceTutorial =
                Math.max(
                    0,
                    Math.min(
                        indiceInicial,
                        ETAPAS.length - 1
                    )
                );
        } else {
            indiceTutorial =
                reiniciar ||
                !Number.isInteger(
                    salvo
                )

                    ? 0

                    : Math.max(
                        0,
                        Math.min(
                            salvo,
                            ETAPAS.length - 1
                        )
                    );
        }

        focoAnterior =
            document.activeElement;

        renderizarSlide();

        modal.classList.add(
            "aberto"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "tutorial-sistema-aberto"
        );

        window.setTimeout(
            () => {
                botaoProximo
                    ?.focus({
                        preventScroll:
                            true
                    });
            },
            180
        );
    }

    function fecharModal({
        concluido = false
    } = {}) {
        if (concluido) {
            armazenamento(
                "concluido",
                "sim"
            );

            armazenamento(
                "etapa-atual",
                0
            );
        }

        modal.classList.remove(
            "aberto"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "tutorial-sistema-aberto"
        );

        focoAnterior
            ?.focus?.({
                preventScroll:
                    true
            });

        focoAnterior =
            null;

        renderizarCard();
    }

    lista.addEventListener(
        "click",
        evento => {
            const botao =
                evento.target.closest(
                    "[data-etapa-primeiros-passos]"
                );

            if (!botao) {
                return;
            }

            abrirModal({
                indiceInicial:
                    Number(
                        botao.dataset
                            .etapaPrimeirosPassos
                    ) ||
                    0
            });
        }
    );

    botaoContinuar.addEventListener(
        "click",
        () => {
            const proxima =
                estadoEtapas()
                    .find(
                        etapa =>
                            !etapa.estaConcluida
                    );

            if (proxima) {
                abrirArea(
                    proxima
                );
            }
        }
    );

    botaoAbrirTutorial.addEventListener(
    "click",
    () => {
        if (
            typeof window
                .iniciarTourGuiadoSistema ===
            "function"
        ) {
            window
                .iniciarTourGuiadoSistema();

            return;
        }

        /*
         * Mantém o tutorial anterior como
         * alternativa caso o tour ainda
         * não tenha sido carregado.
         */

        abrirModal({
            reiniciar:
                armazenamento(
                    "concluido"
                ) === "sim"
        });
    }
);

    botaoAnterior.addEventListener(
        "click",
        () => {
            indiceTutorial =
                Math.max(
                    0,
                    indiceTutorial - 1
                );

            renderizarSlide();
        }
    );

    botaoProximo.addEventListener(
        "click",
        () => {
            if (
                indiceTutorial ===
                ETAPAS.length - 1
            ) {
                fecharModal({
                    concluido:
                        true
                });

                return;
            }

            indiceTutorial +=
                1;

            renderizarSlide();
        }
    );

    botaoAbrirArea.addEventListener(
        "click",
        () => {
            abrirArea(
                ETAPAS[
                    indiceTutorial
                ]
            );
        }
    );

    document
        .querySelectorAll(
            "[data-fechar-tutorial-sistema]"
        )
        .forEach(
            elemento => {
                elemento.addEventListener(
                    "click",
                    () =>
                        fecharModal()
                );
            }
        );

    document.addEventListener(
        "keydown",
        evento => {
            if (
                !modal.classList
                    .contains(
                        "aberto"
                    )
            ) {
                return;
            }

            if (
                evento.key ===
                "Escape"
            ) {
                evento.preventDefault();

                fecharModal();
            }
        }
    );

    document.querySelector(
        "#formularioConfiguracaoMaquina"
    )
        ?.addEventListener(
            "submit",
            () => {
                aguardandoSalvarMaquina =
                    true;

                window.clearTimeout(
                    temporizadorMaquina
                );

                temporizadorMaquina =
                    window.setTimeout(
                        () => {
                            aguardandoSalvarMaquina =
                                false;
                        },
                        15000
                    );
            }
        );

    window.addEventListener(
        "configuracao-producao-atualizada",
        () => {
            if (
                aguardandoSalvarMaquina
            ) {
                armazenamento(
                    "maquina-configurada",
                    "sim"
                );

                aguardandoSalvarMaquina =
                    false;

                window.clearTimeout(
                    temporizadorMaquina
                );
            }

            renderizarCard();
        }
    );

    [
        "permissoes-carregadas",
        "ordens-atualizadas"
    ].forEach(
        nome => {
            window.addEventListener(
                nome,
                renderizarCard
            );
        }
    );

    const observador =
        new MutationObserver(
            renderizarCard
        );

    [
        "#totalClientes",
        "#totalLinhasAtivas"
    ].forEach(
        seletor => {
            const elemento =
                document.querySelector(
                    seletor
                );

            if (elemento) {
                observador.observe(
                    elemento,
                    {
                        childList:
                            true,

                        characterData:
                            true,

                        subtree:
                            true
                    }
                );
            }
        }
    );

    let tentativas =
        0;

    const intervalo =
        window.setInterval(
            () => {
                tentativas +=
                    1;

                renderizarCard();

                if (
                    tentativas >=
                    20
                ) {
                    window.clearInterval(
                        intervalo
                    );
                }
            },
            500
        );

    window.abrirTutorialSistema =
        abrirModal;

    renderizarCard();
})();
