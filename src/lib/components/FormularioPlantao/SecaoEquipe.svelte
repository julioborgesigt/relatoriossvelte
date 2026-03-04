<script lang="ts">
    import { getPlantaoForm } from "./state.svelte";

    let { servidores = [] } = $props<{ servidores: any[] }>();
    const state = getPlantaoForm();
</script>

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
        {#each state.equipe as membro, idx (membro.id)}
            <div
                class="bg-black/20 border {state.membroExtraForaDoPlantao(
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
                                state.buscarServidor(
                                    membro.nome,
                                    membro.id,
                                    servidores,
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
                            {state.calcularHoras(membro)}
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
                                <option value="Normal">Normal</option>
                                <option value="Extraordinaria"
                                    >Extraordinária</option
                                >
                            </select>
                            {#if state.equipe.length > 1}
                                <button
                                    type="button"
                                    onclick={() =>
                                        state.removerMembro(membro.id)}
                                    class="bg-red-900/50 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg transition text-xs font-bold"
                                    title="Remover policial">✕</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Linha 2 -->
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

                {#if state.membroExtraForaDoPlantao(membro)}
                    <p class="text-red-400 text-xs font-bold mt-2">
                        ⚠ Horário extraordinário fora do período do plantão.
                    </p>
                {/if}

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
                                        (e.target as HTMLInputElement).checked
                                    ) {
                                        membro.data_entrada =
                                            state.data_entrada;
                                        membro.hora_entrada =
                                            state.hora_entrada;
                                        membro.data_saida = state.data_saida;
                                        membro.hora_saida = state.hora_saida;
                                        state.marcarDirty();
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
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                                <label
                                    for="equipe_{idx}_data_entrada"
                                    class="text-slate-400 text-[10px] uppercase"
                                    >Entrada — Data</label
                                ><input
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
                                ><input
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
                                ><input
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
                                ><input
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
            <option value={s.nome}>{s.cargo} — Mat. {s.matricula}</option>
        {/each}
    </datalist>

    <button
        type="button"
        onclick={() => state.adicionarMembro()}
        class="mt-3 text-xs font-bold text-[#c5a059] border border-[#c5a059] px-3 py-2 rounded-lg hover:bg-[#c5a059] hover:text-[#0a192f] transition-colors"
    >
        + ADICIONAR POLICIAL
    </button>
</section>
