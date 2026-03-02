<script lang="ts">
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    let { data }: { data: PageData } = $props();

    type Plantao = {
        id: number; protocolo: string; delegacia: string; data_entrada: string;
        hora_entrada: string; data_saida: string; hora_saida: string; status: string;
        nome_responsavel: string; q_bo: number; q_guias: number; q_apreensoes: number;
        q_presos: number; q_medidas: number; q_outros: number; criado_em: string;
        total_equipe: number; total_procedimentos: number;
        servidores_equipe: string | null; tipos_procedimento: string | null;
    };

    // Paginação
    const pag = $derived(data.paginacao ?? { pagina: 1, totalPaginas: 1, totalRegistros: 0, porPagina: 30 });
    function irParaPagina(p: number) {
        const url = new URL(window.location.href);
        url.searchParams.set('pagina', String(p));
        goto(url.toString(), { invalidateAll: true });
    }

    // ── Filtros ────────────────────────────────────────────────────────────────
    let busca          = $state('');
    let filtroStatus   = $state('');
    let filtroDelegacia = $state('');
    let filtroDataDe   = $state('');
    let filtroDataAte  = $state('');
    let filtroServidor = $state('');
    let filtroTipoProc = $state('');

    const TIPOS_PROC = ['IP-FLAGRANTE', 'IP-PORTARIA', 'TCO', 'AI/BOC'];

    const filtrosAtivos = $derived(
        [busca, filtroStatus, filtroDelegacia, filtroDataDe, filtroDataAte, filtroServidor, filtroTipoProc]
            .filter(Boolean).length
    );

    function limparFiltros() {
        busca = ''; filtroStatus = ''; filtroDelegacia = '';
        filtroDataDe = ''; filtroDataAte = ''; filtroServidor = ''; filtroTipoProc = '';
    }

    // ── Filtragem reativa ──────────────────────────────────────────────────────
    const plantoesVisiveis = $derived(
        (data.plantoes as Plantao[]).filter((p: Plantao) => {
            if (filtroStatus && p.status !== filtroStatus) return false;
            if (filtroDelegacia && p.delegacia !== filtroDelegacia) return false;
            if (filtroDataDe && p.data_entrada < filtroDataDe) return false;
            if (filtroDataAte && p.data_entrada > filtroDataAte) return false;
            if (filtroServidor) {
                const b = filtroServidor.toLowerCase();
                const serv = (p.servidores_equipe ?? '').toLowerCase();
                const resp = (p.nome_responsavel ?? '').toLowerCase();
                if (!serv.includes(b) && !resp.includes(b)) return false;
            }
            if (filtroTipoProc && !(p.tipos_procedimento ?? '').includes(filtroTipoProc)) return false;
            if (busca) {
                const b = busca.toLowerCase();
                if (!p.delegacia?.toLowerCase().includes(b) &&
                    !p.protocolo?.toLowerCase().includes(b) &&
                    !p.nome_responsavel?.toLowerCase().includes(b)) return false;
            }
            return true;
        })
    );

    // Stats calculadas sobre os registros filtrados
    const stats = $derived({
        total:       plantoesVisiveis.length,
        finalizados: plantoesVisiveis.filter((p: Plantao) => p.status === 'finalizado').length,
        retificados: plantoesVisiveis.filter((p: Plantao) => p.status === 'retificado').length,
        rascunhos:   plantoesVisiveis.filter((p: Plantao) => p.status === 'rascunho').length,
        presos:      plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_presos ?? 0), 0),
        apreensoes:  plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_apreensoes ?? 0), 0),
        bo:          plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_bo ?? 0), 0),
        guias:       plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_guias ?? 0), 0),
        medidas:     plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_medidas ?? 0), 0),
        outros:      plantoesVisiveis.reduce((s: number, p: Plantao) => s + (p.q_outros ?? 0), 0),
    });

    // ── Helpers ────────────────────────────────────────────────────────────────
    function formatarData(d: string | null | undefined): string {
        if (!d) return '—';
        const [y, m, dd] = d.split('-');
        return `${dd}/${m}/${y}`;
    }

    function statusLabel(s: string): string {
        return s === 'finalizado' ? 'Finalizado'
             : s === 'retificado' ? 'Retificado'
             : s === 'rascunho'   ? 'Rascunho'
             : s;
    }

    function statusCor(status: string): string {
        switch (status) {
            case 'finalizado': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case 'rascunho':   return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
            case 'retificado': return 'bg-blue-100 text-blue-700 border border-blue-200';
            default:           return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    }
</script>

<svelte:head>
    <title>Dashboard — DPI SUL</title>
</svelte:head>

<div class="min-h-screen bg-slate-100">

    <!-- ── Header ── -->
    <header class="bg-[#0a192f] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
            <h1 class="text-xl font-black text-[#c5a059] uppercase tracking-tight">Dashboard de Plantões</h1>
            <p class="text-slate-400 text-xs mt-0.5">DPI SUL — Painel de Controle</p>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-slate-300 text-sm hidden sm:block font-medium">{data.usuario?.nome}</span>
            <a href="/plantao"
                class="bg-[#c5a059] text-[#0a192f] text-xs font-black px-4 py-2 rounded-lg hover:brightness-110 transition">
                + NOVO PLANTÃO
            </a>
            <a href="/logout"
                class="flex items-center gap-1.5 bg-red-950/60 border border-red-700/50 text-red-400 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 hover:text-white hover:border-red-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sair
            </a>
        </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 md:p-6">

        <!-- ── Cards de estatísticas (sobre registros filtrados) ── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
            {#each [
                { label: 'Exibindo',     value: stats.total,       cor: 'border-l-slate-400',   text: 'text-slate-700' },
                { label: 'Finalizados',  value: stats.finalizados, cor: 'border-l-emerald-500', text: 'text-emerald-700' },
                { label: 'Retificados',  value: stats.retificados, cor: 'border-l-blue-500',    text: 'text-blue-700' },
                { label: 'Rascunhos',    value: stats.rascunhos,   cor: 'border-l-yellow-500',  text: 'text-yellow-700' },
                { label: 'Presos',       value: stats.presos,      cor: 'border-l-red-500',     text: 'text-red-700' },
                { label: 'Apreensões',   value: stats.apreensoes,  cor: 'border-l-orange-500',  text: 'text-orange-700' },
                { label: 'B.O.s',        value: stats.bo,          cor: 'border-l-indigo-500',  text: 'text-indigo-700' }
            ] as card}
                <div class="bg-white rounded-xl border border-slate-200 border-l-4 {card.cor} p-3 shadow-sm">
                    <span class="text-[10px] font-bold uppercase text-slate-400 block leading-tight">{card.label}</span>
                    <p class="text-2xl font-black {card.text} mt-1">{card.value}</p>
                </div>
            {/each}
        </div>

        <!-- ── Produtividade acumulada (registros filtrados) ── -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-xs font-bold uppercase text-slate-500">Produtividade Acumulada
                    {#if filtrosAtivos > 0}
                        <span class="ml-2 text-[#c5a059] font-black">(filtrado)</span>
                    {/if}
                </h2>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                {#each [
                    { label: 'B.O.',      value: stats.bo },
                    { label: 'Guias',     value: stats.guias },
                    { label: 'Apreensões',value: stats.apreensoes },
                    { label: 'Presos',    value: stats.presos },
                    { label: 'Med. Prot.',value: stats.medidas },
                    { label: 'Outros',    value: stats.outros }
                ] as q}
                    <div class="bg-slate-50 rounded-lg p-3">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">{q.label}</p>
                        <p class="text-xl font-black text-slate-700">{q.value ?? 0}</p>
                    </div>
                {/each}
            </div>
        </div>

        <!-- ── Painel de filtros ── -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 p-4">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    Filtros
                    {#if filtrosAtivos > 0}
                        <span class="bg-[#c5a059] text-[#0a192f] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {filtrosAtivos}
                        </span>
                    {/if}
                </h2>
                {#if filtrosAtivos > 0}
                    <button type="button" onclick={limparFiltros}
                        class="text-xs text-slate-400 hover:text-red-500 font-bold transition flex items-center gap-1">
                        ✕ Limpar filtros
                    </button>
                {/if}
            </div>

            <!-- Linha 1: Busca + Tipo de Relatório + Tipo de Procedimento -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div class="sm:col-span-1">
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Busca livre</label>
                    <input bind:value={busca} type="text"
                        placeholder="Protocolo, unidade ou responsável..."
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700" />
                </div>
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Relatório</label>
                    <select bind:value={filtroStatus}
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700 bg-white">
                        <option value="">Todos</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="retificado">Retificado</option>
                        <option value="rascunho">Rascunho</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Procedimento</label>
                    <select bind:value={filtroTipoProc}
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700 bg-white">
                        <option value="">Todos</option>
                        {#each TIPOS_PROC as tipo}
                            <option value={tipo}>{tipo}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Linha 2: Unidade + Servidor + Data De + Data Até -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Unidade Policial</label>
                    <select bind:value={filtroDelegacia}
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700 bg-white">
                        <option value="">Todas</option>
                        {#each data.delegacias as d}
                            <option value={d}>{d}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Servidor / Responsável</label>
                    <input bind:value={filtroServidor} type="text"
                        placeholder="Nome do servidor..."
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700" />
                </div>
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data de entrada — De</label>
                    <input bind:value={filtroDataDe} type="date"
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700" />
                </div>
                <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data de entrada — Até</label>
                    <input bind:value={filtroDataAte} type="date"
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-700" />
                </div>
            </div>
        </div>

        <!-- ── Tabela de plantões ── -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase">
                    {plantoesVisiveis.length} registro(s)
                    {#if filtrosAtivos > 0}
                        <span class="text-slate-400 font-normal">de {data.plantoes.length} total</span>
                    {/if}
                </span>
                {#if filtrosAtivos > 0}
                    <span class="text-[10px] text-[#c5a059] font-bold uppercase tracking-wide">● Filtros ativos</span>
                {/if}
            </div>

            {#if plantoesVisiveis.length === 0}
                <div class="text-center py-16 text-slate-400">
                    <p class="text-4xl mb-3">🔍</p>
                    <p class="font-medium text-sm">Nenhum plantão encontrado para os filtros selecionados.</p>
                    <button type="button" onclick={limparFiltros}
                        class="mt-4 text-sm text-[#c5a059] hover:underline font-bold">
                        Limpar filtros
                    </button>
                </div>
            {:else}
                <!-- Tabela desktop -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left font-bold">Protocolo</th>
                                <th class="px-4 py-3 text-left font-bold">Unidade</th>
                                <th class="px-4 py-3 text-left font-bold">Responsável</th>
                                <th class="px-4 py-3 text-center font-bold">Entrada</th>
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
                                        {#if p.status === 'retificado'}
                                            <span class="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-black">RET</span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 font-medium uppercase text-slate-800 text-xs max-w-[160px] truncate"
                                        title={p.delegacia}>{p.delegacia}</td>
                                    <td class="px-4 py-3 text-slate-600 text-xs uppercase max-w-[140px] truncate"
                                        title={p.nome_responsavel ?? ''}>{p.nome_responsavel ?? '—'}</td>
                                    <td class="px-4 py-3 text-center text-slate-600 text-xs whitespace-nowrap">
                                        {formatarData(p.data_entrada)}
                                        {#if p.hora_entrada}
                                            <span class="text-slate-400 text-[10px]"> {p.hora_entrada}</span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-center font-bold text-slate-700">{p.total_equipe ?? 0}</td>
                                    <td class="px-4 py-3 text-center">
                                        {#if (p.total_procedimentos ?? 0) > 0}
                                            <span class="font-bold text-slate-700">{p.total_procedimentos}</span>
                                            {#if p.tipos_procedimento}
                                                <div class="flex flex-wrap gap-0.5 justify-center mt-0.5">
                                                    {#each p.tipos_procedimento.split(',') as tipo}
                                                        <span class="text-[8px] font-bold px-1 rounded {
                                                            tipo === 'IP-FLAGRANTE' ? 'bg-red-100 text-red-600' :
                                                            tipo === 'IP-PORTARIA'  ? 'bg-orange-100 text-orange-600' :
                                                            tipo === 'TCO'          ? 'bg-blue-100 text-blue-600' :
                                                                                     'bg-purple-100 text-purple-600'
                                                        }">{tipo}</span>
                                                    {/each}
                                                </div>
                                            {/if}
                                        {:else}
                                            <span class="text-slate-300">—</span>
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(p.status)}">
                                            {statusLabel(p.status)}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="flex justify-center gap-1 flex-wrap">
                                            <a href="/plantao/imprimir/{p.id}"
                                                class="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition whitespace-nowrap"
                                                title="Ver/Imprimir">🖨 Imprimir</a>
                                            {#if p.status === 'finalizado' || p.status === 'retificado'}
                                                <a href="/plantao/imprimir/{p.id}"
                                                    class="text-[10px] font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 transition whitespace-nowrap"
                                                    title="Relatório Extra">📋 Extra</a>
                                            {/if}
                                            {#if p.status === 'finalizado' || p.status === 'retificado'}
                                                <a href="/plantao/retificar/{p.id}"
                                                    class="text-[10px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-amber-700 transition whitespace-nowrap"
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
                                        {#if p.status === 'retificado'}
                                            <span class="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-black">RET</span>
                                        {/if}
                                    </p>
                                    <p class="text-xs font-bold uppercase text-slate-800">{p.delegacia}</p>
                                    <p class="text-[10px] text-slate-500 uppercase">{p.nome_responsavel ?? ''}</p>
                                </div>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(p.status)}">
                                    {statusLabel(p.status)}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500 mb-1">
                                {formatarData(p.data_entrada)} {p.hora_entrada ?? ''}
                                {p.data_saida ? ` → ${formatarData(p.data_saida)} ${p.hora_saida ?? ''}` : ''}
                            </p>
                            {#if p.tipos_procedimento}
                                <div class="flex flex-wrap gap-1 mb-2">
                                    {#each p.tipos_procedimento.split(',') as tipo}
                                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded {
                                            tipo === 'IP-FLAGRANTE' ? 'bg-red-100 text-red-600' :
                                            tipo === 'IP-PORTARIA'  ? 'bg-orange-100 text-orange-600' :
                                            tipo === 'TCO'          ? 'bg-blue-100 text-blue-600' :
                                                                     'bg-purple-100 text-purple-600'
                                        }">{tipo}</span>
                                    {/each}
                                </div>
                            {/if}
                            <div class="flex gap-2 mt-2 flex-wrap">
                                <a href="/plantao/imprimir/{p.id}"
                                    class="flex-1 text-center text-xs font-bold py-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition">
                                    🖨 Imprimir
                                </a>
                                {#if p.status === 'finalizado' || p.status === 'retificado'}
                                    <a href="/plantao/imprimir/{p.id}"
                                        class="flex-1 text-center text-xs font-bold py-1.5 bg-blue-50 rounded text-blue-600 hover:bg-blue-100 transition">
                                        📋 Extra
                                    </a>
                                {/if}
                                {#if p.status === 'finalizado' || p.status === 'retificado'}
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

        <!-- Paginação server-side -->
        {#if pag.totalPaginas > 1}
            <div class="mt-4 flex items-center justify-center gap-2">
                <button type="button" onclick={() => irParaPagina(pag.pagina - 1)}
                    disabled={pag.pagina <= 1}
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                    Anterior
                </button>
                {#each Array.from({ length: pag.totalPaginas }, (_, i) => i + 1).filter(p => p === 1 || p === pag.totalPaginas || Math.abs(p - pag.pagina) <= 2) as p}
                    <button type="button" onclick={() => irParaPagina(p)}
                        class="px-3 py-1.5 text-xs font-bold rounded-lg transition {p === pag.pagina ? 'bg-[#c5a059] text-[#0a192f]' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}">
                        {p}
                    </button>
                {/each}
                <button type="button" onclick={() => irParaPagina(pag.pagina + 1)}
                    disabled={pag.pagina >= pag.totalPaginas}
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                    Proxima
                </button>
                <span class="text-xs text-slate-400 ml-2">
                    {pag.totalRegistros} registro(s)
                </span>
            </div>
        {/if}

    </main>
</div>
