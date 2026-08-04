function criarServicoProducao({
    banco,
    ErroHttp,
    enviarJson,
    lerJson
}) {
    banco.exec(`
        CREATE TABLE IF NOT EXISTS configuracao_producao (
            id INTEGER
                PRIMARY KEY
                CHECK (id = 1),

            nome_maquina TEXT
                NOT NULL
                DEFAULT 'Máquina principal',

            quantidade_cabecas INTEGER
                NOT NULL
                DEFAULT 1
                CHECK (
                    quantidade_cabecas
                    BETWEEN 1 AND 100
                ),

            velocidade_pontos_minuto INTEGER
                NOT NULL
                DEFAULT 700
                CHECK (
                    velocidade_pontos_minuto
                    BETWEEN 100 AND 3000
                ),

            eficiencia_percentual INTEGER
                NOT NULL
                DEFAULT 85
                CHECK (
                    eficiencia_percentual
                    BETWEEN 10 AND 100
                ),

            horas_produtivas_dia REAL
                NOT NULL
                DEFAULT 8
                CHECK (
                    horas_produtivas_dia
                    BETWEEN 0.5 AND 24
                ),

            minutos_preparacao_ordem INTEGER
                NOT NULL
                DEFAULT 10
                CHECK (
                    minutos_preparacao_ordem
                    BETWEEN 0 AND 240
                ),

            segundos_troca_cor INTEGER
                NOT NULL
                DEFAULT 8
                CHECK (
                    segundos_troca_cor
                    BETWEEN 0 AND 300
                ),

            atualizado_em TEXT
                NOT NULL
        ) STRICT;
    `);

    banco.prepare(`
        INSERT OR IGNORE INTO configuracao_producao (
            id,
            nome_maquina,
            quantidade_cabecas,
            velocidade_pontos_minuto,
            eficiencia_percentual,
            horas_produtivas_dia,
            minutos_preparacao_ordem,
            segundos_troca_cor,
            atualizado_em
        )
        VALUES (
            1,
            'Máquina principal',
            1,
            700,
            85,
            8,
            10,
            8,
            ?
        )
    `).run(
        new Date().toISOString()
    );

    const consultarConfiguracao =
        banco.prepare(`
            SELECT
                id,
                nome_maquina,
                quantidade_cabecas,
                velocidade_pontos_minuto,
                eficiencia_percentual,
                horas_produtivas_dia,
                minutos_preparacao_ordem,
                segundos_troca_cor,
                atualizado_em

            FROM configuracao_producao

            WHERE id = 1

            LIMIT 1
        `);

    const atualizarConfiguracaoBanco =
        banco.prepare(`
            UPDATE configuracao_producao

            SET
                nome_maquina = ?,
                quantidade_cabecas = ?,
                velocidade_pontos_minuto = ?,
                eficiencia_percentual = ?,
                horas_produtivas_dia = ?,
                minutos_preparacao_ordem = ?,
                segundos_troca_cor = ?,
                atualizado_em = ?

            WHERE id = 1
        `);

    function limparTexto(
        valor
    ) {
        return String(
            valor ?? ""
        ).trim();
    }

    function converterNumero(
        valor,
        nome,
        {
            inteiro = false,
            minimo,
            maximo
        }
    ) {
        const numero =
            Number(
                String(
                    valor ?? ""
                )
                    .trim()
                    .replace(
                        ",",
                        "."
                    )
            );

        if (
            !Number.isFinite(
                numero
            ) ||
            (
                inteiro &&
                !Number.isInteger(
                    numero
                )
            ) ||
            numero < minimo ||
            numero > maximo
        ) {
            throw new ErroHttp(
                400,
                `${nome} precisa estar entre ${minimo} e ${maximo}.`
            );
        }

        return numero;
    }

    function converterConfiguracao(
        configuracao
    ) {
        return {
            nomeMaquina:
                configuracao.nome_maquina,

            quantidadeCabecas:
                Number(
                    configuracao.quantidade_cabecas
                ),

            velocidadePontosMinuto:
                Number(
                    configuracao.velocidade_pontos_minuto
                ),

            eficienciaPercentual:
                Number(
                    configuracao.eficiencia_percentual
                ),

            horasProdutivasDia:
                Number(
                    configuracao.horas_produtivas_dia
                ),

            minutosPreparacaoOrdem:
                Number(
                    configuracao.minutos_preparacao_ordem
                ),

            segundosTrocaCor:
                Number(
                    configuracao.segundos_troca_cor
                ),

            atualizadoEm:
                configuracao.atualizado_em
        };
    }

    function obterConfiguracaoAtual() {
        const configuracao =
            consultarConfiguracao.get();

        if (!configuracao) {
            throw new ErroHttp(
                500,
                "A configuração de produção não foi encontrada."
            );
        }

        return configuracao;
    }

    function obterConfiguracao(
        response
    ) {
        enviarJson(
            response,
            200,
            {
                sucesso: true,

                configuracao:
                    converterConfiguracao(
                        obterConfiguracaoAtual()
                    )
            }
        );
    }

    async function atualizarConfiguracao(
        request,
        response
    ) {
        const atual =
            obterConfiguracaoAtual();

        const dados =
            await lerJson(
                request
            );

        const nomeMaquina =
            limparTexto(
                dados.nomeMaquina ??
                atual.nome_maquina
            );

        if (
            nomeMaquina.length < 2 ||
            nomeMaquina.length > 100
        ) {
            throw new ErroHttp(
                400,
                "O nome da máquina precisa ter entre 2 e 100 caracteres."
            );
        }

        const quantidadeCabecas =
            converterNumero(
                dados.quantidadeCabecas ??
                atual.quantidade_cabecas,

                "A quantidade de cabeças",

                {
                    inteiro: true,
                    minimo: 1,
                    maximo: 100
                }
            );

        const velocidadePontosMinuto =
            converterNumero(
                dados.velocidadePontosMinuto ??
                atual.velocidade_pontos_minuto,

                "A velocidade da máquina",

                {
                    inteiro: true,
                    minimo: 100,
                    maximo: 3000
                }
            );

        const eficienciaPercentual =
            converterNumero(
                dados.eficienciaPercentual ??
                atual.eficiencia_percentual,

                "A eficiência da máquina",

                {
                    inteiro: true,
                    minimo: 10,
                    maximo: 100
                }
            );

        const horasProdutivasDia =
            converterNumero(
                dados.horasProdutivasDia ??
                atual.horas_produtivas_dia,

                "As horas produtivas por dia",

                {
                    minimo: 0.5,
                    maximo: 24
                }
            );

        const minutosPreparacaoOrdem =
            converterNumero(
                dados.minutosPreparacaoOrdem ??
                atual.minutos_preparacao_ordem,

                "O tempo de preparação",

                {
                    inteiro: true,
                    minimo: 0,
                    maximo: 240
                }
            );

        const segundosTrocaCor =
            converterNumero(
                dados.segundosTrocaCor ??
                atual.segundos_troca_cor,

                "O tempo de troca de cor",

                {
                    inteiro: true,
                    minimo: 0,
                    maximo: 300
                }
            );

        const atualizadoEm =
            new Date()
                .toISOString();

        atualizarConfiguracaoBanco.run(
            nomeMaquina,
            quantidadeCabecas,
            velocidadePontosMinuto,
            eficienciaPercentual,
            horasProdutivasDia,
            minutosPreparacaoOrdem,
            segundosTrocaCor,
            atualizadoEm
        );

        enviarJson(
            response,
            200,
            {
                sucesso: true,

                mensagem:
                    "Configuração da máquina atualizada com sucesso.",

                configuracao:
                    converterConfiguracao(
                        obterConfiguracaoAtual()
                    )
            }
        );
    }

    return {
        obterConfiguracao,
        atualizarConfiguracao
    };
}

module.exports = {
    criarServicoProducao
};
