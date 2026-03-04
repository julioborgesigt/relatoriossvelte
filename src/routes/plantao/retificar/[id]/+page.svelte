<script lang="ts">
    import FormularioPlantao from "$lib/components/FormularioPlantao/index.svelte";
    import type { ActionData, PageData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<FormularioPlantao
    isRetificacao={true}
    actionUrl="?/finalizar"
    formResult={form}
    dadosIniciais={data.original}
    equipeInicial={data.equipeOriginal}
    procedimentosIniciais={data.procedimentosOriginal}
    servidores={data.servidores ?? []}
    delegacias={data.delegacias ?? []}
    usuario={data.usuario}
/>
