<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();
    const p = data.plantao;
    const equipeExtra = data.equipeExtra;
    const ano = new Date().getFullYear();

    function formatarData(d: string | null | undefined): string {
        if (!d) return '—';
        const [y, m, dd] = d.split('-');
        return `${dd}/${m}/${y}`;
    }

    function calcularHoras(entrada_data: string, entrada_hora: string, saida_data: string, saida_hora: string): string {
        if (!entrada_data || !entrada_hora || !saida_data || !saida_hora) {
            return '—';
        }
        try {
            const de = new Date(`${entrada_data}T${entrada_hora}`);
            const ate = new Date(`${saida_data}T${saida_hora}`);
            const diff = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
            if (isNaN(diff) || diff < 0) return '—';
            const h = Math.floor(diff);
            const m = Math.round((diff - h) * 60);
            return `${h}h${m > 0 ? m + 'm' : ''}`;
        } catch {
            return '—';
        }
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

<!-- Botões (não imprimem) -->
<div class="no-print fixed bottom-6 right-6 flex gap-3 z-50">
    <a href="/plantao/imprimir/{p.id}"
        class="bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl hover:bg-slate-600 transition">
        ← Relatório Principal
    </a>
    <button onclick={() => window.print()}
        class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-full font-black shadow-xl hover:brightness-110 transition text-sm">
        🖨 IMPRIMIR PDF
    </button>
</div>

<!-- Documento A4 -->
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
                    <p class="font-mono text-[12px] font-black">{p.protocolo ?? `FT-${String(p.id).padStart(6,'0')}`}</p>
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
                <span class="font-normal text-gray-500 ml-2">(Total: {equipeExtra.length})</span>
            </h2>

            {#if equipeExtra.length === 0}
                <div class="border border-t-0 border-black p-4 text-center text-gray-500 text-[10px]">
                    Nenhum servidor em escala extraordinária neste plantão.
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
                        {#each equipeExtra as membro}
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
                <p class="text-gray-400 italic text-[9px]">
                    O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial,
                    conforme relatório de plantão {p.protocolo ?? `FT-${String(p.id).padStart(6,'0')}`}.
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
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </div>
                <p class="text-[9px] text-gray-500 mt-1">Diretor / Delegado</p>
            </div>
        </div>

        <footer class="mt-8 pt-2 border-t border-gray-300 text-[8px] text-gray-400 flex justify-between">
            <span>Emitido em: {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
            <span>Ref. Protocolo: {p.protocolo ?? `FT-${String(p.id).padStart(6,'0')}`} — DPI SUL</span>
        </footer>
    </div>
</div>
