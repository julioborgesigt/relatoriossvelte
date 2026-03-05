<script lang="ts">
    import { navigating } from "$app/stores";
    import favicon from "$lib/assets/favicon.svg";
    import "../app.css";
    import type { LayoutData } from "./$types";

    let { data, children }: { data: LayoutData; children: any } = $props();

    const rotasPublicas = ["/login"];
    const rotasSemNav = ["/plantao/imprimir", "/plantao/extra"];
    const ehPublica = $derived(
        rotasPublicas.some((r) => data.pathname?.startsWith(r)),
    );
    const ehImpressao = $derived(
        rotasSemNav.some((r) => data.pathname?.startsWith(r)),
    );
    const mostraNav = $derived(!!data.usuario && !ehPublica && !ehImpressao);
    const ehAdmin = $derived(
        data.usuario?.is_admin === 1 || data.usuario?.matricula === "00000000",
    );

    let menuAberto = $state(false);

    // Fecha o menu ao navegar
    $effect(() => {
        void data.pathname;
        menuAberto = false;
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<!-- Barra de loading global durante navegação -->
{#if $navigating}
    <div
        class="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-[#c5a059] animate-pulse"
    ></div>
{/if}

<!-- Barra de navegação compartilhada para rotas autenticadas -->
{#if mostraNav}
    <nav
        class="print:hidden no-print bg-[#061325] border-b border-[#c5a059]/20 text-xs relative z-50"
    >
        <!-- Linha principal da navbar -->
        <div class="px-4 py-2 flex items-center justify-between">
            <!-- Esquerda: Logo + links desktop -->
            <div class="flex items-center gap-3">
                <span
                    class="text-[#c5a059] font-black uppercase tracking-wider text-[10px] shrink-0"
                    >DPI SUL</span
                >

                <!-- Links de navegação — visíveis apenas em desktop (md+) -->
                <div class="hidden md:flex gap-1">
                    <a
                        href="/plantao"
                        data-sveltekit-reload
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/plantao'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                        >Plantão</a
                    >

                    <a
                        href="/meus-relatorios"
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/meus-relatorios'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                        >Meus Relatórios</a
                    >

                    {#if ehAdmin}
                        <a
                            href="/dashboard"
                            class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                            '/dashboard'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                            >Dashboard</a
                        >

                        <a
                            href="/extras"
                            class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                            '/extras'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                            >Extras</a
                        >

                        <a
                            href="/admin"
                            class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                            '/admin'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                            >Admin</a
                        >
                    {/if}
                </div>
            </div>

            <!-- Direita: usuário + sair + hambúrguer -->
            <div class="flex items-center gap-2 md:gap-4">
                <span
                    class="text-slate-400/80 font-mono hidden sm:block text-[11px] uppercase tracking-wider truncate max-w-[120px] md:max-w-none"
                    >{data.usuario?.nome}</span
                >
                <div class="h-4 w-[1px] bg-slate-700 hidden sm:block"></div>
                <a
                    href="/logout"
                    class="flex items-center gap-2 text-red-400 hover:text-[#0a192f] hover:bg-red-500 font-bold border border-red-500/30 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    title="Sair do sistema"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                        ></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span class="hidden sm:inline">SAIR</span>
                </a>

                <!-- Botão hambúrguer — visível apenas em mobile -->
                <button
                    type="button"
                    onclick={() => (menuAberto = !menuAberto)}
                    class="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg border border-slate-700 hover:bg-white/10 transition"
                    aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={menuAberto}
                >
                    {#if menuAberto}
                        <!-- Ícone X -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-slate-300"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    {:else}
                        <!-- Ícone hambúrguer -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-slate-300"
                        >
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    {/if}
                </button>
            </div>
        </div>

        <!-- Menu mobile dropdown - visível apenas quando aberto em telas pequenas -->
        {#if menuAberto}
            <div
                class="md:hidden border-t border-[#c5a059]/10 bg-[#061325] px-4 py-3 flex flex-col gap-1"
            >
                <a
                    href="/plantao"
                    data-sveltekit-reload
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition {data.pathname ===
                    '/plantao'
                        ? 'bg-[#c5a059] text-[#0a192f]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
                >
                    <span class="text-base">📋</span> Plantão
                </a>

                <a
                    href="/meus-relatorios"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition {data.pathname ===
                    '/meus-relatorios'
                        ? 'bg-[#c5a059] text-[#0a192f]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
                >
                    <span class="text-base">📁</span> Meus Relatórios
                </a>

                {#if ehAdmin}
                    <div class="border-t border-slate-800 my-1 pt-1">
                        <p
                            class="text-[9px] text-slate-600 uppercase font-bold px-3 mb-1"
                        >
                            Admin
                        </p>
                        <a
                            href="/dashboard"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition {data.pathname ===
                            '/dashboard'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
                        >
                            <span class="text-base">📊</span> Dashboard
                        </a>

                        <a
                            href="/extras"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition {data.pathname ===
                            '/extras'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
                        >
                            <span class="text-base">⏱️</span> Extras
                        </a>

                        <a
                            href="/admin"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition {data.pathname ===
                            '/admin'
                                ? 'bg-[#c5a059] text-[#0a192f]'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
                        >
                            <span class="text-base">🔑</span> Admin
                        </a>
                    </div>
                {/if}

                <!-- Info do usuário no menu mobile -->
                <div class="border-t border-slate-800 mt-1 pt-2 px-3">
                    <p
                        class="text-[10px] text-slate-500 uppercase font-bold truncate"
                    >
                        {data.usuario?.nome}
                    </p>
                </div>
            </div>
        {/if}
    </nav>
{/if}

<div
    class="bg-[#0a192f] min-h-screen font-sans text-slate-200 antialiased selection:bg-[#c5a059] selection:text-[#0a192f] flex flex-col"
>
    {@render children()}
</div>
