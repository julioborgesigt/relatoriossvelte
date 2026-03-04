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
    let filtroServidor = $state("");
    let filtroTipoProc = $state("");

    const filtrosAtivos = $derived(
        [
            busca,
            filtroStatus,
            filtroDelegacia,
            filtroDataDe,
            filtroDataAte,
            filtroServidor,
            filtroTipoProc,
        ].filter(Boolean).length,
    );

    function limparFiltros() {
        busca = "";
        filtroStatus = "";
        filtroDelegacia = "";
        filtroDataDe = "";
        filtroDataAte = "";
        filtroServidor = "";
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
            if (filtroServidor) {
                const b = filtroServidor.toLowerCase();
                const serv = (p.servidores_equipe ?? "").toLowerCase();
                const resp = (p.nome_responsavel ?? "").toLowerCase();
                if (!serv.includes(b) && !resp.includes(b)) return false;
            }
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

    // Stats calculadas sobre os registros filtrados
    const stats = $derived({
        total: plantoesVisiveis.length,
        finalizados: plantoesVisiveis.filter(
            (p: PlantaoListItem) => p.status === "finalizado",
        ).length,
        retificados: plantoesVisiveis.filter(
            (p: PlantaoListItem) => p.status === "retificado",
        ).length,
        rascunhos: plantoesVisiveis.filter(
            (p: PlantaoListItem) => p.status === "rascunho",
        ).length,
        presos: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_presos ?? 0),
            0,
        ),
        apreensoes: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_apreensoes ?? 0),
            0,
        ),
        bo: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_bo ?? 0),
            0,
        ),
        guias: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_guias ?? 0),
            0,
        ),
        medidas: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_medidas ?? 0),
            0,
        ),
        outros: plantoesVisiveis.reduce(
            (s: number, p: PlantaoListItem) => s + (p.q_outros ?? 0),
            0,
        ),
        procedimentos: TIPOS_PROC.reduce(
            (acc, tipo) => {
                acc[tipo] = plantoesVisiveis.reduce(
                    (s: number, p: PlantaoListItem) => {
                        if (!p.tipos_procedimento) return s;
                        return (
                            s +
                            p.tipos_procedimento
                                .split(",")
                                .filter((t) => t === tipo).length
                        );
                    },
                    0,
                );
                return acc;
            },
            {} as Record<string, number>,
        ),
    });

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
    <title>Dashboard — DPI SUL</title>
</svelte:head>

<div class="pb-10">
    <main class="max-w-7xl mx-auto p-4 md:p-6">
        <!-- ── Topo do Painel ── -->
        <div
            class="flex items-center justify-between mb-6 border-b border-slate-800 pb-4"
        >
            <div>
                <h1
                    class="text-2xl font-black text-white uppercase tracking-tight"
                >
                    Dashboard de Plantões
                </h1>
                <p
                    class="text-slate-400 text-xs mt-0.5 uppercase tracking-widest"
                >
                    Painel de Controle — DPI SUL
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
        <!-- ── Cards de estatísticas (sobre registros filtrados) ── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-5">
            {#each [{ label: "Exibindo", value: stats.total, cor: "border-l-slate-400", text: "text-slate-200" }, { label: "Finalizados", value: stats.finalizados, cor: "border-l-emerald-500", text: "text-emerald-400" }, { label: "Retificados", value: stats.retificados, cor: "border-l-blue-500", text: "text-blue-400" }, { label: "Rascunhos", value: stats.rascunhos, cor: "border-l-yellow-500", text: "text-yellow-400" }] as card}
                <div
                    class="bg-[#112240] rounded-xl border border-slate-700 border-l-4 {card.cor} p-3 shadow-sm"
                >
                    <span
                        class="text-[10px] font-bold uppercase text-slate-400 block leading-tight"
                        >{card.label}</span
                    >
                    <p class="text-2xl font-black {card.text} mt-1">
                        {card.value}
                    </p>
                </div>
            {/each}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <!-- ── Produtividade acumulada (registros filtrados) ── -->
            <!-- ── Produtividade acumulada (registros filtrados) ── -->
            <div
                class="bg-[#112240] rounded-xl border border-slate-700 p-4 shadow-sm"
            >
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-xs font-bold uppercase text-slate-400">
                        Produtividade Acumulada
                        {#if filtrosAtivos > 0}
                            <span class="ml-2 text-[#c5a059] font-black"
                                >(filtrado)</span
                            >
                        {/if}
                    </h2>
                </div>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                    {#each [{ label: "B.O.", value: stats.bo }, { label: "Guias", value: stats.guias }, { label: "Apreensões", value: stats.apreensoes }, { label: "Presos", value: stats.presos }, { label: "Med. Prot.", value: stats.medidas }, { label: "Outros", value: stats.outros }] as q (q.label)}
                        <div
                            class="bg-[#061325] rounded-lg p-3 border border-slate-800"
                        >
                            <p
                                class="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1"
                            >
                                {q.label}
                            </p>
                            <p class="text-xl font-black text-slate-200">
                                {q.value ?? 0}
                            </p>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- ── Procedimentos Qualitativos (Filtrado/Global) ── -->
            <div
                class="bg-[#112240] rounded-xl border border-slate-700 p-4 shadow-sm"
            >
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-xs font-bold uppercase text-slate-400">
                        Procedimentos Registrados
                        {#if filtrosAtivos > 0}
                            <span class="ml-2 text-[#c5a059] font-black"
                                >(filtrado)</span
                            >
                        {/if}
                    </h2>
                    {#if filtrosAtivos === 0}
                        <span
                            class="text-[10px] font-bold bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded uppercase border border-[#c5a059]/30"
                            >Global</span
                        >
                    {/if}
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {#each TIPOS_PROC as tipo}
                        <div
                            class="bg-[#061325] rounded-lg p-3 border border-slate-800"
                        >
                            <p
                                class="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1"
                            >
                                {tipo}
                            </p>
                            <p class="text-xl font-black text-slate-200">
                                {stats.procedimentos[tipo]}
                            </p>
                        </div>
                    {/each}
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

            <!-- Linha 2: Unidade + Servidor + Data De + Data Até -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        for="filtro-servidor"
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        >Servidor / Responsável</label
                    >
                    <input
                        id="filtro-servidor"
                        bind:value={filtroServidor}
                        type="text"
                        placeholder="Nome do servidor..."
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] text-slate-200 placeholder:text-slate-500"
                    />
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
                    {plantoesVisiveis.length} registro(s)
                    {#if filtrosAtivos > 0}
                        <span class="text-slate-500 font-normal"
                            >de {data.plantoes.length} total</span
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
                    Total: {data.plantoes.length} registros
                </span>
            </div>
        {/if}
    </main>
</div>
