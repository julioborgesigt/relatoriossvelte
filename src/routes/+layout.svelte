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
        class="print:hidden no-print bg-[#061325] border-b border-[#c5a059]/20 px-4 py-2 flex items-center justify-between text-xs"
    >
        <div class="flex items-center gap-4">
            <span
                class="text-[#c5a059] font-black uppercase tracking-wider text-[10px]"
                >DPI SUL</span
            >
            <div class="flex gap-1">
                <a
                    href="/plantao"
                    data-sveltekit-reload
                    class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                    '/plantao'
                        ? 'bg-[#c5a059] text-[#0a192f]'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                >
                    Plantão
                </a>

                <a
                    href="/meus-relatorios"
                    class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                    '/meus-relatorios'
                        ? 'bg-[#c5a059] text-[#0a192f]'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                >
                    Meus Relatórios
                </a>

                {#if ehAdmin}
                    <a
                        href="/dashboard"
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/dashboard'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                    >
                        Dashboard
                    </a>

                    <a
                        href="/extras"
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/extras'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                    >
                        Extras
                    </a>

                    <a
                        href="/admin"
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/admin'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                    >
                        Admin
                    </a>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-3 md:gap-4">
            <span
                class="text-slate-400/80 font-mono hidden sm:block text-[11px] uppercase tracking-wider"
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span class="hidden sm:inline">SAIR</span>
            </a>
        </div>
    </nav>
{/if}

<div
    class="bg-[#0a192f] min-h-screen font-sans text-slate-200 antialiased selection:bg-[#c5a059] selection:text-[#0a192f] flex flex-col"
>
    {@render children()}
</div>
