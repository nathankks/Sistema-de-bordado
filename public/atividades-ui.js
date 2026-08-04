const buscaAtividades =
    document.querySelector(
        "#buscaAtividades"
    );

const filtroAcaoAtividades =
    document.querySelector(
        "#filtroAcaoAtividades"
    );

const filtroEntidadeAtividades =
    document.querySelector(
        "#filtroEntidadeAtividades"
    );

const botaoAtualizarAtividades =
    document.querySelector(
        "#botaoAtualizarAtividades"
    );

const listaAtividades =
    document.querySelector(
        "#listaAtividades"
    );

const quantidadeAtividades =
    document.querySelector(
        "#quantidadeAtividades"
    );

let carregandoAtividades =
    false;

let temporizadorBuscaAtividades =
    null;

function formatarDataHoraAtividade(
    valor
) {
    const data =
        new Date(
            valor
        );

    if (
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

function iniciaisAtividade(
    nome
) {
    return String(
        nome ||
        "Usuário"
    )
        .trim()
        .split(/\s+/)
        .slice(
            0,
            2
        )
        .map(
            parte =>
                parte[0] ||
                ""
        )
        .join("")
        .toUpperCase() ||
        "US";
}

function rotuloAcaoAtividade(
    acao
) {
    const rotulos = {
        criar:
            "Criação",

        editar:
            "Edição",

        excluir:
            "Exclusão",

        arquivar:
            "Arquivamento",

        restaurar:
            "Restauração",

        alterar_senha:
            "Senha",

        entrar:
            "Entrada",

        sair:
            "Saída"
    };

    return rotulos[acao] ||
        "Alteração";
}

function renderizarAtividades(
    atividades
) {
    if (!listaAtividades) {
        return;
    }

    quantidadeAtividades
        .textContent =
            `${atividades.length} ${
                atividades.length ===
                    1

                    ? "atividade"

                    : "atividades"
            }`;

    if (!atividades.length) {
        listaAtividades.innerHTML = `
            <div class="estado-vazio estado-vazio-atividades">
                <div class="estado-vazio-icone">
                    <svg aria-hidden="true">
                        <use href="#icon-clock"></use>
                    </svg>
                </div>

                <p>
                    Nenhuma atividade encontrada
                </p>

                <small>
                    Ajuste os filtros ou realize uma nova ação no sistema.
                </small>
            </div>
        `;

        return;
    }

    listaAtividades.innerHTML =
        atividades
            .map(
                atividade => `
                    <article class="item-atividade">
                        <div class="avatar-atividade">
                            ${escaparHtml(
                                iniciaisAtividade(
                                    atividade
                                        .usuarioNome
                                )
                            )}
                        </div>

                        <div class="conteudo-atividade">
                            <div class="topo-atividade">
                                <div>
                                    <strong>
                                        ${escaparHtml(
                                            atividade
                                                .usuarioNome ||
                                            "Usuário"
                                        )}
                                    </strong>

                                    <span>
                                        @${escaparHtml(
                                            atividade
                                                .usuarioLogin ||
                                            "usuario"
                                        )}
                                    </span>
                                </div>

                                <time datetime="${escaparHtml(
                                    atividade
                                        .criadoEm
                                )}">
                                    ${escaparHtml(
                                        formatarDataHoraAtividade(
                                            atividade
                                                .criadoEm
                                        )
                                    )}
                                </time>
                            </div>

                            <p>
                                ${escaparHtml(
                                    atividade
                                        .descricao
                                )}
                            </p>

                            <div class="metadados-atividade">
                                <span
                                    class="etiqueta-atividade"
                                    data-acao-atividade="${escaparHtml(
                                        atividade
                                            .acao
                                    )}"
                                >
                                    ${escaparHtml(
                                        rotuloAcaoAtividade(
                                            atividade
                                                .acao
                                        )
                                    )}
                                </span>

                                <span>
                                    ${escaparHtml(
                                        atividade
                                            .entidade ||
                                        "sistema"
                                    )}
                                </span>

                                ${
                                    atividade
                                        .entidadeId

                                        ? `
                                            <span title="Identificador do registro">
                                                ID: ${escaparHtml(
                                                    atividade
                                                        .entidadeId
                                                )}
                                            </span>
                                        `

                                        : ""
                                }
                            </div>
                        </div>
                    </article>
                `
            )
            .join("");
}

async function carregarAtividadesSistema({
    mostrarErro = true
} = {}) {
    if (
        carregandoAtividades ||
        !listaAtividades
    ) {
        return;
    }

    carregandoAtividades =
        true;

    botaoAtualizarAtividades
        ?.setAttribute(
            "disabled",
            ""
        );

    try {
        const parametros =
            new URLSearchParams();

        const busca =
            buscaAtividades
                ?.value
                ?.trim();

        const acao =
            filtroAcaoAtividades
                ?.value;

        const entidade =
            filtroEntidadeAtividades
                ?.value;

        if (busca) {
            parametros.set(
                "busca",
                busca
            );
        }

        if (
            acao &&
            acao !==
                "todas"
        ) {
            parametros.set(
                "acao",
                acao
            );
        }

        if (
            entidade &&
            entidade !==
                "todas"
        ) {
            parametros.set(
                "entidade",
                entidade
            );
        }

        parametros.set(
            "limite",
            "500"
        );

        const resposta =
            await requisicaoApi(
                `/api/atividades?${
                    parametros
                        .toString()
                }`
            );

        renderizarAtividades(
            resposta.atividades ||
            []
        );
    } catch (erro) {
        if (mostrarErro) {
            mostrarNotificacao(
                "Não foi possível carregar o histórico",
                erro.message,
                "erro"
            );
        }
    } finally {
        carregandoAtividades =
            false;

        botaoAtualizarAtividades
            ?.removeAttribute(
                "disabled"
            );
    }
}

function agendarBuscaAtividades() {
    clearTimeout(
        temporizadorBuscaAtividades
    );

    temporizadorBuscaAtividades =
        setTimeout(
            () =>
                carregarAtividadesSistema(),
            300
        );
}

/*
|--------------------------------------------------------------------------
| Selects personalizados
|--------------------------------------------------------------------------
*/

function inicializarFiltrosAtividades() {
    [
        filtroAcaoAtividades,
        filtroEntidadeAtividades
    ].forEach(
        campo => {
            window
                .inicializarSelectPadraoSistema
                ?.(
                    campo
                );
        }
    );
}

inicializarFiltrosAtividades();

window.addEventListener(
    "permissoes-carregadas",
    inicializarFiltrosAtividades
);

setTimeout(
    inicializarFiltrosAtividades,
    700
);

buscaAtividades
    ?.addEventListener(
        "input",
        agendarBuscaAtividades
    );

filtroAcaoAtividades
    ?.addEventListener(
        "change",
        () =>
            carregarAtividadesSistema()
    );

filtroEntidadeAtividades
    ?.addEventListener(
        "change",
        () =>
            carregarAtividadesSistema()
    );

botaoAtualizarAtividades
    ?.addEventListener(
        "click",
        () =>
            carregarAtividadesSistema()
    );

window.carregarAtividadesSistema =
    carregarAtividadesSistema;
