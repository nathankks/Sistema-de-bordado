/*
|--------------------------------------------------------------------------
| Gerenciamento de usuários
|--------------------------------------------------------------------------
*/

const menuUsuarios =
    document.querySelector(
        "#menuUsuarios"
    );

const secaoUsuarios =
    document.querySelector(
        "#secao-usuarios"
    );

const botaoNovoUsuario =
    document.querySelector(
        "#botaoNovoUsuario"
    );

const buscaUsuarios =
    document.querySelector(
        "#buscaUsuarios"
    );

const filtroPerfilUsuarios =
    document.querySelector(
        "#filtroPerfilUsuarios"
    );

const filtroSituacaoUsuarios =
    document.querySelector(
        "#filtroSituacaoUsuarios"
    );

const quantidadeUsuarios =
    document.querySelector(
        "#quantidadeUsuarios"
    );

const totalUsuarios =
    document.querySelector(
        "#totalUsuarios"
    );

const totalUsuariosAtivos =
    document.querySelector(
        "#totalUsuariosAtivos"
    );

const totalAdministradores =
    document.querySelector(
        "#totalAdministradores"
    );

const corpoTabelaUsuarios =
    document.querySelector(
        "#corpoTabelaUsuarios"
    );

/*
|--------------------------------------------------------------------------
| Modal de usuário
|--------------------------------------------------------------------------
*/

const modalUsuario =
    document.querySelector(
        "#modalUsuario"
    );

const tituloModalUsuario =
    document.querySelector(
        "#tituloModalUsuario"
    );

const formularioUsuario =
    document.querySelector(
        "#formularioUsuario"
    );

const usuarioGerenciadoId =
    document.querySelector(
        "#usuarioGerenciadoId"
    );

const nomeUsuarioGerenciado =
    document.querySelector(
        "#nomeUsuarioGerenciado"
    );

const loginUsuarioGerenciado =
    document.querySelector(
        "#loginUsuarioGerenciado"
    );

const perfilUsuarioGerenciado =
    document.querySelector(
        "#perfilUsuarioGerenciado"
    );

const campoSituacaoUsuario =
    document.querySelector(
        "#campoSituacaoUsuario"
    );

const situacaoUsuarioGerenciado =
    document.querySelector(
        "#situacaoUsuarioGerenciado"
    );

const camposSenhaNovoUsuario =
    document.querySelector(
        "#camposSenhaNovoUsuario"
    );

const senhaUsuarioGerenciado =
    document.querySelector(
        "#senhaUsuarioGerenciado"
    );

const confirmarSenhaUsuarioGerenciado =
    document.querySelector(
        "#confirmarSenhaUsuarioGerenciado"
    );

const botaoSalvarUsuario =
    document.querySelector(
        "#botaoSalvarUsuario"
    );

/*
|--------------------------------------------------------------------------
| Permissões
|--------------------------------------------------------------------------
*/

const grupoPermissoesUsuario =
    document.querySelector(
        "#grupoPermissoesUsuario"
    );

const botaoPermissoesPadrao =
    document.querySelector(
        "#botaoPermissoesPadrao"
    );

const botaoMarcarTodasPermissoes =
    document.querySelector(
        "#botaoMarcarTodasPermissoes"
    );

const camposPermissoesUsuario =
    Array.from(
        grupoPermissoesUsuario
            ?.querySelectorAll(
                "[data-permissao]"
            ) ||

        document.querySelectorAll(
            "[data-permissao]"
        )
    );

const CHAVES_PERMISSOES_USUARIO =
    Object.freeze([
        "clientes.visualizar",
        "clientes.criar",
        "clientes.editar",
        "clientes.excluir",

        "ordens.visualizar",
        "ordens.criar",
        "ordens.editar",
        "ordens.excluir",

        "linhas.visualizar",
        "linhas.criar",
        "linhas.editar",
        "linhas.excluir",

        "arquivos.baixar",
        "arquivos.remover",

        "backup.criar",
        "backup.restaurar",

        "usuarios.gerenciar"
    ]);

const PERMISSOES_PADRAO_ADMINISTRADOR =
    Object.freeze(
        Object.fromEntries(
            CHAVES_PERMISSOES_USUARIO
                .map(
                    permissao => [
                        permissao,
                        true
                    ]
                )
        )
    );

const PERMISSOES_PADRAO_OPERADOR =
    Object.freeze({
        "clientes.visualizar":
            true,

        "clientes.criar":
            true,

        "clientes.editar":
            true,

        "clientes.excluir":
            false,

        "ordens.visualizar":
            true,

        "ordens.criar":
            true,

        "ordens.editar":
            true,

        "ordens.excluir":
            false,

        "linhas.visualizar":
            true,

        "linhas.criar":
            false,

        "linhas.editar":
            false,

        "linhas.excluir":
            false,

        "arquivos.baixar":
            true,

        "arquivos.remover":
            false,

        "backup.criar":
            false,

        "backup.restaurar":
            false,

        "usuarios.gerenciar":
            false
    });

/*
|--------------------------------------------------------------------------
| Modal de redefinição de senha
|--------------------------------------------------------------------------
*/

const modalSenhaUsuario =
    document.querySelector(
        "#modalSenhaUsuario"
    );

const descricaoModalSenhaUsuario =
    document.querySelector(
        "#descricaoModalSenhaUsuario"
    );

const formularioSenhaUsuario =
    document.querySelector(
        "#formularioSenhaUsuario"
    );

const senhaUsuarioId =
    document.querySelector(
        "#senhaUsuarioId"
    );

const novaSenhaUsuario =
    document.querySelector(
        "#novaSenhaUsuario"
    );

const confirmarNovaSenhaUsuario =
    document.querySelector(
        "#confirmarNovaSenhaUsuario"
    );

const botaoSalvarSenhaUsuario =
    document.querySelector(
        "#botaoSalvarSenhaUsuario"
    );

/*
|--------------------------------------------------------------------------
| Estado
|--------------------------------------------------------------------------
*/

let usuariosGerenciados =
    [];

let usuarioAtualGerenciamento =
    null;

let carregandoUsuarios =
    false;

/*
|--------------------------------------------------------------------------
| Utilitários
|--------------------------------------------------------------------------
*/

function escaparTextoUsuario(
    valor
) {
    const elemento =
        document.createElement(
            "div"
        );

    elemento.textContent =
        String(
            valor ?? ""
        );

    return elemento.innerHTML;
}

function obterIniciaisGerenciamento(
    nome
) {
    return String(
        nome || ""
    )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            2
        )
        .map(
            parte =>
                parte[0]
                    ?.toUpperCase()
        )
        .join("") ||
        "US";
}

function formatarPerfilGerenciamento(
    perfil
) {
    return perfil ===
        "administrador"

        ? "Administrador"

        : "Operador";
}

function formatarDataGerenciamento(
    data
) {
    if (!data) {
        return "Nunca acessou";
    }

    const dataConvertida =
        new Date(
            data
        );

    if (
        Number.isNaN(
            dataConvertida
                .getTime()
        )
    ) {
        return "Nunca acessou";
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
        dataConvertida
    );
}

function encontrarUsuarioGerenciado(
    id
) {
    return usuariosGerenciados
        .find(
            usuario =>
                usuario.id === id
        ) ||
        null;
}

function textoDoBotao(
    botao,
    texto
) {
    const elemento =
        botao?.querySelector(
            "span"
        );

    if (elemento) {
        elemento.textContent =
            texto;

        return;
    }

    if (botao) {
        botao.textContent =
            texto;
    }
}

function temPermissaoGerenciarUsuarios(
    usuario
) {
    return Boolean(
        usuario
            ?.permissoes
            ?.[
                "usuarios.gerenciar"
            ]
    );
}

/*
|--------------------------------------------------------------------------
| Controle das permissões
|--------------------------------------------------------------------------
*/

function obterPermissoesPadraoUsuario(
    perfil
) {
    const origem =
        perfil ===
            "administrador"

            ? PERMISSOES_PADRAO_ADMINISTRADOR

            : PERMISSOES_PADRAO_OPERADOR;

    return Object.fromEntries(
        CHAVES_PERMISSOES_USUARIO
            .map(
                permissao => [
                    permissao,

                    Boolean(
                        origem[
                            permissao
                        ]
                    )
                ]
            )
    );
}

function normalizarPermissoesUsuario(
    permissoes,
    perfil
) {
    const resultado =
        obterPermissoesPadraoUsuario(
            perfil
        );

    if (
        !permissoes ||
        typeof permissoes !==
            "object" ||
        Array.isArray(
            permissoes
        )
    ) {
        return resultado;
    }

    for (
        const permissao
        of CHAVES_PERMISSOES_USUARIO
    ) {
        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    permissoes,
                    permissao
                )
        ) {
            resultado[
                permissao
            ] =
                Boolean(
                    permissoes[
                        permissao
                    ]
                );
        }
    }

    return resultado;
}

function aplicarPermissoesNoFormulario(
    permissoes,

    perfil =
        perfilUsuarioGerenciado
            ?.value ||
        "operador"
) {
    const normalizadas =
        normalizarPermissoesUsuario(
            permissoes,
            perfil
        );

    for (
        const campo
        of camposPermissoesUsuario
    ) {
        campo.checked =
            Boolean(
                normalizadas[
                    campo.dataset
                        .permissao
                ]
            );
    }

    atualizarBotaoMarcarPermissoes();
}

function coletarPermissoesDoFormulario(
    perfil
) {
    const permissoes =
        obterPermissoesPadraoUsuario(
            perfil
        );

    for (
        const campo
        of camposPermissoesUsuario
    ) {
        const permissao =
            campo.dataset
                .permissao;

        if (
            CHAVES_PERMISSOES_USUARIO
                .includes(
                    permissao
                )
        ) {
            permissoes[
                permissao
            ] =
                campo.checked;
        }
    }

    return permissoes;
}

function todasPermissoesMarcadas() {
    return (
        camposPermissoesUsuario
            .length > 0 &&

        camposPermissoesUsuario
            .every(
                campo =>
                    campo.checked
            )
    );
}

function atualizarBotaoMarcarPermissoes() {
    if (
        !botaoMarcarTodasPermissoes
    ) {
        return;
    }

    botaoMarcarTodasPermissoes
        .textContent =
        todasPermissoesMarcadas()

            ? "Desmarcar todas"

            : "Marcar todas";
}

function restaurarPermissoesPadrao() {
    const perfil =
        perfilUsuarioGerenciado
            ?.value ||
        "operador";

    aplicarPermissoesNoFormulario(
        obterPermissoesPadraoUsuario(
            perfil
        ),

        perfil
    );

    mostrarNotificacao(
        "Permissões restauradas",

        perfil ===
            "administrador"

            ? "Foi aplicado o modelo padrão de administrador."

            : "Foi aplicado o modelo padrão de operador."
    );
}

function alternarTodasPermissoes() {
    const marcar =
        !todasPermissoesMarcadas();

    for (
        const campo
        of camposPermissoesUsuario
    ) {
        campo.checked =
            marcar;
    }

    atualizarBotaoMarcarPermissoes();
}

function alterarModeloPermissoesPorPerfil() {
    const perfil =
        perfilUsuarioGerenciado
            ?.value ||
        "operador";

    aplicarPermissoesNoFormulario(
        obterPermissoesPadraoUsuario(
            perfil
        ),

        perfil
    );
}

/*
|--------------------------------------------------------------------------
| Resumos e filtros
|--------------------------------------------------------------------------
*/

function atualizarResumoUsuarios() {
    const ativos =
        usuariosGerenciados
            .filter(
                usuario =>
                    usuario.ativo
            )
            .length;

    const administradores =
        usuariosGerenciados
            .filter(
                usuario =>
                    usuario.perfil ===
                    "administrador"
            )
            .length;

    if (totalUsuarios) {
        totalUsuarios.textContent =
            String(
                usuariosGerenciados
                    .length
            );
    }

    if (totalUsuariosAtivos) {
        totalUsuariosAtivos
            .textContent =
            String(
                ativos
            );
    }

    if (totalAdministradores) {
        totalAdministradores
            .textContent =
            String(
                administradores
            );
    }
}

function obterUsuariosFiltrados() {
    const busca =
        String(
            buscaUsuarios
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const perfil =
        filtroPerfilUsuarios
            ?.value ||
        "todos";

    const situacao =
        filtroSituacaoUsuarios
            ?.value ||
        "todos";

    return usuariosGerenciados
        .filter(
            usuario => {
                const correspondeBusca =
                    !busca ||

                    String(
                        usuario.nome ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busca
                        ) ||

                    String(
                        usuario.usuario ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busca
                        );

                const correspondePerfil =
                    perfil ===
                        "todos" ||

                    usuario.perfil ===
                        perfil;

                const correspondeSituacao =
                    situacao ===
                        "todos" ||

                    (
                        situacao ===
                            "ativos" &&
                        usuario.ativo
                    ) ||

                    (
                        situacao ===
                            "inativos" &&
                        !usuario.ativo
                    );

                return (
                    correspondeBusca &&
                    correspondePerfil &&
                    correspondeSituacao
                );
            }
        );
}

/*
|--------------------------------------------------------------------------
| Renderização da tabela
|--------------------------------------------------------------------------
*/

function renderizarUsuarios() {
    if (
        !corpoTabelaUsuarios
    ) {
        return;
    }

    atualizarResumoUsuarios();

    if (carregandoUsuarios) {
        corpoTabelaUsuarios
            .innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="estado-vazio">
                            <div class="estado-vazio-icone">
                                <svg aria-hidden="true">
                                    <use href="#icon-clock"></use>
                                </svg>
                            </div>

                            <p>
                                Carregando usuários...
                            </p>
                        </div>
                    </td>
                </tr>
            `;

        return;
    }

    const filtrados =
        obterUsuariosFiltrados();

    if (quantidadeUsuarios) {
        quantidadeUsuarios
            .textContent =
            `${
                filtrados.length
            } ${
                filtrados.length === 1
                    ? "usuário"
                    : "usuários"
            }`;
    }

    if (!filtrados.length) {
        corpoTabelaUsuarios
            .innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="estado-vazio">
                            <div class="estado-vazio-icone">
                                <svg aria-hidden="true">
                                    <use href="#icon-search"></use>
                                </svg>
                            </div>

                            <p>
                                Nenhum usuário encontrado
                            </p>

                            <small>
                                Altere os filtros ou cadastre
                                um novo usuário.
                            </small>
                        </div>
                    </td>
                </tr>
            `;

        return;
    }

    corpoTabelaUsuarios
        .innerHTML =
        filtrados
            .map(
                usuario => {
                    const proprioUsuario =
                        Boolean(
                            usuarioAtualGerenciamento &&

                            usuario.id ===
                                usuarioAtualGerenciamento
                                    .id
                        );

                    const detalheCriacao =
                        proprioUsuario

                            ? "Sua conta"

                            : `Criado em ${
                                formatarDataGerenciamento(
                                    usuario.criadoEm
                                )
                            }`;

                    const acoes =
                        proprioUsuario

                            ? `
                                <button
                                    class="botao-acao-usuario"
                                    data-acao-usuario="minha-conta"
                                    type="button"
                                    title="Abrir minha conta"
                                >
                                    <svg aria-hidden="true">
                                        <use href="#icon-settings"></use>
                                    </svg>
                                </button>
                            `

                            : `
                                <button
                                    class="botao-acao-usuario"
                                    data-acao-usuario="editar"
                                    data-usuario-id="${
                                        escaparTextoUsuario(
                                            usuario.id
                                        )
                                    }"
                                    type="button"
                                    title="Editar usuário"
                                >
                                    <svg aria-hidden="true">
                                        <use href="#icon-edit"></use>
                                    </svg>
                                </button>

                                <button
                                    class="botao-acao-usuario"
                                    data-acao-usuario="senha"
                                    data-usuario-id="${
                                        escaparTextoUsuario(
                                            usuario.id
                                        )
                                    }"
                                    type="button"
                                    title="Redefinir senha"
                                >
                                    <svg aria-hidden="true">
                                        <use href="#icon-check-file"></use>
                                    </svg>
                                </button>

                                <button
                                    class="botao-acao-usuario"
                                    data-acao-usuario="situacao"
                                    data-usuario-id="${
                                        escaparTextoUsuario(
                                            usuario.id
                                        )
                                    }"
                                    type="button"
                                    title="${
                                        usuario.ativo
                                            ? "Desativar usuário"
                                            : "Ativar usuário"
                                    }"
                                >
                                    <svg aria-hidden="true">
                                        <use href="#icon-${
                                            usuario.ativo
                                                ? "x"
                                                : "check"
                                        }"></use>
                                    </svg>
                                </button>

                                <button
                                    class="botao-acao-usuario perigo"
                                    data-acao-usuario="excluir"
                                    data-usuario-id="${
                                        escaparTextoUsuario(
                                            usuario.id
                                        )
                                    }"
                                    type="button"
                                    title="Excluir usuário"
                                >
                                    <svg aria-hidden="true">
                                        <use href="#icon-trash"></use>
                                    </svg>
                                </button>
                            `;

                    return `
                        <tr>
                            <td>
                                <div class="usuario-identificacao">
                                    <span class="usuario-avatar">
                                        ${
                                            escaparTextoUsuario(
                                                obterIniciaisGerenciamento(
                                                    usuario.nome
                                                )
                                            )
                                        }
                                    </span>

                                    <div>
                                        <strong>
                                            ${
                                                escaparTextoUsuario(
                                                    usuario.nome
                                                )
                                            }
                                        </strong>

                                        <small>
                                            ${
                                                escaparTextoUsuario(
                                                    detalheCriacao
                                                )
                                            }
                                        </small>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <span class="usuario-login">
                                    @${
                                        escaparTextoUsuario(
                                            usuario.usuario
                                        )
                                    }
                                </span>
                            </td>

                            <td>
                                <span
                                    class="etiqueta-perfil-usuario ${
                                        escaparTextoUsuario(
                                            usuario.perfil
                                        )
                                    }"
                                >
                                    ${
                                        escaparTextoUsuario(
                                            formatarPerfilGerenciamento(
                                                usuario.perfil
                                            )
                                        )
                                    }
                                </span>
                            </td>

                            <td>
                                <span
                                    class="etiqueta-situacao-usuario ${
                                        usuario.ativo
                                            ? "ativo"
                                            : "inativo"
                                    }"
                                >
                                    ${
                                        usuario.ativo
                                            ? "Ativo"
                                            : "Inativo"
                                    }
                                </span>
                            </td>

                            <td>
                                ${
                                    escaparTextoUsuario(
                                        formatarDataGerenciamento(
                                            usuario.ultimoLoginEm
                                        )
                                    )
                                }
                            </td>

                            <td>
                                <div class="acoes-usuario">
                                    ${acoes}
                                </div>
                            </td>
                        </tr>
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

async function carregarUsuarios() {
    carregandoUsuarios =
        true;

    renderizarUsuarios();

    try {
        const resposta =
            await requisicaoApi(
                "/api/usuarios"
            );

        usuariosGerenciados =
            Array.isArray(
                resposta.usuarios
            )

                ? resposta.usuarios

                : [];
    } catch (erro) {
        usuariosGerenciados =
            [];

        mostrarNotificacao(
            "Não foi possível carregar",
            erro.message,
            "erro"
        );
    } finally {
        carregandoUsuarios =
            false;

        renderizarUsuarios();
    }
}

/*
|--------------------------------------------------------------------------
| Modais
|--------------------------------------------------------------------------
*/

function abrirModalGerenciamento(
    modal
) {
    if (!modal) {
        return;
    }

    modal.classList.add(
        "aberto"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}

function fecharModalGerenciamento(
    modal
) {
    if (!modal) {
        return;
    }

    modal.classList.remove(
        "aberto"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    const existeOutroModalAberto =
        Boolean(
            document.querySelector(
                ".modal.aberto"
            )
        );

    if (!existeOutroModalAberto) {
        document.body.style.overflow =
            "";
    }
}

function abrirNovoUsuario() {
    formularioUsuario
        ?.reset();

    if (usuarioGerenciadoId) {
        usuarioGerenciadoId.value =
            "";
    }

    if (tituloModalUsuario) {
        tituloModalUsuario.textContent =
            "Novo usuário";
    }

    if (perfilUsuarioGerenciado) {
        perfilUsuarioGerenciado.value =
            "operador";
    }

    aplicarPermissoesNoFormulario(
        obterPermissoesPadraoUsuario(
            "operador"
        ),

        "operador"
    );

    if (campoSituacaoUsuario) {
        campoSituacaoUsuario.hidden =
            true;
    }

    if (camposSenhaNovoUsuario) {
        camposSenhaNovoUsuario.hidden =
            false;
    }

    if (senhaUsuarioGerenciado) {
        senhaUsuarioGerenciado.required =
            true;
    }

    if (
        confirmarSenhaUsuarioGerenciado
    ) {
        confirmarSenhaUsuarioGerenciado
            .required =
            true;
    }

    textoDoBotao(
        botaoSalvarUsuario,
        "Criar usuário"
    );

    abrirModalGerenciamento(
        modalUsuario
    );

    setTimeout(
        () =>
            nomeUsuarioGerenciado
                ?.focus(),

        50
    );
}

function abrirEdicaoUsuario(
    usuario
) {
    if (!usuario) {
        return;
    }

    formularioUsuario
        ?.reset();

    if (usuarioGerenciadoId) {
        usuarioGerenciadoId.value =
            usuario.id;
    }

    if (nomeUsuarioGerenciado) {
        nomeUsuarioGerenciado.value =
            usuario.nome ||
            "";
    }

    if (loginUsuarioGerenciado) {
        loginUsuarioGerenciado.value =
            usuario.usuario ||
            "";
    }

    const perfil =
        usuario.perfil ||
        "operador";

    if (perfilUsuarioGerenciado) {
        perfilUsuarioGerenciado.value =
            perfil;
    }

    aplicarPermissoesNoFormulario(
        usuario.permissoes,
        perfil
    );

    if (situacaoUsuarioGerenciado) {
        situacaoUsuarioGerenciado.value =
            usuario.ativo
                ? "true"
                : "false";
    }

    if (tituloModalUsuario) {
        tituloModalUsuario.textContent =
            "Editar usuário";
    }

    if (campoSituacaoUsuario) {
        campoSituacaoUsuario.hidden =
            false;
    }

    if (camposSenhaNovoUsuario) {
        camposSenhaNovoUsuario.hidden =
            true;
    }

    if (senhaUsuarioGerenciado) {
        senhaUsuarioGerenciado.required =
            false;

        senhaUsuarioGerenciado.value =
            "";
    }

    if (
        confirmarSenhaUsuarioGerenciado
    ) {
        confirmarSenhaUsuarioGerenciado
            .required =
            false;

        confirmarSenhaUsuarioGerenciado
            .value =
            "";
    }

    textoDoBotao(
        botaoSalvarUsuario,
        "Salvar alterações"
    );

    abrirModalGerenciamento(
        modalUsuario
    );

    setTimeout(
        () =>
            nomeUsuarioGerenciado
                ?.focus(),

        50
    );
}

function abrirRedefinicaoSenha(
    usuario
) {
    if (!usuario) {
        return;
    }

    formularioSenhaUsuario
        ?.reset();

    if (senhaUsuarioId) {
        senhaUsuarioId.value =
            usuario.id;
    }

    if (
        descricaoModalSenhaUsuario
    ) {
        descricaoModalSenhaUsuario
            .textContent =
            `Defina uma nova senha para ${usuario.nome}.`;
    }

    abrirModalGerenciamento(
        modalSenhaUsuario
    );

    setTimeout(
        () =>
            novaSenhaUsuario
                ?.focus(),

        50
    );
}

/*
|--------------------------------------------------------------------------
| Cadastro e edição
|--------------------------------------------------------------------------
*/

async function salvarUsuario(
    evento
) {
    evento.preventDefault();

    if (
        !formularioUsuario
            ?.checkValidity()
    ) {
        formularioUsuario
            ?.reportValidity();

        return;
    }

    const id =
        usuarioGerenciadoId
            ?.value ||
        "";

    const nome =
        nomeUsuarioGerenciado
            ?.value
            .trim() ||
        "";

    const usuario =
        loginUsuarioGerenciado
            ?.value
            .trim()
            .toLowerCase() ||
        "";

    const perfil =
        perfilUsuarioGerenciado
            ?.value ||
        "operador";

    if (
        !/^[a-z0-9._-]+$/.test(
            usuario
        )
    ) {
        mostrarNotificacao(
            "Usuário inválido",

            "Use apenas letras sem acento, números, ponto, hífen ou underline.",

            "erro"
        );

        loginUsuarioGerenciado
            ?.focus();

        return;
    }

    const dados = {
        nome,

        usuario,

        perfil,

        permissoes:
            coletarPermissoesDoFormulario(
                perfil
            )
    };

    if (id) {
        dados.ativo =
            situacaoUsuarioGerenciado
                ?.value ===
            "true";
    } else {
        const senha =
            senhaUsuarioGerenciado
                ?.value ||
            "";

        const confirmarSenha =
            confirmarSenhaUsuarioGerenciado
                ?.value ||
            "";

        if (
            senha !==
            confirmarSenha
        ) {
            mostrarNotificacao(
                "Senhas diferentes",

                "A confirmação não corresponde à senha inicial.",

                "erro"
            );

            confirmarSenhaUsuarioGerenciado
                ?.focus();

            return;
        }

        dados.senha =
            senha;

        dados.confirmarSenha =
            confirmarSenha;
    }

    const textoOriginal =
        botaoSalvarUsuario
            ?.querySelector(
                "span"
            )
            ?.textContent ||

        botaoSalvarUsuario
            ?.textContent ||

        "Salvar";

    if (botaoSalvarUsuario) {
        botaoSalvarUsuario.disabled =
            true;
    }

    textoDoBotao(
        botaoSalvarUsuario,
        "Salvando..."
    );

    try {
        const resposta =
            await requisicaoApi(
                id

                    ? `/api/usuarios/${
                        encodeURIComponent(
                            id
                        )
                    }`

                    : "/api/usuarios",

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

        fecharModalGerenciamento(
            modalUsuario
        );

        mostrarNotificacao(
            id
                ? "Usuário atualizado"
                : "Usuário criado",

            resposta.mensagem ||
            "Operação concluída com sucesso."
        );

        await carregarUsuarios();
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível salvar",
            erro.message,
            "erro"
        );
    } finally {
        if (botaoSalvarUsuario) {
            botaoSalvarUsuario.disabled =
                false;
        }

        textoDoBotao(
            botaoSalvarUsuario,

            textoOriginal
                .trim()
        );
    }
}

/*
|--------------------------------------------------------------------------
| Redefinição da senha
|--------------------------------------------------------------------------
*/

async function salvarSenhaGerenciada(
    evento
) {
    evento.preventDefault();

    if (
        !formularioSenhaUsuario
            ?.checkValidity()
    ) {
        formularioSenhaUsuario
            ?.reportValidity();

        return;
    }

    const id =
        senhaUsuarioId
            ?.value ||
        "";

    const novaSenha =
        novaSenhaUsuario
            ?.value ||
        "";

    const confirmarNovaSenha =
        confirmarNovaSenhaUsuario
            ?.value ||
        "";

    if (
        novaSenha !==
        confirmarNovaSenha
    ) {
        mostrarNotificacao(
            "Senhas diferentes",

            "A confirmação não corresponde à nova senha.",

            "erro"
        );

        confirmarNovaSenhaUsuario
            ?.focus();

        return;
    }

    const textoOriginal =
        botaoSalvarSenhaUsuario
            ?.querySelector(
                "span"
            )
            ?.textContent ||

        botaoSalvarSenhaUsuario
            ?.textContent ||

        "Redefinir senha";

    if (botaoSalvarSenhaUsuario) {
        botaoSalvarSenhaUsuario
            .disabled =
            true;
    }

    textoDoBotao(
        botaoSalvarSenhaUsuario,
        "Redefinindo..."
    );

    try {
        const resposta =
            await requisicaoApi(
                `/api/usuarios/${
                    encodeURIComponent(
                        id
                    )
                }/senha`,

                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({
                            novaSenha,
                            confirmarNovaSenha
                        })
                }
            );

        fecharModalGerenciamento(
            modalSenhaUsuario
        );

        mostrarNotificacao(
            "Senha redefinida",

            resposta.mensagem ||
            "A senha foi redefinida com sucesso."
        );

        await carregarUsuarios();
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível redefinir",
            erro.message,
            "erro"
        );
    } finally {
        if (
            botaoSalvarSenhaUsuario
        ) {
            botaoSalvarSenhaUsuario
                .disabled =
                false;
        }

        textoDoBotao(
            botaoSalvarSenhaUsuario,

            textoOriginal
                .trim()
        );
    }
}

/*
|--------------------------------------------------------------------------
| Ativação e desativação
|--------------------------------------------------------------------------
*/

async function alterarSituacaoUsuario(
    usuario
) {
    const novoEstado =
        !usuario.ativo;

    const confirmou =
        await confirmarAcao({
            titulo:
                novoEstado
                    ? "Ativar usuário?"
                    : "Desativar usuário?",

            mensagem:
                novoEstado

                    ? `${usuario.nome} poderá entrar novamente no sistema.`

                    : `${usuario.nome} perderá o acesso e suas sessões serão encerradas.`,

            textoConfirmar:
                novoEstado
                    ? "Ativar usuário"
                    : "Desativar usuário",

            tipo:
                novoEstado
                    ? "sucesso"
                    : "aviso",

            icone:
                novoEstado
                    ? "check"
                    : "alert"
        });

    if (!confirmou) {
        return;
    }

    try {
        const resposta =
            await requisicaoApi(
                `/api/usuarios/${
                    encodeURIComponent(
                        usuario.id
                    )
                }`,

                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({
                            nome:
                                usuario.nome,

                            usuario:
                                usuario.usuario,

                            perfil:
                                usuario.perfil,

                            ativo:
                                novoEstado,

                            permissoes:
                                normalizarPermissoesUsuario(
                                    usuario.permissoes,
                                    usuario.perfil
                                )
                        })
                }
            );

        mostrarNotificacao(
            novoEstado
                ? "Usuário ativado"
                : "Usuário desativado",

            resposta.mensagem ||
            "Situação atualizada com sucesso."
        );

        await carregarUsuarios();
    } catch (erro) {
        mostrarNotificacao(
            "Não foi possível alterar",
            erro.message,
            "erro"
        );
    }
}

/*
|--------------------------------------------------------------------------
| Exclusão
|--------------------------------------------------------------------------
*/

async function excluirUsuario(
    usuario
) {
    const confirmou =
        await confirmarAcao({
            titulo:
                "Excluir usuário?",

            mensagem:
                `A conta de ${usuario.nome} será excluída permanentemente.`,

            textoConfirmar:
                "Excluir usuário",

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
                `/api/usuarios/${
                    encodeURIComponent(
                        usuario.id
                    )
                }`,

                {
                    method:
                        "DELETE"
                }
            );

        mostrarNotificacao(
            "Usuário excluído",

            resposta.mensagem ||
            "O usuário foi excluído."
        );

        await carregarUsuarios();
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
| Ações da tabela
|--------------------------------------------------------------------------
*/

async function tratarAcaoUsuario(
    evento
) {
    const botao =
        evento.target.closest(
            "[data-acao-usuario]"
        );

    if (!botao) {
        return;
    }

    const acao =
        botao.dataset
            .acaoUsuario;

    if (
        acao ===
        "minha-conta"
    ) {
        if (
            typeof navegarPara ===
            "function"
        ) {
            navegarPara(
                "configuracoes"
            );
        }

        return;
    }

    const usuario =
        encontrarUsuarioGerenciado(
            botao.dataset
                .usuarioId
        );

    if (!usuario) {
        return;
    }

    if (
        acao ===
        "editar"
    ) {
        abrirEdicaoUsuario(
            usuario
        );

        return;
    }

    if (
        acao ===
        "senha"
    ) {
        abrirRedefinicaoSenha(
            usuario
        );

        return;
    }

    if (
        acao ===
        "situacao"
    ) {
        await alterarSituacaoUsuario(
            usuario
        );

        return;
    }

    if (
        acao ===
        "excluir"
    ) {
        await excluirUsuario(
            usuario
        );
    }
}

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

async function inicializarGerenciamentoUsuarios() {
    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/status"
            );

        usuarioAtualGerenciamento =
            resposta.autenticado

                ? resposta.usuario ||
                    null

                : null;

        const podeGerenciarUsuarios =
            temPermissaoGerenciarUsuarios(
                usuarioAtualGerenciamento
            );

        if (menuUsuarios) {
            menuUsuarios.hidden =
                !podeGerenciarUsuarios;
        }

        if (secaoUsuarios) {
            secaoUsuarios.hidden =
                !podeGerenciarUsuarios;
        }

        if (
            !podeGerenciarUsuarios
        ) {
            if (
                secaoUsuarios
                    ?.classList
                    .contains(
                        "ativa"
                    ) &&

                typeof navegarPara ===
                    "function"
            ) {
                navegarPara(
                    "dashboard"
                );
            }

            return;
        }

        await carregarUsuarios();
    } catch (erro) {
        console.error(
            "Falha ao inicializar gerenciamento de usuários:",
            erro
        );

        if (menuUsuarios) {
            menuUsuarios.hidden =
                true;
        }

        if (secaoUsuarios) {
            secaoUsuarios.hidden =
                true;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Eventos
|--------------------------------------------------------------------------
*/

botaoPermissoesPadrao
    ?.addEventListener(
        "click",
        restaurarPermissoesPadrao
    );

botaoMarcarTodasPermissoes
    ?.addEventListener(
        "click",
        alternarTodasPermissoes
    );

perfilUsuarioGerenciado
    ?.addEventListener(
        "change",
        alterarModeloPermissoesPorPerfil
    );

for (
    const campo
    of camposPermissoesUsuario
) {
    campo.addEventListener(
        "change",
        atualizarBotaoMarcarPermissoes
    );
}

botaoNovoUsuario
    ?.addEventListener(
        "click",
        abrirNovoUsuario
    );

buscaUsuarios
    ?.addEventListener(
        "input",
        renderizarUsuarios
    );

filtroPerfilUsuarios
    ?.addEventListener(
        "change",
        renderizarUsuarios
    );

filtroSituacaoUsuarios
    ?.addEventListener(
        "change",
        renderizarUsuarios
    );

corpoTabelaUsuarios
    ?.addEventListener(
        "click",
        tratarAcaoUsuario
    );

formularioUsuario
    ?.addEventListener(
        "submit",
        salvarUsuario
    );

formularioSenhaUsuario
    ?.addEventListener(
        "submit",
        salvarSenhaGerenciada
    );

loginUsuarioGerenciado
    ?.addEventListener(
        "input",

        () => {
            loginUsuarioGerenciado
                .value =
                loginUsuarioGerenciado
                    .value
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        ""
                    );
        }
    );

document
    .querySelectorAll(
        "[data-fechar-modal-usuario]"
    )
    .forEach(
        botao => {
            botao.addEventListener(
                "click",

                () =>
                    fecharModalGerenciamento(
                        modalUsuario
                    )
            );
        }
    );

document
    .querySelectorAll(
        "[data-fechar-modal-senha-usuario]"
    )
    .forEach(
        botao => {
            botao.addEventListener(
                "click",

                () =>
                    fecharModalGerenciamento(
                        modalSenhaUsuario
                    )
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
            modalSenhaUsuario
                ?.classList
                .contains(
                    "aberto"
                )
        ) {
            fecharModalGerenciamento(
                modalSenhaUsuario
            );

            return;
        }

        if (
            modalUsuario
                ?.classList
                .contains(
                    "aberto"
                )
        ) {
            fecharModalGerenciamento(
                modalUsuario
            );
        }
    }
);

inicializarGerenciamentoUsuarios();