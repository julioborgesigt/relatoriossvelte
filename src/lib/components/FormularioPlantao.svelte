<script lang="ts">
    import { enhance } from "$app/forms";
    import { TIPOS_PROC, COR_TIPO_DARK, type TipoProc } from "$lib/constants";

    let {
        isRetificacao = false,
        actionUrl = "?/salvar",
        dadosIniciais = {} as any,
        equipeInicial = [] as any[],
        procedimentosIniciais = [] as any[],
        servidores = [] as any[],
        delegacias = [] as any[],
        formResult = null as any,
        usuario = null as any,
    } = $props();

    type Envolvido = { id: number; texto: string };
    type Procedimento = {
        id: number;
        tipo: TipoProc;
        numero: string;
        natureza: string;
        envolvidos: string;
        resumo: string;
        vitimas: Envolvido[];
        suspeitos: Envolvido[];
    };
    type Membro = {
        id: number;
        nome: string;
        matricula: string;
        cargo: string;
        telefone: string;
        lotacao: string;
        escala: "Normal" | "Extraordinaria" | "";
        data_entrada: string;
        hora_entrada: string;
        data_saida: string;
        hora_saida: string;
        mostrarHorario: boolean;
    };

    // Função para formato YYYY-MM-DD local
    function getLocalYYYYMMDD(d: Date) {
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60 * 1000);
        return local.toISOString().split("T")[0];
    }
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    // Estado do formulário
    let delegacia = $state("");
    let data_entrada = $state(getLocalYYYYMMDD(hoje));
    let hora_entrada = $state("");
    let data_saida = $state(getLocalYYYYMMDD(amanha));
    let hora_saida = $state("");
    let observacoes = $state("");

    // Quantitativos
    let q_bo = $state(0);
    let q_guias = $state(0);
    let q_apreensoes = $state(0);
    let q_presos = $state(0);
    let q_medidas = $state(0);
    let q_outros = $state(0);

    // Equipe
    let equipe = $state<Membro[]>([
        {
            id: 0,
            nome: "",
            matricula: "",
            cargo: "",
            telefone: "",
            lotacao: "",
            escala: "",
            data_entrada: "",
            hora_entrada: "",
            data_saida: "",
            hora_saida: "",
            mostrarHorario: false,
        },
    ]);
    let nextMembroId = $derived(equipe.length || 1);

    // Procedimentos
    let envolvidoCounter = $state(0);
    let procedimentos = $state<Procedimento[]>([]);
    let nextProcId = $derived(procedimentos.length);
    let nextEnvolvidoId = $state(0);

    // Inicialização segura baseada nas props (evita state_referenced_locally)
    let initialized = $state(false);
    $effect(() => {
        if (!initialized && dadosIniciais) {
            delegacia = dadosIniciais.delegacia ?? "";
            data_entrada = dadosIniciais.data_entrada ?? getLocalYYYYMMDD(hoje);
            hora_entrada = dadosIniciais.hora_entrada ?? "";
            data_saida = dadosIniciais.data_saida ?? getLocalYYYYMMDD(amanha);
            hora_saida = dadosIniciais.hora_saida ?? "";
            observacoes = dadosIniciais.observacoes ?? "";
            q_bo = dadosIniciais.q_bo ?? 0;
            q_guias = dadosIniciais.q_guias ?? 0;
            q_apreensoes = dadosIniciais.q_apreensoes ?? 0;
            q_presos = dadosIniciais.q_presos ?? 0;
            q_medidas = dadosIniciais.q_medidas ?? 0;
            q_outros = dadosIniciais.q_outros ?? 0;

            if (equipeInicial && equipeInicial.length > 0) {
                equipe = equipeInicial.map((m: any, i: number) => ({
                    id: i,
                    nome: m.nome_servidor ?? m.nome ?? "",
                    matricula: m.matricula ?? "",
                    cargo: m.cargo ?? "",
                    telefone: m.telefone ?? "",
                    lotacao: m.lotacao ?? m.classe ?? "",
                    escala:
                        (m.escala as "Normal" | "Extraordinaria" | "") ?? "",
                    data_entrada: m.data_entrada ?? "",
                    hora_entrada: m.hora_entrada ?? "",
                    data_saida: m.data_saida ?? "",
                    hora_saida: m.hora_saida ?? "",
                    mostrarHorario: false,
                }));
                nextMembroId = equipe.length;
            }

            if (procedimentosIniciais && procedimentosIniciais.length > 0) {
                let envCounter = 0;
                procedimentos = procedimentosIniciais.map(
                    (p: any, i: number) => {
                        const vitimas = (p.vitimas as string[]).map(
                            (texto: string) => ({ id: envCounter++, texto }),
                        );
                        if (vitimas.length === 0)
                            vitimas.push({ id: envCounter++, texto: "" });

                        const suspeitos = (p.suspeitos as string[]).map(
                            (texto: string) => ({ id: envCounter++, texto }),
                        );
                        if (suspeitos.length === 0)
                            suspeitos.push({ id: envCounter++, texto: "" });

                        return {
                            id: i,
                            tipo: p.tipo as TipoProc,
                            numero: p.numero ?? "",
                            natureza: p.natureza ?? "",
                            envolvidos: p.envolvidos ?? "",
                            resumo: p.resumo ?? "",
                            vitimas,
                            suspeitos,
                        };
                    },
                );
                nextProcId = procedimentos.length;
                nextEnvolvidoId = envCounter;
                envolvidoCounter = envCounter;
            }

            initialized = true;
        }
    });

    // UI states
    let carregando = $state(false);
    let mostrarModalRascunho = $state(false);
    let mostrarModalRetificar = $state(false);
    let codigoRetificar = $state("");
    let erroRetificar = $state("");
    let isDirty = $state(false);

    // Estado pós-finalização
    let relatorioFinalizado = $state(false);
    let protocoloGerado = $state("");
    let relatorioId = $state(0);

    // Inicia os valores finais se for retificacao e se ja estava retificado
    $effect(() => {
        if (isRetificacao && dadosIniciais?.status === "retificado") {
            relatorioFinalizado = true;
            protocoloGerado = dadosIniciais.protocolo ?? "";
            relatorioId = dadosIniciais.id ?? 0;
        }

        // Sincroniza dados do rascunho preenchidos assincronamente (ex: reload via query params)
        if (
            !isRetificacao &&
            dadosIniciais?.id &&
            dadosIniciais.id !== relatorioId
        ) {
            delegacia = dadosIniciais.delegacia ?? "";
            data_entrada = dadosIniciais.data_entrada ?? getLocalYYYYMMDD(hoje);
            hora_entrada = dadosIniciais.hora_entrada ?? "";
            data_saida = dadosIniciais.data_saida ?? getLocalYYYYMMDD(amanha);
            hora_saida = dadosIniciais.hora_saida ?? "";
            observacoes = dadosIniciais.observacoes ?? "";
            q_bo = dadosIniciais.q_bo ?? 0;
            q_guias = dadosIniciais.q_guias ?? 0;
            q_apreensoes = dadosIniciais.q_apreensoes ?? 0;
            q_presos = dadosIniciais.q_presos ?? 0;
            q_medidas = dadosIniciais.q_medidas ?? 0;
            q_outros = dadosIniciais.q_outros ?? 0;

            if (equipeInicial && equipeInicial.length > 0) {
                equipe = equipeInicial.map((m: any, i: number) => ({
                    id: i,
                    nome: m.nome_servidor ?? m.nome ?? "",
                    matricula: m.matricula ?? "",
                    cargo: m.cargo ?? "",
                    telefone: m.telefone ?? "",
                    lotacao: m.lotacao ?? m.classe ?? "",
                    escala:
                        (m.escala as "Normal" | "Extraordinaria" | "") ?? "",
                    data_entrada: m.data_entrada ?? "",
                    hora_entrada: m.hora_entrada ?? "",
                    data_saida: m.data_saida ?? "",
                    hora_saida: m.hora_saida ?? "",
                    mostrarHorario: false,
                }));
                nextMembroId = equipe.length;
            }

            if (procedimentosIniciais && procedimentosIniciais.length > 0) {
                envolvidoCounter = 0;
                procedimentos = procedimentosIniciais.map(
                    (p: any, i: number) => {
                        const vitimas = (p.vitimas as string[]).map(
                            (texto: string) => ({
                                id: envolvidoCounter++,
                                texto,
                            }),
                        );
                        if (vitimas.length === 0)
                            vitimas.push({ id: envolvidoCounter++, texto: "" });

                        const suspeitos = (p.suspeitos as string[]).map(
                            (texto: string) => ({
                                id: envolvidoCounter++,
                                texto,
                            }),
                        );
                        if (suspeitos.length === 0)
                            suspeitos.push({
                                id: envolvidoCounter++,
                                texto: "",
                            });

                        return {
                            id: i,
                            tipo: p.tipo as TipoProc,
                            numero: p.numero ?? "",
                            natureza: p.natureza ?? "",
                            envolvidos: p.envolvidos ?? "",
                            resumo: p.resumo ?? "",
                            vitimas,
                            suspeitos,
                        };
                    },
                );
                nextProcId = procedimentos.length;
                nextEnvolvidoId = envolvidoCounter;
            }

            relatorioId = dadosIniciais.id;
        }
    });

    // ── Validações de horário ─────────────────────────────────────────────────
    let duracaoHoras = $derived.by(() => {
        if (!data_entrada || !hora_entrada || !data_saida || !hora_saida)
            return null;
        const de = new Date(`${data_entrada}T${hora_entrada}`);
        const ate = new Date(`${data_saida}T${hora_saida}`);
        if (isNaN(de.getTime()) || isNaN(ate.getTime())) return null;
        return (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
    });
    let duracaoInvalida = $derived(
        duracaoHoras !== null && (duracaoHoras <= 0 || duracaoHoras > 24),
    );

    function membroExtraForaDoPlantao(membro: Membro): boolean {
        if (membro.escala !== "Extraordinaria") return false;
        if (!data_entrada || !hora_entrada || !data_saida || !hora_saida)
            return false;
        const entradaPlantao = new Date(`${data_entrada}T${hora_entrada}`);
        const saidaPlantao = new Date(`${data_saida}T${hora_saida}`);
        const entradaMembro =
            membro.data_entrada && membro.hora_entrada
                ? new Date(`${membro.data_entrada}T${membro.hora_entrada}`)
                : entradaPlantao;
        const saidaMembro =
            membro.data_saida && membro.hora_saida
                ? new Date(`${membro.data_saida}T${membro.hora_saida}`)
                : saidaPlantao;
        if (isNaN(entradaMembro.getTime()) || isNaN(saidaMembro.getTime()))
            return false;
        return entradaMembro < entradaPlantao || saidaMembro > saidaPlantao;
    }

    let temErrosHorario = $derived(
        duracaoInvalida || equipe.some((m) => membroExtraForaDoPlantao(m)),
    );

    function marcarDirty() {
        isDirty = true;
    }

    function adicionarMembro() {
        equipe.push({
            id: nextMembroId++,
            nome: "",
            matricula: "",
            cargo: "",
            telefone: "",
            lotacao: "",
            escala: "",
            data_entrada: data_entrada,
            hora_entrada: hora_entrada,
            data_saida: data_saida,
            hora_saida: hora_saida,
            mostrarHorario: false,
        });
        marcarDirty();
    }

    function removerMembro(id: number) {
        const idx = equipe.findIndex((m) => m.id === id);
        if (idx > 0) equipe.splice(idx, 1);
        marcarDirty();
    }

    function buscarServidor(nome: string, membroId: number) {
        const encontrado = servidores.find(
            (s) =>
                s.nome.toLowerCase() === nome.toLowerCase() ||
                s.matricula === nome,
        );
        if (encontrado) {
            const membro = equipe.find((m) => m.id === membroId);
            if (membro) {
                membro.nome = encontrado.nome;
                membro.matricula = encontrado.matricula;
                membro.cargo = encontrado.cargo || "";
                membro.lotacao = encontrado.lotacao || "";
            }
        }
        marcarDirty();
    }

    function adicionarProcedimento(tipo: TipoProc) {
        procedimentos.push({
            id: nextProcId++,
            tipo,
            numero: "",
            natureza: "",
            envolvidos: "",
            resumo: "",
            vitimas: [{ id: nextEnvolvidoId++, texto: "" }],
            suspeitos: [{ id: nextEnvolvidoId++, texto: "" }],
        });
        marcarDirty();
    }

    function removerProcedimento(id: number) {
        const idx = procedimentos.findIndex((p) => p.id === id);
        if (idx >= 0) procedimentos.splice(idx, 1);
        marcarDirty();
    }

    function adicionarVitima(procId: number) {
        const proc = procedimentos.find((p) => p.id === procId);
        if (proc) proc.vitimas.push({ id: nextEnvolvidoId++, texto: "" });
    }

    function removerVitima(procId: number, vitimaId: number) {
        const proc = procedimentos.find((p) => p.id === procId);
        if (proc && proc.vitimas.length > 1) {
            const idx = proc.vitimas.findIndex((v) => v.id === vitimaId);
            if (idx >= 0) proc.vitimas.splice(idx, 1);
        }
    }

    function adicionarSuspeito(procId: number) {
        const proc = procedimentos.find((p) => p.id === procId);
        if (proc) proc.suspeitos.push({ id: nextEnvolvidoId++, texto: "" });
    }

    function removerSuspeito(procId: number, suspeitoId: number) {
        const proc = procedimentos.find((p) => p.id === procId);
        if (proc && proc.suspeitos.length > 1) {
            const idx = proc.suspeitos.findIndex((s) => s.id === suspeitoId);
            if (idx >= 0) proc.suspeitos.splice(idx, 1);
        }
    }

    // Calcula horas trabalhadas de um membro
    function calcularHoras(membro: Membro): string {
        const de =
            membro.data_entrada && membro.hora_entrada
                ? new Date(`${membro.data_entrada}T${membro.hora_entrada}`)
                : data_entrada && hora_entrada
                  ? new Date(`${data_entrada}T${hora_entrada}`)
                  : null;
        const ate =
            membro.data_saida && membro.hora_saida
                ? new Date(`${membro.data_saida}T${membro.hora_saida}`)
                : data_saida && hora_saida
                  ? new Date(`${data_saida}T${hora_saida}`)
                  : null;

        if (!de || !ate || isNaN(de.getTime()) || isNaN(ate.getTime()))
            return "—";
        const diff = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
        if (diff < 0 || diff > 72) return "inválido";
        const h = Math.floor(diff);
        const m = Math.round((diff - h) * 60);
        return `${h}h${m > 0 ? m + "m" : ""}`;
    }

    // Cor do badge por tipo de procedimento
    function corTipo(tipo: string): string {
        return (
            COR_TIPO_DARK[tipo] ??
            "bg-slate-800 border-slate-600 text-slate-300"
        );
    }

    // Máscara para número do procedimento: xxx-xxxxx/xxxx
    function mascaraProcedimento(e: Event) {
        const input = e.target as HTMLInputElement;
        let v = input.value.replace(/\D/g, "").slice(0, 12);
        if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
        if (v.length > 9) v = v.slice(0, 9) + "/" + v.slice(9);
        input.value = v;
        // Atualizar o bind:value via evento de input
        const idx = parseInt(
            input.name.match(/proc_(\d+)_numero/)?.[1] ?? "-1",
        );
        if (idx >= 0) {
            const proc = procedimentos.find((_, i) => i === idx);
            if (proc) proc.numero = v;
        }
    }

    // Efeito: detecta finalização e rascunho
    $effect(() => {
        if (formResult && "sucesso" in formResult && formResult.sucesso) {
            isDirty = false;
        }
        if (
            formResult &&
            "acao" in formResult &&
            (formResult as any).acao === "finalizado"
        ) {
            relatorioFinalizado = true;
            protocoloGerado = (formResult as any).protocolo ?? "";
            relatorioId = (formResult as any).id ?? 0;
        }
    });

    // Modal do relatório extra
    let mostrarModalExtra = $state(false);
    let justificativaExtra = $state("");
    let nomeDiretorExtra = $state("");
    let membrosExtraIncluidos = $state<string[]>([]);

    const membrosExtraordinarios = $derived(
        equipe.filter((m) => m.escala === "Extraordinaria"),
    );

    function abrirModalExtra() {
        justificativaExtra = `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${protocoloGerado}.`;
        membrosExtraIncluidos = membrosExtraordinarios.map((m) => m.nome);
        nomeDiretorExtra = "";
        mostrarModalExtra = true;
    }

    function toggleMembroExtra(nome: string) {
        if (membrosExtraIncluidos.includes(nome)) {
            membrosExtraIncluidos = membrosExtraIncluidos.filter(
                (n) => n !== nome,
            );
        } else {
            membrosExtraIncluidos = [...membrosExtraIncluidos, nome];
        }
    }

    function gerarRelatorioExtra() {
        if (!nomeDiretorExtra.trim()) return;
        if (
            membrosExtraordinarios.length > 0 &&
            membrosExtraIncluidos.length === 0
        )
            return;
        const url = new URL(
            `/plantao/extra/${relatorioId}`,
            window.location.origin,
        );
        url.searchParams.set("dir", nomeDiretorExtra.trim());
        url.searchParams.set("just", justificativaExtra);
        if (membrosExtraIncluidos.length < membrosExtraordinarios.length) {
            url.searchParams.set("mb", membrosExtraIncluidos.join(","));
        }
        window.open(url.toString(), "_blank");
        mostrarModalExtra = false;
    }
</script>

<svelte:window
    onbeforeunload={(e) => {
        if (isDirty && !relatorioFinalizado) {
            e.preventDefault();
        }
    }}
/>

<svelte:head>
    <title>Relatório de Plantão — DPI SUL</title>
</svelte:head>

<!-- Toast de sucesso -->
{#if formResult && "sucesso" in formResult && formResult.sucesso}
    <div
        class="fixed top-5 right-5 z-50 bg-emerald-900 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm"
    >
        ✓ {(formResult as any).mensagem}
    </div>
{/if}

<!-- Modal: Retificar relatório de plantão passado -->
{#if mostrarModalRetificar}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
        <div
            class="bg-[#0d2137] border border-amber-500/40 rounded-2xl p-8 w-full max-w-md shadow-2xl"
        >
            <h2 class="text-amber-400 font-black uppercase text-lg mb-2">
                ✏️ Retificar Relatório
            </h2>
            <p class="text-slate-400 text-sm mb-4">
                Informe o protocolo <strong class="text-white">FT-</strong> do
                relatório <strong class="text-white">finalizado</strong> que deseja
                retificar.
            </p>
            <p
                class="text-slate-500 text-xs mb-5 font-mono bg-black/30 rounded px-3 py-2"
            >
                ⚠ Rascunhos (R-) não podem ser retificados. Finalize o
                relatório primeiro.
            </p>
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    erroRetificar = "";
                    const val = codigoRetificar.trim().toUpperCase();
                    const matchFT = val.match(/^FT-?0*(\d+)$/);
                    if (!matchFT) {
                        erroRetificar =
                            "Digite um protocolo FT- válido. Ex: FT-000042";
                        return;
                    }
                    const id = parseInt(matchFT[1]);
                    if (isNaN(id) || id <= 0) {
                        erroRetificar = "Protocolo inválido.";
                        return;
                    }
                    mostrarModalRetificar = false;
                    codigoRetificar = "";
                    window.location.href = `/plantao/retificar/${id}`;
                }}
            >
                <input
                    type="text"
                    bind:value={codigoRetificar}
                    placeholder="FT-000001"
                    required
                    oninput={() => (erroRetificar = "")}
                    class="w-full bg-white/10 border {erroRetificar
                        ? 'border-red-500'
                        : 'border-white/20'} text-white p-3 rounded-lg font-mono text-center text-lg mb-2 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
                {#if erroRetificar}
                    <p class="text-red-400 text-xs text-center mb-3">
                        {erroRetificar}
                    </p>
                {:else}
                    <div class="mb-3"></div>
                {/if}
                <div class="flex gap-2">
                    <button
                        type="submit"
                        class="flex-1 bg-amber-500 text-black font-bold py-2 rounded-lg text-sm uppercase hover:brightness-110 transition"
                    >
                        ABRIR
                    </button>
                    <button
                        type="button"
                        onclick={() => {
                            mostrarModalRetificar = false;
                            codigoRetificar = "";
                            erroRetificar = "";
                        }}
                        class="flex-1 border border-slate-600 text-slate-400 py-2 rounded-lg text-sm uppercase hover:bg-slate-800 transition"
                    >
                        CANCELAR
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Modal: Configurar Relatório Extra -->
{#if mostrarModalExtra}
    <div
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
        <div
            class="bg-[#0d2340] border border-[#c5a059]/40 rounded-xl p-6 w-full max-w-lg shadow-2xl"
        >
            <h3 class="text-[#c5a059] font-bold uppercase text-sm mb-1">
                Configurar Relatório Extra
            </h3>
            <p class="text-slate-400 text-xs mb-5">
                Preencha os campos antes de gerar o relatório para impressão.
            </p>

            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label
                for="justificativa-extra"
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
            >
                Justificativa do Serviço Extraordinário
            </label>
            <textarea
                id="justificativa-extra"
                bind:value={justificativaExtra}
                rows="4"
                placeholder="Descreva a justificativa para o serviço extraordinário..."
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm resize-none mb-4 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            >
            </textarea>

            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label
                for="diretor-extra"
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
            >
                Diretor / Delegado Signatário <span class="text-red-400">*</span
                >
            </label>
            <input
                id="diretor-extra"
                bind:value={nomeDiretorExtra}
                type="text"
                list="sugestoes-diretor-extra-plantao"
                placeholder="Nome completo do diretor ou delegado"
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm mb-1 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            />
            <datalist id="sugestoes-diretor-extra-plantao">
                {#each equipe as m}
                    {#if m.nome.trim()}
                        <option value={m.nome}
                            >{m.cargo ? `${m.cargo}` : ""}</option
                        >
                    {/if}
                {/each}
            </datalist>
            {#if !nomeDiretorExtra.trim()}
                <p class="text-red-400 text-[11px] mb-4">
                    Campo obrigatório para gerar o relatório.
                </p>
            {:else}
                <div class="mb-4"></div>
            {/if}

            {#if membrosExtraordinarios.length > 0}
                <span
                    id="servidores-extra"
                    class="block text-[#c5a059] text-xs font-bold uppercase mb-2"
                >
                    Servidores em Escala Extraordinária
                </span>
                <div
                    aria-labelledby="servidores-extra"
                    class="bg-[#0a192f] border border-[#c5a059]/20 rounded-lg p-3 mb-4 space-y-2 max-h-40 overflow-y-auto"
                >
                    {#each membrosExtraordinarios as membro}
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={membrosExtraIncluidos.includes(
                                    membro.nome,
                                )}
                                onchange={() => toggleMembroExtra(membro.nome)}
                                class="accent-[#c5a059] w-4 h-4"
                            />
                            <span
                                class="text-white text-xs uppercase group-hover:text-[#c5a059] transition"
                            >
                                {membro.nome}
                            </span>
                        </label>
                    {/each}
                </div>
                {#if membrosExtraIncluidos.length === 0}
                    <p class="text-red-400 text-[11px] mb-3">
                        Selecione ao menos um servidor.
                    </p>
                {/if}
            {:else}
                <p class="text-slate-500 text-xs mb-4 italic">
                    Nenhum servidor em escala extraordinária neste plantão.
                </p>
            {/if}

            <div class="flex gap-3 justify-end">
                <button
                    type="button"
                    onclick={() => (mostrarModalExtra = false)}
                    class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onclick={gerarRelatorioExtra}
                    disabled={!nomeDiretorExtra.trim() ||
                        (membrosExtraordinarios.length > 0 &&
                            membrosExtraIncluidos.length === 0)}
                    class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                >
                    Gerar Relatório
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Indicador de alterações não salvas -->
{#if isDirty}
    <div
        class="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-yellow-500/15 backdrop-blur-xl border border-yellow-500/30 text-yellow-300 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-yellow-500/10 animate-fade-in"
    >
        <span class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
        Alterações não salvas
    </div>
{/if}

<!-- Modal de rascunho -->
{#if mostrarModalRascunho}
    <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
        <div
            class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
        >
            <h3 class="text-xl font-bold text-yellow-400 mb-2">
                Retomar Rascunho
            </h3>
            <p class="text-slate-400 text-sm mb-6">
                Cole o código do rascunho salvo anteriormente.
            </p>

            <form
                method="POST"
                action="?/carregarRascunho"
                class="space-y-4"
                use:enhance={({ cancel }) => {
                    carregando = true;
                    return async ({ result, update }) => {
                        carregando = false;
                        mostrarModalRascunho = false;
                        await update();
                    };
                }}
            >
                <div>
                    <label
                        for="codigo-rascunho"
                        class="block text-slate-300 text-xs font-bold uppercase mb-1"
                        >Código (Ex: R-000001)</label
                    >
                    <input
                        id="codigo-rascunho"
                        type="text"
                        name="codigo"
                        required
                        placeholder="R-XXXXXX"
                        class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl uppercase"
                    />
                </div>
                <div class="flex gap-2">
                    <button
                        type="submit"
                        class="flex-1 bg-[#c5a059] text-[#0a192f] font-bold py-2 rounded-lg text-sm uppercase"
                    >
                        CARREGAR
                    </button>
                    <button
                        type="button"
                        onclick={() => (mostrarModalRascunho = false)}
                        class="flex-1 border border-slate-600 text-slate-400 py-2 rounded-lg text-sm uppercase hover:bg-slate-800"
                    >
                        CANCELAR
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<div class="min-h-screen bg-[#0a192f] p-4 md:p-8 text-white font-sans">
    <div class="max-w-4xl mx-auto">
        {#if isRetificacao}
            <div
                class="mb-4 bg-blue-900/40 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
            >
                <span class="text-blue-400 text-lg">✏️</span>
                <div>
                    <span class="font-bold uppercase tracking-wide"
                        >Retificação do relatório
                    </span>
                    <span class="font-mono font-black"
                        >{dadosIniciais.protocolo}</span
                    >
                    <span class="block text-xs text-blue-400 mt-0.5"
                        >Corrija os dados abaixo. Ao finalizar, o relatório
                        original será marcado como retificado.</span
                    >
                </div>
            </div>
        {/if}

        <!-- Header -->
        <header
            class="mb-6 flex justify-between items-start border-b border-[#c5a059] pb-4 flex-wrap gap-3"
        >
            <div>
                <h1
                    class="text-2xl font-black text-[#c5a059] tracking-tight uppercase"
                >
                    {isRetificacao
                        ? "Retificação de Plantão"
                        : "Relatório de Plantão"}
                </h1>
                <p
                    class="text-xs text-slate-400 uppercase tracking-widest mt-1"
                >
                    {isRetificacao
                        ? "DPI SUL — Formulário Oficial"
                        : "Formulário Oficial"}
                </p>
            </div>
        </header>

        {#if formResult && "erro" in formResult && formResult.erro}
            <div
                class="mb-5 bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-xl text-sm"
            >
                ✗ {formResult.erro}
            </div>
        {/if}

        <form
            method="POST"
            action={actionUrl}
            use:enhance={() => {
                carregando = true;
                return async ({ result, update }) => {
                    carregando = false;
                    if (isRetificacao) {
                        await update({ reset: false, invalidateAll: false });
                        if (
                            result.type === "success" &&
                            (result.data as any)?.acao === "finalizado"
                        ) {
                            relatorioFinalizado = true;
                            protocoloGerado =
                                (result.data as any).protocolo ?? "";
                            relatorioId = (result.data as any).id ?? 0;
                        }
                    } else {
                        if (result.type === "redirect") {
                            import("$app/navigation").then((m) =>
                                m.goto(result.location),
                            );
                        } else {
                            await update({ reset: false });
                        }
                    }
                };
            }}
            oninput={marcarDirty}
        >
            {#if !isRetificacao && dadosIniciais?.id}
                <input type="hidden" name="draft_id" value={dadosIniciais.id} />
            {/if}

            <!-- ── Seção 1: Unidade e Período ── -->
            <section class="mb-6">
                <h2
                    class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                >
                    <span
                        class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]"
                        >1</span
                    >
                    Dados do Período
                </h2>

                <div class="space-y-4">
                    <div class="mb-4">
                        <label
                            for="delegacia"
                            class="block text-slate-300 text-xs font-bold uppercase mb-1"
                            >Unidade Policial de Atuação *</label
                        >
                        <input
                            id="delegacia"
                            name="delegacia"
                            type="text"
                            list="lista-delegacias"
                            bind:value={delegacia}
                            placeholder="Digite ou selecione a delegacia..."
                            required
                            class="w-full bg-white/90 text-slate-900 p-3 rounded-lg font-medium focus:ring-2 focus:ring-[#c5a059] outline-none uppercase"
                        />
                        <datalist id="lista-delegacias">
                            {#each delegacias as d}
                                <option value={d.nome}>{d.nome}</option>
                            {/each}
                        </datalist>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <!-- Data Entrada -->
                        <div>
                            <label
                                for="data_entrada"
                                class="block text-slate-400 text-[10px] uppercase font-bold mb-1"
                                >Entrada — Data *</label
                            >
                            <input
                                id="data_entrada"
                                type="date"
                                name="data_entrada"
                                bind:value={data_entrada}
                                required
                                class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                        <!-- Hora Entrada -->
                        <div>
                            <label
                                for="hora_entrada"
                                class="block text-slate-400 text-[10px] uppercase font-bold mb-1"
                                >Entrada — Hora *</label
                            >
                            <input
                                id="hora_entrada"
                                type="time"
                                name="hora_entrada"
                                bind:value={hora_entrada}
                                required
                                class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                        <!-- Data Saída -->
                        <div>
                            <label
                                for="data_saida"
                                class="block text-slate-400 text-[10px] uppercase font-bold mb-1"
                                >Saída — Data</label
                            >
                            <input
                                id="data_saida"
                                type="date"
                                name="data_saida"
                                bind:value={data_saida}
                                class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                        <!-- Hora Saída -->
                        <div>
                            <label
                                for="hora_saida"
                                class="block text-slate-400 text-[10px] uppercase font-bold mb-1"
                                >Saída — Hora</label
                            >
                            <input
                                id="hora_saida"
                                type="time"
                                name="hora_saida"
                                bind:value={hora_saida}
                                class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>
                {#if duracaoInvalida}
                    <p class="text-red-400 text-xs font-bold mt-2">
                        ⚠ {duracaoHoras !== null && duracaoHoras <= 0
                            ? "A saída deve ser posterior à entrada."
                            : `Plantão não pode exceder 24h (atual: ${duracaoHoras?.toFixed(1)}h).`}
                    </p>
                {:else if duracaoHoras !== null}
                    <p class="text-slate-500 text-[10px] mt-1">
                        Duração: {Math.floor(duracaoHoras)}h{Math.round(
                            (duracaoHoras % 1) * 60,
                        ) > 0
                            ? Math.round((duracaoHoras % 1) * 60) + "m"
                            : ""}
                    </p>
                {/if}
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 2: Equipe ── -->
            <section class="mb-6">
                <h2
                    class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                >
                    <span
                        class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]"
                        >2</span
                    >
                    Composição da Equipe de Serviço
                </h2>

                <div class="space-y-3">
                    {#each equipe as membro, idx (membro.id)}
                        <div
                            class="bg-black/20 border {membroExtraForaDoPlantao(
                                membro,
                            )
                                ? 'border-red-500/60'
                                : membro.escala === 'Extraordinaria'
                                  ? 'border-yellow-700/40'
                                  : 'border-[#c5a059]/20'} rounded-xl p-3"
                        >
                            <!-- Linha 1: Nome + controles -->
                            <div
                                class="flex flex-col md:flex-row md:items-center gap-2 mb-2"
                            >
                                <div
                                    class="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 flex-1 w-full"
                                >
                                    <label
                                        for="equipe_{idx}_nome"
                                        class="text-[#c5a059] text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
                                        >Nome do Policial</label
                                    >
                                    <input
                                        id="equipe_{idx}_nome"
                                        name="equipe_{idx}_nome"
                                        type="text"
                                        list="lista-servidores"
                                        bind:value={membro.nome}
                                        onchange={() =>
                                            buscarServidor(
                                                membro.nome,
                                                membro.id,
                                            )}
                                        placeholder="Nome completo ou matrícula..."
                                        class="flex-1 w-full min-w-0 bg-black/30 border-l-4 border-[#c5a059] text-white placeholder-slate-600 px-3 py-2 rounded-lg outline-none uppercase text-sm"
                                    />
                                </div>
                                <div
                                    class="flex justify-between md:justify-end items-center gap-2 mt-1 md:mt-0"
                                >
                                    <span
                                        class="text-xs font-mono {membro.escala ===
                                        'Extraordinaria'
                                            ? 'text-yellow-400 bg-yellow-900/40 border border-yellow-700'
                                            : 'text-slate-500 bg-slate-800'} px-2 py-1.5 rounded font-bold min-w-[3rem] text-center"
                                    >
                                        {calcularHoras(membro)}
                                    </span>
                                    <div class="flex items-center gap-1.5">
                                        <select
                                            name="equipe_{idx}_escala"
                                            bind:value={membro.escala}
                                            required
                                            class="bg-slate-800 border border-slate-700 text-slate-300 text-xs p-2 rounded-lg outline-none max-w-[120px] {membro.escala ===
                                            ''
                                                ? 'text-slate-500'
                                                : ''}"
                                        >
                                            <option value="" disabled selected
                                                >Selecione</option
                                            >
                                            <option value="Normal"
                                                >Normal</option
                                            >
                                            <option value="Extraordinaria"
                                                >Extraordinária</option
                                            >
                                        </select>
                                        {#if idx > 0}
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    removerMembro(membro.id)}
                                                class="bg-red-900/50 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg transition text-xs font-bold"
                                                title="Remover policial"
                                                >✕</button
                                            >
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <!-- Linha 2: Cargo | Matrícula | Telefone | Lotação -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                    <label
                                        for="equipe_{idx}_cargo"
                                        class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5"
                                        >Cargo</label
                                    >
                                    <input
                                        id="equipe_{idx}_cargo"
                                        type="text"
                                        name="equipe_{idx}_cargo"
                                        bind:value={membro.cargo}
                                        placeholder="—"
                                        readonly
                                        class="w-full bg-black/10 border border-slate-700/50 text-slate-400 text-xs px-2 py-1.5 rounded outline-none uppercase cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="equipe_{idx}_matricula"
                                        class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5"
                                        >Matrícula</label
                                    >
                                    <input
                                        id="equipe_{idx}_matricula"
                                        type="text"
                                        name="equipe_{idx}_matricula"
                                        bind:value={membro.matricula}
                                        placeholder="—"
                                        readonly
                                        class="w-full bg-black/10 border border-slate-700/50 text-slate-400 text-xs px-2 py-1.5 rounded outline-none font-mono cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="equipe_{idx}_telefone"
                                        class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5"
                                        >Telefone</label
                                    >
                                    <input
                                        id="equipe_{idx}_telefone"
                                        type="text"
                                        bind:value={membro.telefone}
                                        placeholder="—"
                                        readonly
                                        class="w-full bg-black/10 border border-slate-700/50 text-slate-400 text-xs px-2 py-1.5 rounded outline-none font-mono cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="equipe_{idx}_classe"
                                        class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5"
                                        >Lotação</label
                                    >
                                    <input
                                        id="equipe_{idx}_classe"
                                        type="text"
                                        name="equipe_{idx}_classe"
                                        bind:value={membro.lotacao}
                                        placeholder="—"
                                        readonly
                                        class="w-full bg-black/10 border border-slate-700/50 text-slate-400 text-xs px-2 py-1.5 rounded outline-none uppercase cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {#if membroExtraForaDoPlantao(membro)}
                                <p class="text-red-400 text-xs font-bold mt-2">
                                    ⚠ Horário extraordinário fora do período do
                                    plantão.
                                </p>
                            {/if}

                            <!-- Horário individual expandível -->
                            {#if membro.escala}
                                <div
                                    class="mt-2 bg-black/20 p-2.5 rounded-lg border border-slate-700"
                                >
                                    <label
                                        class="flex items-center gap-2 cursor-pointer mb-2"
                                    >
                                        <input
                                            type="checkbox"
                                            class="accent-yellow-400 w-3.5 h-3.5"
                                            onchange={(e) => {
                                                if (
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).checked
                                                ) {
                                                    membro.data_entrada =
                                                        data_entrada;
                                                    membro.hora_entrada =
                                                        hora_entrada;
                                                    membro.data_saida =
                                                        data_saida;
                                                    membro.hora_saida =
                                                        hora_saida;
                                                    marcarDirty();
                                                }
                                            }}
                                        />
                                        <span
                                            class="text-yellow-400 text-[10px] font-bold uppercase tracking-wide"
                                            >{membro.escala === "Extraordinaria"
                                                ? "Mesmo horário do plantão ordinário"
                                                : "Horário completo"}</span
                                        >
                                    </label>
                                    <div
                                        class="grid grid-cols-2 md:grid-cols-4 gap-2"
                                    >
                                        <div>
                                            <label
                                                for="equipe_{idx}_data_entrada"
                                                class="text-slate-400 text-[10px] uppercase"
                                                >Entrada — Data</label
                                            >
                                            <input
                                                id="equipe_{idx}_data_entrada"
                                                type="date"
                                                name="equipe_{idx}_data_entrada"
                                                bind:value={membro.data_entrada}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                for="equipe_{idx}_hora_entrada"
                                                class="text-slate-400 text-[10px] uppercase"
                                                >Entrada — Hora</label
                                            >
                                            <input
                                                id="equipe_{idx}_hora_entrada"
                                                type="time"
                                                name="equipe_{idx}_hora_entrada"
                                                bind:value={membro.hora_entrada}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                for="equipe_{idx}_data_saida"
                                                class="text-slate-400 text-[10px] uppercase"
                                                >Saída — Data</label
                                            >
                                            <input
                                                id="equipe_{idx}_data_saida"
                                                type="date"
                                                name="equipe_{idx}_data_saida"
                                                bind:value={membro.data_saida}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                for="equipe_{idx}_hora_saida"
                                                class="text-slate-400 text-[10px] uppercase"
                                                >Saída — Hora</label
                                            >
                                            <input
                                                id="equipe_{idx}_hora_saida"
                                                type="time"
                                                name="equipe_{idx}_hora_saida"
                                                bind:value={membro.hora_saida}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <datalist id="lista-servidores">
                    {#each servidores as s}
                        <option value={s.nome}
                            >{s.cargo} — Mat. {s.matricula}</option
                        >
                    {/each}
                </datalist>

                <button
                    type="button"
                    onclick={adicionarMembro}
                    class="mt-3 text-xs font-bold text-[#c5a059] border border-[#c5a059] px-3 py-2 rounded-lg hover:bg-[#c5a059] hover:text-[#0a192f] transition-colors"
                >
                    + ADICIONAR POLICIAL
                </button>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 3: Quantitativos ── -->
            <section class="mb-6">
                <h2
                    class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                >
                    <span
                        class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]"
                        >3</span
                    >
                    Procedimentos Quantitativos
                </h2>
                <div
                    class="grid grid-cols-3 md:grid-cols-6 gap-3 bg-black/20 p-4 rounded-xl border border-dashed border-[#c5a059]/40"
                >
                    {#each [{ label: "B.O.", name: "q_bo", bind: "q_bo" }, { label: "Guias", name: "q_guias", bind: "q_guias" }, { label: "Apreensões", name: "q_apreensoes", bind: "q_apreensoes" }, { label: "Presos", name: "q_presos", bind: "q_presos" }, { label: "Med. Prot.", name: "q_medidas", bind: "q_medidas" }, { label: "Outros", name: "q_outros", bind: "q_outros" }] as item, idx}
                        <div>
                            <label
                                for="quantitativo_{item.name}"
                                class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1"
                                >{item.label}</label
                            >
                            <input
                                id="quantitativo_{item.name}"
                                type="number"
                                name={item.name}
                                min="0"
                                value="0"
                                class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]"
                            />
                        </div>
                    {/each}
                </div>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 4: Procedimentos Qualitativos ── -->
            <section class="mb-6">
                <h2
                    class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                >
                    <span
                        class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]"
                        >4</span
                    >
                    Procedimentos Qualitativos
                    <span class="text-slate-500 text-[10px] font-normal"
                        >(Detalhe cada ocorrência registrada)</span
                    >
                </h2>

                <!-- Botões para adicionar tipo de procedimento -->
                <div class="flex flex-wrap gap-2 mb-4">
                    {#each TIPOS_PROC as tipo}
                        <button
                            type="button"
                            onclick={() => adicionarProcedimento(tipo)}
                            class="text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:brightness-110 {tipo ===
                            'IP-FLAGRANTE'
                                ? 'bg-red-900/40 border-red-700 text-red-300 hover:bg-red-800/60'
                                : tipo === 'IP-PORTARIA'
                                  ? 'bg-orange-900/40 border-orange-700 text-orange-300 hover:bg-orange-800/60'
                                  : tipo === 'TCO'
                                    ? 'bg-blue-900/40 border-blue-700 text-blue-300 hover:bg-blue-800/60'
                                    : 'bg-purple-900/40 border-purple-700 text-purple-300 hover:bg-purple-800/60'}"
                        >
                            + {tipo}
                        </button>
                    {/each}
                </div>

                {#if procedimentos.length === 0}
                    <div
                        class="text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-600 text-sm"
                    >
                        Nenhum procedimento qualitativo. Use os botões acima
                        para adicionar.
                    </div>
                {/if}

                <div class="space-y-4">
                    {#each procedimentos as proc, idx (proc.id)}
                        <div class="border rounded-xl p-4 {corTipo(proc.tipo)}">
                            <!-- Header do procedimento -->
                            <div class="flex items-center justify-between mb-3">
                                <span
                                    class="text-xs font-black uppercase tracking-widest"
                                    >{proc.tipo}</span
                                >
                                <button
                                    type="button"
                                    onclick={() => removerProcedimento(proc.id)}
                                    class="text-current opacity-60 hover:opacity-100 text-xs border border-current px-2 py-0.5 rounded transition"
                                >
                                    ✕ Remover
                                </button>
                            </div>

                            <!-- Hidden: tipo do procedimento -->
                            <input
                                type="hidden"
                                name="proc_{idx}_tipo"
                                value={proc.tipo}
                            />

                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3"
                            >
                                <div>
                                    <label
                                        for="proc_{idx}_numero"
                                        class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                                        >Número do Procedimento</label
                                    >
                                    <input
                                        id="proc_{idx}_numero"
                                        type="text"
                                        name="proc_{idx}_numero"
                                        bind:value={proc.numero}
                                        placeholder="000-00000/0000"
                                        maxlength="14"
                                        oninput={mascaraProcedimento}
                                        class="w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current font-mono"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="proc_{idx}_natureza"
                                        class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                                        >Natureza / Infração *</label
                                    >
                                    <input
                                        id="proc_{idx}_natureza"
                                        type="text"
                                        name="proc_{idx}_natureza"
                                        bind:value={proc.natureza}
                                        placeholder="Ex: Tráfico de Entorpecentes"
                                        required
                                        class="w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current uppercase"
                                    />
                                </div>
                            </div>

                            <!-- Vítimas e Suspeitos lado a lado -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <span
                                        class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                                        >Vítimas / Ofendidos</span
                                    >
                                    {#each proc.vitimas as vitima, vi (vitima.id)}
                                        <div class="flex gap-2">
                                            <!-- svelte-ignore a11y_label_has_associated_control -->
                                            <label
                                                class="sr-only"
                                                for="vitima_{idx}_{vi}_texto"
                                                >Nome Vítima {vi + 1}</label
                                            >
                                            <input
                                                id="vitima_{idx}_{vi}_texto"
                                                type="text"
                                                name="proc_{idx}_vitima_{vi}"
                                                bind:value={vitima.texto}
                                                placeholder="Nome ou 'A APURAR'"
                                                class="flex-1 w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current uppercase"
                                            />
                                            {#if proc.vitimas.length > 1}
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        removerVitima(
                                                            proc.id,
                                                            vitima.id,
                                                        )}
                                                    class="text-current opacity-50 hover:opacity-100 px-2 text-xs transition"
                                                    >✕</button
                                                >
                                            {/if}
                                        </div>
                                    {/each}
                                    <button
                                        type="button"
                                        onclick={() => adicionarVitima(proc.id)}
                                        class="text-[10px] opacity-60 hover:opacity-100 transition"
                                        >+ Adicionar vítima</button
                                    >
                                </div>

                                <div>
                                    <span
                                        class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                                        >Suspeitos / Indiciados</span
                                    >
                                    {#each proc.suspeitos as suspeito, si (suspeito.id)}
                                        <div class="flex gap-2">
                                            <!-- svelte-ignore a11y_label_has_associated_control -->
                                            <label
                                                class="sr-only"
                                                for="suspeito_{idx}_{si}_texto"
                                                >Nome Suspeito {si + 1}</label
                                            >
                                            <input
                                                id="suspeito_{idx}_{si}_texto"
                                                type="text"
                                                name="proc_{idx}_suspeito_{si}"
                                                bind:value={suspeito.texto}
                                                placeholder="Nome ou 'A APURAR'"
                                                class="flex-1 w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current uppercase"
                                            />
                                            {#if proc.suspeitos.length > 1}
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        removerSuspeito(
                                                            proc.id,
                                                            suspeito.id,
                                                        )}
                                                    class="text-current opacity-50 hover:opacity-100 px-2 text-xs transition"
                                                    >✕</button
                                                >
                                            {/if}
                                        </div>
                                    {/each}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            adicionarSuspeito(proc.id)}
                                        class="text-[10px] opacity-60 hover:opacity-100 transition"
                                        >+ Adicionar suspeito</button
                                    >
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 5: Observações ── -->
            <section class="mb-8">
                <h2
                    class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                >
                    <span
                        class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]"
                        >5</span
                    >
                    Observações Gerais
                </h2>
                <textarea
                    name="observacoes"
                    bind:value={observacoes}
                    rows="4"
                    placeholder="Registre aqui quaisquer observações relevantes sobre o plantão..."
                    class="w-full bg-black/20 border border-slate-700 text-white placeholder-slate-600 p-3 rounded-xl outline-none resize-y text-sm focus:ring-2 focus:ring-[#c5a059] uppercase"
                ></textarea>
            </section>

            <!-- ── Barra de ações unificada ───────────────────────────────────── -->
            <div class="pt-6 border-t border-[#c5a059]/30">
                <div class="grid grid-cols-2 lg:grid-cols-6 gap-2">
                    {#if isRetificacao}
                        <!-- BOTOES DE RETIFICACAO -->
                        <div
                            class="col-span-2 lg:col-span-6 flex flex-wrap justify-center gap-2"
                        >
                            {#if !relatorioFinalizado}
                                <button
                                    type="submit"
                                    disabled={carregando}
                                    class="px-5 py-2 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-sm font-black rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {carregando
                                        ? "PROCESSANDO..."
                                        : "✓ FINALIZAR RETIFICAÇÃO"}
                                </button>
                            {/if}

                            <a
                                href={relatorioFinalizado
                                    ? `/plantao/imprimir/${relatorioId}`
                                    : "#"}
                                target={relatorioFinalizado
                                    ? "_blank"
                                    : undefined}
                                class="px-4 py-2 bg-emerald-700 text-white text-sm font-black rounded-lg transition {relatorioFinalizado
                                    ? 'hover:bg-emerald-600 cursor-pointer'
                                    : 'opacity-40 cursor-not-allowed pointer-events-none'}"
                            >
                                🖨 PLANTÃO
                            </a>
                            <button
                                type="button"
                                disabled={!relatorioFinalizado}
                                onclick={abrirModalExtra}
                                class="px-4 py-2 bg-cyan-700 text-white text-sm font-black rounded-lg transition {relatorioFinalizado
                                    ? 'hover:bg-cyan-600'
                                    : 'opacity-40 cursor-not-allowed'}"
                            >
                                📋 EXTRA
                            </button>
                            {#if relatorioFinalizado}
                                <button
                                    type="button"
                                    onclick={() => {
                                        relatorioFinalizado = false;
                                    }}
                                    class="px-4 py-2 bg-amber-700 text-white text-sm font-black rounded-lg hover:bg-amber-600 transition"
                                >
                                    ✏️ NOVA RETIFICAÇÃO
                                </button>
                            {/if}
                        </div>
                    {:else}
                        <!-- BOTOES DE CRIACAO -->
                        <button
                            type="submit"
                            name="acao"
                            value="rascunho"
                            disabled={carregando || relatorioFinalizado}
                            class="py-2 border border-slate-500 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                        >
                            💾 SALVAR
                        </button>
                        <button
                            type="button"
                            onclick={() => (mostrarModalRascunho = true)}
                            disabled={relatorioFinalizado}
                            class="py-2 border border-slate-500 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                        >
                            ↩ RETOMAR
                        </button>
                        {#if relatorioFinalizado}
                            <a
                                href={`/plantao/retificar/${relatorioId}`}
                                class="py-2 bg-amber-500 text-black text-xs font-black rounded-lg hover:brightness-110 transition text-center flex items-center justify-center"
                            >
                                ✏️ RETIFICAR
                            </a>
                        {:else}
                            <button
                                type="button"
                                onclick={() => (mostrarModalRetificar = true)}
                                class="py-2 bg-amber-500/80 text-black text-xs font-black rounded-lg hover:bg-amber-500 transition text-center"
                            >
                                ✏️ RETIFICAR
                            </button>
                        {/if}
                        {#if !relatorioFinalizado}
                            <button
                                type="submit"
                                name="acao"
                                value="finalizar"
                                disabled={carregando || temErrosHorario}
                                title={temErrosHorario
                                    ? "Corrija os erros de horário antes de finalizar"
                                    : undefined}
                                class="py-2 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-xs font-black rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                            >
                                {carregando ? "..." : "✓ FINALIZAR"}
                            </button>
                        {/if}
                        <a
                            href={relatorioFinalizado
                                ? `/plantao/imprimir/${relatorioId}`
                                : "#"}
                            target={relatorioFinalizado ? "_blank" : undefined}
                            title={relatorioFinalizado
                                ? "Abrir para impressão"
                                : "Finalize o relatório primeiro"}
                            class="py-2 bg-emerald-700 text-white text-xs font-black rounded-lg transition text-center flex items-center justify-center {relatorioFinalizado
                                ? 'hover:bg-emerald-600 cursor-pointer'
                                : 'opacity-40 cursor-not-allowed pointer-events-none'}"
                        >
                            🖨 PLANTÃO
                        </a>
                        <button
                            type="button"
                            disabled={!relatorioFinalizado}
                            onclick={abrirModalExtra}
                            title={relatorioFinalizado
                                ? "Configurar e gerar relatório extra"
                                : "Finalize o relatório primeiro"}
                            class="py-2 bg-cyan-700 text-white text-xs font-black rounded-lg transition text-center {relatorioFinalizado
                                ? 'hover:bg-cyan-600'
                                : 'opacity-40 cursor-not-allowed'}"
                        >
                            📋 EXTRA
                        </button>
                    {/if}
                </div>

                {#if relatorioFinalizado}
                    <p
                        class="text-center mt-3 font-mono text-emerald-400 font-black text-sm tracking-widest"
                    >
                        ✅ {protocoloGerado}
                        {isRetificacao ? "— Retificação finalizada" : ""}
                        <a
                            href="/plantao"
                            class="ml-4 text-[10px] border border-slate-600 text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-800 transition font-sans font-bold uppercase"
                        >
                            + Novo{isRetificacao ? " Relatório" : ""}
                        </a>
                    </p>
                {:else if temErrosHorario && !isRetificacao}
                    <p
                        class="text-red-400 text-[10px] text-center mt-2 font-bold"
                    >
                        ⚠ Corrija os erros de horário para habilitar a
                        finalização
                    </p>
                {:else}
                    <p
                        class="text-slate-600 text-xs text-center mt-3 uppercase tracking-wider font-bold"
                    >
                        🖨 PLANTÃO e 📋 EXTRA serão habilitados após a
                        finalização
                    </p>
                {/if}
            </div>
        </form>
    </div>
</div>
