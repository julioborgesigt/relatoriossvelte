<script lang="ts">
    import { getPlantaoForm } from "./state.svelte";
    const state = getPlantaoForm();
</script>

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
        {#each [{ label: "B.O.", name: "q_bo", bind: "q_bo" }, { label: "Guias", name: "q_guias", bind: "q_guias" }, { label: "Apreensões", name: "q_apreensoes", bind: "q_apreensoes" }, { label: "Presos", name: "q_presos", bind: "q_presos" }, { label: "Med. Prot.", name: "q_medidas", bind: "q_medidas" }, { label: "Outros", name: "q_outros", bind: "q_outros" }] as item}
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
                    bind:value={state[item.bind as keyof typeof state]}
                    class="w-full text-center bg-white/90 text-slate-900 p-1.5 rounded-lg font-bold outline-none text-base focus:ring-2 focus:ring-[#c5a059]"
                />
            </div>
        {/each}
    </div>
</section>
