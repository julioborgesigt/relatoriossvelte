<script lang="ts">
    let { data } = $props();
    const p = data.plantao;
</script>

<div class="min-h-screen bg-white text-black p-10 font-serif print:p-0">
    <div class="text-center border-b-2 border-black pb-4 mb-6">
        <h2 class="text-xl font-bold uppercase">Estado do Ceará</h2>
        <h3 class="text-lg font-bold uppercase">Polícia Civil do Estado do Ceará</h3>
        <h4 class="text-md uppercase">{p.delegacia}</h4>
        <p class="text-sm mt-2 font-bold">RELATÓRIO DE PLANTÃO Nº {p.id}/{new Date().getFullYear()}</p>
    </div>

    <section class="mb-6">
        <h5 class="bg-gray-200 px-2 font-bold uppercase text-sm border border-black">1. Dados do Período</h5>
        <div class="grid grid-cols-2 border border-t-0 border-black p-2 text-sm">
            <p><strong>Início:</strong> {p.data_entrada} às {p.hora_entrada}</p>
            <p><strong>Término:</strong> {p.data_saida} às {p.hora_saida}</p>
        </div>
    </section>

    <section class="mb-6">
        <h5 class="bg-gray-200 px-2 font-bold uppercase text-sm border border-black">2. Equipe de Serviço</h5>
        <div class="border border-t-0 border-black p-2 text-sm">
            <ul class="list-disc ml-5">
                {#each data.equipe as membro}
                    <li class="uppercase">{membro.nome_servidor}</li>
                {/each}
            </ul>
        </div>
    </section>

    <section class="mb-6">
        <h5 class="bg-gray-200 px-2 font-bold uppercase text-sm border border-black">3. Detalhamento Qualitativo</h5>
        <div class="border border-t-0 border-black p-0 text-sm">
            {#each data.procedimentos as proc}
                <div class="border-b border-black p-2 last:border-b-0">
                    <p class="font-bold uppercase mb-1">Natureza: {proc.natureza}</p>
                    <p class="mb-1"><strong>Envolvidos:</strong> {proc.envolvidos}</p>
                    <p class="text-justify italic"><strong>Resumo:</strong> {proc.resumo}</p>
                </div>
            {/each}
        </div>
    </section>

    <div class="mt-20 text-center">
        <div class="inline-block border-t border-black px-10 pt-2 uppercase text-sm">
            Responsável pelo Plantão
        </div>
    </div>

    <button 
        onclick={() => window.print()} 
        class="fixed bottom-10 right-10 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl print:hidden hover:bg-blue-700 transition-all"
    >
        IMPRIMIR PDF
    </button>
</div>