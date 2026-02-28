<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();

    let busca = $state('');

    const plantoesVisiveis = $derived(
        data.plantoes.filter(p =>
            p.delegacia?.toLowerCase().includes(busca.toLowerCase()) ||
            p.protocolo?.toLowerCase().includes(busca.toLowerCase()) ||
            p.nome_responsavel?.toLowerCase().includes(busca.toLowerCase())
        )
    );

    function formatarData(d: string | null | undefined): string {
        if (!d) return '—';
        const [y, m, dd] = d.split('-');
        return `${dd}/${m}/${y}`;
    }

    function statusCor(status: string): string {
        switch (status) {
            case 'finalizado': return 'bg-emerald-100 text-emerald-700';
            case 'rascunho': return 'bg-yellow-100 text-yellow-700';
            case 'retificado': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
</script>

<svelte:head>
    <title>Dashboard — DPI SUL</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header class="bg-[#0a192f] text-white px-6 py-4 flex items-center justify-between">
        <div>
            <h1 class="text-xl font-black text-[#c5a059] uppercase tracking-tight">Dashboard de Plantões</h1>
            <p class="text-slate-400 text-xs mt-0.5">DPI SUL — Painel de Controle</p>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-slate-400 text-sm hidden sm:block">{data.usuario?.nome}</span>
            <a href="/plantao" class="bg-[#c5a059] text-[#0a192f] text-xs font-black px-4 py-2 rounded-lg hover:brightness-110 transition">
                + NOVO PLANTÃO
            </a>
            <a href="/logout" class="text-slate-500 text-xs hover:text-red-400 transition">Sair</a>
        </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 md:p-6">

        <!-- Cards de estatísticas gerais -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {#each [
                { label: 'Total Plantões', value: data.estatisticas.total, cor: 'border-l-slate-400' },
                { label: 'Finalizados', value: data.estatisticas.finalizados, cor: 'border-l-emerald-500' },
                { label: 'Rascunhos', value: data.estatisticas.rascunhos, cor: 'border-l-yellow-500' },
                { label: 'Presos', value: data.quantitativos.presos, cor: 'border-l-red-500' },
                { label: 'Apreensões', value: data.quantitativos.apreensoes, cor: 'border-l-orange-500' },
                { label: 'B.O.s', value: data.quantitativos.bo, cor: 'border-l-blue-500' }
            ] as card}
                <div class="bg-white rounded-xl border border-slate-200 border-l-4 {card.cor} p-4 shadow-sm">
                    <span class="text-[10px] font-bold uppercase text-slate-400 block">{card.label}</span>
                    <p class="text-2xl font-black text-slate-800 mt-1">{card.value}</p>
                </div>
            {/each}
        </div>

        <!-- Linha: quantitativos detalhados -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
            <h2 class="text-xs font-bold uppercase text-slate-500 mb-3">Produtividade Acumulada</h2>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                {#each [
                    { label: 'B.O.', value: data.quantitativos.bo },
                    { label: 'Guias', value: data.quantitativos.guias },
                    { label: 'Apreensões', value: data.quantitativos.apreensoes },
                    { label: 'Presos', value: data.quantitativos.presos },
                    { label: 'Med. Prot.', value: data.quantitativos.medidas },
                    { label: 'Outros', value: data.quantitativos.outros }
                ] as q}
                    <div class="bg-slate-50 rounded-lg p-3">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">{q.label}</p>
                        <p class="text-xl font-black text-slate-700">{q.value ?? 0}</p>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Busca e tabela de plantões -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center gap-3">
                <input bind:value={busca} type="text" placeholder="Buscar por delegacia, protocolo ou responsável..."
                    class="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700" />
                <span class="text-xs text-slate-400 whitespace-nowrap">{plantoesVisiveis.length} registro(s)</span>
            </div>

            {#if plantoesVisiveis.length === 0}
                <div class="text-center py-16 text-slate-400">
                    <p class="text-4xl mb-3">📋</p>
                    <p class="font-medium">Nenhum plantão encontrado.</p>
                    <a href="/plantao" class="mt-4 inline-block text-sm text-[#c5a059] hover:underline">Criar primeiro plantão</a>
                </div>
            {:else}
                <!-- Tabela desktop -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th class="px-4 py-3 text-left font-bold">Protocolo</th>
                                <th class="px-4 py-3 text-left font-bold">Unidade</th>
                                <th class="px-4 py-3 text-left font-bold">Responsável</th>
                                <th class="px-4 py-3 text-center font-bold">Período</th>
                                <th class="px-4 py-3 text-center font-bold">Equipe</th>
                                <th class="px-4 py-3 text-center font-bold">Procs.</th>
                                <th class="px-4 py-3 text-center font-bold">Status</th>
                                <th class="px-4 py-3 text-center font-bold">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each plantoesVisiveis as p}
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-3 font-mono font-bold text-slate-700 text-xs">
                                        {p.protocolo ?? `FT-${String(p.id).padStart(6,'0')}`}
                                    </td>
                                    <td class="px-4 py-3 font-medium uppercase text-slate-800 text-xs">{p.delegacia}</td>
                                    <td class="px-4 py-3 text-slate-600 text-xs uppercase">{p.nome_responsavel ?? '—'}</td>
                                    <td class="px-4 py-3 text-center text-slate-600 text-xs">
                                        {formatarData(p.data_entrada)}
                                        {#if p.data_saida && p.data_saida !== p.data_entrada}
                                            <br/><span class="text-slate-400">→ {formatarData(p.data_saida)}</span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-center font-bold text-slate-700">{p.total_equipe ?? 0}</td>
                                    <td class="px-4 py-3 text-center font-bold text-slate-700">{p.total_procedimentos ?? 0}</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(p.status)}">
                                            {p.status}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="flex justify-center gap-1">
                                            <a href="/plantao/imprimir/{p.id}"
                                                class="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition"
                                                title="Ver/Imprimir">🖨 Imprimir</a>
                                            {#if p.status === 'finalizado' || p.status === 'retificado'}
                                                <a href="/plantao/extra/{p.id}"
                                                    class="text-[10px] font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 transition"
                                                    title="Relatório Extra">📋 Extra</a>
                                            {/if}
                                            {#if p.status === 'finalizado'}
                                                <a href="/plantao/retificar/{p.id}"
                                                    class="text-[10px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-amber-700 transition"
                                                    title="Retificar Relatório">✏️ Retificar</a>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Cards mobile -->
                <div class="md:hidden divide-y divide-slate-100">
                    {#each plantoesVisiveis as p}
                        <div class="p-4">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <p class="font-mono font-black text-slate-700 text-sm">
                                        {p.protocolo ?? `FT-${String(p.id).padStart(6,'0')}`}
                                    </p>
                                    <p class="text-xs font-bold uppercase text-slate-800">{p.delegacia}</p>
                                </div>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(p.status)}">
                                    {p.status}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500 mb-2">
                                {formatarData(p.data_entrada)} {p.hora_entrada ?? ''}
                                {p.data_saida ? ` → ${formatarData(p.data_saida)} ${p.hora_saida ?? ''}` : ''}
                            </p>
                            <div class="flex gap-2 mt-3 flex-wrap">
                                <a href="/plantao/imprimir/{p.id}"
                                    class="flex-1 text-center text-xs font-bold py-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition">
                                    🖨 Imprimir
                                </a>
                                {#if p.status === 'finalizado' || p.status === 'retificado'}
                                    <a href="/plantao/extra/{p.id}"
                                        class="flex-1 text-center text-xs font-bold py-1.5 bg-blue-50 rounded text-blue-600 hover:bg-blue-100 transition">
                                        📋 Extra
                                    </a>
                                {/if}
                                {#if p.status === 'finalizado'}
                                    <a href="/plantao/retificar/{p.id}"
                                        class="flex-1 text-center text-xs font-bold py-1.5 bg-amber-50 rounded text-amber-700 hover:bg-amber-100 transition">
                                        ✏️ Retificar
                                    </a>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>
</div>
