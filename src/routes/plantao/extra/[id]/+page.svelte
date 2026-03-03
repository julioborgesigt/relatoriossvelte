<script lang="ts">
    import type { PageData } from './$types';
    import { formatarData, formatarProtocolo, calcularHoras } from '$lib/utils';

    let { data }: { data: PageData } = $props();
    const p = data.plantao;
    const equipeExtra = data.equipeExtra;
    const config = data.config;
    const ano = new Date().getFullYear();

    // ── Estado do modal de configuração ──────────────────────────────────────
    // Se vier configurado via URL params (da página de retificação), pula o modal
    let mostrarModalConfig = $state(!config.dir);
    let justificativa = $state(
        config.just ||
        `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${formatarProtocolo(p.protocolo, p.id)}.`
    );
    let nomeDiretor = $state(config.dir);

    // Seleção de quais membros incluir na impressão
    // Se vier lista via URL, filtra; caso contrário inclui todos
    let membrosIncluidos = $state<string[]>(
        config.mb
            ? config.mb.split(',').filter(n => equipeExtra.some(m => m.nome_servidor === n))
            : equipeExtra.map(m => m.nome_servidor)
    );

    function toggleMembro(nome: string) {
        if (membrosIncluidos.includes(nome)) {
            membrosIncluidos = membrosIncluidos.filter(n => n !== nome);
        } else {
            membrosIncluidos = [...membrosIncluidos, nome];
        }
    }

    // Equipe filtrada para o relatório impresso
    let equipeImpressao = $derived(equipeExtra.filter(m => membrosIncluidos.includes(m.nome_servidor)));

    function confirmarConfig() {
        if (!nomeDiretor.trim() || membrosIncluidos.length === 0) return;
        mostrarModalConfig = false;
    }
</script>

<svelte:head>
    <title>Relatório Extra {p.protocolo} — DPI SUL</title>
    <style>
        @media print {
            .no-print { display: none !important; }
            body { background: white; }
            @page { size: A4; margin: 10mm; }
        }
        body { font-family: 'Segoe UI', Arial, sans-serif; }
    </style>
</svelte:head>

<!-- ══ MODAL DE CONFIGURAÇÃO ════════════════════════════════════════════════ -->
{#if mostrarModalConfig}
<div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div class="bg-[#0d2340] border border-[#c5a059]/40 rounded-xl p-6 w-full max-w-lg shadow-2xl">

        <h3 class="text-[#c5a059] font-bold uppercase text-sm mb-1">
            Configurar Relatório Extra
        </h3>
        <p class="text-slate-400 text-xs mb-5">
            Preencha os campos antes de gerar o relatório para impressão.
        </p>

        <!-- Justificativa -->
        <label class="block text-[#c5a059] text-xs font-bold uppercase mb-1">
            Justificativa do Serviço Extraordinário
        </label>
        <textarea
            bind:value={justificativa}
            rows="4"
            placeholder="Descreva a justificativa para o serviço extraordinário..."
            class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm resize-none mb-4 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
        ></textarea>

        <!-- Nome do Diretor -->
        <label class="block text-[#c5a059] text-xs font-bold uppercase mb-1">
            Diretor / Delegado Signatário <span class="text-red-400">*</span>
        </label>
        <input
            bind:value={nomeDiretor}
            type="text"
            list="sugestoes-diretor"
            placeholder="Nome completo do diretor ou delegado"
            class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm mb-1 focus:outline-none focus:border-[#c5a059] placeholder-slate-600"
        />
        <!-- Sugestão automática com o responsável do plantão -->
        <datalist id="sugestoes-diretor">
            {#if p.nome_responsavel}
                <option value={p.nome_responsavel}></option>
            {/if}
        </datalist>
        {#if !nomeDiretor.trim()}
            <p class="text-red-400 text-[11px] mb-4">Campo obrigatório para gerar o relatório.</p>
        {:else}
            <p class="text-slate-500 text-[11px] mb-4">&nbsp;</p>
        {/if}

        <!-- Servidores a incluir -->
        {#if equipeExtra.length > 0}
            <label class="block text-[#c5a059] text-xs font-bold uppercase mb-2">
                Servidores em Escala Extraordinária
            </label>
            <div class="bg-[#0a192f] border border-[#c5a059]/20 rounded-lg p-3 mb-4 space-y-2 max-h-40 overflow-y-auto">
                {#each equipeExtra as membro}
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={membrosIncluidos.includes(membro.nome_servidor)}
                            onchange={() => toggleMembro(membro.nome_servidor)}
                            class="accent-[#c5a059] w-4 h-4"
                        />
                        <span class="text-white text-xs uppercase group-hover:text-[#c5a059] transition">
                            {membro.nome_servidor}
                        </span>
                    </label>
                {/each}
            </div>
            {#if membrosIncluidos.length === 0}
                <p class="text-red-400 text-[11px] mb-3">Selecione ao menos um servidor.</p>
            {/if}
        {/if}

        <!-- Ações -->
        <div class="flex gap-3 justify-end">
            <a
                href="/plantao/imprimir/{p.id}"
                class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg"
            >
                ← Voltar
            </a>
            <button
                onclick={confirmarConfig}
                disabled={!nomeDiretor.trim() || membrosIncluidos.length === 0}
                class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
                Gerar Relatório
            </button>
        </div>
    </div>
</div>
{/if}

<!-- ══ BOTÕES DE AÇÃO (não aparecem na impressão) ════════════════════════════ -->
{#if !mostrarModalConfig}
<div class="no-print fixed bottom-6 right-6 flex gap-3 z-50">
    <a href="/plantao/imprimir/{p.id}"
        class="bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-slate-600 transition">
        ← Relatório Principal
    </a>
    <button
        onclick={() => mostrarModalConfig = true}
        class="bg-slate-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-slate-500 transition">
        ✏️ Ajustar
    </button>
    <button onclick={() => window.print()}
        class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-full font-black shadow-xl hover:brightness-110 transition text-sm">
        🖨 IMPRIMIR PDF
    </button>
</div>
{/if}

<!-- ══ DOCUMENTO A4 ══════════════════════════════════════════════════════════ -->
{#if !mostrarModalConfig}
<div class="bg-white min-h-screen p-0">
    <div class="max-w-[210mm] mx-auto px-[12mm] py-[10mm] text-black text-[11px]">

        <!-- Cabeçalho -->
        <header class="text-center border-b-2 border-black pb-3 mb-4">
            <div class="flex items-center justify-between mb-2">
                <div class="text-left text-[9px] leading-tight text-gray-600">
                    <p class="font-bold">ESTADO DO CEARÁ</p>
                    <p>Secretaria de Segurança Pública</p>
                    <p>Polícia Civil do Estado do Ceará</p>
                </div>
                <div class="text-center">
                    <p class="font-black text-[13px] uppercase tracking-tight">RELATÓRIO DE SERVIÇO EXTRAORDINÁRIO</p>
                    <p class="font-bold text-[10px] uppercase">{p.delegacia}</p>
                </div>
                <div class="text-right text-[9px] leading-tight">
                    <p class="font-bold">Ref. Protocolo:</p>
                    <p class="font-mono text-[12px] font-black">{formatarProtocolo(p.protocolo, p.id)}</p>
                    <p class="text-gray-500">{ano}</p>
                </div>
            </div>
        </header>

        <!-- Dados do Plantão -->
        <section class="mb-4">
            <h2 class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black">Dados do Plantão de Referência</h2>
            <div class="border border-t-0 border-black grid grid-cols-2 text-[10px]">
                <div class="p-2 border-r border-black">
                    <span class="font-bold block text-[9px] text-gray-500 uppercase">Período</span>
                    <span>{formatarData(p.data_entrada)} {p.hora_entrada} → {formatarData(p.data_saida)} {p.hora_saida}</span>
                </div>
                <div class="p-2">
                    <span class="font-bold block text-[9px] text-gray-500 uppercase">Responsável</span>
                    <span class="uppercase">{p.nome_responsavel ?? '—'}</span>
                </div>
            </div>
        </section>

        <!-- Equipe em escala extraordinária -->
        <section class="mb-4">
            <h2 class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black">
                Servidores em Escala Extraordinária
                <span class="font-normal text-gray-500 ml-2">(Total: {equipeImpressao.length})</span>
            </h2>

            {#if equipeImpressao.length === 0}
                <div class="border border-t-0 border-black p-4 text-center text-gray-500 text-[10px]">
                    Nenhum servidor selecionado para este relatório.
                </div>
            {:else}
                <table class="w-full border-collapse border border-t-0 border-black text-[10px]">
                    <thead>
                        <tr class="bg-[#f3f3f3]">
                            <th class="border border-black px-2 py-1 text-left font-bold uppercase text-[9px]">Nome</th>
                            <th class="border border-black px-2 py-1 text-left font-bold uppercase text-[9px]">Cargo/Classe</th>
                            <th class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]">Entrada</th>
                            <th class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]">Saída</th>
                            <th class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]">Horas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each equipeImpressao as membro}
                            <tr>
                                <td class="border border-black px-2 py-1.5 uppercase font-medium">{membro.nome_servidor}</td>
                                <td class="border border-black px-2 py-1.5 text-gray-700">{membro.cargo ?? ''} {membro.classe ? `— ${membro.classe}` : ''}</td>
                                <td class="border border-black px-2 py-1.5 text-center font-mono text-[9px]">
                                    {formatarData(membro.data_entrada)} {membro.hora_entrada ?? ''}
                                </td>
                                <td class="border border-black px-2 py-1.5 text-center font-mono text-[9px]">
                                    {formatarData(membro.data_saida)} {membro.hora_saida ?? ''}
                                </td>
                                <td class="border border-black px-2 py-1.5 text-center font-bold">
                                    {calcularHoras(membro.data_entrada, membro.hora_entrada, membro.data_saida, membro.hora_saida)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </section>

        <!-- Justificativa -->
        <section class="mb-4">
            <h2 class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black">Justificativa do Serviço Extraordinário</h2>
            <div class="border border-t-0 border-black p-3 min-h-16 text-[10px]">
                <p class="text-justify">
                    {justificativa}
                </p>
            </div>
        </section>

        <!-- Assinaturas -->
        <div class="mt-12 flex justify-around text-center">
            <div>
                <div class="inline-block border-t border-black px-12 pt-2 text-[10px] uppercase font-bold">
                    {p.nome_responsavel ?? 'Responsável pelo Plantão'}
                </div>
                <p class="text-[9px] text-gray-500 mt-1">Responsável pelo Plantão</p>
            </div>
            <div>
                <div class="inline-block border-t border-black px-12 pt-2 text-[10px] uppercase font-bold">
                    {nomeDiretor.toUpperCase()}
                </div>
                <p class="text-[9px] text-gray-500 mt-1">Diretor / Delegado</p>
            </div>
        </div>

        <footer class="mt-8 pt-2 border-t border-gray-300 text-[8px] text-gray-400 flex justify-between">
            <span>Emitido em: {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
            <span>Ref. Protocolo: {formatarProtocolo(p.protocolo, p.id)} — DPI SUL</span>
        </footer>
    </div>
</div>
{/if}
