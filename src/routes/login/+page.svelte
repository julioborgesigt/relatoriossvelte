<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData, PageData } from './$types';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    // Estado da autenticação
    let etapa = $state<'matricula' | 'token'>(data.etapa ?? 'matricula');
    let servidor = $state<{ nome: string; matricula: string; emailMascarado: string; email: string } | null>(null);
    let tokenDev = $state<string | undefined>(undefined);
    let carregando = $state(false);

    // Quando o form retorna dados do servidor, avança para etapa do token
    $effect(() => {
        if (form && 'etapa' in form && form.etapa === 'token' && form.servidor) {
            etapa = 'token';
            servidor = form.servidor as typeof servidor;
            tokenDev = (form as any).tokenDev;
        }
    });
</script>

<svelte:head>
    <title>Login - Sistema de Plantões DPI SUL</title>
</svelte:head>

<div class="min-h-screen bg-[#0a192f] flex items-center justify-center p-4">
    <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-8">
            <div class="inline-block bg-[#c5a059] text-[#0a192f] font-black text-xs px-3 py-1 rounded mb-4 uppercase tracking-widest">
                Polícia Civil do Estado do Ceará
            </div>
            <h1 class="text-3xl font-black text-[#c5a059] tracking-tight uppercase">Sistema de Plantões</h1>
            <p class="text-slate-400 text-sm mt-1 uppercase tracking-wider">DPI SUL — Acesso Seguro</p>
        </div>

        <div class="bg-white/5 border border-[#c5a059]/30 rounded-xl p-8 shadow-2xl">

            {#if etapa === 'matricula'}
                <!-- Etapa 1: Inserir matrícula -->
                <h2 class="text-[#c5a059] font-bold text-sm uppercase tracking-widest mb-6">Identificação</h2>

                <form method="POST" action="?/buscarServidor" use:enhance={() => {
                    carregando = true;
                    return async ({ result, update }) => {
                        carregando = false;
                        await update();
                    };
                }}>
                    <div class="mb-5">
                        <label for="matricula" class="block text-slate-300 text-xs font-bold uppercase mb-2">
                            Número de Matrícula
                        </label>
                        <input
                            id="matricula"
                            name="matricula"
                            type="text"
                            placeholder="Ex: 12345678"
                            autocomplete="off"
                            required
                            class="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 p-3 rounded-lg focus:ring-2 focus:ring-[#c5a059] focus:border-transparent outline-none text-center text-xl font-mono tracking-widest transition-all"
                        />
                    </div>

                    {#if form?.erro}
                        <div class="mb-4 bg-red-900/40 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg">
                            {form.erro}
                        </div>
                    {/if}

                    <button
                        type="submit"
                        disabled={carregando}
                        class="w-full bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] font-black py-3 rounded-lg uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        {carregando ? 'AGUARDE...' : 'IDENTIFICAR'}
                    </button>
                </form>

            {:else if etapa === 'token' && servidor}
                <!-- Etapa 2: Confirmar identidade e inserir token -->
                <div class="mb-6">
                    <div class="bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-lg p-4 mb-4">
                        <p class="text-[#c5a059] text-xs font-bold uppercase mb-1">Servidor Identificado</p>
                        <p class="text-white font-bold text-lg uppercase">{servidor.nome}</p>
                        <p class="text-slate-400 text-sm font-mono">Mat. {servidor.matricula}</p>
                    </div>
                    <p class="text-slate-400 text-sm text-center">
                        Código enviado para: <span class="text-white font-mono">{servidor.emailMascarado}</span>
                    </p>

                    {#if tokenDev}
                        <div class="mt-3 bg-yellow-900/40 border border-yellow-500/50 rounded-lg p-3 text-center">
                            <p class="text-yellow-400 text-xs font-bold uppercase mb-1">Modo Dev — Token:</p>
                            <p class="text-yellow-300 font-mono text-2xl font-black tracking-[0.5em]">{tokenDev}</p>
                        </div>
                    {/if}
                </div>

                <form method="POST" action="?/validarToken" use:enhance={() => {
                    carregando = true;
                    return async ({ result, update }) => {
                        carregando = false;
                        await update();
                    };
                }}>
                    <input type="hidden" name="email" value={servidor.email} />

                    <div class="mb-5">
                        <label for="token" class="block text-slate-300 text-xs font-bold uppercase mb-2">
                            Código de 6 Dígitos
                        </label>
                        <input
                            id="token"
                            name="token"
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]{6}"
                            maxlength="6"
                            placeholder="000000"
                            autocomplete="one-time-code"
                            required
                            class="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 p-3 rounded-lg focus:ring-2 focus:ring-[#c5a059] focus:border-transparent outline-none text-center text-3xl font-mono tracking-[0.5em] transition-all"
                        />
                    </div>

                    {#if form?.erro}
                        <div class="mb-4 bg-red-900/40 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg">
                            {form.erro}
                        </div>
                    {/if}

                    <button
                        type="submit"
                        disabled={carregando}
                        class="w-full bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] font-black py-3 rounded-lg uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50 mb-3"
                    >
                        {carregando ? 'VALIDANDO...' : 'ACESSAR SISTEMA'}
                    </button>

                    <button
                        type="button"
                        onclick={() => { etapa = 'matricula'; servidor = null; }}
                        class="w-full text-slate-400 text-xs py-2 hover:text-white transition-colors"
                    >
                        ← Voltar e tentar com outra matrícula
                    </button>
                </form>
            {/if}
        </div>

        <p class="text-center text-slate-600 text-xs mt-6">
            DPI SUL — Departamento de Polícia do Interior Sul
        </p>
    </div>
</div>
