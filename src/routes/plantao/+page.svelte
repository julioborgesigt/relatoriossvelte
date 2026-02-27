<script lang="ts">
    import { enhance } from '$app/forms';

    // O Svelte 5 gerencia o estado da página inteira aqui
    let delegacia = $state('');
    let data_entrada = $state('');
    let hora_entrada = $state('');
    
    // Arrays reativos: adicionar um item aqui desenha a tela automaticamente!
    let equipe = $state([{ nome: '' }]);
    let procedimentos = $state([{ descricao: '' }]);

    function adicionarPolicial() {
        equipe.push({ nome: '' });
    }

    function removerPolicial(index: number) {
        equipe.splice(index, 1);
    }
</script>

<div class="min-h-screen bg-[#0a192f] p-4 md:p-8 text-white font-sans">
    <div class="max-w-4xl mx-auto">
        
        <header class="mb-6 flex justify-between items-end border-b border-[#c5a059] pb-4">
            <div>
                <h1 class="text-3xl font-black text-[#c5a059] tracking-tight">RELATÓRIO DE PLANTÃO</h1>
                <p class="text-sm text-slate-300 uppercase tracking-widest">DPI SUL - Formulário Oficial</p>
            </div>
            <div class="text-right">
                <span class="text-xs font-bold text-[#c5a059] border border-[#c5a059] px-2 py-1 rounded">Logado: 123.456-7</span>
            </div>
        </header>

        <form 
            method="POST" 
            action="?/salvar" 
            use:enhance={() => {
                return async ({ result, update }) => {
                    if (result.type === 'redirect') {
                        // Força a navegação caso o redirect automático falhe
                        import('$app/navigation').then(m => m.goto(result.location));
                    }
                    await update();
                };
            }}
        >
            
            <div class="mb-6">
                <label for="delegacia" class="block text-[#c5a059] text-xs font-bold mb-2 uppercase">Unidade Policial de Atuação</label>
                <input id="delegacia" name="delegacia" bind:value={delegacia} type="text" placeholder="Ex: Delegacia Regional de Iguatu" 
                       class="w-full bg-white/90 text-slate-900 p-3 rounded font-medium focus:ring-2 focus:ring-[#c5a059] outline-none uppercase" />
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div>
                    <label for="data_ent" class="block text-[#c5a059] text-xs font-bold mb-1 uppercase">Entrada (Data)</label>
                    <input id="data_ent" name="data_entrada" type="date" class="w-full bg-white/90 text-slate-900 p-2 rounded outline-none" />
                </div>
                <div>
                    <label for="hora_ent" class="block text-[#c5a059] text-xs font-bold mb-1 uppercase">Entrada (Hora)</label>
                    <input id="hora_ent"     name="hora_entrada" type="time" class="w-full bg-white/90 text-slate-900 p-2 rounded outline-none" />
                </div>
                <div>
                    <label for="data_saida" class="block text-[#c5a059] text-xs font-bold mb-1 uppercase">Saída (Data)</label>
                    <input id="data_saida" name="data_saida" type="date" class="w-full bg-white/90 text-slate-900 p-2 rounded outline-none" />
                </div>
                <div>
                    <label for="hora_saida" class="block text-[#c5a059] text-xs font-bold mb-1 uppercase">Saída (Hora)</label>
                    <input id="hora_saida" name="hora_saida" type="time" class="w-full bg-white/90 text-slate-900 p-2 rounded outline-none" />
                </div>
            </div>

            <div class="mb-8">
                <div class="flex items-center gap-2 border-b border-[#c5a059]/50 pb-2 mb-4">
                    <span class="text-[#c5a059] font-bold text-sm uppercase">Composição da Equipe de Serviço</span>
                </div>
                
                {#each equipe as policial, i}
                    <div class="flex gap-2 mb-2">
                        <input name="equipe_{i}" bind:value={policial.nome} type="text" placeholder="Nome / Matrícula do Policial" 
                               class="flex-1 bg-black/30 border-l-4 border-[#c5a059] text-white p-3 rounded outline-none uppercase" />
                        
                        {#if i > 0}
                            <button type="button" onclick={() => removerPolicial(i)} class="bg-red-900/50 hover:bg-red-700 text-white px-4 rounded transition-colors">X</button>
                        {/if}
                    </div>
                {/each}
                
                <button type="button" onclick={adicionarPolicial} class="mt-2 text-xs font-bold text-[#c5a059] border border-[#c5a059] px-3 py-1 rounded hover:bg-[#c5a059] hover:text-[#0a192f] transition-colors">
                    + ADICIONAR POLICIAL
                </button>
            </div>

            <div class="mb-8">
                <div class="flex items-center gap-2 border-b border-[#c5a059]/50 pb-2 mb-4">
                    <span class="text-[#c5a059] font-bold text-sm uppercase">Procedimentos Quantitativos</span>
                </div>
                <div class="grid grid-cols-3 md:grid-cols-6 gap-2 bg-black/20 p-4 rounded border border-dashed border-[#c5a059]">
                    {#each ['B.O.', 'Guias', 'Apreensões', 'Presos', 'Medidas', 'Outros'] as label}
                        <div>
                            <label for="q_{label.toLowerCase()}" class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">{label}</label>
                            <input id="q_{label.toLowerCase()}" type="number" name="q_{label.toLowerCase()}" value="0" class="w-full text-center bg-white/90 text-slate-900 p-1 rounded font-bold outline-none" />
                        </div>
                    {/each}
                </div>
            </div>

            <div class="mt-8 pt-6 border-t border-[#c5a059] flex justify-end gap-3">
                <button type="submit" name="acao" value="rascunho" class="px-4 py-2 border border-slate-500 text-slate-300 text-sm font-bold rounded hover:bg-slate-800 transition">
                    SALVAR RASCUNHO
                </button>
                <button type="submit" name="acao" value="finalizar" class="px-6 py-2 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-sm font-black rounded hover:brightness-110 transition">
                    FINALIZAR RELATÓRIO
                </button>
            </div>
        </form>
    </div>
</div>