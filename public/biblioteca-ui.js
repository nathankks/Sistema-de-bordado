(() => {
    "use strict";

    /*
    |--------------------------------------------------------------------------
    | Estado
    |--------------------------------------------------------------------------
    */

    let clientes = [];
    let matrizes = [];
    let ordens = [];
    let arquivosBibliotecaAtuais = [];
    let interfaceInicializada = false;

    const chavePastasAbertasBiblioteca =
        "biblioteca-pastas-abertas";

    const pastasAbertasBiblioteca =
        carregarPastasAbertasBiblioteca();

    /*
    |--------------------------------------------------------------------------
    | Elementos
    |--------------------------------------------------------------------------
    */

    const gradeArquivos =
        document.querySelector(
            "#gradeArquivos"
        );

    const buscaBiblioteca =
        document.querySelector(
            "#buscaBiblioteca"
        );

    const filtroClienteBiblioteca =
        document.querySelector(
            "#filtroClienteBiblioteca"
        );

    const filtroTipoBiblioteca =
        document.querySelector(
            "#filtroTipoBiblioteca"
        );

    const filtroVinculoBiblioteca =
        document.querySelector(
            "#filtroVinculoBiblioteca"
        );

    const quantidadeArquivosBiblioteca =
        document.querySelector(
            "#quantidadeArquivosBiblioteca"
        );

    const botaoExpandirPastasBiblioteca =
        document.querySelector(
            "#botaoExpandirPastasBiblioteca"
        );

    const botaoRecolherPastasBiblioteca =
        document.querySelector(
            "#botaoRecolherPastasBiblioteca"
        );

    const botaoLimparFiltrosBiblioteca =
        document.querySelector(
            "#botaoLimparFiltrosBiblioteca"
        );

    const totalArquivosBiblioteca =
        document.querySelector(
            "#totalArquivosBiblioteca"
        );

    const totalOriginaisBiblioteca =
        document.querySelector(
            "#totalOriginaisBiblioteca"
        );

    const totalEditaveisBiblioteca =
        document.querySelector(
            "#totalEditaveisBiblioteca"
        );

    const totalMaquinaBiblioteca =
        document.querySelector(
            "#totalMaquinaBiblioteca"
        );

    const totalSemMatrizBiblioteca =
        document.querySelector(
            "#totalSemMatrizBiblioteca"
        );

    /*
    |--------------------------------------------------------------------------
    | Utilitários
    |--------------------------------------------------------------------------
    */

    
function atualizarDadosLocais() {
    clientes =
        typeof window
            .obterClientesSistema ===
            "function"

            ? window
                .obterClientesSistema()

            : [];

    matrizes =
        typeof window
            .obterMatrizesSistema ===
            "function"

            ? window
                .obterMatrizesSistema()

            : [];

    ordens =
        typeof window
            .obterOrdensSistema ===
            "function"

            ? window
                .obterOrdensSistema()

            : [];
}

function carregarPastasAbertasBiblioteca() {
    try {
        const valorSalvo =
            sessionStorage.getItem(
                chavePastasAbertasBiblioteca
            );

        const ids =
            JSON.parse(
                valorSalvo || "[]"
            );

        return new Set(
            Array.isArray(ids)
                ? ids.map(String)
                : []
        );
    } catch (erro) {
        return new Set();
    }
}

function salvarPastasAbertasBiblioteca() {
    try {
        sessionStorage.setItem(
            chavePastasAbertasBiblioteca,
            JSON.stringify(
                [
                    ...pastasAbertasBiblioteca
                ]
            )
        );
    } catch (erro) {
        // A biblioteca continua funcionando mesmo sem armazenamento.
    }
}

function atualizarBotoesPastasBiblioteca() {
    const pastas =
        [
            ...gradeArquivos
                ?.querySelectorAll(
                    ".pasta-cliente-biblioteca"
                ) || []
        ];

    const quantidadeAbertas =
        pastas.filter(
            pasta => pasta.open
        ).length;

    if (botaoExpandirPastasBiblioteca) {
        botaoExpandirPastasBiblioteca.disabled =
            !pastas.length ||
            quantidadeAbertas === pastas.length;
    }

    if (botaoRecolherPastasBiblioteca) {
        botaoRecolherPastasBiblioteca.disabled =
            !quantidadeAbertas;
    }
}

function definirEstadoDeTodasAsPastas(
    abertas
) {
    const pastas =
        gradeArquivos
            ?.querySelectorAll(
                ".pasta-cliente-biblioteca"
            ) || [];

    for (const pasta of pastas) {
        const clienteId =
            String(
                pasta.dataset
                    .clienteBiblioteca ||
                ""
            );

        pasta.open = abertas;

        if (!clienteId) {
            continue;
        }

        if (abertas) {
            pastasAbertasBiblioteca.add(
                clienteId
            );
        } else {
            pastasAbertasBiblioteca.delete(
                clienteId
            );
        }
    }

    salvarPastasAbertasBiblioteca();
    atualizarBotoesPastasBiblioteca();
}

function existemFiltrosAtivosBiblioteca() {
    const buscaAtiva =
        Boolean(
            normalizarTexto(
                buscaBiblioteca
                    ?.value
            )
        );

    const clienteAtivo =
        Boolean(
            filtroClienteBiblioteca
                ?.value
        );

    const tipoAtivo =
        (
            filtroTipoBiblioteca
                ?.value ||
            "todos"
        ) !== "todos";

    const vinculoAtivo =
        (
            filtroVinculoBiblioteca
                ?.value ||
            "todos"
        ) !== "todos";

    return (
        buscaAtiva ||
        clienteAtivo ||
        tipoAtivo ||
        vinculoAtivo
    );
}

function atualizarBotaoLimparFiltrosBiblioteca() {
    if (!botaoLimparFiltrosBiblioteca) {
        return;
    }

    botaoLimparFiltrosBiblioteca.disabled =
        !existemFiltrosAtivosBiblioteca();
}

function limparFiltrosBiblioteca() {
    if (buscaBiblioteca) {
        buscaBiblioteca.value =
            "";
    }

    if (filtroClienteBiblioteca) {
        filtroClienteBiblioteca.value =
            "";
    }

    if (filtroTipoBiblioteca) {
        filtroTipoBiblioteca.value =
            "todos";
    }

    if (filtroVinculoBiblioteca) {
        filtroVinculoBiblioteca.value =
            "todos";
    }

    [
        filtroClienteBiblioteca,
        filtroTipoBiblioteca,
        filtroVinculoBiblioteca
    ].forEach(
        campo => {
            window
                .atualizarSelectPadraoSistema
                ?.(campo);
        }
    );

    renderizarBiblioteca();

    buscaBiblioteca
        ?.focus();
}

    function normalizarTexto(
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

    function obterExtensaoBiblioteca(
        nome
    ) {
        const texto =
            String(
                nome || ""
            );

        const indice =
            texto.lastIndexOf(
                "."
            );

        if (
            indice < 0 ||
            indice ===
                texto.length - 1
        ) {
            return "ARQUIVO";
        }

        return texto
            .slice(
                indice + 1
            )
            .toUpperCase();
    }

    function obterIniciaisBiblioteca(
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

    function formatarDataBiblioteca(
        valor
    ) {
        if (!valor) {
            return "Data não informada";
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
            return "Data não informada";
        }

        return new Intl
            .DateTimeFormat(
                "pt-BR",
                {
                    dateStyle:
                        "short"
                }
            )
            .format(
                data
            );
    }

    function obterConfiguracaoTipo(
        tipo
    ) {
        const configuracoes = {
            original: {
                rotulo:
                    "Original",

                plural:
                    "originais",

                icone:
                    "file"
            },

            editavel: {
                rotulo:
                    "Editável",

                plural:
                    "editáveis",

                icone:
                    "edit"
            },

            convertido: {
                rotulo:
                    "Arquivo de máquina",

                plural:
                    "arquivos de máquina",

                icone:
                    "check-file"
            }
        };

        return configuracoes[
            tipo
        ] || {
            rotulo:
                "Arquivo",

            plural:
                "arquivos",

            icone:
                "file"
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Vínculos entre arquivos e matrizes
    |--------------------------------------------------------------------------
    */

    function montarMapaVinculos() {
        const mapa =
            new Map();

        function adicionarVinculo(
            arquivo,
            matriz,
            funcao
        ) {
            if (!arquivo?.id) {
                return;
            }

            const vinculos =
                mapa.get(
                    arquivo.id
                ) || [];

            vinculos.push({
                matrizId:
                    matriz.id,

                nome:
                    matriz.nome,

                versao:
                    matriz.versao,

                status:
                    matriz.status,

                statusRotulo:
                    matriz.statusRotulo,

                funcao
            });

            mapa.set(
                arquivo.id,
                vinculos
            );
        }

        for (
            const matriz
            of matrizes
        ) {
            adicionarVinculo(
                matriz.arquivoOriginal,
                matriz,
                "original"
            );

            adicionarVinculo(
                matriz.arquivoEditavel,
                matriz,
                "editavel"
            );

            for (
                const arquivo
                of matriz
                    .arquivosMaquina ||
                []
            ) {
                adicionarVinculo(
                    arquivo,
                    matriz,
                    "maquina"
                );
            }
        }

        return mapa;
    }

    function montarMapaOrdens() {
    const mapa =
        new Map();

    function adicionarOrdem(
        arquivoId,
        ordem,
        funcao
    ) {
        if (!arquivoId) {
            return;
        }

        const usos =
            mapa.get(
                arquivoId
            ) || [];

        usos.push({
            ordemId:
                ordem.id,

            codigo:
                ordem.codigo,

            descricao:
                ordem.descricao,

            status:
                ordem.status,

            statusTexto:
                ordem.statusTexto,

            funcao
        });

        mapa.set(
            arquivoId,
            usos
        );
    }

    for (
        const ordem
        of ordens
    ) {
        adicionarOrdem(
            ordem.arquivoOriginalId,
            ordem,
            "original"
        );

        adicionarOrdem(
            ordem.arquivoConvertidoId,
            ordem,
            "convertido"
        );
    }

    return mapa;
}

    /*
    |--------------------------------------------------------------------------
    | Montagem da biblioteca
    |--------------------------------------------------------------------------
    */

    function montarArquivosBiblioteca() {
        const vinculosPorArquivo =
            montarMapaVinculos();

        const ordensPorArquivo =
            montarMapaOrdens();

        const resultado = [];

        for (
            const cliente
            of clientes
        ) {
            const grupos = [
                {
                    tipo:
                        "original",

                    arquivos:
                        cliente
                            .arquivosOriginais ||
                        []
                },

                {
                    tipo:
                        "editavel",

                    arquivos:
                        cliente
                            .arquivosEditaveis ||
                        []
                },

                {
                    tipo:
                        "convertido",

                    arquivos:
                        cliente
                            .arquivosConvertidos ||
                        []
                }
            ];

            for (
                const grupo
                of grupos
            ) {
                for (
                    const arquivo
                    of grupo.arquivos
                ) {
                    resultado.push({
                        id:
                            arquivo.id,

                        clienteId:
                            cliente.id,

                        clienteNome:
                            cliente.nome,

                        clienteCpf:
                            cliente.cpf ||
                            "",

                        clienteLinha:
                            cliente.linha ||
                            "",

                        tipo:
                            grupo.tipo,

                        nome:
                            arquivo.nome,

                        url:
                            arquivo.url,

                        criadoEm:
                            arquivo.criadoEm,

                        extensao:
                            obterExtensaoBiblioteca(
                                arquivo.nome
                            ),

                        vinculos:
                    vinculosPorArquivo
                        .get(
                            arquivo.id
                        ) ||
                    [],

                ordens:
                    ordensPorArquivo
                        .get(
                            arquivo.id
                        ) ||
                    []
                    });
                }
            }
        }

        return resultado;
    }

    /*
    |--------------------------------------------------------------------------
    | Filtros
    |--------------------------------------------------------------------------
    */

    function preencherFiltroClientes(
        arquivos
    ) {
        if (!filtroClienteBiblioteca) {
            return;
        }

        const valorAtual =
            filtroClienteBiblioteca
                .value;

        const clientesComArquivos =
            [
                ...new Map(
                    arquivos.map(
                        arquivo => [
                            arquivo.clienteId,
                            arquivo.clienteNome
                        ]
                    )
                )
            ]
                .map(
                    (
                        [
                            id,
                            nome
                        ]
                    ) => ({
                        id,
                        nome
                    })
                )
                .sort(
                    (
                        clienteA,
                        clienteB
                    ) =>
                        clienteA.nome
                            .localeCompare(
                                clienteB.nome,
                                "pt-BR"
                            )
                );

        filtroClienteBiblioteca.innerHTML = `
            <option value="">
                Todos os clientes
            </option>

            ${
                clientesComArquivos
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
            clientesComArquivos.some(
                cliente =>
                    cliente.id ===
                        valorAtual
            )
        ) {
            filtroClienteBiblioteca.value =
                valorAtual;
        }

        window
            .atualizarSelectPadraoSistema
            ?.(
                filtroClienteBiblioteca
            );
    }

    function obterArquivosFiltrados(
        arquivos
    ) {
        const busca =
            normalizarTexto(
                buscaBiblioteca
                    ?.value
            );

        const clienteId =
            filtroClienteBiblioteca
                ?.value ||
            "";

        const tipo =
            filtroTipoBiblioteca
                ?.value ||
            "todos";

        const vinculo =
            filtroVinculoBiblioteca
                ?.value ||
            "todos";

        return arquivos.filter(
            arquivo => {
                if (
                    clienteId &&
                    arquivo.clienteId !==
                        clienteId
                ) {
                    return false;
                }

                if (
                    tipo !==
                        "todos" &&
                    arquivo.tipo !==
                        tipo
                ) {
                    return false;
                }

                if (
                    vinculo ===
                        "vinculados" &&
                    !arquivo.vinculos.length
                ) {
                    return false;
                }

                if (
                    vinculo ===
                        "disponiveis" &&
                    arquivo.vinculos.length
                ) {
                    return false;
                }

                if (!busca) {
                    return true;
                }

                const textoMatrizes =
                    arquivo.vinculos
                        .map(
                            item =>
                                `${
                                    item.nome
                                } versão ${
                                    item.versao
                                }`
                        )
                        .join(" ");

                const textoOrdens =
                arquivo.ordens
                    .map(
                        item =>
                            `${
                                item.codigo
                            } ${
                                item.descricao
                            } ${
                                item.statusTexto
                            }`
                    )
                    .join(" ");

            const texto =
                normalizarTexto(
                    [
                        arquivo.nome,
                        arquivo.extensao,
                        arquivo.clienteNome,
                        arquivo.clienteCpf,
                        arquivo.clienteLinha,
                        textoMatrizes,
                        textoOrdens
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
    | Resumo
    |--------------------------------------------------------------------------
    */

    function renderizarResumo(
        arquivos
    ) {
        const totalOriginais =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "original"
            ).length;

        const totalEditaveis =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "editavel"
            ).length;

        const totalMaquina =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "convertido"
            ).length;

        const totalSemMatriz =
            arquivos.filter(
                arquivo =>
                    !arquivo
                        .vinculos
                        .length
            ).length;

        totalArquivosBiblioteca.textContent =
            arquivos.length;

        totalOriginaisBiblioteca.textContent =
            totalOriginais;

        totalEditaveisBiblioteca.textContent =
            totalEditaveis;

        totalMaquinaBiblioteca.textContent =
            totalMaquina;

        totalSemMatrizBiblioteca.textContent =
            totalSemMatriz;
    }

    function arquivoPodeSerVisualizado(
    arquivo
) {
    return arquivo.tipo ===
        "original" &&
        [
            "PNG",
            "JPG",
            "JPEG",
            "WEBP",
            "PDF"
        ].includes(
            arquivo.extensao
        );
}

function obterArquivoBibliotecaPorId(
    id
) {
    return arquivosBibliotecaAtuais
        .find(
            arquivo =>
                arquivo.id === id
        ) ||
        null;
}

    /*
    |--------------------------------------------------------------------------
    | Arquivo individual
    |--------------------------------------------------------------------------
    */

    function criarTextoVinculo(
    arquivo
) {
    const etiquetas = [];

    if (
        arquivo.vinculos.length >
        1
    ) {
        etiquetas.push(`
            <span class="vinculo-arquivo-biblioteca vinculado">
                Vinculado a ${
                    arquivo.vinculos.length
                } matrizes
            </span>
        `);
    } else if (
        arquivo.vinculos.length ===
        1
    ) {
        const vinculo =
            arquivo.vinculos[0];

        etiquetas.push(`
            <span class="vinculo-arquivo-biblioteca vinculado">
                ${escaparHtml(
                    vinculo.nome
                )}
                · versão
                ${escaparHtml(
                    vinculo.versao
                )}
            </span>
        `);
    }

    if (
        arquivo.ordens.length >
        1
    ) {
        etiquetas.push(`
            <span class="vinculo-arquivo-biblioteca ordem">
                Usado em ${
                    arquivo.ordens.length
                } ordens
            </span>
        `);
    } else if (
        arquivo.ordens.length ===
        1
    ) {
        const ordem =
            arquivo.ordens[0];

        etiquetas.push(`
            <span class="vinculo-arquivo-biblioteca ordem">
                Usado na ${escaparHtml(
                    ordem.codigo
                )}
            </span>
        `);
    }

    if (!etiquetas.length) {
        etiquetas.push(`
            <span class="vinculo-arquivo-biblioteca disponivel">
                Disponível · ainda sem matriz
            </span>
        `);
    }

    return `
        <div class="vinculos-arquivo-biblioteca">
            ${etiquetas.join("")}
        </div>
    `;
}

function obterMotivoBloqueioExclusao(
    arquivo
) {
    const temMatriz =
        Boolean(
            arquivo.vinculos.length
        );

    const temOrdem =
        Boolean(
            arquivo.ordens.length
        );

    if (
        temMatriz &&
        temOrdem
    ) {
        return "Arquivo vinculado a uma matriz e utilizado em uma ordem";
    }

    if (temMatriz) {
        return "Arquivo vinculado a uma matriz";
    }

    if (temOrdem) {
        const ordem =
            arquivo.ordens[0];

        return ordem
            ? `Arquivo utilizado na ${ordem.codigo}`
            : "Arquivo utilizado em uma ordem";
    }

    return "Excluir arquivo";
}

    function criarItemArquivo(
    arquivo
) {
    const configuracao =
        obterConfiguracaoTipo(
            arquivo.tipo
        );

    const podeEditarMatrizes =
        window.possuiPermissaoSistema(
            "clientes.editar"
        );

    const podeRemover =
        window.possuiPermissaoSistema(
            "arquivos.remover"
        );

    const vinculoPrincipal =
        arquivo.vinculos[0] ||
        null;

    const ordemPrincipal =
    arquivo.ordens[0] ||
    null;

    const podeVisualizarOrdens =
        window.possuiPermissaoSistema(
            "ordens.visualizar"
    );

    /*
     * Uma imagem original pode ser usada
     * em várias matrizes.
     *
     * EMB e arquivos de máquina só podem
     * pertencer a uma matriz.
     */

    const podeCriarMatriz =
        Boolean(
            arquivo.id
        ) &&
        podeEditarMatrizes &&
        (
            arquivo.tipo ===
                "original" ||
            !arquivo.vinculos.length
        );

    const exclusaoBloqueada =
        Boolean(
            arquivo.vinculos.length ||
            arquivo.ordens.length
        );

    const motivoBloqueioExclusao =
        obterMotivoBloqueioExclusao(
            arquivo
        );

    return `
        <article class="item-biblioteca-arquivo">
            <span class="icone-biblioteca-arquivo">
                ${icone(
                    configuracao.icone
                )}
            </span>

            <div class="informacoes-biblioteca-arquivo">
                <div class="nome-biblioteca-arquivo">
                    <strong
                        title="${escaparHtml(
                            arquivo.nome
                        )}"
                    >
                        ${escaparHtml(
                            arquivo.nome
                        )}
                    </strong>

                    <span class="extensao-biblioteca-arquivo">
                        ${escaparHtml(
                            arquivo.extensao
                        )}
                    </span>
                </div>

                <small>
                    ${escaparHtml(
                        configuracao.rotulo
                    )}
                    · enviado em
                    ${escaparHtml(
                        formatarDataBiblioteca(
                            arquivo.criadoEm
                        )
                    )}
                </small>

                ${
                    criarTextoVinculo(
                        arquivo
                    )
                }
            </div>

            <div class="acoes-biblioteca-arquivo">
                ${
                    arquivoPodeSerVisualizado(
                        arquivo
                    )
                        ? `
                            <a
                                class="botao-acao-biblioteca"
                                href="${escaparHtml(
                                    arquivo.url
                                )}"
                                target="_blank"
                                rel="noopener"
                                title="Visualizar arquivo"
                                aria-label="Visualizar ${escaparHtml(
                                    arquivo.nome
                                )}"
                            >
                                ${icone(
                                    "eye"
                                )}
                            </a>
                        `
                        : ""
                }

                <a
                    class="botao-acao-biblioteca"
                    href="${escaparHtml(
                        arquivo.url
                    )}?download=1"
                    title="Baixar arquivo"
                    aria-label="Baixar ${escaparHtml(
                        arquivo.nome
                    )}"
                >
                    ${icone(
                        "download"
                    )}
                </a>

                                ${
                    vinculoPrincipal &&
                    podeEditarMatrizes
                        ? `
                            <button
                                class="botao-acao-biblioteca"
                                data-abrir-matriz-biblioteca="${escaparHtml(
                                    vinculoPrincipal.matrizId
                                )}"
                                type="button"
                                title="Abrir matriz vinculada"
                                aria-label="Abrir matriz ${escaparHtml(
                                    vinculoPrincipal.nome
                                )}"
                            >
                                ${icone(
                                    "edit"
                                )}
                            </button>
                        `
                        : ""
                }

                ${
                    ordemPrincipal &&
                    podeVisualizarOrdens
                        ? `
                            <button
                                class="botao-acao-biblioteca"
                                data-abrir-ordem-biblioteca="${escaparHtml(
                                    ordemPrincipal.ordemId
                                )}"
                                type="button"
                                title="Abrir ${escaparHtml(
                                    ordemPrincipal.codigo
                                )}"
                                aria-label="Abrir ${escaparHtml(
                                    ordemPrincipal.codigo
                                )}"
                            >
                                ${icone(
                                    "check-file"
                                )}
                            </button>
                        `
                        : ""
                }

                ${
                    podeCriarMatriz
                        ? `
                            <button
                                class="botao-acao-biblioteca"
                                data-criar-matriz-arquivo="${escaparHtml(
                                    arquivo.id
                                )}"
                                type="button"
                                title="Criar matriz com este arquivo"
                                aria-label="Criar matriz com ${escaparHtml(
                                    arquivo.nome
                                )}"
                            >
                                ${icone(
                                    "plus"
                                )}
                            </button>
                        `
                        : ""
                }

                ${
                    podeRemover &&
                    arquivo.id
                        ? `
                            <button
                                class="botao-acao-biblioteca botao-excluir-biblioteca"
                                ${
                                    exclusaoBloqueada
                                        ? "disabled"
                                        : `data-excluir-arquivo-biblioteca="${escaparHtml(
                                            arquivo.id
                                        )}"`
                                }
                                type="button"
                                title="${escaparHtml(
                                    motivoBloqueioExclusao
                                )}"
                                aria-label="${
                                    exclusaoBloqueada
                                        ? escaparHtml(
                                            motivoBloqueioExclusao
                                        )
                                        : `Excluir ${escaparHtml(
                                            arquivo.nome
                                        )}`
                                }"
                            >
                                ${icone(
                                    "trash"
                                )}
                            </button>
                        `
                        : ""
                }
            </div>
        </article>
    `;
}

    /*
    |--------------------------------------------------------------------------
    | Pasta do cliente
    |--------------------------------------------------------------------------
    */

    function criarPastaCliente(
        clienteId,
        arquivos,
        abrirAutomaticamente = false
    ) {
        const clienteNome =
            arquivos[0]
                ?.clienteNome ||
            "Cliente";

        const originais =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "original"
            ).length;

        const editaveis =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "editavel"
            ).length;

        const maquinas =
            arquivos.filter(
                arquivo =>
                    arquivo.tipo ===
                        "convertido"
            ).length;

        const matrizesCliente =
            new Set(
                arquivos.flatMap(
                    arquivo =>
                        arquivo.vinculos
                            .map(
                                vinculo =>
                                    vinculo
                                        .matrizId
                            )
                )
            );

        const arquivosOrdenados =
            [...arquivos]
                .sort(
                    (
                        arquivoA,
                        arquivoB
                    ) => {
                        const ordem = {
                            original:
                                0,

                            editavel:
                                1,

                            convertido:
                                2
                        };

                        const diferencaTipo =
                            ordem[
                                arquivoA.tipo
                            ] -
                            ordem[
                                arquivoB.tipo
                            ];

                        if (diferencaTipo) {
                            return diferencaTipo;
                        }

                        return arquivoA.nome
                            .localeCompare(
                                arquivoB.nome,
                                "pt-BR"
                            );
                    }
                );

        const clienteIdTexto =
    String(
        clienteId
    );

const pastaAberta =
    abrirAutomaticamente ||
    pastasAbertasBiblioteca.has(
        clienteIdTexto
    );

        return `
    <details
        class="pasta-cliente-biblioteca"
        data-cliente-biblioteca="${escaparHtml(
            clienteIdTexto
        )}"
        ${
            pastaAberta
                ? "open"
                : ""
        }
    >
                <summary>
                    <div class="identificacao-pasta-biblioteca">
                        <span class="avatar-pasta-biblioteca">
                            ${escaparHtml(
                                obterIniciaisBiblioteca(
                                    clienteNome
                                )
                            )}
                        </span>

                        <div>
                            <h3>
                                ${escaparHtml(
                                    clienteNome
                                )}
                            </h3>

                            <p>
                                ${arquivos.length}
                                ${
                                    arquivos.length ===
                                        1
                                        ? "arquivo"
                                        : "arquivos"
                                }
                                ·
                                ${matrizesCliente.size}
                                ${
                                    matrizesCliente.size ===
                                        1
                                        ? "matriz"
                                        : "matrizes"
                                }
                            </p>
                        </div>
                    </div>

                    <div class="resumo-pasta-biblioteca">
                        <span>
                            ${originais}
                            originais
                        </span>

                        <span>
                            ${editaveis}
                            editáveis
                        </span>

                        <span>
                            ${maquinas}
                            máquina
                        </span>
                    </div>

                    <span class="seta-pasta-biblioteca">
                        <svg aria-hidden="true">
                            <use href="#icon-arrow-right"></use>
                        </svg>
                    </span>
                </summary>

                <div class="conteudo-pasta-biblioteca">
                    ${
                        arquivosOrdenados
                            .map(
                                criarItemArquivo
                            )
                            .join("")
                    }
                </div>
            </details>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | Renderização principal
    |--------------------------------------------------------------------------
    */

    function renderizarBiblioteca() {
        if (!gradeArquivos) {
            return;
        }

        atualizarDadosLocais();

        const todosOsArquivos =
            montarArquivosBiblioteca();

        arquivosBibliotecaAtuais =
            todosOsArquivos;

        preencherFiltroClientes(
            todosOsArquivos
        );

        renderizarResumo(
            todosOsArquivos
        );

        const arquivosFiltrados =
            obterArquivosFiltrados(
                todosOsArquivos
            );

        const abrirPastasDaBusca =
            Boolean(
                normalizarTexto(
                    buscaBiblioteca
                        ?.value
                )
            );

        quantidadeArquivosBiblioteca
            .textContent =
                `${
                    arquivosFiltrados.length
                } ${
                    arquivosFiltrados.length ===
                        1
                        ? "arquivo"
                        : "arquivos"
                }`;

        atualizarBotaoLimparFiltrosBiblioteca();

        if (!arquivosFiltrados.length) {
            gradeArquivos.innerHTML = `
                <div class="estado-vazio estado-vazio-biblioteca">
                    <div class="estado-vazio-icone">
                        ${icone(
                            "folder"
                        )}
                    </div>

                    <p>
                        Nenhum arquivo encontrado
                    </p>

                    <small>
                        Cadastre arquivos nos clientes
                        ou altere os filtros utilizados.
                    </small>
                </div>
            `;

        atualizarBotoesPastasBiblioteca();

        return;
    }

        const arquivosPorCliente =
            new Map();

        for (
            const arquivo
            of arquivosFiltrados
        ) {
            const lista =
                arquivosPorCliente.get(
                    arquivo.clienteId
                ) ||
                [];

            lista.push(
                arquivo
            );

            arquivosPorCliente.set(
                arquivo.clienteId,
                lista
            );
        }

        const pastas =
            [
                ...arquivosPorCliente
                    .entries()
            ]
                .sort(
                    (
                        [
                            ,
                            arquivosA
                        ],

                        [
                            ,
                            arquivosB
                        ]
                    ) =>
                        arquivosA[0]
                            .clienteNome
                            .localeCompare(
                                arquivosB[0]
                                    .clienteNome,
                                "pt-BR"
                            )
                );

        gradeArquivos.innerHTML =
    pastas
        .map(
            (
                [
                    clienteId,
                    arquivos
                ]
            ) =>
                criarPastaCliente(
                    clienteId,
                    arquivos,
                    abrirPastasDaBusca
                )
        )
        .join("");

atualizarBotoesPastasBiblioteca();
}

async function excluirArquivoBiblioteca(
    arquivoId
) {
    const arquivo =
        obterArquivoBibliotecaPorId(
            arquivoId
        );

    if (!arquivo) {
        return;
    }

    if (
    arquivo.vinculos.length ||
    arquivo.ordens.length
) {
    let mensagem =
        "Este arquivo está protegido e não pode ser excluído.";

    if (
        arquivo.vinculos.length &&
        arquivo.ordens.length
    ) {
        mensagem =
            "O arquivo está vinculado a uma matriz e também é utilizado em uma ordem.";
    } else if (
        arquivo.vinculos.length
    ) {
        mensagem =
            "Abra a matriz vinculada e remova o vínculo antes de excluir o arquivo.";
    } else if (
        arquivo.ordens.length
    ) {
        const ordem =
            arquivo.ordens[0];

        mensagem =
            `O arquivo é utilizado na ${
                ordem?.codigo ||
                "ordem selecionada"
            }. Altere o arquivo da ordem antes de excluí-lo.`;
    }

    mostrarNotificacao(
        "Arquivo protegido",
        mensagem,
        "aviso"
    );

    return;
}

    const confirmou =
        await confirmarAcao({
            titulo:
                "Excluir este arquivo?",

            mensagem:
                `O arquivo ${arquivo.nome} será removido do cliente ${arquivo.clienteNome}.`,

            textoConfirmar:
                "Excluir arquivo",

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
                `/api/clientes/${
                    encodeURIComponent(
                        arquivo.clienteId
                    )
                }/arquivos/${
                    encodeURIComponent(
                        arquivo.id
                    )
                }`,

                {
                    method:
                        "DELETE"
                }
            );

        await window
            .recarregarClientesSistema
            ?.();

        mostrarNotificacao(
            "Arquivo excluído",
            resposta.mensagem ||
                "O arquivo foi removido com sucesso.",
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

    buscaBiblioteca
        ?.addEventListener(
            "input",
            renderizarBiblioteca
        );

    filtroClienteBiblioteca
        ?.addEventListener(
            "change",
            renderizarBiblioteca
        );

    filtroTipoBiblioteca
        ?.addEventListener(
            "change",
            renderizarBiblioteca
        );

    filtroVinculoBiblioteca
        ?.addEventListener(
            "change",
            renderizarBiblioteca
        );

    botaoLimparFiltrosBiblioteca
    ?.addEventListener(
        "click",
        limparFiltrosBiblioteca
    );

    botaoExpandirPastasBiblioteca
    ?.addEventListener(
        "click",
        () =>
            definirEstadoDeTodasAsPastas(
                true
            )
    );

botaoRecolherPastasBiblioteca
    ?.addEventListener(
        "click",
        () =>
            definirEstadoDeTodasAsPastas(
                false
            )
    );

gradeArquivos
    ?.addEventListener(
        "toggle",
        evento => {
            const pasta =
                evento.target;

            if (
                !pasta.matches?.(
                    ".pasta-cliente-biblioteca"
                )
            ) {
                return;
            }

            const clienteId =
                String(
                    pasta.dataset
                        .clienteBiblioteca ||
                    ""
                );

            if (clienteId) {
                if (pasta.open) {
                    pastasAbertasBiblioteca.add(
                        clienteId
                    );
                } else {
                    pastasAbertasBiblioteca.delete(
                        clienteId
                    );
                }

                salvarPastasAbertasBiblioteca();
            }

            atualizarBotoesPastasBiblioteca();
        },
        true
    );

    gradeArquivos
    ?.addEventListener(
        "click",
        evento => {
            const botaoAbrirMatriz =
                evento.target.closest(
                    "[data-abrir-matriz-biblioteca]"
                );

            if (botaoAbrirMatriz) {
                window.abrirMatrizSistema
                    ?.(
                        botaoAbrirMatriz
                            .dataset
                            .abrirMatrizBiblioteca
                    );

                return;
            }

            const botaoAbrirOrdem =
                evento.target.closest(
                    "[data-abrir-ordem-biblioteca]"
                );

            if (botaoAbrirOrdem) {
                window.abrirOrdemSistema
                    ?.(
                        botaoAbrirOrdem
                            .dataset
                            .abrirOrdemBiblioteca
                    );

                return;
            }

            const botaoCriarMatriz =
                evento.target.closest(
                    "[data-criar-matriz-arquivo]"
                );

            if (botaoCriarMatriz) {
                const arquivo =
                    obterArquivoBibliotecaPorId(
                        botaoCriarMatriz
                            .dataset
                            .criarMatrizArquivo
                    );

                if (arquivo) {
                    window
                        .criarMatrizComArquivoSistema
                        ?.(
                            arquivo
                        );
                }

                return;
            }

            const botaoExcluir =
                evento.target.closest(
                    "[data-excluir-arquivo-biblioteca]"
                );

            if (botaoExcluir) {
                excluirArquivoBiblioteca(
                    botaoExcluir
                        .dataset
                        .excluirArquivoBiblioteca
                );
            }
        }
    );

    window.addEventListener(
        "clientes-atualizados",
        renderizarBiblioteca
    );

    window.addEventListener(
        "cliente-salvo",
        renderizarBiblioteca
    );

    window.addEventListener(
        "matrizes-atualizadas",
        renderizarBiblioteca
    );

    window.addEventListener(
        "ordens-atualizadas",
        renderizarBiblioteca
    );

    /*
    |--------------------------------------------------------------------------
    | Inicialização
    |--------------------------------------------------------------------------
    */

    function inicializarBiblioteca() {
        if (
            interfaceInicializada
        ) {
            renderizarBiblioteca();

            return;
        }

        interfaceInicializada =
            true;

        [
            filtroClienteBiblioteca,
            filtroTipoBiblioteca,
            filtroVinculoBiblioteca
        ].forEach(
            campo => {
                window
                    .inicializarSelectPadraoSistema
                    ?.(
                        campo
                    );
            }
        );

        renderizarBiblioteca();
    }

    window.addEventListener(
        "permissoes-carregadas",
        inicializarBiblioteca
    );

    setTimeout(
        inicializarBiblioteca,
        700
    );
})();
