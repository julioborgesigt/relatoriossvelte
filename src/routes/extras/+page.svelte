<script lang="ts">
    import { page } from "$app/stores";

    let { data } = $props();
    let extrasBase = $derived(data.extras ?? []);

    // ─────────────────────────────────────────────────────────────
    // Helper: Formata data e hora
    // ─────────────────────────────────────────────────────────────
    function getDuracaoHoras(
        dEntrada: string,
        hEntrada: string,
        dSaida: string,
        hSaida: string,
    ): number {
        if (!dEntrada || !hEntrada || !dSaida || !hSaida) return 0;

        const parseDate = (dStr: string) => {
            if (dStr.includes("-")) {
                const [y, m, d] = dStr.split("-").map(Number);
                return { y, m, d };
            }
            const [d, m, y] = dStr.split("/").map(Number);
            return { y, m, d };
        };

        const de = parseDate(dEntrada);
        const ds = parseDate(dSaida);

        const [hrE, minE] = hEntrada.split(":").map(Number);
        const [hrS, minS] = hSaida.split(":").map(Number);

        const dtE = new Date(de.y, de.m - 1, de.d, hrE, minE);
        const dtS = new Date(ds.y, ds.m - 1, ds.d, hrS, minS);

        const diffMs = dtS.getTime() - dtE.getTime();
        return diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
    }

    function formatarDataCurta(dStr: string) {
        if (!dStr || typeof dStr !== "string") return "--/--";
        if (dStr.includes("-")) {
            const [, m, d] = dStr.split("-");
            return `${d.padStart(2, "0")}/${m.padStart(2, "0")}`;
        }
        if (dStr.includes("/")) {
            const [d, m] = dStr.split("/");
            return `${d.padStart(2, "0")}/${m.padStart(2, "0")}`;
        }
        return "--/--";
    }

    // Helper: Encontrar o ciclo de uma data (21 de Mês X até 20 de Mês Y)
    // Retorna a string do ciclo, ex: "21/01/2026 a 20/02/2026" e um identificador pra ordenação
    function obterCicloInfo(dEntrada: string) {
        if (!dEntrada || typeof dEntrada !== "string") {
            return { label: "Desconhecido", sortValue: 0 };
        }

        let dd, mm, yyyy;
        if (dEntrada.includes("-")) {
            [yyyy, mm, dd] = dEntrada.split("-").map(Number);
        } else if (dEntrada.includes("/")) {
            [dd, mm, yyyy] = dEntrada.split("/").map(Number);
        } else {
            return { label: "Desconhecido", sortValue: 0 };
        }

        if (isNaN(dd) || isNaN(mm) || isNaN(yyyy))
            return { label: "Desconhecido", sortValue: 0 };

        let mesInicio = mm;
        let anoInicio = yyyy;

        if (dd < 21) {
            mesInicio -= 1;
            if (mesInicio === 0) {
                mesInicio = 12;
                anoInicio -= 1;
            }
        }

        let mesFim = mesInicio + 1;
        let anoFim = anoInicio;
        if (mesFim === 13) {
            mesFim = 1;
            anoFim += 1;
        }

        const fmt = (n: number) => n.toString().padStart(2, "0");
        const label = `21/${fmt(mesInicio)}/${anoInicio} a 20/${fmt(mesFim)}/${anoFim}`;
        const sortValue = anoInicio * 100 + mesInicio; // Ex: 202601

        return { label, sortValue };
    }

    // ─────────────────────────────────────────────────────────────
    // Processamento da Lista Extra
    // ─────────────────────────────────────────────────────────────
    let extrasProcessados = $derived(
        extrasBase.map((e: any) => {
            const horas = getDuracaoHoras(
                e.data_entrada,
                e.hora_entrada,
                e.data_saida,
                e.hora_saida,
            );
            const infoCiclo = obterCicloInfo(e.data_entrada);
            return {
                ...e,
                horas,
                ciclo: infoCiclo.label,
                sortCiclo: infoCiclo.sortValue,
                data_entrada_formatada: formatarDataCurta(e.data_entrada),
                data_saida_formatada: formatarDataCurta(e.data_saida),
            };
        }),
    );

    // Lista única de ciclos ordenados do mais recente pro mais antigo
    let ciclosDisponiveis = $derived(
        Array.from(new Set(extrasProcessados.map((e) => e.ciclo)))
            .map((label) => {
                const amostra = extrasProcessados.find(
                    (e) => e.ciclo === label,
                );
                return { label, sortValue: amostra?.sortCiclo ?? 0 };
            })
            .sort((a, b) => b.sortValue - a.sortValue)
            .map((c) => c.label),
    );

    // O ciclo atual (inicia com o mais recente se houver, ou um cálculo do dia de hoje)
    let cicloSelecionado = $state("");

    // Inicializa o ciclo atual apenas se a lista tiver pronta e o estado estiver vazio
    $effect(() => {
        if (!cicloSelecionado && ciclosDisponiveis.length > 0) {
            cicloSelecionado = ciclosDisponiveis[0];
        } else if (!cicloSelecionado && ciclosDisponiveis.length === 0) {
            const hoje = new Date();
            const fakeData = `${hoje.getDate()}/${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
            cicloSelecionado = obterCicloInfo(fakeData).label;
        }
    });

    // Filtros de UI
    let buscaServidor = $state("");

    // Filtragem Final
    let extrasFiltrados = $derived(
        extrasProcessados.filter((e: any) => {
            if (e.ciclo !== cicloSelecionado) return false;

            if (buscaServidor.trim() !== "") {
                const b = buscaServidor.toLowerCase();
                const nm = (e.nome || "").toLowerCase();
                const mat = (e.matricula || "").toLowerCase();
                if (!nm.includes(b) && !mat.includes(b)) return false;
            }
            return true;
        }),
    );

    // Contadores Totais do Ciclo em si (sem o filtro de texto do servidor, apenas ciclo puro)
    let totalHorasCicloGeral = $derived(
        extrasProcessados
            .filter((e: any) => e.ciclo === cicloSelecionado && e.horas > 0)
            .reduce((acc: number, curr: any) => acc + curr.horas, 0),
    );

    // Contadores baseados nos filtros ativos
    let totalHorasFiltradas = $derived(
        extrasFiltrados
            .filter((e: any) => e.horas > 0)
            .reduce((acc: number, curr: any) => acc + curr.horas, 0),
    );

    // Paginação
    let paginaAtual = $state(1);
    const itensPorPagina = 10;

    $effect(() => {
        // Reset pagina quando filtro muda
        void buscaServidor;
        void cicloSelecionado;
        paginaAtual = 1;
    });

    let totalPaginas = $derived(
        Math.max(1, Math.ceil(extrasFiltrados.length / itensPorPagina)),
    );
    let itensPaginados = $derived(
        extrasFiltrados.slice(
            (paginaAtual - 1) * itensPorPagina,
            paginaAtual * itensPorPagina,
        ),
    );
</script>

<div class="pb-10 min-h-screen pt-4 px-4 md:px-0 bg-[#0a192f]">
    <main class="max-w-7xl mx-auto md:p-6">
        <h2
            class="text-2xl font-black text-white mb-2 uppercase tracking-tight"
        >
            Controle de Horas Extras
        </h2>
        <p
            class="text-slate-400 text-sm mb-6 uppercase tracking-wider font-bold"
        >
            Monitoramento Analítico de Plantões Extraordinários
        </p>

        <!-- Filtros e Status -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Filtros -->
            <div
                class="lg:col-span-2 bg-[#112240] rounded-xl border border-slate-700 p-5 shadow-sm"
            >
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="flex-1">
                        <label
                            for="ciclo-select"
                            class="block text-[10px] uppercase font-bold text-slate-400 mb-1.5"
                        >
                            Ciclo Vigente
                        </label>
                        <select
                            id="ciclo-select"
                            bind:value={cicloSelecionado}
                            class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                        >
                            {#if ciclosDisponiveis.length === 0}
                                <option value={cicloSelecionado}
                                    >{cicloSelecionado}</option
                                >
                            {/if}
                            {#each ciclosDisponiveis as ciclo}
                                <option value={ciclo}>{ciclo}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="flex-1">
                        <label
                            for="busca-servidor"
                            class="block text-[10px] uppercase font-bold text-slate-400 mb-1.5"
                        >
                            Buscar Servidor (Nome/Matrícula)
                        </label>
                        <div class="relative">
                            <span
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
                                >🔍</span
                            >
                            <input
                                id="busca-servidor"
                                type="text"
                                bind:value={buscaServidor}
                                placeholder="Digite o nome..."
                                class="w-full bg-[#061325] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumo Totais -->
            <div
                class="bg-[#c5a059]/10 rounded-xl border border-[#c5a059]/30 p-5 shadow-sm flex flex-col justify-center relative overflow-hidden"
            >
                <div
                    class="absolute -right-4 -bottom-4 opacity-5 text-7xl text-[#c5a059]"
                >
                    ⏱️
                </div>
                <div class="flex justify-between items-center z-10">
                    <div>
                        <div
                            class="text-[10px] uppercase font-bold text-[#c5a059]"
                        >
                            {buscaServidor.trim() !== ""
                                ? "Horas Somadas (Filtrado)"
                                : "Total do Ciclo"}
                        </div>
                        <div class="text-3xl font-black text-white mt-1">
                            {totalHorasFiltradas.toLocaleString("pt-BR", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                            <span class="text-sm font-medium text-slate-300"
                                >hrs</span
                            >
                        </div>
                    </div>
                    {#if buscaServidor.trim() !== ""}
                        <div class="text-right">
                            <div
                                class="text-[9px] uppercase font-bold text-slate-400"
                            >
                                Total do Ciclo
                            </div>
                            <div class="text-sm font-bold text-slate-300">
                                {totalHorasCicloGeral.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                })} h
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div
            class="bg-[#112240] rounded-xl border border-slate-700 shadow-sm overflow-hidden"
        >
            <div
                class="px-4 py-3 border-b border-slate-700 flex items-center justify-between"
            >
                <span class="text-xs font-bold text-[#c5a059] uppercase">
                    {extrasFiltrados.length} Registros Adicionais
                </span>
            </div>

            {#if extrasFiltrados.length === 0}
                <div class="p-10 text-center">
                    <p class="text-3xl mb-2 text-slate-500">🛡️</p>
                    <p class="text-sm font-bold text-slate-400">
                        Nenhum plantão extra registrado neste ciclo ou filtro.
                    </p>
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-slate-300">
                        <thead
                            class="bg-[#061325] text-[10px] uppercase text-slate-400 border-b border-slate-700"
                        >
                            <tr>
                                <th class="px-4 py-3 font-bold">Servidor</th>
                                <th class="px-4 py-3 font-bold">Matrícula</th>
                                <th class="px-4 py-3 font-bold"
                                    >Unidade/Origem</th
                                >
                                <th class="px-4 py-3 font-bold text-center"
                                    >Protocolo do Plantão</th
                                >
                                <th class="px-4 py-3 font-bold text-center"
                                    >Data / Horário</th
                                >
                                <th class="px-4 py-3 font-bold text-right"
                                    >Duração (Hrs)</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            {#each itensPaginados as info}
                                <tr
                                    class="hover:bg-slate-800/50 transition-colors"
                                >
                                    <td class="px-4 py-3">
                                        <div
                                            class="font-bold text-slate-200 uppercase text-xs truncate max-w-[200px]"
                                            title={info.nome}
                                        >
                                            {info.nome}
                                        </div>
                                        <div
                                            class="text-[10px] text-slate-500 uppercase mt-0.5"
                                        >
                                            {info.cargo}
                                        </div>
                                    </td>
                                    <td
                                        class="px-4 py-3 font-mono text-xs text-slate-400"
                                    >
                                        {info.matricula}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-xs uppercase font-medium text-slate-400 truncate max-w-[150px]"
                                        title={info.unidade}
                                    >
                                        {info.unidade}
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <a
                                            href="/plantao/{info.plantao_id}"
                                            class="text-[10px] bg-[#061325] border border-slate-700 font-bold px-2 py-1 rounded text-slate-300 hover:border-[#c5a059] hover:text-[#c5a059] transition uppercase cursor-pointer"
                                        >
                                            {info.protocolo}
                                        </a>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <div
                                            class="font-bold text-slate-200 text-xs text-center border border-slate-700/50 bg-[#c5a059]/10 rounded-lg px-2 py-1 max-w-[150px] mx-auto"
                                        >
                                            {info.data_entrada_formatada}
                                            <span
                                                class="font-normal text-slate-500 mx-1"
                                                >—</span
                                            >
                                            {info.data_saida_formatada}
                                        </div>
                                        <div
                                            class="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-bold"
                                        >
                                            {info.hora_entrada || "--:--"}
                                            <span
                                                class="font-normal text-slate-600 mx-1"
                                                >às</span
                                            >
                                            {info.hora_saida || "--:--"}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="font-black text-[#c5a059]">
                                            {info.horas.toLocaleString(
                                                "pt-BR",
                                                {
                                                    minimumFractionDigits: 1,
                                                    maximumFractionDigits: 1,
                                                },
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Paginação -->
                {#if totalPaginas > 1}
                    <div
                        class="p-4 border-t border-slate-700 bg-[#061325] flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-xl"
                    >
                        <div class="text-xs text-slate-400 font-bold">
                            Página {paginaAtual} de {totalPaginas}
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                onclick={() => (paginaAtual -= 1)}
                                disabled={paginaAtual <= 1}
                                class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onclick={() => (paginaAtual += 1)}
                                disabled={paginaAtual >= totalPaginas}
                                class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </main>
</div>
