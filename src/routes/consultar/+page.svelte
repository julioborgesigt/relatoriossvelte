<script lang="ts">
    let { data } = $props();
</script>

<div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Relatório de Remoções</h1>
        <a href="/nova-remocao" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            + Nova Remoção
        </a>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full leading-normal">
            <thead>
                <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th class="py-3 px-6 text-left">Indiciado</th>
                    <th class="py-3 px-6 text-left">Origem/Destino</th>
                    <th class="py-3 px-6 text-center">Data</th>
                    <th class="py-3 px-6 text-center">Status</th>
                </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
                {#each data.remocoes as item}
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-6 text-left whitespace-nowrap">
                            <span class="font-medium">{item.nome_indiciado}</span>
                        </td>
                        <td class="py-3 px-6 text-left">
                            <div class="flex flex-col">
                                <span>De: {item.origem}</span>
                                <span class="text-blue-500">Para: {item.destino}</span>
                            </div>
                        </td>
                        <td class="py-3 px-6 text-center">
                            {new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}
                        </td>
                        <td class="py-3 px-6 text-center">
                            <span class="bg-yellow-200 text-yellow-700 py-1 px-3 rounded-full text-xs">
                                {item.status}
                            </span>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>