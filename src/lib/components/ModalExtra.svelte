<script lang="ts">
    import { formatarProtocolo } from "$lib/utils";

    let {
        mostrarModalConfig = $bindable(false),
        justificativa = $bindable(""),
        nomeDiretor = $bindable(""),
        membrosIncluidos = $bindable<string[]>([]),
        p,
        equipeExtra,
        onConfirm,
        onCancel = null,
    } = $props();

    function toggleMembro(nome: string) {
        if (membrosIncluidos.includes(nome)) {
            membrosIncluidos = membrosIncluidos.filter((n) => n !== nome);
        } else {
            membrosIncluidos = [...membrosIncluidos, nome];
        }
    }
</script>

{#if mostrarModalConfig}
    <div
        class="no-print fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
        <div
            class="bg-[#0d2340] border border-[#c5a059]/40 rounded-xl p-6 w-full max-w-lg shadow-2xl"
        >
            <h3 class="text-[#c5a059] font-bold uppercase text-sm mb-1">
                Configurar Relatório Extra
            </h3>
            <p class="text-slate-400 text-xs mb-5">
                Preencha os campos abaixo para gerar o relatório extra.
            </p>

            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
            >
                Justificativa do Serviço Extraordinário
            </label>
            <textarea
                bind:value={justificativa}
                rows="4"
                placeholder="Descreva a justificativa para o serviço extraordinário..."
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm resize-none mb-4 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            ></textarea>

            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label
                class="block text-[#c5a059] text-xs font-bold uppercase mb-1"
            >
                Diretor / Delegado Signatário <span class="text-red-400">*</span
                >
            </label>
            <input
                bind:value={nomeDiretor}
                type="text"
                list="sugestoes-diretor"
                placeholder="Nome completo do diretor ou delegado"
                class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm mb-1 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
            />
            <datalist id="sugestoes-diretor">
                {#each equipeExtra as m}
                    {#if m.nome_servidor?.trim()}
                        <option value={m.nome_servidor}
                            >{m.cargo ? `${m.cargo}` : ""}</option
                        >
                    {/if}
                {/each}
                {#if p && p.nome_responsavel}
                    <option value={p.nome_responsavel}></option>
                {/if}
            </datalist>
            {#if !nomeDiretor.trim()}
                <p class="text-red-400 text-[11px] mb-4">Campo obrigatório.</p>
            {:else}
                <div class="mb-4"></div>
            {/if}

            {#if equipeExtra.length > 0}
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label
                    class="block text-[#c5a059] text-xs font-bold uppercase mb-2"
                >
                    Servidores em Escala Extraordinária
                </label>
                <div
                    class="bg-[#0a192f] border border-[#c5a059]/20 rounded-lg p-3 mb-4 space-y-2 max-h-40 overflow-y-auto"
                >
                    {#each equipeExtra as membro}
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={membrosIncluidos.includes(
                                    membro.nome_servidor,
                                )}
                                onchange={() =>
                                    toggleMembro(membro.nome_servidor)}
                                class="accent-[#c5a059] w-4 h-4"
                            />
                            <span
                                class="text-white text-xs uppercase group-hover:text-[#c5a059] transition"
                            >
                                {membro.nome_servidor}
                            </span>
                        </label>
                    {/each}
                </div>
                {#if membrosIncluidos.length === 0}
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
                {#if onCancel}
                    <button
                        type="button"
                        onclick={onCancel}
                        class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg"
                    >
                        Cancelar
                    </button>
                {:else}
                    <button
                        type="button"
                        onclick={() => (mostrarModalConfig = false)}
                        class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg"
                    >
                        Cancelar
                    </button>
                {/if}
                <button
                    onclick={onConfirm}
                    disabled={!nomeDiretor.trim() ||
                        (equipeExtra.length > 0 &&
                            membrosIncluidos.length === 0)}
                    class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                >
                    Gerar Relatório
                </button>
            </div>
        </div>
    </div>
{/if}
