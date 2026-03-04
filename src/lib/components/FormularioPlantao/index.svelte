<script lang="ts">
    import { enhance } from "$app/forms";
    import SecaoCabecalho from "./SecaoCabecalho.svelte";
    import SecaoEquipe from "./SecaoEquipe.svelte";
    import SecaoEstatisticas from "./SecaoEstatisticas.svelte";
    import SecaoProcedimentos from "./SecaoProcedimentos.svelte";
    import { PlantaoFormState, setPlantaoForm } from "./state.svelte";

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

    const state = new PlantaoFormState(
        isRetificacao,
        dadosIniciais,
        equipeInicial,
        procedimentosIniciais,
    );

    $effect(() => {
        // Re-sincroniza o estado e notificações baseados no resultado da finalização
        state.handleFormResult(formResult);
    });

    // Prover contexto para os sub componentes
    setPlantaoForm(state);
</script>

<svelte:window
    onbeforeunload={(e) => {
        if (state.isDirty && !state.relatorioFinalizado) {
            e.preventDefault();
        }
    }}
/>

<!-- Toast de sucesso -->
{#if formResult && "sucesso" in formResult && formResult.sucesso}
    <div
        class="fixed top-5 right-5 z-50 bg-emerald-900 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm"
    >
        ✓ {formResult.mensagem}
    </div>
{/if}

<!-- Modais: Retificar e Rascunho -->
{#if state.mostrarModalRetificar}
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
                    state.erroRetificar = "";
                    const val = state.codigoRetificar.trim().toUpperCase();
                    const matchFT = val.match(/^FT-?0*(\d+)$/);
                    if (!matchFT) {
                        state.erroRetificar =
                            "Digite um protocolo FT- válido. Ex: FT-000042";
                        return;
                    }
                    const id = parseInt(matchFT[1]);
                    if (isNaN(id) || id <= 0) {
                        state.erroRetificar = "Protocolo inválido.";
                        return;
                    }
                    state.mostrarModalRetificar = false;
                    state.codigoRetificar = "";
                    window.location.href = `/plantao/retificar/${id}`;
                }}
            >
                <input
                    type="text"
                    bind:value={state.codigoRetificar}
                    placeholder="FT-000001"
                    required
                    oninput={() => (state.erroRetificar = "")}
                    class="w-full bg-white/10 border {state.erroRetificar
                        ? 'border-red-500'
                        : 'border-white/20'} text-white p-3 rounded-lg font-mono text-center text-lg mb-2 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
                {#if state.erroRetificar}
                    <p class="text-red-400 text-xs text-center mb-3">
                        {state.erroRetificar}
                    </p>
                {:else}
                    <div class="mb-3"></div>
                {/if}
                <div class="flex gap-2">
                    <button
                        type="submit"
                        class="flex-1 bg-amber-500 text-black font-bold py-2 rounded-lg text-sm uppercase hover:brightness-110 transition"
                        >ABRIR</button
                    >
                    <button
                        type="button"
                        onclick={() => {
                            state.mostrarModalRetificar = false;
                            state.codigoRetificar = "";
                            state.erroRetificar = "";
                        }}
                        class="flex-1 border border-slate-600 text-slate-400 py-2 rounded-lg text-sm uppercase hover:bg-slate-800 transition"
                        >CANCELAR</button
                    >
                </div>
            </form>
        </div>
    </div>
{/if}

{#if state.mostrarModalRascunho}
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
                use:enhance={() => {
                    state.carregando = true;
                    return async ({ update }) => {
                        state.carregando = false;
                        state.mostrarModalRascunho = false;
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
                        >CARREGAR</button
                    >
                    <button
                        type="button"
                        onclick={() => (state.mostrarModalRascunho = false)}
                        class="flex-1 border border-slate-600 text-slate-400 py-2 rounded-lg text-sm uppercase hover:bg-slate-800"
                        >CANCELAR</button
                    >
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Modal Extra -->
{#if state.mostrarModalExtra}
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

            <label
                for="justificativa-extra"
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
                >Justificativa do Serviço Extraordinário</label
            >
            <textarea
                id="justificativa-extra"
                bind:value={state.justificativaExtra}
                rows="4"
                placeholder="Descreva a justificativa para o serviço extraordinário..."
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm resize-none mb-4 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            ></textarea>

            <label
                for="diretor-extra"
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
                >Diretor / Delegado Signatário <span class="text-red-400"
                    >*</span
                ></label
            >
            <input
                id="diretor-extra"
                bind:value={state.nomeDiretorExtra}
                type="text"
                list="sugestoes-diretor-extra-plantao"
                placeholder="Nome completo do diretor ou delegado"
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm mb-1 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            />
            <datalist id="sugestoes-diretor-extra-plantao">
                {#each state.equipe as m}
                    {#if m.nome.trim()}
                        <option value={m.nome}
                            >{m.cargo ? `${m.cargo}` : ""}</option
                        >
                    {/if}
                {/each}
            </datalist>
            {#if !state.nomeDiretorExtra.trim()}
                <p class="text-red-400 text-[11px] mb-4">
                    Campo obrigatório para gerar o relatório.
                </p>
            {:else}
                <div class="mb-4"></div>
            {/if}

            {#if state.membrosExtraordinarios.length > 0}
                <span
                    id="servidores-extra"
                    class="block text-[#c5a059] text-xs font-bold uppercase mb-2"
                    >Servidores em Escala Extraordinária</span
                >
                <div
                    aria-labelledby="servidores-extra"
                    class="bg-[#0a192f] border border-[#c5a059]/20 rounded-lg p-3 mb-4 space-y-2 max-h-40 overflow-y-auto"
                >
                    {#each state.membrosExtraordinarios as membro}
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={state.membrosExtraIncluidos.includes(
                                    membro.nome,
                                )}
                                onchange={() =>
                                    state.toggleMembroExtra(membro.nome)}
                                class="accent-[#c5a059] w-4 h-4"
                            />
                            <span
                                class="text-white text-xs uppercase group-hover:text-[#c5a059] transition"
                                >{membro.nome}</span
                            >
                        </label>
                    {/each}
                </div>
                {#if state.membrosExtraIncluidos.length === 0}
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
                    onclick={() => (state.mostrarModalExtra = false)}
                    class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg"
                    >Cancelar</button
                >
                <button
                    type="button"
                    onclick={() => state.gerarRelatorioExtra()}
                    disabled={!state.nomeDiretorExtra.trim() ||
                        (state.membrosExtraordinarios.length > 0 &&
                            state.membrosExtraIncluidos.length === 0)}
                    class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                    >Gerar Relatório</button
                >
            </div>
        </div>
    </div>
{/if}

{#if state.isDirty}
    <div
        class="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-yellow-500/15 backdrop-blur-xl border border-yellow-500/30 text-yellow-300 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-yellow-500/10 animate-fade-in"
    >
        <span class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
        Alterações não salvas
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
                state.carregando = true;
                return async ({ result, update }) => {
                    state.carregando = false;
                    if (isRetificacao) {
                        await update({ reset: false, invalidateAll: false });
                        if (
                            result.type === "success" &&
                            (result.data as any)?.acao === "finalizado"
                        ) {
                            state.relatorioFinalizado = true;
                            state.protocoloGerado =
                                (result.data as any).protocolo ?? "";
                            state.relatorioId = (result.data as any).id ?? 0;
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
            oninput={() => state.marcarDirty()}
        >
            {#if !isRetificacao && dadosIniciais?.id}
                <input type="hidden" name="draft_id" value={dadosIniciais.id} />
            {/if}

            <SecaoCabecalho {delegacias} />
            <hr class="border-[#c5a059]/20 my-6" />
            <SecaoEquipe {servidores} />
            <hr class="border-[#c5a059]/20 my-6" />
            <SecaoEstatisticas />
            <hr class="border-[#c5a059]/20 my-6" />
            <SecaoProcedimentos />
            <hr class="border-[#c5a059]/20 my-6" />

            <!-- Seção 5: Observações -->
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
                    bind:value={state.observacoes}
                    rows="4"
                    placeholder="Registre aqui quaisquer observações relevantes sobre o plantão..."
                    class="w-full bg-black/20 border border-slate-700 text-white placeholder-slate-600 p-3 rounded-xl outline-none resize-y text-sm focus:ring-2 focus:ring-[#c5a059] uppercase"
                ></textarea>
            </section>

            <!-- Barra de ações unificada -->
            <div class="pt-6 border-t border-[#c5a059]/30">
                <div class="grid grid-cols-2 lg:grid-cols-6 gap-2">
                    {#if isRetificacao}
                        <div
                            class="col-span-2 lg:col-span-6 flex flex-wrap justify-center gap-2"
                        >
                            {#if !state.relatorioFinalizado}
                                <button
                                    type="submit"
                                    disabled={state.carregando}
                                    class="px-5 py-2 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-sm font-black rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {state.carregando
                                        ? "PROCESSANDO..."
                                        : "✓ FINALIZAR RETIFICAÇÃO"}
                                </button>
                            {/if}
                            <a
                                href={state.relatorioFinalizado
                                    ? `/plantao/imprimir/${state.relatorioId}`
                                    : "#"}
                                target={state.relatorioFinalizado
                                    ? "_blank"
                                    : undefined}
                                class="px-4 py-2 bg-emerald-700 text-white text-sm font-black rounded-lg transition {state.relatorioFinalizado
                                    ? 'hover:bg-emerald-600 cursor-pointer'
                                    : 'opacity-40 cursor-not-allowed pointer-events-none'}"
                                >🖨 PLANTÃO</a
                            >
                            <button
                                type="button"
                                disabled={!state.relatorioFinalizado}
                                onclick={() => state.abrirModalExtra()}
                                class="px-4 py-2 bg-cyan-700 text-white text-sm font-black rounded-lg transition {state.relatorioFinalizado
                                    ? 'hover:bg-cyan-600'
                                    : 'opacity-40 cursor-not-allowed'}"
                                >📋 EXTRA</button
                            >
                            {#if state.relatorioFinalizado}
                                <button
                                    type="button"
                                    onclick={() => {
                                        state.relatorioFinalizado = false;
                                    }}
                                    class="px-4 py-2 bg-amber-700 text-white text-sm font-black rounded-lg hover:bg-amber-600 transition"
                                    >✏️ NOVA RETIFICAÇÃO</button
                                >
                            {/if}
                        </div>
                    {:else}
                        <button
                            type="submit"
                            name="acao"
                            value="rascunho"
                            disabled={state.carregando ||
                                state.relatorioFinalizado}
                            class="py-2 border border-slate-500 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                            >💾 SALVAR</button
                        >
                        <button
                            type="button"
                            onclick={() => (state.mostrarModalRascunho = true)}
                            disabled={state.relatorioFinalizado}
                            class="py-2 border border-slate-500 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                            >↩ RETOMAR</button
                        >
                        {#if state.relatorioFinalizado}
                            <a
                                href={`/plantao/retificar/${state.relatorioId}`}
                                class="py-2 bg-amber-500 text-black text-xs font-black rounded-lg hover:brightness-110 transition text-center flex items-center justify-center"
                                >✏️ RETIFICAR</a
                            >
                        {:else}
                            <button
                                type="button"
                                onclick={() =>
                                    (state.mostrarModalRetificar = true)}
                                class="py-2 bg-amber-500/80 text-black text-xs font-black rounded-lg hover:bg-amber-500 transition text-center"
                                >✏️ RETIFICAR</button
                            >
                        {/if}
                        {#if !state.relatorioFinalizado}
                            <button
                                type="submit"
                                name="acao"
                                value="finalizar"
                                disabled={state.carregando ||
                                    state.temErrosHorario}
                                title={state.temErrosHorario
                                    ? "Corrija os erros de horário antes de finalizar"
                                    : undefined}
                                class="py-2 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-xs font-black rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
                                >{state.carregando
                                    ? "..."
                                    : "✓ FINALIZAR"}</button
                            >
                        {/if}
                        <a
                            href={state.relatorioFinalizado
                                ? `/plantao/imprimir/${state.relatorioId}`
                                : "#"}
                            target={state.relatorioFinalizado
                                ? "_blank"
                                : undefined}
                            title={state.relatorioFinalizado
                                ? "Abrir para impressão"
                                : "Finalize o relatório primeiro"}
                            class="py-2 bg-emerald-700 text-white text-xs font-black rounded-lg transition text-center flex items-center justify-center {state.relatorioFinalizado
                                ? 'hover:bg-emerald-600 cursor-pointer'
                                : 'opacity-40 cursor-not-allowed pointer-events-none'}"
                            >🖨 PLANTÃO</a
                        >
                        <button
                            type="button"
                            disabled={!state.relatorioFinalizado}
                            onclick={() => state.abrirModalExtra()}
                            title={state.relatorioFinalizado
                                ? "Configurar e gerar relatório extra"
                                : "Finalize o relatório primeiro"}
                            class="py-2 bg-cyan-700 text-white text-xs font-black rounded-lg transition text-center {state.relatorioFinalizado
                                ? 'hover:bg-cyan-600'
                                : 'opacity-40 cursor-not-allowed'}"
                            >📋 EXTRA</button
                        >
                    {/if}
                </div>

                {#if state.relatorioFinalizado}
                    <p
                        class="text-center mt-3 font-mono text-emerald-400 font-black text-sm tracking-widest"
                    >
                        ✅ {state.protocoloGerado}
                        {isRetificacao ? "— Retificação finalizada" : ""}
                        <a
                            href="/plantao"
                            class="ml-4 text-[10px] border border-slate-600 text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-800 transition font-sans font-bold uppercase"
                            >+ Novo{isRetificacao ? " Relatório" : ""}</a
                        >
                    </p>
                {:else if state.temErrosHorario && !isRetificacao}
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
