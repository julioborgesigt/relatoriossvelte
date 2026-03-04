<script lang="ts">
    import FormularioPlantao from "$lib/components/FormularioPlantao/index.svelte";
    import type { ActionData, PageData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<FormularioPlantao
    isRetificacao={false}
    actionUrl="?/salvar"
    formResult={form}
    superform={data.form}
    dadosIniciais={data.rascunhoCarregado?.dados ?? {}}
    equipeInicial={data.rascunhoCarregado?.equipe ?? []}
    procedimentosIniciais={data.rascunhoCarregado?.procedimentos ?? []}
    servidores={data.servidores ?? []}
    delegacias={data.delegacias ?? []}
/>
