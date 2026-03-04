<script lang="ts">
    import { getPlantaoForm } from "./state.svelte";
    import { TIPOS_PROC, COR_TIPO_DARK } from "$lib/constants";

    const state = getPlantaoForm();

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
        const idxMatch = input.name.match(/proc_(\d+)_numero/);
        if (idxMatch) {
            const idx = parseInt(idxMatch[1]);
            const proc = state.procedimentos.find((_, i) => i === idx);
            if (proc) proc.numero = v;
        }
    }
</script>

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

    <div class="flex flex-wrap gap-2 mb-4">
        {#each TIPOS_PROC as tipo}
            <button
                type="button"
                onclick={() => state.adicionarProcedimento(tipo)}
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

    {#if state.procedimentos.length === 0}
        <div
            class="text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-600 text-sm"
        >
            Nenhum procedimento qualitativo. Use os botões acima para adicionar.
        </div>
    {/if}

    <div class="space-y-4">
        {#each state.procedimentos as proc, idx (proc.id)}
            <div class="border rounded-xl p-4 {corTipo(proc.tipo)}">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-black uppercase tracking-widest"
                        >{proc.tipo}</span
                    >
                    <button
                        type="button"
                        onclick={() => state.removerProcedimento(proc.id)}
                        class="text-current opacity-60 hover:opacity-100 text-xs border border-current px-2 py-0.5 rounded transition"
                    >
                        ✕ Remover
                    </button>
                </div>

                <input type="hidden" name="proc_{idx}_tipo" value={proc.tipo} />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <span
                            class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                            >Vítimas / Ofendidos</span
                        >
                        {#each proc.vitimas as vitima, vi (vitima.id)}
                            <div class="flex gap-2 mb-1">
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
                                            state.removerVitima(
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
                            onclick={() => state.adicionarVitima(proc.id)}
                            class="text-[10px] opacity-60 hover:opacity-100 transition mt-1"
                            >+ Adicionar vítima</button
                        >
                    </div>

                    <div>
                        <span
                            class="text-[10px] font-bold uppercase opacity-70 block mb-1"
                            >Suspeitos / Indiciados</span
                        >
                        {#each proc.suspeitos as suspeito, si (suspeito.id)}
                            <div class="flex gap-2 mb-1">
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
                                            state.removerSuspeito(
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
                            onclick={() => state.adicionarSuspeito(proc.id)}
                            class="text-[10px] opacity-60 hover:opacity-100 transition mt-1"
                            >+ Adicionar suspeito</button
                        >
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
