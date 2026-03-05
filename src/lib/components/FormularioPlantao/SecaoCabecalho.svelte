<script lang="ts">
    import { getPlantaoForm } from "./state.svelte";

    let { delegacias = [] } = $props<{ delegacias: { nome: string }[] }>();
    const state = getPlantaoForm();
</script>

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
                bind:value={state.delegacia}
                onchange={() => {
                    if (state.delegacia.trim() !== "") {
                        const existe = delegacias.find(
                            (d: any) =>
                                d.nome.toLowerCase() ===
                                state.delegacia.toLowerCase(),
                        );
                        if (existe) {
                            state.delegacia = existe.nome;
                        } else {
                            state.delegacia = "";
                            alert(
                                "Unidade policial não encontrada na base de dados. Selecione uma opção válida.",
                            );
                        }
                    }
                }}
                placeholder="Digite ou selecione a delegacia..."
                required
                class="w-full bg-white/90 text-slate-900 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#c5a059] outline-none uppercase"
            />
            <datalist id="lista-delegacias">
                {#each delegacias as d}
                    <option value={d.nome}>{d.nome}</option>
                {/each}
            </datalist>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                    bind:value={state.data_entrada}
                    required
                    class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                />
            </div>
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
                    bind:value={state.hora_entrada}
                    required
                    class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                />
            </div>
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
                    bind:value={state.data_saida}
                    class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                />
            </div>
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
                    bind:value={state.hora_saida}
                    class="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-yellow-500 transition-colors"
                />
            </div>
        </div>
    </div>

    {#if state.duracaoInvalida}
        <p class="text-red-400 text-xs font-bold mt-2">
            ⚠ {state.duracaoHoras !== null && state.duracaoHoras <= 0
                ? "A saída deve ser posterior à entrada."
                : `Plantão não pode exceder 24h (atual: ${state.duracaoHoras?.toFixed(1)}h).`}
        </p>
    {:else if state.duracaoHoras !== null}
        <p class="text-slate-500 text-[10px] mt-1">
            Duração: {Math.floor(state.duracaoHoras)}h{Math.round(
                (state.duracaoHoras % 1) * 60,
            ) > 0
                ? Math.round((state.duracaoHoras % 1) * 60) + "m"
                : ""}
        </p>
    {/if}
</section>
