<script lang="ts">
    import type { PageData } from "./$types";
    import type { PlantaoListItem } from "$lib/types";
    import { TIPOS_PROC, COR_TIPO_BADGE } from "$lib/constants";
    import {
        formatarData,
        statusLabel,
        statusCor,
        formatarProtocolo,
    } from "$lib/utils";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    let { data }: { data: PageData } = $props();

    // Paginação
    const pag = $derived(
        data.paginacao ?? {
            pagina: 1,
            totalPaginas: 1,
            totalRegistros: 0,
            porPagina: 30,
        },
    );
    function irParaPagina(p: number) {
        const url = new URL(window.location.href);
        url.searchParams.set("pagina", String(p));
        goto(url.toString(), { invalidateAll: true });
    }

    // ── Filtros ────────────────────────────────────────────────────────────────
    let busca = $state("");
    let filtroStatus = $state("");
    let filtroDelegacia = $state("");
    let filtroDataDe = $state("");
    let filtroDataAte = $state("");
    let filtroTipoProc = $state("");

    const filtrosAtivos = $derived(
        [
            busca,
            filtroStatus,
            filtroDelegacia,
            filtroDataDe,
            filtroDataAte,
            filtroTipoProc,
        ].filter(Boolean).length,
    );

    function limparFiltros() {
        busca = "";
        filtroStatus = "";
        filtroDelegacia = "";
        filtroDataDe = "";
        filtroDataAte = "";
        filtroTipoProc = "";
    }

    // ── Filtragem reativa ──────────────────────────────────────────────────────
    const plantoesVisiveis = $derived(
        (data.plantoes as PlantaoListItem[]).filter((p: PlantaoListItem) => {
            if (filtroStatus && p.status !== filtroStatus) return false;
            if (filtroDelegacia && p.delegacia !== filtroDelegacia)
                return false;
            if (filtroDataDe && p.data_entrada < filtroDataDe) return false;
            if (filtroDataAte && p.data_entrada > filtroDataAte) return false;
            if (
                filtroTipoProc &&
                !(p.tipos_procedimento ?? "").includes(filtroTipoProc)
            )
                return false;
            if (busca) {
                const b = busca.toLowerCase();
                if (
                    !p.delegacia?.toLowerCase().includes(b) &&
                    !p.protocolo?.toLowerCase().includes(b) &&
                    !p.nome_responsavel?.toLowerCase().includes(b)
                )
                    return false;
            }
            return true;
        }),
    );

    /** Retorna classe CSS do badge de tipo de procedimento */
    function corTipoBadge(tipo: string): string {
        return COR_TIPO_BADGE[tipo] ?? "bg-purple-100 text-purple-600";
    }

    /** Verifica se o plantão pode ser retificado/ter extra */
    function ehFinalizadoOuRetificado(status: string): boolean {
        return status === "finalizado" || status === "retificado";
    }
</script>

{#snippet tipoBadges(tipos: string | null, size: string)}
    {#if tipos}
        <div
            class="flex flex-wrap gap-0.5 {size === 'sm'
                ? 'justify-center mt-0.5'
                : 'gap-1 mb-2'}"
        >
            {#each Array.from(new Set(tipos.split(","))) as tipo}
                <span
                    class="{size === 'sm'
                        ? 'text-[8px]'
                        : 'text-[9px]'} font-bold px-1{size === 'lg'
                        ? '.5 py-0.5'
                        : ''} rounded {corTipoBadge(tipo)}">{tipo}</span
                >
            {/each}
        </div>
    {/if}
{/snippet}

{#snippet acoes(p: PlantaoListItem, layout: string)}
    {#if layout === "desktop"}
        <div class="flex justify-center gap-1 flex-wrap">
            <a
                href="/plantao/imprimir/{p.id}"
                class="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition whitespace-nowrap"
                title="Ver/Imprimir">🖨 Imprimir</a
            >
            {#if ehFinalizadoOuRetificado(p.status)}
                <a
                    href="/plantao/imprimir/{p.id}"
                    class="text-[10px] font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 transition whitespace-nowrap"
                    title="Relatório Extra">📋 Extra</a
                >
                <a
                    href="/plantao/retificar/{p.id}"
                    class="text-[10px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-amber-700 transition whitespace-nowrap"
                    title="Retificar Relatório">✏️ Retificar</a
                >
            {/if}
        </div>
    {:else}
        <div class="flex gap-2 mt-2 flex-wrap">
            <a
                href="/plantao/imprimir/{p.id}"
                class="flex-1 text-center text-xs font-bold py-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition"
            >
                🖨 Imprimir
            </a>
            {#if ehFinalizadoOuRetificado(p.status)}
                <a
                    href="/plantao/imprimir/{p.id}"
                    class="flex-1 text-center text-xs font-bold py-1.5 bg-blue-50 rounded text-blue-600 hover:bg-blue-100 transition"
                >
                    📋 Extra
                </a>
                <a
                    href="/plantao/retificar/{p.id}"
                    class="flex-1 text-center text-xs font-bold py-1.5 bg-amber-50 rounded text-amber-700 hover:bg-amber-100 transition"
                >
                    ✏️ Retificar
                </a>
            {/if}
        </div>
    {/if}
{/snippet}

<svelte:head>
    <title>Meus Relatórios — DPI SUL</title>
</svelte:head>

<div class="pb-10">
    <main class="max-w-7xl mx-auto p-4 md:p-6">
        <!-- ── Topo do Painel ── -->
        <div
            class="flex items-center justify-between mb-6 border-b border-slate-800 pb-4"
        >
            <div>
                <h1
                    class="text-xl md:text-2xl font-black text-white uppercase tracking-tight"
                >
                    Meus Relatórios
                </h1>
                <p
                    class="text-slate-400 text-xs mt-0.5 uppercase tracking-widest"
                >
                    Histórico do Servidor: {$page.data.usuario?.nome}
                </p>
            </div>
            <a
                href="/plantao"
                data-sveltekit-reload
                class="bg-[#c5a059] text-[#0a192f] text-xs font-black px-4 py-2 rounded-lg hover:brightness-110 flex items-center justify-center transition shadow-sm"
            >
                + <span class="hidden sm:inline ml-1">NOVO PLANTÃO</span>
            </a>
        </div>

        <!-- ── Card Informativo de Horas Extras ── -->
        <div
            class="bg-gradient-to-r from-[#112240] to-[#0A192F] rounded-xl border border-slate-700 shadow-sm mb-5 p-5 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden"
        >
            <div
                class="absolute right-0 top-0 w-32 h-32 bg-[#c5a059] opacity-5 rounded-full blur-3xl -mr-10 -mt-10"
            ></div>

            <div class="relative z-10 w-full">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-sm font-bold uppercase text-slate-300">
                            Horas Extras Validadas
                        </h2>
                        <p
                            class="text-[10px] text-slate-500 mt-1 uppercase max-w-sm"
                        >
                            Total de horas computadas em plantões
                            extraordinários que já encontram-se no status
                            "finalizado" ou "retificado".
                        </p>
                    </div>
                    <div class="text-right">
                        <span
                            class="text-4xl font-black text-[#c5a059] drop-shadow-md"
                            >{data.horasExtrasTotaisTexto}</span
                        >
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Painel de filtros ── -->
        <div
            class="bg-[#112240] rounded-xl border border-slate-700 shadow-sm mb-4 p-4"
        >
            <div class="flex items-center justify-between mb-3">
                <h2
                    class="text-xs font-bold uppercase text-[#c5a059] flex items-center gap-2"
                >
                    Filtros
                    {#if filtrosAtivos > 0}
                        <span
                            class="bg-[#c5a059] text-[#0a192f] text-[10px] font-black px-1.5 py-0.5 rounded-full"
                        >
                            {filtrosAtivos}
                        </span>
                    {/if}
                </h2>
                {#if filtrosAtivos > 0}
                    <button
                        type="button"
                        onclick={limparFiltros}
                        class="text-xs text-slate-400 hover:text-red-400 font-bold transition flex items-center gap-1"
                    >
                        ✕ Limpar filtros
                    </button>
                {/if}
            </div>

            <!-- Linha 1: Busca + Tipo de Relatório + Tipo de Procedimento -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div class="sm:col-span-1">
                    <label
                        for="busca-livre"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Busca livre</label
                    >
                    <input
                        id="busca-livre"
                        bind:value={busca}
                        type="text"
                        placeholder="Protocolo, unidade ou responsável..."
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200 placeholder:text-slate-500"
                    />
                </div>
                <div>
                    <label
                        for="filtro-status"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Tipo de Relatório</label
                    >
                    <select
                        id="filtro-status"
                        bind:value={filtroStatus}
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200"
                    >
                        <option value="">Todos</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="retificado">Retificado</option>
                        <option value="rascunho">Rascunho</option>
                    </select>
                </div>
                <div>
                    <label
                        for="filtro-tipo-proc"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Tipo de Procedimento</label
                    >
                    <select
                        id="filtro-tipo-proc"
                        bind:value={filtroTipoProc}
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200"
                    >
                        <option value="">Todos</option>
                        {#each TIPOS_PROC as tipo}
                            <option value={tipo}>{tipo}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Linha 2: Unidade + Data De + Data Até -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label
                        for="filtro-delegacia"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Unidade Policial</label
                    >
                    <select
                        id="filtro-delegacia"
                        bind:value={filtroDelegacia}
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200"
                    >
                        <option value="">Todas</option>
                        {#each data.delegacias as d}
                            <option value={d}>{d}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="filtro-data-de"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Data de entrada — De</label
                    >
                    <input
                        id="filtro-data-de"
                        bind:value={filtroDataDe}
                        type="date"
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200"
                    />
                </div>
                <div>
                    <label
                        for="filtro-data-ate"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Data de entrada — Até</label
                    >
                    <input
                        id="filtro-data-ate"
                        bind:value={filtroDataAte}
                        type="date"
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200"
                    />
                </div>
            </div>
        </div>

        <!-- ── Tabela de plantões ── -->
        <div
            class="bg-[#112240] rounded-xl border border-slate-700 shadow-sm overflow-hidden"
        >
            <div
                class="px-4 py-3 border-b border-slate-700 flex items-center justify-between"
            >
                <span class="text-xs font-bold text-slate-400 uppercase">
                    {plantoesVisiveis.length} registro(s) listados
                    {#if filtrosAtivos > 0}
                        <span class="text-slate-500 font-normal"
                            >de {data.plantoes.length} total nesta página</span
                        >
                    {/if}
                </span>
                {#if filtrosAtivos > 0}
                    <span
                        class="text-[10px] text-[#c5a059] font-bold uppercase tracking-wide"
                        >● Filtros ativos</span
                    >
                {/if}
            </div>

            {#if plantoesVisiveis.length === 0}
                <div class="text-center py-16 text-slate-400">
                    <p class="text-4xl mb-3">🔍</p>
                    <p class="font-medium text-sm text-slate-300">
                        Nenhum plantão encontrado para os filtros selecionados.
                    </p>
                    <button
                        type="button"
                        onclick={limparFiltros}
                        class="mt-4 text-sm text-[#c5a059] hover:underline font-bold"
                    >
                        Limpar filtros
                    </button>
                </div>
            {:else}
                <!-- Tabela desktop -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead
                            class="bg-[#061325] text-xs uppercase text-slate-400 border-b border-slate-700"
                        >
                            <tr>
                                <th class="px-4 py-3 text-left font-bold"
                                    >Protocolo</th
                                >
                                <th class="px-4 py-3 text-left font-bold"
                                    >Unidade</th
                                >
                                <th class="px-4 py-3 text-left font-bold"
                                    >Responsável</th
                                >
                                <th class="px-4 py-3 text-center font-bold"
                                    >Entrada</th
                                >
                                <th class="px-4 py-3 text-center font-bold"
                                    >Equipe</th
                                >
                                <th class="px-4 py-3 text-center font-bold"
                                    >Procs.</th
                                >
                                <th class="px-4 py-3 text-center font-bold"
                                    >Status</th
                                >
                                <th class="px-4 py-3 text-center font-bold"
                                    >Ações</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            {#each plantoesVisiveis as p}
                                <tr
                                    class="hover:bg-slate-800/50 transition-colors"
                                >
                                    <td
                                        class="px-4 py-3 font-mono font-bold text-slate-200 text-xs"
                                    >
                                        {formatarProtocolo(p.protocolo, p.id)}
                                        {#if p.status === "retificado"}
                                            <span
                                                class="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-black"
                                                >RET</span
                                            >
                                        {/if}
                                    </td>
                                    <td
                                        class="px-4 py-3 font-medium uppercase text-slate-300 text-xs max-w-[160px] truncate"
                                        title={p.delegacia}>{p.delegacia}</td
                                    >
                                    <td
                                        class="px-4 py-3 text-slate-400 text-xs uppercase max-w-[140px] truncate"
                                        title={p.nome_responsavel ?? ""}
                                        >{p.nome_responsavel ?? "—"}</td
                                    >
                                    <td
                                        class="px-4 py-3 text-center text-slate-400 text-xs whitespace-nowrap"
                                    >
                                        {formatarData(p.data_entrada)}
                                        {#if p.hora_entrada}
                                            <span
                                                class="text-slate-500 text-[10px]"
                                            >
                                                {p.hora_entrada}</span
                                            >
                                        {/if}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-center font-bold text-slate-200"
                                        >{p.total_equipe ?? 0}</td
                                    >
                                    <td class="px-4 py-3 text-center">
                                        {#if (p.total_procedimentos ?? 0) > 0}
                                            <span
                                                class="font-bold text-slate-200"
                                                >{p.total_procedimentos}</span
                                            >
                                            {@render tipoBadges(
                                                p.tipos_procedimento,
                                                "sm",
                                            )}
                                        {:else}
                                            <span class="text-slate-600">—</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span
                                            class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(
                                                p.status,
                                            )}"
                                        >
                                            {statusLabel(p.status)}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        {@render acoes(p, "desktop")}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Cards mobile -->
                <div class="md:hidden divide-y divide-slate-700">
                    {#each plantoesVisiveis as p}
                        <div class="p-4">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <p
                                        class="font-mono font-black text-slate-200 text-sm"
                                    >
                                        {formatarProtocolo(p.protocolo, p.id)}
                                        {#if p.status === "retificado"}
                                            <span
                                                class="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-black"
                                                >RET</span
                                            >
                                        {/if}
                                    </p>
                                    <p
                                        class="text-xs font-bold uppercase text-slate-300"
                                    >
                                        {p.delegacia}
                                    </p>
                                    <p
                                        class="text-[10px] text-slate-400 uppercase"
                                    >
                                        {p.nome_responsavel ?? ""}
                                    </p>
                                </div>
                                <span
                                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusCor(
                                        p.status,
                                    )}"
                                >
                                    {statusLabel(p.status)}
                                </span>
                            </div>
                            <p class="text-xs text-slate-400 mb-1">
                                {formatarData(p.data_entrada)}
                                {p.hora_entrada ?? ""}
                                {p.data_saida
                                    ? ` → ${formatarData(p.data_saida)} ${p.hora_saida ?? ""}`
                                    : ""}
                            </p>
                            {@render tipoBadges(p.tipos_procedimento, "lg")}
                            {@render acoes(p, "mobile")}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Paginação server-side -->
        {#if pag.totalPaginas > 1}
            <div class="mt-4 flex items-center justify-center gap-2">
                <button
                    type="button"
                    onclick={() => irParaPagina(pag.pagina - 1)}
                    disabled={pag.pagina <= 1}
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                {#each Array.from({ length: pag.totalPaginas }, (_, i) => i + 1).filter((p) => p === 1 || p === pag.totalPaginas || Math.abs(p - pag.pagina) <= 2) as p}
                    <button
                        type="button"
                        onclick={() => irParaPagina(p)}
                        class="px-3 py-1.5 text-xs font-bold rounded-lg transition {p ===
                        pag.pagina
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white'}"
                    >
                        {p}
                    </button>
                {/each}
                <button
                    type="button"
                    onclick={() => irParaPagina(pag.pagina + 1)}
                    disabled={pag.pagina >= pag.totalPaginas}
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Próxima
                </button>
                <span class="text-xs text-slate-500 ml-2">
                    Total: {data.paginacao?.totalRegistros ?? 0} registros
                </span>
            </div>
        {/if}
    </main>
</div>
