const $ = seletor =>
    document.querySelector(seletor);

const $$ = seletor =>
    document.querySelectorAll(seletor);

const loginCarregando =
    $("#loginCarregando");

const loginCard =
    $("#loginCard");

const loginEtiqueta =
    $("#loginEtiqueta");

const loginTitulo =
    $("#loginTitulo");

const loginDescricao =
    $("#loginDescricao");

const formularioLogin =
    $("#formularioLogin");

const formularioConfiguracao =
    $("#formularioConfiguracao");

const loginMensagem =
    $("#loginMensagem");

const loginMensagemTexto =
    $("#loginMensagemTexto");

const botaoEntrar =
    $("#botaoEntrar");

const botaoConfigurar =
    $("#botaoConfigurar");

const configSenha =
    $("#configSenha");

const configConfirmarSenha =
    $("#configConfirmarSenha");

const requisitoTamanho =
    $("#requisitoTamanho");

const requisitoLetra =
    $("#requisitoLetra");

const requisitoNumero =
    $("#requisitoNumero");

const requisitoConfirmacao =
    $("#requisitoConfirmacao");

/*
|--------------------------------------------------------------------------
| Requisições
|--------------------------------------------------------------------------
*/

async function requisicaoApi(
    caminho,
    opcoes = {}
) {
    const resposta =
        await fetch(
            caminho,
            {
                ...opcoes,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(opcoes.headers || {})
                }
            }
        );

    let dados = null;

    try {
        dados =
            await resposta.json();
    } catch {
        dados = null;
    }

    if (!resposta.ok) {
        const erro =
            new Error(
                dados?.mensagem ||
                "Não foi possível concluir a solicitação."
            );

        erro.status =
            resposta.status;

        erro.detalhes =
            dados?.detalhes ||
            null;

        throw erro;
    }

    return dados;
}

/*
|--------------------------------------------------------------------------
| Mensagens
|--------------------------------------------------------------------------
*/

function mostrarErro(
    mensagem
) {
    loginMensagemTexto.textContent =
        mensagem;

    loginMensagem.classList.remove(
        "escondido"
    );
}

function esconderErro() {
    loginMensagem.classList.add(
        "escondido"
    );

    loginMensagemTexto.textContent =
        "";
}

/*
|--------------------------------------------------------------------------
| Tela inicial
|--------------------------------------------------------------------------
*/

function exibirLogin() {
    loginEtiqueta.textContent =
        "Acesso seguro";

    loginTitulo.textContent =
        "Entrar no sistema";

    loginDescricao.textContent =
        "Informe seu usuário e senha para acessar o painel.";

    formularioLogin.classList.remove(
        "escondido"
    );

    formularioConfiguracao
        .classList.add(
            "escondido"
        );

    setTimeout(() => {
        $("#loginUsuario").focus();
    }, 100);
}

function exibirConfiguracaoInicial() {
    loginEtiqueta.textContent =
        "Primeiro acesso";

    loginTitulo.textContent =
        "Configure o administrador";

    loginDescricao.textContent =
        "Crie a primeira conta responsável pela administração do sistema.";

    formularioLogin.classList.add(
        "escondido"
    );

    formularioConfiguracao
        .classList.remove(
            "escondido"
        );

    setTimeout(() => {
        $("#configNome").focus();
    }, 100);
}

async function verificarSistema() {
    try {
        const resposta =
            await requisicaoApi(
                "/api/auth/status",
                {
                    method: "GET"
                }
            );

        if (resposta.autenticado) {
            window.location.replace(
                "/"
            );

            return;
        }

        loginCarregando.classList.add(
            "escondido"
        );

        loginCard.classList.remove(
            "escondido"
        );

        if (resposta.configurado) {
            exibirLogin();
        } else {
            exibirConfiguracaoInicial();
        }
    } catch (erro) {
        loginCarregando.classList.add(
            "escondido"
        );

        loginCard.classList.remove(
            "escondido"
        );

        formularioLogin.classList.add(
            "escondido"
        );

        formularioConfiguracao
            .classList.add(
                "escondido"
            );

        mostrarErro(
            erro.message ||
            "Não foi possível conectar ao servidor."
        );
    }
}

/*
|--------------------------------------------------------------------------
| Validação da senha inicial
|--------------------------------------------------------------------------
*/

function atualizarRequisitosSenha() {
    const senha =
        configSenha.value;

    const confirmacao =
        configConfirmarSenha.value;

    requisitoTamanho.classList.toggle(
        "valido",
        senha.length >= 10
    );

    requisitoLetra.classList.toggle(
        "valido",
        /[A-Za-zÀ-ÿ]/.test(
            senha
        )
    );

    requisitoNumero.classList.toggle(
        "valido",
        /\d/.test(senha)
    );

    requisitoConfirmacao
        .classList.toggle(
            "valido",

            Boolean(senha) &&
            senha === confirmacao
        );
}

function validarConfiguracaoInicial() {
    const senha =
        configSenha.value;

    const confirmacao =
        configConfirmarSenha.value;

    if (senha.length < 10) {
        throw new Error(
            "A senha precisa possuir pelo menos 10 caracteres."
        );
    }

    if (
        !/[A-Za-zÀ-ÿ]/.test(
            senha
        ) ||
        !/\d/.test(senha)
    ) {
        throw new Error(
            "A senha precisa conter pelo menos uma letra e um número."
        );
    }

    if (
        senha !==
        confirmacao
    ) {
        throw new Error(
            "A confirmação da senha não corresponde."
        );
    }
}

/*
|--------------------------------------------------------------------------
| Estado dos botões
|--------------------------------------------------------------------------
*/

function alterarEstadoBotao(
    botao,
    processando,
    textoProcessando
) {
    const span =
        botao.querySelector(
            "span"
        );

    if (
        processando &&
        !botao.dataset.textoOriginal
    ) {
        botao.dataset.textoOriginal =
            span.textContent.trim();
    }

    botao.disabled =
        processando;

    span.textContent =
        processando
            ? textoProcessando
            : botao.dataset
                .textoOriginal;
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

async function realizarLogin(
    evento
) {
    evento.preventDefault();

    esconderErro();

    if (
        !formularioLogin
            .checkValidity()
    ) {
        formularioLogin
            .reportValidity();

        return;
    }

    const dados =
        new FormData(
            formularioLogin
        );

    alterarEstadoBotao(
        botaoEntrar,
        true,
        "Verificando acesso..."
    );

    try {
        await requisicaoApi(
            "/api/auth/login",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        usuario:
                            dados.get(
                                "usuario"
                            ),

                        senha:
                            dados.get(
                                "senha"
                            )
                    })
            }
        );

        botaoEntrar
            .querySelector("span")
            .textContent =
                "Acesso autorizado";

        window.location.replace(
            "/"
        );
    } catch (erro) {
        mostrarErro(
            erro.message
        );

        alterarEstadoBotao(
            botaoEntrar,
            false
        );

        $("#loginSenha").value = "";
        $("#loginSenha").focus();
    }
}

/*
|--------------------------------------------------------------------------
| Configuração inicial
|--------------------------------------------------------------------------
*/

async function configurarSistema(
    evento
) {
    evento.preventDefault();

    esconderErro();

    if (
        !formularioConfiguracao
            .checkValidity()
    ) {
        formularioConfiguracao
            .reportValidity();

        return;
    }

    try {
        validarConfiguracaoInicial();
    } catch (erro) {
        mostrarErro(
            erro.message
        );

        return;
    }

    const dados =
        new FormData(
            formularioConfiguracao
        );

    alterarEstadoBotao(
        botaoConfigurar,
        true,
        "Criando administrador..."
    );

    try {
        await requisicaoApi(
            "/api/auth/configurar",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        nome:
                            dados.get(
                                "nome"
                            ),

                        usuario:
                            dados.get(
                                "usuario"
                            ),

                        senha:
                            dados.get(
                                "senha"
                            )
                    })
            }
        );

        botaoConfigurar
            .querySelector("span")
            .textContent =
                "Configuração concluída";

        window.location.replace(
            "/"
        );
    } catch (erro) {
        mostrarErro(
            erro.message
        );

        alterarEstadoBotao(
            botaoConfigurar,
            false
        );
    }
}

/*
|--------------------------------------------------------------------------
| Mostrar e ocultar senhas
|--------------------------------------------------------------------------
*/

$$(
    "[data-alternar-senha]"
).forEach(botao => {
    botao.addEventListener(
        "click",
        () => {
            const campo =
                document.getElementById(
                    botao.dataset
                        .alternarSenha
                );

            if (!campo) {
                return;
            }

            const mostrando =
                campo.type === "text";

            campo.type =
                mostrando
                    ? "password"
                    : "text";

            botao.setAttribute(
                "aria-label",
                mostrando
                    ? "Mostrar senha"
                    : "Ocultar senha"
            );

            botao.title =
                mostrando
                    ? "Mostrar senha"
                    : "Ocultar senha";
        }
    );
});

/*
|--------------------------------------------------------------------------
| Eventos
|--------------------------------------------------------------------------
*/

formularioLogin.addEventListener(
    "submit",
    realizarLogin
);

formularioConfiguracao
    .addEventListener(
        "submit",
        configurarSistema
    );

configSenha.addEventListener(
    "input",
    atualizarRequisitosSenha
);

configConfirmarSenha
    .addEventListener(
        "input",
        atualizarRequisitosSenha
    );

$$("input").forEach(campo => {
    campo.addEventListener(
        "input",
        () => {
            campo.classList.remove(
                "invalido"
            );

            esconderErro();
        }
    );
});

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

verificarSistema();