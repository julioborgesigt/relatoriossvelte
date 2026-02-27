<script lang="ts">
    import { page } from '$app/state';
    const id = $derived(page.params.id);
</script>

<div class="min-h-screen bg-[#0a192f] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white/5 border border-[#c5a059] rounded-2xl p-8 text-center shadow-2xl">
        <div class="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full border-2 border-emerald-500">
            <span class="text-4xl">✅</span>
        </div>
        
        <h1 class="text-2xl font-black text-[#c5a059] mb-2 uppercase tracking-tight">Relatório Finalizado!</h1>
        <p class="text-slate-300 text-sm mb-8">
            O relatório de plantão <strong>#{id}</strong> foi gravado com sucesso no banco de dados da Cloudflare.
        </p>

        <div class="space-y-3">
            <a 
                href="/plantao/imprimir/{id}" 
                target="_blank"
                class="block w-full py-3 bg-[#c5a059] text-[#0a192f] font-black rounded-xl hover:brightness-110 transition-all uppercase text-sm tracking-widest"
            >
                🖨️ Abrir para Impressão
            </a>
            
            <a 
                href="/plantao" 
                class="block w-full py-3 border border-slate-500 text-slate-300 font-bold rounded-xl hover:bg-white/5 transition-all uppercase text-xs"
            >
                Novo Relatório
            </a>
        </div>
    </div>
</div>