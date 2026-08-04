(() => {
    "use strict";

    /*
    |--------------------------------------------------------------------------
    | Estado
    |--------------------------------------------------------------------------
    */

    let matrizes = [];
    let carregandoMatrizes = true;
    let interfaceInicializada = false;

    window.obterMatrizesSistema =
        function () {
            return [
                ...matrizes
            ];
        };

    function emitirMatrizesAtualizadas() {
        window.dispatchEvent(
            new CustomEvent(
                "matrizes-atualizadas",
                {
                    detail: {
                        matrizes: [
                            ...matrizes
                        ]
                    }
                }
            )
        );
    }

    let cadastrandoClientePelaMatriz =
        false;

    /*
    |--------------------------------------------------------------------------
    | Elementos
    |--------------------------------------------------------------------------
    */

    const botaoNovaMatriz =
        document.querySelector(
            "#botaoNovaMatriz"
        );

    const gradeMatrizes =
        document.querySelector(
            "#gradeMatrizes"
        );

    const quantidadeMatrizes =
        document.querySelector(
            "#quantidadeMatrizes"
        );

    const buscaMatrizes =
        document.querySelector(
            "#buscaMatrizes"
        );

    const filtroClienteMatrizes =
        document.querySelector(
            "#filtroClienteMatrizes"
        );

    const filtroStatusMatrizes =
        document.querySelector(
            "#filtroStatusMatrizes"
        );

    const modalMatriz =
        document.querySelector(
            "#modalMatriz"
        );

    const formularioMatriz =
        document.querySelector(
            "#formularioMatriz"
        );

    const tituloModalMatriz =
        document.querySelector(
            "#tituloModalMatriz"
        );

    const matrizId =
        document.querySelector(
            "#matrizId"
        );

    const matrizCliente =
        document.querySelector(
            "#matrizCliente"
        );

    const seletorClienteMatriz =
    document.querySelector(
        "#seletorClienteMatriz"
    );

    const botaoClienteMatriz =
        document.querySelector(
            "#botaoClienteMatriz"
        );

    const textoClienteMatriz =
        document.querySelector(
            "#textoClienteMatriz"
        );

    const subtextoClienteMatriz =
        document.querySelector(
            "#subtextoClienteMatriz"
        );

    const avatarClienteMatriz =
        document.querySelector(
            "#avatarClienteMatriz"
        );

    const menuClienteMatriz =
        document.querySelector(
            "#menuClienteMatriz"
        );

    const buscaClienteMatriz =
        document.querySelector(
            "#buscaClienteMatriz"
        );

    const listaClientesMatriz =
        document.querySelector(
            "#listaClientesMatriz"
        );

    const botaoCadastrarClienteMatriz =
        document.querySelector(
            "#botaoCadastrarClienteMatriz"
        );

    const mensagemClienteMatriz =
        document.querySelector(
            "#mensagemClienteMatriz"
        );

    const modalCliente =
        document.querySelector(
            "#modalCliente"
        );

    const matrizNome =
        document.querySelector(
            "#matrizNome"
        );

    const matrizVersao =
        document.querySelector(
            "#matrizVersao"
        );

    const matrizStatus =
        document.querySelector(
            "#matrizStatus"
        );

    const matrizLocalAplicacao =
        document.querySelector(
            "#matrizLocalAplicacao"
        );

    const matrizArquivoOriginalId =
        document.querySelector(
            "#matrizArquivoOriginalId"
        );

    const matrizArquivoEditavelId =
        document.querySelector(
            "#matrizArquivoEditavelId"
        );

    const listaArquivosMaquinaMatriz =
        document.querySelector(
            "#listaArquivosMaquinaMatriz"
        );

    const mensagemArquivosMatriz =
        document.querySelector(
            "#mensagemArquivosMatriz"
        );

    const matrizLarguraMm =
        document.querySelector(
            "#matrizLarguraMm"
        );

    const matrizAlturaMm =
        document.querySelector(
            "#matrizAlturaMm"
        );

    const matrizQuantidadePontos =
        document.querySelector(
            "#matrizQuantidadePontos"
        );

    const matrizQuantidadeCores =
        document.querySelector(
            "#matrizQuantidadeCores"
        );

    const matrizObservacoes =
        document.querySelector(
            "#matrizObservacoes"
        );

    const botaoSalvarMatriz =
        document.querySelector(
            "#botaoSalvarMatriz"
        );

    /*
|--------------------------------------------------------------------------
| Selects personalizados
|--------------------------------------------------------------------------
*/

const controlesSelectCustomMatriz =
    new Map();

function fecharOutrosSelectsCustomMatriz(
    excecao = null
) {
    for (
        const controle
        of controlesSelectCustomMatriz
            .values()
    ) {
        if (
            controle !==
            excecao
        ) {
            controle.fechar();
        }
    }
}

function inicializarSelectCustomMatriz(
    campo
) {
    if (
        !campo ||
        controlesSelectCustomMatriz
            .has(
                campo
            )
    ) {
        return;
    }

    const elementoPai =
        campo.parentElement;

    if (!elementoPai) {
        return;
    }

    /*
     * Cria automaticamente a mesma
     * estrutura visual usada nos
     * selects de arquivos das ordens.
     */

    const raiz =
        document.createElement(
            "div"
        );

    raiz.className =
        "select-arquivo-custom select-matriz-custom";

    raiz.dataset
        .selectCustomMatriz =
            "";

    elementoPai.insertBefore(
        raiz,
        campo
    );

    campo.classList.add(
        "select-arquivo-nativo"
    );

    raiz.appendChild(
        campo
    );

    const gatilho =
        document.createElement(
            "button"
        );

    gatilho.type =
        "button";

    gatilho.className =
        "select-arquivo-gatilho";

    gatilho.setAttribute(
        "aria-haspopup",
        "listbox"
    );

    gatilho.setAttribute(
        "aria-expanded",
        "false"
    );

    const rotuloAcessivel =
        campo.getAttribute(
            "aria-label"
        ) ||
        elementoPai
            .querySelector(
                ":scope > span"
            )
            ?.textContent
            ?.trim() ||
        "Selecionar opção";

    gatilho.setAttribute(
        "aria-label",
        rotuloAcessivel
    );

    const valor =
        document.createElement(
            "span"
        );

    valor.className =
        "select-arquivo-valor";

    valor.textContent =
        "Selecione";

    const seta =
        document.createElement(
            "span"
        );

    seta.className =
        "select-arquivo-seta";

    seta.setAttribute(
        "aria-hidden",
        "true"
    );

    gatilho.append(
        valor,
        seta
    );

    const menu =
        document.createElement(
            "div"
        );

    menu.className =
        "select-arquivo-menu";

    menu.setAttribute(
        "role",
        "listbox"
    );

    menu.hidden =
        true;

    raiz.append(
        gatilho,
        menu
    );

    function fechar() {
        menu.hidden =
            true;

        raiz.classList.remove(
            "aberto"
        );

        gatilho.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function selecionar(
        novoValor
    ) {
        campo.value =
            String(
                novoValor
            );

        campo.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:
                        true
                }
            )
        );

        atualizar();
        fechar();

        gatilho.focus();
    }

    function criarOpcaoVisual(
        opcao
    ) {
        const item =
            document.createElement(
                "button"
            );

        item.type =
            "button";

        item.className =
            "select-arquivo-opcao";

        item.setAttribute(
            "role",
            "option"
        );

        item.setAttribute(
            "aria-selected",
            opcao.value ===
                campo.value
                ? "true"
                : "false"
        );

        item.disabled =
            opcao.disabled;

        item.dataset.valor =
            opcao.value;

        item.textContent =
            opcao.textContent
                .trim();

        item.addEventListener(
            "click",
            () => {
                selecionar(
                    opcao.value
                );
            }
        );

        return item;
    }

    function atualizar() {
        const opcoes = [
            ...campo.options
        ];

        const selecionada =
            opcoes.find(
                opcao =>
                    opcao.value ===
                        campo.value
            ) ||
            opcoes[0] ||
            null;

        valor.textContent =
            selecionada
                ?.textContent
                ?.trim() ||
            "Selecione";

        valor.title =
            valor.textContent;

        gatilho.disabled =
            campo.disabled;

        menu.replaceChildren(
            ...opcoes.map(
                criarOpcaoVisual
            )
        );

        if (
            campo.disabled
        ) {
            fechar();
        }
    }

    function abrir() {
        if (
            campo.disabled
        ) {
            return;
        }

        fecharOutrosSelectsCustomMatriz(
            controle
        );

        menu.hidden =
            false;

        raiz.classList.add(
            "aberto"
        );

        gatilho.setAttribute(
            "aria-expanded",
            "true"
        );

        const selecionada =
            menu.querySelector(
                '[aria-selected="true"]:not(:disabled)'
            );

        const primeira =
            menu.querySelector(
                ".select-arquivo-opcao:not(:disabled)"
            );

        (
            selecionada ||
            primeira
        )?.focus();
    }

    function alternar() {
        if (
            menu.hidden
        ) {
            abrir();
        } else {
            fechar();
        }
    }

    const controle = {
        campo,
        raiz,
        gatilho,
        menu,
        atualizar,
        abrir,
        fechar
    };

    controlesSelectCustomMatriz.set(
        campo,
        controle
    );

    gatilho.addEventListener(
        "click",
        alternar
    );

    campo.addEventListener(
        "change",
        atualizar
    );

    raiz.addEventListener(
        "keydown",
        evento => {
            const opcoesVisuais = [
                ...menu.querySelectorAll(
                    ".select-arquivo-opcao:not(:disabled)"
                )
            ];

            const indiceAtual =
                opcoesVisuais.indexOf(
                    document
                        .activeElement
                );

            if (
                evento.key ===
                    "Enter" ||
                evento.key ===
                    " "
            ) {
                if (
                    document
                        .activeElement ===
                    gatilho
                ) {
                    evento.preventDefault();

                    alternar();
                }

                return;
            }

            if (
                evento.key ===
                    "Escape"
            ) {
                evento.preventDefault();

                fechar();
                gatilho.focus();

                return;
            }

            if (
                evento.key ===
                    "ArrowDown"
            ) {
                evento.preventDefault();

                if (
                    menu.hidden
                ) {
                    abrir();

                    return;
                }

                const proximoIndice =
                    Math.min(
                        indiceAtual + 1,
                        opcoesVisuais
                            .length - 1
                    );

                opcoesVisuais[
                    proximoIndice
                ]?.focus();

                return;
            }

            if (
                evento.key ===
                    "ArrowUp"
            ) {
                evento.preventDefault();

                if (
                    menu.hidden
                ) {
                    abrir();

                    return;
                }

                const indiceAnterior =
                    indiceAtual <= 0
                        ? 0
                        : indiceAtual - 1;

                opcoesVisuais[
                    indiceAnterior
                ]?.focus();

                return;
            }

            if (
                evento.key ===
                    "Home" &&
                !menu.hidden
            ) {
                evento.preventDefault();

                opcoesVisuais[
                    0
                ]?.focus();

                return;
            }

            if (
                evento.key ===
                    "End" &&
                !menu.hidden
            ) {
                evento.preventDefault();

                opcoesVisuais[
                    opcoesVisuais
                        .length - 1
                ]?.focus();
            }
        }
    );

    document.addEventListener(
        "click",
        evento => {
            if (
                !raiz.contains(
                    evento.target
                )
            ) {
                fechar();
            }
        }
    );

    const observador =
        new MutationObserver(
            atualizar
        );

    observador.observe(
        campo,
        {
            childList:
                true,

            subtree:
                true,

            attributes:
                true
        }
    );

    atualizar();
}

function atualizarSelectCustomMatriz(
    campo
) {
    controlesSelectCustomMatriz
        .get(
            campo
        )
        ?.atualizar();
}

function fecharSelectsCustomMatriz() {
    fecharOutrosSelectsCustomMatriz();
}

function inicializarSelectsCustomMatriz() {
    [
        filtroClienteMatrizes,
        filtroStatusMatrizes,
        matrizStatus,
        matrizArquivoOriginalId,
        matrizArquivoEditavelId
    ].forEach(
        inicializarSelectCustomMatriz
    );
}

/*
 * Disponibiliza o mesmo componente
 * visual para outras seções.
 */

window.inicializarSelectPadraoSistema =
    inicializarSelectCustomMatriz;

window.atualizarSelectPadraoSistema =
    atualizarSelectCustomMatriz;

window.fecharSelectsPadraoSistema =
    fecharSelectsCustomMatriz;

    /*
    |--------------------------------------------------------------------------
    | Dados auxiliares
    |--------------------------------------------------------------------------
    */

    function obterClientes() {
        if (
            typeof window
                .obterClientesSistema !==
                "function"
        ) {
            return [];
        }

        return window
            .obterClientesSistema();
    }

    function obterClientePorId(
        id
    ) {
        return obterClientes().find(
            cliente =>
                cliente.id === id
        ) || null;
    }

    function obterArquivosCliente(
        cliente,
        propriedade
    ) {
        const lista =
            cliente?.[
                propriedade
            ];

        return Array.isArray(
            lista
        )
            ? lista
            : [];
    }

    function formatarDataMatriz(
        valor
    ) {
        if (!valor) {
            return "Não informada";
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
            return "Não informada";
        }

        return new Intl
            .DateTimeFormat(
                "pt-BR",
                {
                    dateStyle:
                        "short",

                    timeStyle:
                        "short"
                }
            )
            .format(
                data
            );
    }

    function formatarNumeroMatriz(
        valor
    ) {
        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return "Não informado";
        }

        return new Intl
            .NumberFormat(
                "pt-BR"
            )
            .format(
                Number(valor)
            );
    }

    function formatarDimensoesMatriz(
        matriz
    ) {
        const largura =
            matriz.larguraMm;

        const altura =
            matriz.alturaMm;

        const larguraNaoInformada =
            largura === null ||
            largura === undefined ||
            largura === "";

        const alturaNaoInformada =
            altura === null ||
            altura === undefined ||
            altura === "";

        if (
            larguraNaoInformada &&
            alturaNaoInformada
        ) {
            return "Não informado";
        }

        const larguraFormatada =
            larguraNaoInformada
                ? "—"
                : formatarNumeroMatriz(
                    largura
                );

        const alturaFormatada =
            alturaNaoInformada
                ? "—"
                : formatarNumeroMatriz(
                    altura
                );

        return `${
            larguraFormatada
        } × ${
            alturaFormatada
        } mm`;
    }

    function normalizarBusca(
        valor
    ) {
        return String(
            valor ?? ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Filtros
    |--------------------------------------------------------------------------
    */

    function preencherFiltroClientes() {
        if (!filtroClienteMatrizes) {
            return;
        }

        const valorAtual =
            filtroClienteMatrizes
                .value;

        const clientesOrdenados =
            [...obterClientes()]
                .sort(
                    (
                        clienteA,
                        clienteB
                    ) =>
                        String(
                            clienteA.nome
                        ).localeCompare(
                            String(
                                clienteB.nome
                            ),
                            "pt-BR"
                        )
                );

        filtroClienteMatrizes
            .innerHTML = `
                <option value="">
                    Todos os clientes
                </option>

                ${
                    clientesOrdenados
                        .map(
                            cliente => `
                                <option
                                    value="${escaparHtml(
                                        cliente.id
                                    )}"
                                >
                                    ${escaparHtml(
                                        cliente.nome
                                    )}
                                </option>
                            `
                        )
                        .join("")
                }
            `;

        if (
            clientesOrdenados.some(
                cliente =>
                    cliente.id ===
                        valorAtual
            )
        ) {
            filtroClienteMatrizes.value =
                valorAtual;
        }
    }

    atualizarSelectCustomMatriz(
    filtroClienteMatrizes
    );

    function obterMatrizesFiltradas() {
        const busca =
            normalizarBusca(
                buscaMatrizes
                    ?.value
            );

        const clienteId =
            filtroClienteMatrizes
                ?.value ||
            "";

        const status =
            filtroStatusMatrizes
                ?.value ||
            "todos";

        return matrizes.filter(
            matriz => {
                if (
                    clienteId &&
                    matriz.cliente.id !==
                        clienteId
                ) {
                    return false;
                }

                if (
                    status !==
                        "todos" &&
                    matriz.status !==
                        status
                ) {
                    return false;
                }

                if (!busca) {
                    return true;
                }

                const texto =
                    normalizarBusca(
                        [
                            matriz.nome,
                            matriz.cliente
                                .nome,
                            matriz
                                .localAplicacao,
                            matriz
                                .statusRotulo,
                            `versão ${
                                matriz.versao
                            }`
                        ].join(" ")
                    );

                return texto.includes(
                    busca
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Arquivos nos cards
    |--------------------------------------------------------------------------
    */

    function criarArquivoCardMatriz({
        arquivo,
        rotulo,
        iconeNome
    }) {
        if (!arquivo) {
            return `
                <div class="arquivo-card-matriz ausente">
                    <span class="arquivo-card-matriz-icone">
                        ${icone(
                            iconeNome
                        )}
                    </span>

                    <div>
                        <small>
                            ${escaparHtml(
                                rotulo
                            )}
                        </small>

                        <strong>
                            Não vinculado
                        </strong>
                    </div>
                </div>
            `;
        }

        return `
            <a
                class="arquivo-card-matriz"
                href="${escaparHtml(
                    arquivo.url
                )}?download=1"
                title="Baixar ${escaparHtml(
                    arquivo.nome
                )}"
            >
                <span class="arquivo-card-matriz-icone">
                    ${icone(
                        iconeNome
                    )}
                </span>

                <div>
                    <small>
                        ${escaparHtml(
                            rotulo
                        )}
                    </small>

                    <strong>
                        ${escaparHtml(
                            arquivo.nome
                        )}
                    </strong>
                </div>
            </a>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | Renderização
    |--------------------------------------------------------------------------
    */

    function renderizarMatrizes() {
        if (!gradeMatrizes) {
            return;
        }

        if (carregandoMatrizes) {
            gradeMatrizes.innerHTML = `
                <div class="estado-vazio estado-matrizes">
                    <div class="estado-vazio-icone">
                        ${icone("clock")}
                    </div>

                    <p>
                        Carregando matrizes
                    </p>

                    <small>
                        Aguarde enquanto os dados são consultados.
                    </small>
                </div>
            `;

            return;
        }

        const lista =
            obterMatrizesFiltradas();

        if (quantidadeMatrizes) {
            quantidadeMatrizes.textContent =
                `${lista.length} ${
                    lista.length === 1
                        ? "matriz"
                        : "matrizes"
                }`;
        }

        if (!lista.length) {
            gradeMatrizes.innerHTML = `
                <div class="estado-vazio estado-matrizes">
                    <div class="estado-vazio-icone">
                        ${icone("check-file")}
                    </div>

                    <p>
                        Nenhuma matriz encontrada
                    </p>

                    <small>
                        Cadastre uma matriz ou altere os filtros utilizados.
                    </small>
                </div>
            `;

            return;
        }

        const podeEditar =
            window
                .possuiPermissaoSistema(
                    "clientes.editar"
                );

        const podeExcluir =
            window
                .possuiPermissaoSistema(
                    "clientes.excluir"
                );

        gradeMatrizes.innerHTML =
            lista.map(
                matriz => {
                    const arquivosMaquina =
                        matriz
                            .arquivosMaquina ||
                        [];

                    const arquivosMaquinaHtml =
                        arquivosMaquina
                            .length
                            ? arquivosMaquina
                                .map(
                                    arquivo =>
                                        criarArquivoCardMatriz({
                                            arquivo,
                                            rotulo:
                                                "Arquivo de máquina",
                                            iconeNome:
                                                "check-file"
                                        })
                                )
                                .join("")
                            : criarArquivoCardMatriz({
                                arquivo:
                                    null,
                                rotulo:
                                    "Arquivo de máquina",
                                iconeNome:
                                    "check-file"
                            });

                    return `
                        <article
                            class="card-matriz"
                            data-status-matriz="${escaparHtml(
                                matriz.status
                            )}"
                        >
                            <header class="card-matriz-cabecalho">
                                <div class="card-matriz-identificacao">
                                    <span class="card-matriz-icone">
                                        ${icone(
                                            "check-file"
                                        )}
                                    </span>

                                    <div>
                                        <h3>
                                            ${escaparHtml(
                                                matriz.nome
                                            )}
                                        </h3>

                                        <p>
                                            ${escaparHtml(
                                                matriz
                                                    .cliente
                                                    .nome
                                            )}
                                            · versão
                                            ${escaparHtml(
                                                matriz.versao
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    class="status-matriz status-matriz-${escaparHtml(
                                        matriz.status
                                    )}"
                                >
                                    ${escaparHtml(
                                        matriz
                                            .statusRotulo
                                    )}
                                </span>
                            </header>

                            <div class="dados-card-matriz">
                                <div>
                                    <span>
                                        Aplicação
                                    </span>

                                    <strong>
                                        ${escaparHtml(
                                            matriz
                                                .localAplicacao ||
                                            "Não informada"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Tamanho
                                    </span>

                                    <strong>
                                        ${escaparHtml(
                                            formatarDimensoesMatriz(
                                                matriz
                                            )
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Pontos
                                    </span>

                                    <strong>
                                        ${escaparHtml(
                                            formatarNumeroMatriz(
                                                matriz
                                                    .quantidadePontos
                                            )
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Cores
                                    </span>

                                    <strong>
                                        ${escaparHtml(
                                            formatarNumeroMatriz(
                                                matriz
                                                    .quantidadeCores
                                            )
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <section class="arquivos-card-matriz">
                                ${
                                    criarArquivoCardMatriz({
                                        arquivo:
                                            matriz
                                                .arquivoOriginal,
                                        rotulo:
                                            "Logo original",
                                        iconeNome:
                                            "file"
                                    })
                                }

                                ${
                                    criarArquivoCardMatriz({
                                        arquivo:
                                            matriz
                                                .arquivoEditavel,
                                        rotulo:
                                            "Arquivo editável",
                                        iconeNome:
                                            "edit"
                                    })
                                }

                                ${arquivosMaquinaHtml}
                            </section>

                            <footer class="card-matriz-rodape">
                                <small>
                                    Atualizada em
                                    ${escaparHtml(
                                        formatarDataMatriz(
                                            matriz
                                                .atualizadoEm
                                        )
                                    )}
                                </small>

                                ${
    (
        podeEditar ||
        (
            matriz.status ===
                "arquivada" &&
            podeExcluir
        )
    )
        ? `
            <div class="acoes-card-matriz">
                ${
                    podeEditar
                        ? `
                            <button
                                class="botao botao-secundario botao-card-matriz"
                                data-editar-matriz="${escaparHtml(
                                    matriz.id
                                )}"
                                type="button"
                            >
                                ${icone(
                                    "edit"
                                )}

                                <span>
                                    Editar
                                </span>
                            </button>
                        `
                        : ""
                }

                ${
                    matriz.status !==
                        "arquivada"
                        ? podeEditar
                            ? `
                                <button
                                    class="botao botao-secundario botao-card-matriz"
                                    data-arquivar-matriz="${escaparHtml(
                                        matriz.id
                                    )}"
                                    type="button"
                                >
                                    ${icone(
                                        "folder"
                                    )}

                                    <span>
                                        Arquivar
                                    </span>
                                </button>
                            `
                            : ""
                        : `
                            ${
                                podeEditar
                                    ? `
                                        <button
                                            class="botao botao-secundario botao-card-matriz"
                                            data-restaurar-matriz="${escaparHtml(
                                                matriz.id
                                            )}"
                                            type="button"
                                        >
                                            ${icone(
                                                "check"
                                            )}

                                            <span>
                                                Restaurar
                                            </span>
                                        </button>
                                    `
                                    : ""
                            }

                            ${
                                podeExcluir
                                    ? `
                                        <button
                                            class="botao botao-perigo botao-card-matriz"
                                            data-excluir-matriz="${escaparHtml(
                                                matriz.id
                                            )}"
                                            type="button"
                                        >
                                            ${icone(
                                                "trash"
                                            )}

                                            <span>
                                                Excluir
                                            </span>
                                        </button>
                                    `
                                    : ""
                            }
                        `
                }
            </div>
        `
        : ""
}
                            </footer>
                        </article>
                    `;
                }
            )
            .join("");
    }

    /*
    |--------------------------------------------------------------------------
    | Carregamento
    |--------------------------------------------------------------------------
    */

    async function carregarMatrizes({
        mostrarErro = true
    } = {}) {
        if (
            !window
                .possuiPermissaoSistema(
                    "clientes.visualizar"
                )
        ) {
            matrizes = [];
            carregandoMatrizes =
                false;

            renderizarMatrizes();
            emitirMatrizesAtualizadas();

            return;
        }

        carregandoMatrizes =
            true;

        renderizarMatrizes();

        try {
            const resposta =
                await requisicaoApi(
                    "/api/matrizes"
                );

            matrizes =
                Array.isArray(
                    resposta.matrizes
                )
                    ? resposta.matrizes
                    : [];
        } catch (erro) {
            matrizes = [];

            if (mostrarErro) {
                mostrarNotificacao(
                    "Não foi possível carregar as matrizes",
                    erro.message,
                    "erro"
                );
            }
        } finally {
            carregandoMatrizes =
                false;

            renderizarMatrizes();
            emitirMatrizesAtualizadas();
        }
    }

    /*
|--------------------------------------------------------------------------
| Cliente pesquisável da matriz
|--------------------------------------------------------------------------
*/

function obterIniciaisClienteMatriz(
    nome
) {
    const partes =
        String(
            nome || ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!partes.length) {
        return "CL";
    }

    return partes
        .slice(
            0,
            2
        )
        .map(
            parte =>
                parte
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}

function obterClientesOrdenadosMatriz() {
    return [
        ...obterClientes()
    ].sort(
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

function atualizarVisualClienteMatriz() {
    const cliente =
        obterClientePorId(
            matrizCliente
                ?.value
        );

    if (!cliente) {
        textoClienteMatriz.textContent =
            "Selecione um cliente";

        subtextoClienteMatriz.textContent =
            "Pesquise pelo nome do cliente";

        avatarClienteMatriz.hidden =
            true;

        return;
    }

    textoClienteMatriz.textContent =
        cliente.nome ||
        "Cliente";

    subtextoClienteMatriz.textContent =
        "Cliente selecionado";

    avatarClienteMatriz.textContent =
        obterIniciaisClienteMatriz(
            cliente.nome
        );

    avatarClienteMatriz.hidden =
        false;
}

function criarOpcaoClienteMatriz(
    cliente
) {
    const selecionado =
        String(
            matrizCliente
                ?.value ||
            ""
        ) ===
        String(
            cliente.id
        );

    return `
        <button
            class="opcao-menu-linha opcao-cliente-matriz ${
                selecionado
                    ? "selecionada"
                    : ""
            }"
            data-cliente-matriz="${escaparHtml(
                cliente.id
            )}"
            type="button"
            role="option"
            aria-selected="${selecionado}"
        >
            <span
                class="avatar-cliente avatar-opcao-cliente"
            >
                ${escaparHtml(
                    obterIniciaisClienteMatriz(
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

function renderizarClientesMatriz() {
    if (!listaClientesMatriz) {
        return;
    }

    const termo =
        normalizarBusca(
            buscaClienteMatriz
                ?.value ||
            ""
        );

    const clientesFiltrados =
        obterClientesOrdenadosMatriz()
            .filter(
                cliente => {
                    if (!termo) {
                        return true;
                    }

                    return normalizarBusca(
                        cliente.nome
                    ).includes(
                        termo
                    );
                }
            );

    if (!clientesFiltrados.length) {
        listaClientesMatriz.innerHTML = `
            <div class="menu-linha-vazio">
                <strong>
                    Nenhum cliente encontrado
                </strong>

                <span>
                    Pesquise usando outro nome
                    ou cadastre um cliente novo.
                </span>
            </div>
        `;

        return;
    }

    listaClientesMatriz.innerHTML =
        clientesFiltrados
            .map(
                criarOpcaoClienteMatriz
            )
            .join("");
}

function abrirMenuClienteMatriz() {
    if (
        !menuClienteMatriz ||
        !botaoClienteMatriz
    ) {
        return;
    }

    fecharSelectsCustomMatriz();

    menuClienteMatriz.hidden =
        false;

    seletorClienteMatriz
        ?.classList.add(
            "aberto"
        );

    botaoClienteMatriz.setAttribute(
        "aria-expanded",
        "true"
    );

    buscaClienteMatriz.value =
        "";

    renderizarClientesMatriz();

    setTimeout(
        () => {
            buscaClienteMatriz
                ?.focus();
        },
        30
    );
}

function fecharMenuClienteMatriz() {
    if (
        !menuClienteMatriz ||
        !botaoClienteMatriz
    ) {
        return;
    }

    menuClienteMatriz.hidden =
        true;

    seletorClienteMatriz
        ?.classList.remove(
            "aberto"
        );

    botaoClienteMatriz.setAttribute(
        "aria-expanded",
        "false"
    );
}

function selecionarClienteMatriz(
    clienteId
) {
    const cliente =
        obterClientePorId(
            clienteId
        );

    if (!cliente) {
        return;
    }

    matrizCliente.value =
        cliente.id;

    botaoClienteMatriz
        ?.classList.remove(
            "invalido"
        );

    mensagemClienteMatriz
        ?.classList.remove(
            "erro"
        );

    mensagemClienteMatriz.textContent =
        "Cliente selecionado.";

    atualizarVisualClienteMatriz();
    fecharMenuClienteMatriz();

    /*
     * Ao trocar o cliente manualmente,
     * limpa os vínculos do cliente anterior.
     */

    preencherArquivosModal();
}

    /*
    |--------------------------------------------------------------------------
    | Clientes e arquivos do modal
    |--------------------------------------------------------------------------
    */

function preencherClientesModal() {
    if (!matrizCliente) {
        return;
    }

    const valorAtual =
        matrizCliente.value;

    const clientesOrdenados =
        obterClientesOrdenadosMatriz();

    matrizCliente.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>

        ${
            clientesOrdenados
                .map(
                    cliente => `
                        <option
                            value="${escaparHtml(
                                cliente.id
                            )}"
                        >
                            ${escaparHtml(
                                cliente.nome
                            )}
                        </option>
                    `
                )
                .join("")
        }
    `;

    if (
        clientesOrdenados.some(
            cliente =>
                String(
                    cliente.id
                ) ===
                String(
                    valorAtual
                )
        )
    ) {
        matrizCliente.value =
            valorAtual;
    }

    atualizarVisualClienteMatriz();

    if (
        menuClienteMatriz &&
        !menuClienteMatriz.hidden
    ) {
        renderizarClientesMatriz();
    }
}

    function obterIdsVinculados(
        matrizAtualId = ""
    ) {
        const ids =
            new Set();

        for (
            const matriz
            of matrizes
        ) {
            if (
                matriz.id ===
                    matrizAtualId
            ) {
                continue;
            }

            if (
                matriz
                    .arquivoEditavel
                    ?.id
            ) {
                ids.add(
                    matriz
                        .arquivoEditavel
                        .id
                );
            }

            for (
                const arquivo
                of matriz
                    .arquivosMaquina ||
                []
            ) {
                ids.add(
                    arquivo.id
                );
            }
        }

        return ids;
    }

    function preencherArquivosModal(
        matrizAtual = null
    ) {
        const cliente =
            obterClientePorId(
                matrizCliente
                    ?.value
            );

        const originalAtualId =
            matrizAtual
                ?.arquivoOriginal
                ?.id ||
            "";

        const editavelAtualId =
            matrizAtual
                ?.arquivoEditavel
                ?.id ||
            "";

        const maquinasAtuaisIds =
            new Set(
                (
                    matrizAtual
                        ?.arquivosMaquina ||
                    []
                ).map(
                    arquivo =>
                        arquivo.id
                )
            );

        if (!cliente) {
            matrizArquivoOriginalId
                .innerHTML = `
                    <option value="">
                        Selecione primeiro um cliente
                    </option>
                `;

            matrizArquivoEditavelId
                .innerHTML = `
                    <option value="">
                        Selecione primeiro um cliente
                    </option>
                `;

            atualizarSelectCustomMatriz(
                matrizArquivoOriginalId
            );

            atualizarSelectCustomMatriz(
                matrizArquivoEditavelId
            );

            listaArquivosMaquinaMatriz
                .innerHTML = `
                    <div class="estado-arquivos-matriz">
                        Selecione primeiro um cliente.
                    </div>
                `;

            mensagemArquivosMatriz
                .textContent = "";

            return;
        }

        const originais =
            obterArquivosCliente(
                cliente,
                "arquivosOriginais"
            );

        const editaveis =
            obterArquivosCliente(
                cliente,
                "arquivosEditaveis"
            );

        const maquinas =
            obterArquivosCliente(
                cliente,
                "arquivosConvertidos"
            );

        const idsVinculados =
            obterIdsVinculados(
                matrizAtual?.id ||
                ""
            );

        const editaveisDisponiveis =
            editaveis.filter(
                arquivo =>
                    !idsVinculados.has(
                        arquivo.id
                    ) ||
                    arquivo.id ===
                        editavelAtualId
            );

        const maquinasDisponiveis =
            maquinas.filter(
                arquivo =>
                    !idsVinculados.has(
                        arquivo.id
                    ) ||
                    maquinasAtuaisIds.has(
                        arquivo.id
                    )
            );

        matrizArquivoOriginalId
            .innerHTML = `
                <option value="">
                    Nenhuma logo selecionada
                </option>

                ${
                    originais
                        .map(
                            arquivo => `
                                <option
                                    value="${escaparHtml(
                                        arquivo.id
                                    )}"
                                >
                                    ${escaparHtml(
                                        arquivo.nome
                                    )}
                                </option>
                            `
                        )
                        .join("")
                }
            `;

        matrizArquivoEditavelId
            .innerHTML = `
                <option value="">
                    Nenhum EMB selecionado
                </option>

                ${
                    editaveisDisponiveis
                        .map(
                            arquivo => `
                                <option
                                    value="${escaparHtml(
                                        arquivo.id
                                    )}"
                                >
                                    ${escaparHtml(
                                        arquivo.nome
                                    )}
                                </option>
                            `
                        )
                        .join("")
                }
            `;

        matrizArquivoOriginalId.value =
            originalAtualId;

        matrizArquivoEditavelId.value =
            editavelAtualId;

        if (
            maquinasDisponiveis.length
        ) {
            listaArquivosMaquinaMatriz
                .innerHTML =
                    maquinasDisponiveis
                        .map(
                            arquivo => `
                                <label class="opcao-arquivo-matriz">
                                    <input
                                        type="checkbox"
                                        name="arquivoMaquinaMatriz"
                                        value="${escaparHtml(
                                            arquivo.id
                                        )}"
                                        ${
                                            maquinasAtuaisIds.has(
                                                arquivo.id
                                            )
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                    <span class="opcao-arquivo-matriz-icone">
                                        ${icone(
                                            "check-file"
                                        )}
                                    </span>

                                    <span class="opcao-arquivo-matriz-texto">
                                        <strong>
                                            ${escaparHtml(
                                                arquivo.nome
                                            )}
                                        </strong>

                                        <small>
                                            Arquivo de máquina
                                        </small>
                                    </span>
                                </label>
                            `
                        )
                        .join("");
        } else {
            listaArquivosMaquinaMatriz
                .innerHTML = `
                    <div class="estado-arquivos-matriz">
                        Nenhum arquivo de máquina disponível para este cliente.
                    </div>
                `;
        }

        mensagemArquivosMatriz
            .textContent =
                `${originais.length} originais · ${
                    editaveisDisponiveis.length
                } editáveis disponíveis · ${
                    maquinasDisponiveis.length
                } arquivos de máquina disponíveis`;
    }

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    function abrirModalMatriz(
        matriz = null
    ) {
        if (
            !window
                .exigirPermissaoInterface(
                    "clientes.editar",
                    "Você não possui permissão para cadastrar ou editar matrizes."
                )
        ) {
            return;
        }

        formularioMatriz.reset();

        fecharMenuClienteMatriz();

        botaoClienteMatriz
            ?.classList.remove(
                "invalido"
            );

        mensagemClienteMatriz
            ?.classList.remove(
                "erro"
            );

        mensagemClienteMatriz.textContent =
            "Selecione o cliente responsável pela matriz.";

        matrizId.value =
            matriz?.id ||
            "";

        tituloModalMatriz.textContent =
            matriz
                ? "Editar matriz"
                : "Nova matriz";

        botaoSalvarMatriz
            .querySelector(
                "span"
            )
            .textContent =
                matriz
                    ? "Salvar alterações"
                    : "Salvar matriz";

        preencherClientesModal();

        if (matriz) {
            matrizCliente.value =
                matriz.cliente.id;

            matrizNome.value =
                matriz.nome;

            matrizVersao.value =
                matriz.versao;

            matrizStatus.value =
                matriz.status;

            matrizLocalAplicacao.value =
                matriz.localAplicacao ||
                "";

            matrizLarguraMm.value =
                matriz.larguraMm ??
                "";

            matrizAlturaMm.value =
                matriz.alturaMm ??
                "";

            matrizQuantidadePontos.value =
                matriz
                    .quantidadePontos ??
                "";

            matrizQuantidadeCores.value =
                matriz
                    .quantidadeCores ??
                "";

            matrizObservacoes.value =
                matriz.observacoes ||
                "";
        } else {
            matrizVersao.value =
                "1";

            matrizStatus.value =
                "rascunho";

            const clienteFiltrado =
                filtroClienteMatrizes
                    ?.value ||
                "";

            if (clienteFiltrado) {
                matrizCliente.value =
                    clienteFiltrado;
            }
        }

        atualizarVisualClienteMatriz();

        preencherArquivosModal(
            matriz
        );

        atualizarSelectCustomMatriz(
            matrizStatus
        );

        atualizarSelectCustomMatriz(
            matrizArquivoOriginalId
        );

        atualizarSelectCustomMatriz(
            matrizArquivoEditavelId
        );

        fecharSelectsCustomMatriz();

        modalMatriz.classList.add(
            "aberto"
        );

        modalMatriz.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        setTimeout(
            () => {
                if (
                    matrizCliente.value
                ) {
                    matrizNome.focus();
                } else {
                    botaoClienteMatriz
                        ?.focus();
                }
            },
            100
        );
    }

    function obterNomeBaseArquivoMatriz(
    nome
) {
    const texto =
        String(
            nome ||
            "Nova matriz"
        ).trim();

    const semExtensao =
        texto.replace(
            /\.[^.]+$/,
            ""
        );

    return semExtensao
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim() ||
        "Nova matriz";
}

function criarMatrizComArquivo(
    arquivo
) {
    if (
        !arquivo?.id ||
        !arquivo?.clienteId
    ) {
        mostrarNotificacao(
            "Arquivo inválido",
            "Não foi possível identificar o arquivo selecionado.",
            "erro"
        );

        return;
    }

    abrirModalMatriz();

    matrizCliente.value =
        arquivo.clienteId;

    atualizarVisualClienteMatriz();
    preencherArquivosModal();

    matrizNome.value =
        obterNomeBaseArquivoMatriz(
            arquivo.nome
        );

    if (
        arquivo.tipo ===
            "original"
    ) {
        matrizArquivoOriginalId.value =
            arquivo.id;

        atualizarSelectCustomMatriz(
            matrizArquivoOriginalId
        );
    } else if (
        arquivo.tipo ===
            "editavel"
    ) {
        matrizArquivoEditavelId.value =
            arquivo.id;

        atualizarSelectCustomMatriz(
            matrizArquivoEditavelId
        );
    } else if (
        arquivo.tipo ===
            "convertido"
    ) {
        const campoArquivo =
            [
                ...listaArquivosMaquinaMatriz
                    .querySelectorAll(
                        'input[name="arquivoMaquinaMatriz"]'
                    )
            ].find(
                campo =>
                    campo.value ===
                        arquivo.id
            );

        if (campoArquivo) {
            campoArquivo.checked =
                true;
        }
    }

    mensagemArquivosMatriz.textContent =
        "Arquivo selecionado pela biblioteca.";

    setTimeout(
        () => {
            matrizNome.focus();
            matrizNome.select();
        },
        80
    );
}

window.abrirMatrizSistema =
    function (id) {
        const matriz =
            matrizes.find(
                item =>
                    item.id === id
            );

        if (!matriz) {
            mostrarNotificacao(
                "Matriz não encontrada",
                "Atualize a página e tente novamente.",
                "erro"
            );

            return;
        }

        abrirModalMatriz(
            matriz
        );
    };

window.criarMatrizComArquivoSistema =
    criarMatrizComArquivo;

    function fecharModalMatriz() {
        fecharMenuClienteMatriz();
        fecharSelectsCustomMatriz();

        modalMatriz.classList.remove(
            "aberto"
        );

        modalMatriz.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";
    }

    /*
    |--------------------------------------------------------------------------
    | Salvar
    |--------------------------------------------------------------------------
    */

    async function salvarMatriz(
        evento
    ) {
        evento.preventDefault();

        if (
            !window
                .exigirPermissaoInterface(
                    "clientes.editar",
                    "Você não possui permissão para salvar matrizes."
                )
        ) {
            return;
        }

        const id =
            String(
                matrizId.value ||
                ""
            ).trim();

        const arquivosMaquinaIds =
            [
                ...document
                    .querySelectorAll(
                        'input[name="arquivoMaquinaMatriz"]:checked'
                    )
            ].map(
                campo =>
                    campo.value
            );

        const dados = {
            clienteId:
                matrizCliente.value,

            nome:
                matrizNome.value,

            versao:
                Number(
                    matrizVersao.value
                ),

            status:
                matrizStatus.value,

            localAplicacao:
                matrizLocalAplicacao
                    .value,

            arquivoOriginalId:
                matrizArquivoOriginalId
                    .value,

            arquivoEditavelId:
                matrizArquivoEditavelId
                    .value,

            arquivosMaquinaIds,

            larguraMm:
                matrizLarguraMm
                    .value,

            alturaMm:
                matrizAlturaMm
                    .value,

            quantidadePontos:
                matrizQuantidadePontos
                    .value,

            quantidadeCores:
                matrizQuantidadeCores
                    .value,

            observacoes:
                matrizObservacoes
                    .value
        };

        if (!dados.clienteId) {
            botaoClienteMatriz
                ?.classList.add(
                    "invalido"
                );

            mensagemClienteMatriz
                ?.classList.add(
                    "erro"
                );

            mensagemClienteMatriz.textContent =
                "Selecione um cliente para continuar.";

            mostrarNotificacao(
                "Cliente obrigatório",
                "Selecione o cliente da matriz.",
                "erro"
            );

            botaoClienteMatriz
                ?.focus();

            return;
        }

        if (
            dados.nome
                .trim()
                .length <
            2
        ) {
            mostrarNotificacao(
                "Nome obrigatório",
                "Informe um nome válido para a matriz.",
                "erro"
            );

            matrizNome.focus();

            return;
        }

        const textoOriginalBotao =
            botaoSalvarMatriz
                .querySelector(
                    "span"
                )
                .textContent;

        botaoSalvarMatriz.disabled =
            true;

        botaoSalvarMatriz
            .querySelector(
                "span"
            )
            .textContent =
                "Salvando...";

        try {
            const resposta =
                await requisicaoApi(
                    id
                        ? `/api/matrizes/${
                            encodeURIComponent(
                                id
                            )
                        }`
                        : "/api/matrizes",

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

            await carregarMatrizes({
                mostrarErro:
                    false
            });

            fecharModalMatriz();

            mostrarNotificacao(
                id
                    ? "Matriz atualizada"
                    : "Matriz cadastrada",

                resposta.mensagem ||
                    "A matriz foi salva com sucesso.",

                "sucesso"
            );
        } catch (erro) {
            mostrarNotificacao(
                "Não foi possível salvar a matriz",
                erro.message,
                "erro"
            );
        } finally {
            botaoSalvarMatriz.disabled =
                false;

            botaoSalvarMatriz
                .querySelector(
                    "span"
                )
                .textContent =
                    textoOriginalBotao;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Arquivar
    |--------------------------------------------------------------------------
    */

    async function arquivarMatriz(
        id
    ) {
        const matriz =
            matrizes.find(
                item =>
                    item.id === id
            );

        if (!matriz) {
            return;
        }

        const confirmou =
            await confirmarAcao({
                titulo:
                    "Arquivar esta matriz?",

                mensagem:
                    `A matriz ${matriz.nome}, versão ${matriz.versao}, ficará fora da produção ativa.`,

                textoConfirmar:
                    "Arquivar matriz",

                tipo:
                    "aviso",

                icone:
                    "folder"
            });

        if (!confirmou) {
            return;
        }

        try {
            const resposta =
                await requisicaoApi(
                    `/api/matrizes/${
                        encodeURIComponent(
                            id
                        )
                    }/arquivar`,

                    {
                        method:
                            "PATCH"
                    }
                );

            await carregarMatrizes({
                mostrarErro:
                    false
            });

            mostrarNotificacao(
                "Matriz arquivada",
                resposta.mensagem ||
                    "A matriz foi arquivada.",
                "sucesso"
            );
        } catch (erro) {
            mostrarNotificacao(
                "Não foi possível arquivar",
                erro.message,
                "erro"
            );
        }
    }

/*
|--------------------------------------------------------------------------
| Restaurar matriz arquivada
|--------------------------------------------------------------------------
*/

async function restaurarMatriz(
    id
) {
    const matriz =
        matrizes.find(
            item =>
                item.id === id
        );

    if (!matriz) {
        return;
    }

    if (
        matriz.status !==
            "arquivada"
    ) {
        mostrarNotificacao(
            "Matriz não arquivada",
            "Somente matrizes arquivadas podem ser restauradas.",
            "aviso"
        );

        return;
    }

    const confirmou =
        await confirmarAcao({
            titulo:
                "Restaurar esta matriz?",

            mensagem:
                `A matriz ${matriz.nome}, versão ${matriz.versao}, voltará para o status Rascunho e poderá ser utilizada novamente.`,

            textoConfirmar:
                "Restaurar matriz",

            tipo:
                "sucesso",

            icone:
                "check"
        });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/matrizes/${
                    encodeURIComponent(
                        id
                    )
                }/restaurar`,

                {
                    method:
                        "PATCH"
                }
            );

        await carregarMatrizes({
            mostrarErro:
                false
        });

        mostrarNotificacao(
            "Matriz restaurada",
            resposta.mensagem ||
                "A matriz voltou para o status Rascunho.",
            "sucesso"
        );
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível restaurar",
            erro.message,
            "erro"
        );
    }
}

    /*
|--------------------------------------------------------------------------
| Excluir permanentemente
|--------------------------------------------------------------------------
*/

async function excluirMatriz(
    id
) {
    const matriz =
        matrizes.find(
            item =>
                item.id === id
        );

    if (!matriz) {
        return;
    }

    if (
        matriz.status !==
            "arquivada"
    ) {
        mostrarNotificacao(
            "Arquive a matriz primeiro",
            "Somente matrizes arquivadas podem ser excluídas permanentemente.",
            "aviso"
        );

        return;
    }

    const confirmou =
        await confirmarAcao({
            titulo:
                "Excluir esta matriz permanentemente?",

            mensagem:
                `A matriz ${matriz.nome}, versão ${matriz.versao}, será apagada. As ordens continuarão salvas sem o vínculo com a matriz, e os arquivos continuarão disponíveis na Biblioteca. Esta ação não pode ser desfeita.`,

            textoConfirmar:
                "Excluir permanentemente",

            tipo:
                "perigo",

            icone:
                "trash"
        });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/matrizes/${
                    encodeURIComponent(
                        id
                    )
                }`,

                {
                    method:
                        "DELETE"
                }
            );

        await carregarMatrizes({
            mostrarErro:
                false
        });

        mostrarNotificacao(
            "Matriz excluída",
            resposta.mensagem ||
                "A matriz foi excluída permanentemente.",
            "sucesso"
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

    botaoNovaMatriz
    ?.addEventListener(
        "click",
        () => {
            abrirModalMatriz();
        }
    );

    formularioMatriz
        ?.addEventListener(
            "submit",
            salvarMatriz
        );

    matrizCliente
        ?.addEventListener(
            "change",
            () => {
                atualizarVisualClienteMatriz();
                preencherArquivosModal();
            }
        );

botaoClienteMatriz
    ?.addEventListener(
        "click",
        () => {
            if (
                menuClienteMatriz
                    ?.hidden
            ) {
                abrirMenuClienteMatriz();
            } else {
                fecharMenuClienteMatriz();
            }
        }
    );

    buscaClienteMatriz
        ?.addEventListener(
            "input",
            renderizarClientesMatriz
        );

    listaClientesMatriz
        ?.addEventListener(
            "click",
            evento => {
                const botao =
                    evento.target.closest(
                        "[data-cliente-matriz]"
                    );

                if (!botao) {
                    return;
                }

                selecionarClienteMatriz(
                    botao.dataset
                        .clienteMatriz
                );
            }
        );

    botaoCadastrarClienteMatriz
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

            fecharMenuClienteMatriz();
            fecharSelectsCustomMatriz();

            cadastrandoClientePelaMatriz =
                true;

            modalCliente
                ?.classList.add(
                    "modal-cliente-sobre-matriz"
                );

            abrirModalCliente();
        }
    );

    document.addEventListener(
        "click",
        evento => {
            if (
                seletorClienteMatriz &&
                !seletorClienteMatriz
                    .contains(
                        evento.target
                    ) &&
                evento.target !==
                    botaoCadastrarClienteMatriz
            ) {
                fecharMenuClienteMatriz();
            }
        }
    );

    buscaMatrizes
        ?.addEventListener(
            "input",
            renderizarMatrizes
        );

    filtroClienteMatrizes
        ?.addEventListener(
            "change",
            renderizarMatrizes
        );

    filtroStatusMatrizes
        ?.addEventListener(
            "change",
            renderizarMatrizes
        );

    gradeMatrizes
        ?.addEventListener(
            "click",
            evento => {
                const botaoEditar =
                    evento.target.closest(
                        "[data-editar-matriz]"
                    );

                if (botaoEditar) {
                    const matriz =
                        matrizes.find(
                            item =>
                                item.id ===
                                    botaoEditar
                                        .dataset
                                        .editarMatriz
                        );

                    if (matriz) {
                        abrirModalMatriz(
                            matriz
                        );
                    }

                    return;
                }

                const botaoArquivar =
                    evento.target.closest(
                        "[data-arquivar-matriz]"
                    );

                if (botaoArquivar) {
                        arquivarMatriz(
                            botaoArquivar
                                .dataset
                                .arquivarMatriz
                        );

                        return;
                    }

                    const botaoRestaurar =
    evento.target.closest(
        "[data-restaurar-matriz]"
    );

if (botaoRestaurar) {
    restaurarMatriz(
        botaoRestaurar
            .dataset
            .restaurarMatriz
    );

    return;
}

                    const botaoExcluir =
                        evento.target.closest(
                            "[data-excluir-matriz]"
                        );

                    if (botaoExcluir) {
                        excluirMatriz(
                            botaoExcluir
                                .dataset
                                .excluirMatriz
                        );
                    }
            }
        );

    document
        .querySelectorAll(
            "[data-fechar-matriz]"
        )
        .forEach(
            elemento => {
                elemento.addEventListener(
                    "click",
                    fecharModalMatriz
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
                menuClienteMatriz &&
                !menuClienteMatriz.hidden
            ) {
                fecharMenuClienteMatriz();

                botaoClienteMatriz
                    ?.focus();

                return;
            }

            if (
                modalMatriz
                    ?.classList
                    .contains(
                        "aberto"
                    )
            ) {
                fecharModalMatriz();
            }
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Inicialização
    |--------------------------------------------------------------------------
    */

    function inicializarInterfaceMatrizes() {
        if (
            !window
                .possuiPermissaoSistema(
                    "clientes.visualizar"
                )
        ) {
            return;
        }

        inicializarSelectsCustomMatriz();

        preencherFiltroClientes();
        preencherClientesModal();

        if (interfaceInicializada) {
            renderizarMatrizes();

            return;
        }

        interfaceInicializada =
            true;

        carregarMatrizes();
    }

    window.addEventListener(
        "permissoes-carregadas",
        inicializarInterfaceMatrizes
    );

    window.addEventListener(
        "clientes-atualizados",
        () => {
            preencherFiltroClientes();
            preencherClientesModal();

            if (
                modalMatriz
                    ?.classList
                    .contains(
                        "aberto"
                    )
            ) {
                const matrizAtual =
                    matrizes.find(
                        matriz =>
                            matriz.id ===
                                matrizId.value
                    ) ||
                    null;

                preencherArquivosModal(
                    matrizAtual
                );
            }
        }
    );

    window.addEventListener(
        "cliente-salvo",
        evento => {
            preencherFiltroClientes();
            preencherClientesModal();

            if (
                !cadastrandoClientePelaMatriz
            ) {
                return;
            }

            const cliente =
                evento.detail?.cliente;

            if (!cliente?.id) {
                return;
            }

            selecionarClienteMatriz(
                cliente.id
            );

            mensagemClienteMatriz.textContent =
                "Cliente cadastrado e selecionado na matriz.";
        }
    );

    window.addEventListener(
    "modal-cliente-fechado",
    () => {
        if (
            !cadastrandoClientePelaMatriz
        ) {
            return;
        }

        cadastrandoClientePelaMatriz =
            false;

        modalCliente
            ?.classList.remove(
                "modal-cliente-sobre-matriz"
            );

        if (
            modalMatriz
                ?.classList
                .contains(
                    "aberto"
                )
        ) {
            document.body.style.overflow =
                "hidden";

            setTimeout(
                () => {
                    botaoClienteMatriz
                        ?.focus();
                },
                50
            );
        }
    }
);

    setTimeout(
        inicializarInterfaceMatrizes,
        500
    );
})();
