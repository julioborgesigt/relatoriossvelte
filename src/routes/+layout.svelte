<script lang="ts">
    import { navigating } from "$app/stores";
    import favicon from "$lib/assets/favicon.svg";
    import "../app.css";
    import type { LayoutData } from "./$types";
    import { AppBar } from "@skeletonlabs/skeleton-svelte";

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

    $effect(() => {
        void data.pathname;
        menuAberto = false;
    });

    const navLinks = [
        { href: "/plantao", label: "Plantão", emoji: "📋", reload: true },
        { href: "/meus-relatorios", label: "Meus Relatórios", emoji: "📁", reload: false },
    ];

    const adminLinks = [
        { href: "/dashboard", label: "Dashboard", emoji: "📊" },
        { href: "/extras", label: "Extras", emoji: "⏱️" },
        { href: "/admin", label: "Admin", emoji: "🔑" },
    ];

    function isActive(href: string): boolean {
        return data.pathname === href;
    }
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

<!-- Barra de navegação com Skeleton AppBar -->
{#if mostraNav}
    <header class="print:hidden no-print sticky top-0 z-50">
        <AppBar
            background="bg-surface-950"
            border="border-b border-primary-500/20"
            padding="px-4 py-2"
            classes="text-xs"
        >
            {#snippet lead()}
                <!-- Logo + links desktop -->
                <div class="flex items-center gap-3">
                    <span
                        class="text-primary-500 font-black uppercase tracking-wider text-[10px] shrink-0"
                    >DPI SUL</span>

                    <!-- Links desktop -->
                    <nav class="hidden md:flex gap-1">
                        {#each navLinks as link}
                            <a
                                href={link.href}
                                data-sveltekit-reload={link.reload || undefined}
                                class="px-3 py-1.5 rounded-lg transition font-bold text-xs
                                    {isActive(link.href)
                                        ? 'bg-primary-500 text-surface-950'
                                        : 'text-surface-300 hover:text-white hover:bg-white/10'}"
                            >{link.label}</a>
                        {/each}

                        {#if ehAdmin}
                            {#each adminLinks as link}
                                <a
                                    href={link.href}
                                    class="px-3 py-1.5 rounded-lg transition font-bold text-xs
                                        {isActive(link.href)
                                            ? 'bg-primary-500 text-surface-950'
                                            : 'text-surface-300 hover:text-white hover:bg-white/10'}"
                                >{link.label}</a>
                            {/each}
                        {/if}
                    </nav>
                </div>
            {/snippet}

            {#snippet trail()}
                <!-- Usuário + botão sair + hambúrguer -->
                <div class="flex items-center gap-2 md:gap-4">
                    <span
                        class="text-surface-400 font-mono hidden sm:block text-[11px] uppercase tracking-wider truncate max-w-[120px] md:max-w-none"
                    >{data.usuario?.nome}</span>

                    <div class="h-4 w-[1px] bg-surface-700 hidden sm:block"></div>

                    <!-- Botão Sair -->
                    <a
                        href="/logout"
                        class="flex items-center gap-2 text-error-400 hover:text-surface-950 hover:bg-error-500 font-bold border border-error-500/30 px-3 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                        title="Sair do sistema"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span class="hidden sm:inline">SAIR</span>
                    </a>

                    <!-- Hambúrguer mobile -->
                    <button
                        type="button"
                        onclick={() => (menuAberto = !menuAberto)}
                        class="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg border border-surface-700 hover:bg-white/10 transition"
                        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                        aria-expanded={menuAberto}
                    >
                        {#if menuAberto}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                class="text-surface-300">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                class="text-surface-300">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        {/if}
                    </button>
                </div>
            {/snippet}
        </AppBar>

        <!-- Menu mobile dropdown -->
        {#if menuAberto}
            <div
                class="md:hidden border-t border-primary-500/10 bg-surface-950 px-4 py-3 flex flex-col gap-1"
            >
                {#each navLinks as link}
                    <a
                        href={link.href}
                        data-sveltekit-reload={link.reload || undefined}
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition text-sm
                            {isActive(link.href)
                                ? 'bg-primary-500 text-surface-950'
                                : 'text-surface-300 hover:bg-white/10 hover:text-white'}"
                    >
                        <span class="text-base">{link.emoji}</span> {link.label}
                    </a>
                {/each}

                {#if ehAdmin}
                    <div class="border-t border-surface-800 my-1 pt-1">
                        <p class="text-[9px] text-surface-600 uppercase font-bold px-3 mb-1">Admin</p>
                        {#each adminLinks as link}
                            <a
                                href={link.href}
                                class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition text-sm
                                    {isActive(link.href)
                                        ? 'bg-primary-500 text-surface-950'
                                        : 'text-surface-300 hover:bg-white/10 hover:text-white'}"
                            >
                                <span class="text-base">{link.emoji}</span> {link.label}
                            </a>
                        {/each}
                    </div>
                {/if}

                <div class="border-t border-surface-800 mt-1 pt-2 px-3">
                    <p class="text-[10px] text-surface-500 uppercase font-bold truncate">
                        {data.usuario?.nome}
                    </p>
                </div>
            </div>
        {/if}
    </header>
{/if}

<div
    class="bg-surface-900 min-h-screen font-sans text-surface-50 antialiased selection:bg-primary-500 selection:text-surface-950 flex flex-col"
>
    {@render children()}
</div>
