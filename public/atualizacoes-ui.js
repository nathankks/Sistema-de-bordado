/*
|--------------------------------------------------------------------------
| Central de novidades do sistema
|--------------------------------------------------------------------------
*/

(() => {
    /*
     * Troque o ID sempre que publicar
     * uma nova atualização.
     */

    const ATUALIZACAO_ATUAL = {

        videoYouTube:
            "https://youtu.be/GxaAZ_hX8lk",

        id:
            "2026.08.04.2",

        versao:
            "Atualização de agosto de 2026",

        titulo:
            "Mais controle para sua produção",

        descricao:
            "Conheça as novas ferramentas para planejar a produção, controlar o estoque de linhas e organizar as ordens com mais segurança.",

        tituloResumo:
            "Produção e estoque mais organizados",

        duracaoVideo:
            "9 min",

        textoResumo:
            "A atualização reúne melhorias que aumentam a rastreabilidade do estoque, facilitam o planejamento da máquina e deixam a operação das ordens mais simples.",

        novidades: [
            {
                icone:
                    "clock",

                categoria:
                    "Produção",

                titulo:
                    "Tempo estimado automático",

                descricao:
                    "Cada ordem passa a ter uma previsão de produção calculada usando pontos, cores, quantidade de peças e configurações da máquina.",

                destaque:
                    "Cálculo automático"
            },

            {
                icone:
                    "check-file",

                categoria:
                    "Produção",

                titulo:
                    "Capacidade da máquina",

                descricao:
                    "Acompanhe a capacidade diária, o tempo acumulado da fila e a previsão de dias necessários para finalizar as ordens.",

                destaque:
                    "Planejamento da fila"
            },

            {
                icone:
                    "plus",

                categoria:
                    "Estoque",

                titulo:
                    "Entrada, saída e ajuste",

                descricao:
                    "O estoque das linhas agora é atualizado por movimentações registradas, evitando alterações sem histórico.",

                destaque:
                    "Estoque rastreável"
            },

            {
                icone:
                    "eye",

                categoria:
                    "Estoque",

                titulo:
                    "Histórico completo",

                descricao:
                    "Consulte quantidade movimentada, saldo anterior, saldo posterior, motivo, observações, data e usuário responsável.",

                destaque:
                    "Rastreabilidade"
            },

            {
                icone:
                    "arrow-right",

                categoria:
                    "Ordens",

                titulo:
                    "Consumo vinculado à ordem",

                descricao:
                    "As saídas de linha podem ser relacionadas à ordem de produção, registrando cliente, número e quantidade retirada.",

                destaque:
                    "Consumo por ordem"
            },

            {
                icone:
                    "edit",

                categoria:
                    "Interface",

                titulo:
                    "Novo menu de opções",

                descricao:
                    "As ações das ordens foram agrupadas em um único menu, deixando a tabela mais limpa, compacta e organizada.",

                destaque:
                    "Interface simplificada"
            }
        ]
    };

    const modal =
        document.querySelector(
            "#modalAtualizacoesSistema"
        );

    const versao =
        document.querySelector(
            "#versaoAtualizacoesSistema"
        );

    const titulo =
        document.querySelector(
            "#tituloAtualizacoesSistema"
        );

    const descricao =
        document.querySelector(
            "#descricaoAtualizacoesSistema"
        );

    const tituloResumo =
        document.querySelector(
            "#tituloResumoAtualizacoes"
        );

    const textoResumo =
        document.querySelector(
            "#textoResumoAtualizacoes"
        );

    const quantidade =
        document.querySelector(
            "#quantidadeAtualizacoesSistema"
        );

    const quantidadeAreas =
        document.querySelector(
            "#quantidadeAreasAtualizacoes"
        );

    const tempoVideo =
        document.querySelector(
            "#tempoVideoAtualizacoes"
        );

    const duracaoVideo =
        document.querySelector(
            "#duracaoVideoAtualizacoes"
        );

    const rotuloQuantidade =
        document.querySelector(
            "#rotuloQuantidadeAtualizacoes"
        );

    const lista =
        document.querySelector(
            "#listaAtualizacoesSistema"
        );

    const iframeVideo =
    document.querySelector(
        "#iframeVideoAtualizacoes"
    );

    const capaVideo =
        document.querySelector(
            "#capaVideoAtualizacoes"
        );

    const botaoReproduzir =
        document.querySelector(
            "#botaoReproduzirAtualizacoes"
        );

    const containerVideo =
        document.querySelector(
            "#containerVideoAtualizacoes"
        );

    const mensagemVideo =
        document.querySelector(
            "#mensagemVideoAtualizacoes"
        );

    const botaoVerDepois =
        document.querySelector(
            "#botaoVerDepoisAtualizacoes"
        );

    const botaoConfirmar =
        document.querySelector(
            "#botaoConfirmarAtualizacoes"
        );

    let exibidoNestaSessao =
        false;

    let elementoComFocoAnterior =
        null;

    let intervaloVerificacao =
        null;

    function escaparHtmlAtualizacoes(
        valor
    ) {
        return String(
            valor ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function criarIconeAtualizacao(
        nome
    ) {
        return `
            <svg aria-hidden="true">
                <use href="#icon-${escaparHtmlAtualizacoes(
                    nome
                )}"></use>
            </svg>
        `;
    }

    function obterUsuarioAtual() {
        return (
            window.usuarioAtualSistema ||
            null
        );
    }

    function obterIdentificadorUsuario() {
        const usuario =
            obterUsuarioAtual();

        return String(
            usuario?.id ||
            usuario?.email ||
            usuario?.usuario ||
            usuario?.nome ||
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

    function criarChaveVisualizacao() {
        return [
            "sistema-bordado",
            "atualizacao-visualizada",
            ATUALIZACAO_ATUAL.id,
            obterIdentificadorUsuario()
        ].join(
            ":"
        );
    }

    function atualizacaoFoiVisualizada() {
        try {
            return (
                localStorage.getItem(
                    criarChaveVisualizacao()
                ) === "sim"
            );
        } catch {
            return false;
        }
    }

    function registrarVisualizacao() {
        try {
            localStorage.setItem(
                criarChaveVisualizacao(),
                "sim"
            );
        } catch {
            /*
             * Mantém o modal funcionando
             * mesmo sem localStorage.
             */
        }
    }

    function extrairIdVideoYouTube(
    endereco
) {
    const valor =
        String(
            endereco ?? ""
        ).trim();

    if (!valor) {
        return "";
    }

    /*
     * Permite informar somente o ID.
     */

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            valor
        )
    ) {
        return valor;
    }

    try {
        const url =
            new URL(
                valor
            );

        const host =
            url.hostname
                .replace(
                    /^www\./,
                    ""
                )
                .toLowerCase();

        if (
            host ===
                "youtu.be"
        ) {
            return url.pathname
                .split("/")
                .filter(Boolean)[0] ||
                "";
        }

        if (
            host ===
                "youtube.com" ||
            host ===
                "m.youtube.com" ||
            host ===
                "music.youtube.com"
        ) {
            const idParametro =
                url.searchParams.get(
                    "v"
                );

            if (idParametro) {
                return idParametro;
            }

            const partes =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            if (
                [
                    "shorts",
                    "embed",
                    "live"
                ].includes(
                    partes[0]
                )
            ) {
                return partes[1] || "";
            }
        }
    } catch {
        /*
         * Continua para a verificação
         * por expressão regular.
         */
    }

    const correspondencia =
        valor.match(
            /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
        );

    return correspondencia?.[1] ||
        "";
}

function obterIdVideoAtualizacoes() {
    const id =
        extrairIdVideoYouTube(
            ATUALIZACAO_ATUAL
                .videoYouTube
        );

    return /^[a-zA-Z0-9_-]{11}$/.test(
        id
    )
        ? id
        : "";
}

function configurarVideoAtualizacoes() {
    const idVideo =
        obterIdVideoAtualizacoes();

    if (!idVideo) {
        botaoReproduzir.hidden =
            true;

        mensagemVideo.hidden =
            false;

        return;
    }

    capaVideo.src =
        `https://i.ytimg.com/vi/${idVideo}/maxresdefault.jpg`;

    capaVideo.onerror =
        () => {
            capaVideo.onerror =
                null;

            capaVideo.src =
                `https://i.ytimg.com/vi/${idVideo}/hqdefault.jpg`;
        };

    botaoReproduzir.hidden =
        false;

    mensagemVideo.hidden =
        true;
}

function carregarVideoAtualizacoes() {
    const idVideo =
        obterIdVideoAtualizacoes();

    if (
        !idVideo ||
        !iframeVideo
    ) {
        if (mensagemVideo) {
            mensagemVideo.hidden =
                false;
        }

        return;
    }

    const videoJaCarregado =
        Boolean(
            iframeVideo.getAttribute(
                "src"
            )
        );

    if (!videoJaCarregado) {
        const parametros =
            new URLSearchParams({
                autoplay:
                    "1",

                controls:
                    "1",

                playsinline:
                    "1",

                rel:
                    "0",

                enablejsapi:
                    "1",

                origin:
                    window.location.origin
            });

        iframeVideo.setAttribute(
            "src",
            `https://www.youtube-nocookie.com/embed/${idVideo}?${parametros.toString()}`
        );
    } else {
        iframeVideo.contentWindow
            ?.postMessage(
                JSON.stringify({
                    event:
                        "command",

                    func:
                        "playVideo",

                    args:
                        []
                }),
                "https://www.youtube-nocookie.com"
            );
    }

    iframeVideo.hidden =
        false;

    if (botaoReproduzir) {
        botaoReproduzir.hidden =
            true;
    }

    if (mensagemVideo) {
        mensagemVideo.hidden =
            true;
    }

    containerVideo
        ?.classList.add(
            "video-carregado"
        );
}

function pausarVideoAtualizacoes() {
    if (
        !iframeVideo ||
        iframeVideo.hidden ||
        !iframeVideo.contentWindow
    ) {
        return;
    }

    iframeVideo.contentWindow
        .postMessage(
            JSON.stringify({
                event:
                    "command",

                func:
                    "pauseVideo",

                args:
                    []
            }),
            "https://www.youtube-nocookie.com"
        );
}

    function renderizarAtualizacoes() {
        if (
            !modal ||
            !lista
        ) {
            return;
        }

        const areas =
            new Set(
                ATUALIZACAO_ATUAL
                    .novidades
                    .map(
                        novidade =>
                            novidade.categoria
                    )
            );

        versao.textContent =
            ATUALIZACAO_ATUAL.versao;

        titulo.textContent =
            ATUALIZACAO_ATUAL.titulo;

        descricao.textContent =
            ATUALIZACAO_ATUAL.descricao;

        tituloResumo.textContent =
            ATUALIZACAO_ATUAL.tituloResumo;

        textoResumo.textContent =
            ATUALIZACAO_ATUAL.textoResumo;

        quantidade.textContent =
            ATUALIZACAO_ATUAL
                .novidades
                .length;

        quantidadeAreas.textContent =
            areas.size;

        tempoVideo.textContent =
            ATUALIZACAO_ATUAL
                .duracaoVideo;

        duracaoVideo.textContent =
            ATUALIZACAO_ATUAL
                .duracaoVideo;

        rotuloQuantidade.textContent =
            `${ATUALIZACAO_ATUAL.novidades.length} ${
                ATUALIZACAO_ATUAL.novidades.length ===
                    1
                    ? "novidade"
                    : "novidades"
            }`;

        configurarVideoAtualizacoes();

        lista.innerHTML =
            ATUALIZACAO_ATUAL
                .novidades
                .map(
                    (
                        novidade,
                        indice
                    ) => `
                        <article class="atualizacao-cartao">
                            <header class="atualizacao-cartao-topo">
                                <span class="atualizacao-cartao-numero">
                                    ${String(
                                        indice + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </span>

                                <span class="atualizacao-cartao-categoria">
                                    ${escaparHtmlAtualizacoes(
                                        novidade.categoria
                                    )}
                                </span>
                            </header>

                            <div class="atualizacao-cartao-conteudo">
                                <span class="atualizacao-cartao-icone">
                                    ${criarIconeAtualizacao(
                                        novidade.icone
                                    )}
                                </span>

                                <div>
                                    <h4>
                                        ${escaparHtmlAtualizacoes(
                                            novidade.titulo
                                        )}
                                    </h4>

                                    <p>
                                        ${escaparHtmlAtualizacoes(
                                            novidade.descricao
                                        )}
                                    </p>
                                </div>
                            </div>

                            <footer class="atualizacao-cartao-rodape">
                                <span>
                                    <svg aria-hidden="true">
                                        <use href="#icon-check"></use>
                                    </svg>

                                    ${escaparHtmlAtualizacoes(
                                        novidade.destaque
                                    )}
                                </span>
                            </footer>
                        </article>
                    `
                )
                .join("");
    }

    function obterElementosFocaveis() {
        if (!modal) {
            return [];
        }

        return [
            ...modal.querySelectorAll(
                `
                    button:not([disabled]),
                    a[href],
                    video[controls],
                    [tabindex]:not([tabindex="-1"])
                `
            )
        ].filter(
            elemento =>
                elemento.offsetParent !==
                null
        );
    }

    function abrirAtualizacoes({
        ignorarVisualizacao = false
    } = {}) {
        if (
            !modal ||
            !obterUsuarioAtual()
        ) {
            return;
        }

        if (
            !ignorarVisualizacao &&
            atualizacaoFoiVisualizada()
        ) {
            return;
        }

        const outroModalAberto =
            document.querySelector(
                ".modal.aberto:not(#modalAtualizacoesSistema)"
            );

        if (outroModalAberto) {
            window.setTimeout(
                () => {
                    abrirAtualizacoes({
                        ignorarVisualizacao
                    });
                },
                700
            );

            return;
        }

        renderizarAtualizacoes();

        elementoComFocoAnterior =
            document.activeElement;

        exibidoNestaSessao =
            true;

        modal.classList.add(
            "aberto"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "atualizacoes-sistema-abertas"
        );

        window.setTimeout(
            () => {
                botaoReproduzir
                    ?.focus({
                        preventScroll:
                            true
                    });
            },
            220
        );
    }

    function fecharAtualizacoes({
        marcarComoVisualizada = false
    } = {}) {
        if (!modal) {
            return;
        }

        if (marcarComoVisualizada) {
            registrarVisualizacao();
        }

        pausarVideoAtualizacoes();

        modal.classList.remove(
            "aberto"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "atualizacoes-sistema-abertas"
        );

        elementoComFocoAnterior
            ?.focus?.({
                preventScroll:
                    true
            });

        elementoComFocoAnterior =
            null;
    }

    function verificarAtualizacoes() {
        if (
            exibidoNestaSessao ||
            !obterUsuarioAtual()
        ) {
            return;
        }

        if (atualizacaoFoiVisualizada()) {
            exibidoNestaSessao =
                true;

            return;
        }

        abrirAtualizacoes();
    }

    document
        .querySelectorAll(
            "[data-fechar-atualizacoes]"
        )
        .forEach(
            elemento => {
                elemento.addEventListener(
                    "click",
                    () => {
                        fecharAtualizacoes();
                    }
                );
            }
        );

    botaoVerDepois
        ?.addEventListener(
            "click",
            () => {
                fecharAtualizacoes();
            }
        );

    botaoConfirmar
        ?.addEventListener(
            "click",
            () => {
                fecharAtualizacoes({
                    marcarComoVisualizada:
                        true
                });
            }
        );

    botaoReproduzir
        ?.addEventListener(
            "click",
            carregarVideoAtualizacoes
        );

    document.addEventListener(
        "keydown",
        evento => {
            if (
                !modal?.classList.contains(
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

                fecharAtualizacoes();

                return;
            }

            if (
                evento.key !==
                "Tab"
            ) {
                return;
            }

            const elementos =
                obterElementosFocaveis();

            if (!elementos.length) {
                return;
            }

            const primeiro =
                elementos[0];

            const ultimo =
                elementos[
                    elementos.length - 1
                ];

            if (
                evento.shiftKey &&
                document.activeElement ===
                    primeiro
            ) {
                evento.preventDefault();
                ultimo.focus();

                return;
            }

            if (
                !evento.shiftKey &&
                document.activeElement ===
                    ultimo
            ) {
                evento.preventDefault();
                primeiro.focus();
            }
        }
    );

    window.addEventListener(
        "permissoes-carregadas",
        verificarAtualizacoes
    );

    window.addEventListener(
        "load",
        verificarAtualizacoes
    );

    let tentativas =
        0;

    intervaloVerificacao =
        window.setInterval(
            () => {
                tentativas +=
                    1;

                verificarAtualizacoes();

                if (
                    exibidoNestaSessao ||
                    tentativas >= 40
                ) {
                    window.clearInterval(
                        intervaloVerificacao
                    );
                }
            },
            300
        );

    window.abrirAtualizacoesSistema =
        function () {
            abrirAtualizacoes({
                ignorarVisualizacao:
                    true
            });
        };
})();
