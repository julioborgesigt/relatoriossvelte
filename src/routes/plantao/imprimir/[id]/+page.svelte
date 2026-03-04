<script lang="ts">
    import type { PageData } from "./$types";
    import { formatarData, formatarProtocolo } from "$lib/utils";
    import { COR_TIPO_PRINT } from "$lib/constants";
    import ModalExtra from "$lib/components/ModalExtra.svelte";

    let { data }: { data: PageData } = $props();
    const p = $derived(data.plantao);
    const ano = new Date().getFullYear();

    function totalProcedimentos(): number {
        return (
            (p.q_bo ?? 0) +
            (p.q_guias ?? 0) +
            (p.q_apreensoes ?? 0) +
            (p.q_presos ?? 0) +
            (p.q_medidas ?? 0) +
            (p.q_outros ?? 0)
        );
    }

    // Modal configuração do relatório extra
    let mostrarModalExtra = $state(false);
    let justificativaExtra = $state("");
    let nomeDiretorExtra = $state("");
    let membrosExtraIncluidos = $state<string[]>([]);

    const membrosExtraordinarios = $derived(
        data.equipe.filter((m) => m.escala === "Extraordinaria"),
    );

    function abrirModalExtra() {
        justificativaExtra = `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${p.protocolo}.`;
        membrosExtraIncluidos = membrosExtraordinarios.map(
            (m) => m.nome_servidor,
        );
        nomeDiretorExtra = "";
        mostrarModalExtra = true;
    }

    function toggleMembroExtra(nome: string) {
        if (membrosExtraIncluidos.includes(nome)) {
            membrosExtraIncluidos = membrosExtraIncluidos.filter(
                (n) => n !== nome,
            );
        } else {
            membrosExtraIncluidos = [...membrosExtraIncluidos, nome];
        }
    }

    function gerarRelatorioExtra() {
        if (!nomeDiretorExtra.trim()) return;
        if (
            membrosExtraordinarios.length > 0 &&
            membrosExtraIncluidos.length === 0
        )
            return;
        const url = new URL(`/plantao/extra/${p.id}`, window.location.origin);
        url.searchParams.set("dir", nomeDiretorExtra.trim());
        url.searchParams.set("just", justificativaExtra);
        if (membrosExtraIncluidos.length < membrosExtraordinarios.length) {
            url.searchParams.set("mb", membrosExtraIncluidos.join(","));
        }
        window.open(url.toString(), "_blank");
        mostrarModalExtra = false;
    }
</script>

<svelte:head>
    <title>Relatório {p.protocolo} — DPI SUL</title>
    <style>
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: white;
            }
            @page {
                size: A4;
                margin: 10mm;
            }
        }
        body {
            font-family: "Segoe UI", Arial, sans-serif;
        }
    </style>
</svelte:head>

<!-- Modal: Configurar Relatório Extra -->
<ModalExtra
    bind:mostrarModalConfig={mostrarModalExtra}
    bind:justificativa={justificativaExtra}
    bind:nomeDiretor={nomeDiretorExtra}
    bind:membrosIncluidos={membrosExtraIncluidos}
    {p}
    equipeExtra={membrosExtraordinarios}
    onConfirm={gerarRelatorioExtra}
/>

<!-- Botões de ação (não aparecem na impressão) -->
<div class="no-print fixed bottom-6 right-6 flex gap-3 z-50">
    {#if p.status === "finalizado" || p.status === "retificado"}
        <button
            type="button"
            onclick={abrirModalExtra}
            class="bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-blue-600 transition"
        >
            📋 Extra
        </button>
    {/if}
    {#if p.status === "finalizado" || p.status === "retificado"}
        <a
            href="/plantao/retificar/{p.id}"
            class="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-amber-500 transition"
        >
            ✏️ Retificar
        </a>
    {/if}
    <button
        onclick={() => window.print()}
        class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-full font-black shadow-xl hover:brightness-110 transition text-sm"
    >
        🖨 IMPRIMIR PDF
    </button>
</div>

<!-- Documento A4 -->
<div class="bg-white min-h-screen p-0 print:p-0">
    <div
        class="max-w-[210mm] mx-auto px-[12mm] py-[10mm] text-black text-[11px]"
        style="font-family: 'Segoe UI', Arial, sans-serif;"
    >
        <!-- ══ TARJA DE RETIFICAÇÃO ══ -->
        {#if p.status === "retificado"}
            <div
                class="text-center mb-3 border-2 border-red-700 bg-red-50 py-1.5"
            >
                <span
                    class="font-black text-red-700 text-[13px] uppercase tracking-[0.4em]"
                    >✦ RETIFICADO ✦</span
                >
            </div>
        {/if}

        <!-- ══ CABEÇALHO ══ -->
        <header class="text-center border-b-2 border-black pb-3 mb-4">
            <div class="flex items-center justify-between mb-2">
                <div class="text-left text-[9px] leading-tight text-gray-600">
                    <p class="font-bold">ESTADO DO CEARÁ</p>
                    <p>Secretaria de Segurança Pública</p>
                    <p>Polícia Civil do Estado do Ceará</p>
                </div>
                <div class="text-center">
                    <p class="font-black text-[13px] uppercase tracking-tight">
                        RELATÓRIO DE PLANTÃO
                    </p>
                    <p class="font-bold text-[10px] uppercase">{p.delegacia}</p>
                </div>
                <div class="text-right text-[9px] leading-tight">
                    <p class="font-bold">Protocolo:</p>
                    <p class="font-mono text-[12px] font-black">
                        {formatarProtocolo(p.protocolo, p.id)}
                    </p>
                    <p class="text-gray-500">{ano}</p>
                </div>
            </div>
        </header>

        <!-- ══ SEÇÃO 1: DADOS DO PERÍODO ══ -->
        <section class="mb-3">
            <h2
                class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black"
            >
                1. Dados do Período
            </h2>
            <div
                class="border border-t-0 border-black grid grid-cols-4 text-[10px]"
            >
                <div class="p-2 border-r border-black">
                    <span
                        class="font-bold block text-[9px] text-gray-500 uppercase"
                        >Início</span
                    >
                    <span
                        >{formatarData(p.data_entrada)} às {p.hora_entrada ??
                            "—"}</span
                    >
                </div>
                <div class="p-2 border-r border-black">
                    <span
                        class="font-bold block text-[9px] text-gray-500 uppercase"
                        >Término</span
                    >
                    <span
                        >{formatarData(p.data_saida)} às {p.hora_saida ??
                            "—"}</span
                    >
                </div>
                <div class="p-2 border-r border-black col-span-2">
                    <span
                        class="font-bold block text-[9px] text-gray-500 uppercase"
                        >Responsável</span
                    >
                    <span class="uppercase">{p.nome_responsavel ?? "—"}</span>
                    {#if p.matricula_responsavel}
                        <span class="text-gray-500 ml-2 font-mono text-[9px]"
                            >Mat. {p.matricula_responsavel}</span
                        >
                    {/if}
                </div>
            </div>
        </section>

        <!-- ══ SEÇÃO 2: EQUIPE ══ -->
        <section class="mb-3">
            <h2
                class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black"
            >
                2. Equipe de Serviço
            </h2>
            <table
                class="w-full border-collapse border border-t-0 border-black text-[10px]"
            >
                <thead>
                    <tr class="bg-[#f3f3f3]">
                        <th
                            class="border border-black px-2 py-1 text-left font-bold uppercase text-[9px]"
                            >Nome</th
                        >
                        <th
                            class="border border-black px-2 py-1 text-left font-bold uppercase text-[9px]"
                            >Cargo/Classe</th
                        >
                        <th
                            class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]"
                            >Escala</th
                        >
                        <th
                            class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]"
                            >Entrada</th
                        >
                        <th
                            class="border border-black px-2 py-1 text-center font-bold uppercase text-[9px]"
                            >Saída</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each data.equipe as membro}
                        <tr class="hover:bg-gray-50">
                            <td
                                class="border border-black px-2 py-1 uppercase font-medium"
                                >{membro.nome_servidor}</td
                            >
                            <td
                                class="border border-black px-2 py-1 text-gray-700"
                                >{membro.cargo ?? ""}
                                {membro.classe ? `— ${membro.classe}` : ""}</td
                            >
                            <td
                                class="border border-black px-2 py-1 text-center"
                            >
                                <span
                                    class="px-1 rounded text-[9px] font-bold {membro.escala ===
                                    'Extraordinaria'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100'}"
                                >
                                    {membro.escala === "Extraordinaria"
                                        ? "EXTRA"
                                        : "NORMAL"}
                                </span>
                            </td>
                            <td
                                class="border border-black px-2 py-1 text-center font-mono text-[9px]"
                            >
                                {formatarData(membro.data_entrada)}
                                {membro.hora_entrada ?? ""}
                            </td>
                            <td
                                class="border border-black px-2 py-1 text-center font-mono text-[9px]"
                            >
                                {formatarData(membro.data_saida)}
                                {membro.hora_saida ?? ""}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>

        <!-- ══ SEÇÃO 3: QUANTITATIVOS ══ -->
        <section class="mb-3">
            <h2
                class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black"
            >
                3. Resumo Quantitativo de Procedimentos
            </h2>
            <div class="border border-t-0 border-black">
                <div class="grid grid-cols-7 text-center text-[10px]">
                    {#each [{ label: "B.O.", value: p.q_bo }, { label: "Guias", value: p.q_guias }, { label: "Apreensões", value: p.q_apreensoes }, { label: "Presos", value: p.q_presos }, { label: "Med. Prot.", value: p.q_medidas }, { label: "Outros", value: p.q_outros }, { label: "TOTAL", value: totalProcedimentos() }] as item}
                        <div
                            class="border-r border-black last:border-r-0 p-1.5 {item.label ===
                            'TOTAL'
                                ? 'bg-[#f3f3f3] font-black'
                                : ''}"
                        >
                            <div
                                class="text-[8px] font-bold text-gray-600 uppercase"
                            >
                                {item.label}
                            </div>
                            <div class="text-[14px] font-black">
                                {item.value ?? 0}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <!-- ══ SEÇÃO 4: PROCEDIMENTOS QUALITATIVOS ══ -->
        {#if data.procedimentos.length > 0}
            <section class="mb-3">
                <h2
                    class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black"
                >
                    4. Detalhamento Qualitativo
                </h2>
                <div class="border border-t-0 border-black">
                    {#each data.procedimentos as proc, idx}
                        <div
                            class="p-2 {idx < data.procedimentos.length - 1
                                ? 'border-b border-black'
                                : ''}"
                        >
                            <div
                                class="flex items-baseline gap-3 mb-1.5 flex-wrap"
                            >
                                <span
                                    class="font-black text-[10px] uppercase px-1.5 py-0.5 rounded text-white text-[9px]"
                                    style="background-color: {COR_TIPO_PRINT[
                                        proc.tipo
                                    ] ?? '#374151'}"
                                >
                                    {proc.tipo}
                                </span>
                                {#if proc.numero}
                                    <span
                                        class="font-mono text-[10px] text-gray-600"
                                        >Nº {proc.numero}</span
                                    >
                                {/if}
                                <span class="font-bold uppercase text-[10px]"
                                    >{proc.natureza}</span
                                >
                            </div>

                            {#if proc.vitimas?.length > 0 && proc.vitimas[0]}
                                <p class="text-[10px] mb-0.5">
                                    <strong>Vítima(s):</strong>
                                    {proc.vitimas.filter(Boolean).join(" | ")}
                                </p>
                            {/if}

                            {#if proc.suspeitos?.length > 0 && proc.suspeitos[0]}
                                <p class="text-[10px] mb-0.5">
                                    <strong>Suspeito(s):</strong>
                                    {proc.suspeitos.filter(Boolean).join(" | ")}
                                </p>
                            {/if}

                            {#if proc.envolvidos}
                                <p class="text-[10px] mb-0.5">
                                    <strong>Envolvidos:</strong>
                                    {proc.envolvidos}
                                </p>
                            {/if}

                            {#if proc.resumo}
                                <p
                                    class="text-[10px] text-justify italic text-gray-700"
                                >
                                    <strong>Resumo:</strong>
                                    {proc.resumo}
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- ══ SEÇÃO 5: OBSERVAÇÕES ══ -->
        {#if p.observacoes}
            <section class="mb-3">
                <h2
                    class="bg-[#f3f3f3] px-2 py-1 font-bold uppercase text-[10px] border border-black"
                >
                    5. Observações
                </h2>
                <div
                    class="border border-t-0 border-black p-2 text-[10px] text-justify uppercase"
                >
                    {p.observacoes}
                </div>
            </section>
        {/if}

        <!-- ══ ASSINATURA ══ -->
        <div class="mt-12 text-center">
            <div
                class="inline-block border-t border-black px-16 pt-2 text-[10px] uppercase font-bold"
            >
                {p.nome_responsavel ?? "Responsável pelo Plantão"}
            </div>
            {#if p.matricula_responsavel}
                <p class="text-[9px] text-gray-600 mt-1">
                    Matrícula: {p.matricula_responsavel}
                </p>
            {/if}
        </div>

        <!-- Rodapé do documento -->
        <footer
            class="mt-8 pt-2 border-t border-gray-300 text-[8px] text-gray-400 flex justify-between"
        >
            <span
                >Emitido em: {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}</span
            >
            <span
                >Protocolo: {formatarProtocolo(p.protocolo, p.id)} — DPI SUL</span
            >
        </footer>
    </div>
</div>
