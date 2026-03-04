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
                    class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                    '/plantao'
                        ? 'bg-[#c5a059] text-[#0a192f]'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                >
                    Plantao
                </a>
                {#if data.usuario?.matricula === "00000000"}
                    <a
                        href="/dashboard"
                        class="px-3 py-1.5 rounded-lg transition font-bold {data.pathname ===
                        '/dashboard'
                            ? 'bg-[#c5a059] text-[#0a192f]'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'}"
                    >
                        Dashboard
                    </a>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-slate-500 font-mono hidden sm:block"
                >{data.usuario?.nome}</span
            >
            <a
                href="/logout"
                class="text-red-400 hover:text-red-300 font-bold transition"
            >
                Sair
            </a>
        </div>
    </nav>
{/if}

{@render children()}
