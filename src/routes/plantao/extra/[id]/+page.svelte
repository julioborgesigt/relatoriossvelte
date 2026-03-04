<script lang="ts">
    import { LOGO_LEFT, LOGO_RIGHT } from "$lib/assets/logos";
    import type { PageData } from "./$types";
    import ModalExtra from "$lib/components/ModalExtra.svelte";
    import { formatarData, formatarProtocolo, calcularHoras } from "$lib/utils";

    let { data }: { data: PageData } = $props();
    const p = $derived(data.plantao);
    const equipeExtra = $derived(data.equipeExtra);
    const config = $derived(data.config);
    const ano = new Date().getFullYear();

    function capitalizeCity(nome: string) {
        if (!nome) return "Farias Brito";
        return nome.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    }
    const cidadeFormatada = $derived(
        p.delegacia
            ? capitalizeCity(p.delegacia.split(" DE ").pop() || "Farias Brito")
            : "Farias Brito",
    );

    // ── Estado do modal de configuração ──────────────────────────────────────
    // Se vier configurado via URL params (da página de retificação), pula o modal
    let mostrarModalConfig = $state(!config.dir);
    let justificativa = $state(
        config.just ||
            `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${formatarProtocolo(p.protocolo, p.id)}.`,
    );
    let nomeDiretor = $state(config.dir);

    // Seleção de quais membros incluir na impressão
    // Se vier lista via URL, filtra; caso contrário inclui todos
    let membrosIncluidos = $state<string[]>(
        config.mb
            ? config.mb
                  .split(",")
                  .filter((n: string) =>
                      equipeExtra.some((m: any) => m.nome_servidor === n),
                  )
            : equipeExtra.map((m: any) => m.nome_servidor),
    );

    function toggleMembro(nome: string) {
        if (membrosIncluidos.includes(nome)) {
            membrosIncluidos = membrosIncluidos.filter((n) => n !== nome);
        } else {
            membrosIncluidos = [...membrosIncluidos, nome];
        }
    }

    // Equipe filtrada para o relatório impresso
    let equipeImpressao = $derived(
        equipeExtra.filter((m: any) =>
            membrosIncluidos.includes(m.nome_servidor),
        ),
    );

    function confirmarConfig() {
        if (!nomeDiretor.trim() || membrosIncluidos.length === 0) return;
        mostrarModalConfig = false;
    }
</script>

<svelte:head>
    <title>Relatório Extra {p.protocolo} — DPI SUL</title>
    <style>
        @media print {
            .no-print {
                display: none !important;
            }
            @page {
                size: A4 landscape;
                margin: 5mm;
            }
            .print-container {
                box-shadow: none !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: none !important;
                min-height: auto !important;
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
            }
            .print-page-wrapper {
                background: transparent !important;
                padding: 0 !important;
                min-height: auto !important;
            }
        }

        .print-page-wrapper {
            background-color: #525659;
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            font-family: "Segoe UI", Arial, sans-serif;
        }

        .print-container {
            width: 297mm;
            min-height: 190mm;
            background: white;
            padding: 10mm 15mm;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            box-sizing: border-box;
            color: black;
            font-family: Arial, sans-serif;
        }
    </style>
</svelte:head>

<!-- ══ MODAL DE CONFIGURAÇÃO ════════════════════════════════════════════════ -->
<ModalExtra
    bind:mostrarModalConfig
    bind:justificativa
    bind:nomeDiretor
    bind:membrosIncluidos
    {p}
    {equipeExtra}
    onConfirm={confirmarConfig}
    onCancel={() => (window.location.href = `/plantao/imprimir/${p.id}`)}
/>

<!-- ══ BOTÕES DE AÇÃO (não aparecem na impressão) ════════════════════════════ -->
{#if !mostrarModalConfig}
    <div class="no-print fixed bottom-6 right-6 flex gap-3 z-50">
        <a
            href="/plantao/imprimir/{p.id}"
            class="bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-slate-600 transition"
        >
            ← Relatório Principal
        </a>
        <button
            onclick={() => (mostrarModalConfig = true)}
            class="bg-slate-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-slate-500 transition"
        >
            ✏️ Ajustar
        </button>
        <button
            onclick={() => window.print()}
            class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-full font-black shadow-xl hover:brightness-110 transition text-sm"
        >
            🖨 IMPRIMIR PDF
        </button>
    </div>
{/if}

<!-- ══ DOCUMENTO A4 ══════════════════════════════════════════════════════════ -->
{#if !mostrarModalConfig}
    <div class="print-page-wrapper">
        <div
            class="print-container flex flex-col relative"
            id="conteudoRelatorio"
        >
            <!-- CABEÇALHO -->
            <div
                class="flex justify-between items-center border-b-[2px] border-black pb-4 mb-6"
            >
                <img
                    class="logo-left"
                    src={LOGO_LEFT}
                    style="max-height: 25mm;"
                    alt="Logo Ceará"
                />
                <div class="flex-1 text-center px-4 font-arial text-black">
                    <div class="font-bold text-[16px] uppercase">
                        RELATÓRIO DE SERVIÇO EXTRAORDINÁRIO
                    </div>
                    <div class="font-bold text-[16px] uppercase">
                        {p.delegacia}
                    </div>
                    <div class="text-[14px] mt-1">
                        Departamento de Polícia do Interior Sul - DPI SUL
                    </div>
                </div>
                <img
                    class="logo-right"
                    src={LOGO_RIGHT}
                    style="max-height: 25mm;"
                    alt="Logo PC"
                />
            </div>

            <!-- PERÍODO -->
            <div
                class="text-center font-bold font-arial uppercase text-[15px] mb-8 text-black"
            >
                PERÍODO DO PLANTÃO: {formatarData(p.data_entrada)}
                {p.hora_entrada} ÀS {formatarData(p.data_saida)}
                {p.hora_saida}
            </div>

            <!-- BREVE RELATÓRIO -->
            <div class="mb-8 font-arial text-black">
                <div class="font-bold text-[14px] mb-2 uppercase">
                    BREVE RELATÓRIO:
                </div>
                <div
                    class="border-[1.5px] border-black p-4 text-[14px] uppercase italic"
                >
                    {justificativa}
                </div>
            </div>

            <!-- TABELA -->
            <div class="mb-12 font-arial w-full relative">
                <table
                    class="w-full border-collapse border border-black text-[11px] text-center text-black leading-tight"
                >
                    <thead>
                        <tr class="bg-[#f3f3f3]">
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase text-left w-[24%]"
                                >NOME COMPLETO</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[8%]"
                                >CARGO</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[11%]"
                                >MATRÍCULA</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[6%]"
                                >CLASSE</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[19%]"
                                >LOTAÇÃO</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[10%]"
                                >INÍCIO</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[6%]"
                                >RUBRICA</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[10%]"
                                >SAÍDA</th
                            >
                            <th
                                class="border border-black px-2 py-2 font-bold uppercase w-[6%]"
                                >RUBRICA</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each equipeImpressao as membro}
                            <tr>
                                <td
                                    class="border border-black px-2 py-3 font-semibold uppercase text-left"
                                    >{membro.nome_servidor}</td
                                >
                                <td
                                    class="border border-black px-2 py-3 uppercase text-[12px]"
                                    >{membro.cargo ?? ""}</td
                                >
                                <td
                                    class="border border-black px-2 py-3 text-[12px]"
                                    >{membro.matricula ?? ""}</td
                                >
                                <td
                                    class="border border-black px-2 py-3 uppercase text-[12px]"
                                    >{membro.classe ?? ""}</td
                                >
                                <td
                                    class="border border-black px-2 py-3 text-[12px]"
                                    >Departamento de Polícia do Interior Sul</td
                                >
                                <td
                                    class="border border-black px-2 py-3 font-semibold text-[12px] text-center"
                                    >{formatarData(membro.data_entrada)}<br
                                    />{membro.hora_entrada ?? ""}</td
                                >
                                <td class="border border-black px-2 py-3"></td>
                                <td
                                    class="border border-black px-2 py-3 font-semibold text-[12px] text-center"
                                    >{formatarData(membro.data_saida)}<br
                                    />{membro.hora_saida ?? ""}</td
                                >
                                <td class="border border-black px-2 py-3"></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- LOCAL E DATA -->
            <div class="font-bold font-arial text-[14px] text-black mb-4">
                {cidadeFormatada}/CE, {new Intl.DateTimeFormat("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }).format(new Date())}.
            </div>

            <!-- ASSINATURA -->
            <div
                class="text-center mb-6 w-full flex justify-center mt-12 relative"
            >
                <div
                    class="border-t-[2px] border-black pt-2 min-w-[400px] font-bold uppercase font-arial text-[14px] leading-snug text-black"
                >
                    {nomeDiretor.toUpperCase()}<br />
                    DELEGADO(A) DE POLÍCIA CIVIL
                </div>
            </div>

            <!-- FOOTER -->
            <div
                class="text-right font-arial absolute bottom-2 right-2 text-[10px] text-gray-700"
            >
                <div class="font-bold text-black mb-0.5 uppercase text-[11px]">
                    REFERENTE AO PLANTÃO ID: {formatarProtocolo(
                        p.protocolo,
                        p.id,
                    )}
                </div>
                <div class="uppercase">
                    GERADO EM: {new Date().toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </div>
            </div>
        </div>
    </div>
{/if}
