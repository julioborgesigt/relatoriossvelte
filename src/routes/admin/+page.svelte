<script lang="ts">
    import { enhance } from "$app/forms";

    let { data, form } = $props();

    let toastMensagem = $state("");
    let toastVisivel = $state(false);
    let toastErro = $state(false);
    let toastTimeout: ReturnType<typeof setTimeout> | null = null;

    function showToast(msg: string, erro: boolean = false) {
        toastMensagem = msg;
        toastErro = erro;
        toastVisivel = true;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastVisivel = false;
            toastTimeout = null;
        }, 3000);
    }

    function adminEnhance() {
        return async ({ result, update }: any) => {
            if (result.type === "success") {
                showToast("Operação realizada com sucesso!");
                await update();
            } else if (result.type === "failure") {
                showToast(result.data?.erro || "Erro na operação.", true);
                await update();
            } else {
                await update();
            }
        };
    }

    let delegaciasAdmin = $derived(data.delegaciasAdmin ?? []);
    let servidoresAdmin = $derived(data.servidoresAdmin ?? []);

    // Paginação Delegacias
    let paginaDelegacias = $state(1);
    const itensPorPagina = 10;
    let delegaciasPaginadas = $derived(
        delegaciasAdmin.slice(
            (paginaDelegacias - 1) * itensPorPagina,
            paginaDelegacias * itensPorPagina,
        ),
    );
    let totalPaginasDelegacias = $derived(
        Math.max(1, Math.ceil(delegaciasAdmin.length / itensPorPagina)),
    );

    // Paginação Servidores
    let paginaServidores = $state(1);
    let servidoresPaginados = $derived(
        servidoresAdmin.slice(
            (paginaServidores - 1) * itensPorPagina,
            paginaServidores * itensPorPagina,
        ),
    );
    let totalPaginasServidores = $derived(
        Math.max(1, Math.ceil(servidoresAdmin.length / itensPorPagina)),
    );

    // Ajuste de segurança caso apaguem a última linha de uma página e fiquem em página vazia
    $effect(() => {
        if (
            paginaDelegacias > totalPaginasDelegacias &&
            totalPaginasDelegacias > 0
        ) {
            paginaDelegacias = totalPaginasDelegacias;
        }
        if (
            paginaServidores > totalPaginasServidores &&
            totalPaginasServidores > 0
        ) {
            paginaServidores = totalPaginasServidores;
        }
    });
</script>

<div class="pb-10 relative">
    {#if toastVisivel}
        <div
            class="fixed top-5 right-5 z-50 {toastErro
                ? 'bg-red-900 border-red-500 text-red-200'
                : 'bg-emerald-900 border-emerald-500 text-emerald-200'} border px-5 py-3 rounded-xl shadow-2xl font-bold text-sm transition-opacity"
        >
            {toastErro ? "✗" : "✓"}
            {toastMensagem}
        </div>
    {/if}

    <main class="max-w-7xl mx-auto p-4 md:p-6">
        <h2
            class="text-2xl font-black text-white mb-6 uppercase tracking-tight"
        >
            Administração
        </h2>

        <!-- Unidades policiais -->
        <div
            class="bg-[#112240] rounded-xl border border-slate-700 p-6 mb-8 shadow-sm"
        >
            <h3 class="text-lg font-bold text-[#c5a059] mb-4 uppercase">
                Unidades Policiais
            </h3>
            <form
                method="POST"
                use:enhance={adminEnhance}
                class="flex flex-wrap gap-3 items-end mb-6"
            >
                <input type="hidden" name="acao" value="criar-delegacia" />
                <div class="flex-1 min-w-[200px]">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="nova-unidade-nome">Nome da Unidade</label
                    >
                    <input
                        id="nova-unidade-nome"
                        name="nome"
                        placeholder="Digite o nome..."
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div>
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="nova-unidade-status">Status</label
                    >
                    <select
                        id="nova-unidade-status"
                        name="status"
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                    >
                        <option value="SIM">SIM</option>
                        <option value="NAO">NÃO</option>
                        <option value="TEMPORARIO">TEMPORÁRIO</option>
                    </select>
                </div>
                <div>
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="nova-unidade-exp">Expiração</label
                    >
                    <input
                        id="nova-unidade-exp"
                        type="date"
                        name="data_expiracao"
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                    />
                </div>
                <button
                    type="submit"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
                    >➕ Adicionar</button
                >
            </form>

            <div class="overflow-x-auto rounded-xl border border-slate-700">
                <table class="w-full text-sm text-left text-slate-300">
                    <thead
                        class="bg-[#061325] text-xs uppercase text-slate-400 border-b border-slate-700"
                    >
                        <tr>
                            <th class="px-4 py-3 font-bold">Unidade e Opções</th
                            >
                            <th class="px-4 py-3 font-bold w-24 text-center"
                                >Ações</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700 bg-[#112240]">
                        {#each delegaciasPaginadas as d}
                            <tr class="hover:bg-slate-800/50 transition-colors">
                                <td class="px-4 py-3">
                                    <form
                                        method="POST"
                                        use:enhance={adminEnhance}
                                        class="flex flex-wrap items-center gap-2"
                                    >
                                        <input
                                            type="hidden"
                                            name="acao"
                                            value="editar-delegacia"
                                        />
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={d.id}
                                        />
                                        <input
                                            name="nome"
                                            value={d.nome}
                                            class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm flex-1 text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                                        />
                                        <select
                                            name="status"
                                            class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                                        >
                                            <option
                                                value="SIM"
                                                selected={d.status === "SIM"}
                                                >SIM</option
                                            >
                                            <option
                                                value="NAO"
                                                selected={d.status === "NAO"}
                                                >NÃO</option
                                            >
                                            <option
                                                value="TEMPORARIO"
                                                selected={d.status ===
                                                    "TEMPORARIO"}
                                                >TEMPORÁRIO</option
                                            >
                                        </select>
                                        <input
                                            type="date"
                                            name="data_expiracao"
                                            value={d.data_expiracao
                                                ? String(
                                                      d.data_expiracao,
                                                  ).split("T")[0]
                                                : ""}
                                            class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059]"
                                        />
                                        <button
                                            type="submit"
                                            class="bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059]/20 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Salvar</button
                                        >
                                    </form>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <form
                                        method="POST"
                                        use:enhance={adminEnhance}
                                    >
                                        <input
                                            type="hidden"
                                            name="acao"
                                            value="excluir-delegacia"
                                        />
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={d.id}
                                        />
                                        <button
                                            type="submit"
                                            class="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Excluir</button
                                        >
                                    </form>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Paginação Delegacias -->
            {#if totalPaginasDelegacias > 1}
                <div
                    class="mt-4 border-t border-slate-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                    <div class="text-xs text-slate-400 font-bold">
                        Página {paginaDelegacias} de {totalPaginasDelegacias > 0
                            ? totalPaginasDelegacias
                            : 1} — Total: {delegaciasAdmin.length} registros
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            onclick={() => (paginaDelegacias -= 1)}
                            disabled={paginaDelegacias <= 1}
                            class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            onclick={() => (paginaDelegacias += 1)}
                            disabled={paginaDelegacias >=
                                totalPaginasDelegacias}
                            class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Servidores policiais -->
        <!-- Servidores policiais -->
        <div
            class="bg-[#112240] rounded-xl border border-slate-700 p-6 shadow-sm"
        >
            <h3 class="text-lg font-bold text-[#c5a059] mb-4 uppercase">
                Servidores Policiais
            </h3>
            <form
                method="POST"
                use:enhance={adminEnhance}
                class="flex flex-wrap gap-3 items-end mb-6"
            >
                <input type="hidden" name="acao" value="criar-servidor" />
                <div class="flex-1 min-w-[200px]">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-nome">Nome</label
                    >
                    <input
                        id="novo-servidor-nome"
                        name="nome"
                        placeholder="Digite o nome..."
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-1/6">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-mat">Matrícula</label
                    >
                    <input
                        id="novo-servidor-mat"
                        name="matricula"
                        placeholder="Ex: 123456"
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-1/4">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-email">Email</label
                    >
                    <input
                        id="novo-servidor-email"
                        name="email"
                        type="email"
                        placeholder="email@exemplo.com"
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-1/5">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-cargo">Cargo</label
                    >
                    <input
                        id="novo-servidor-cargo"
                        name="cargo"
                        placeholder="Ex: Inspetor"
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-1/5">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-telefone">Telefone</label
                    >
                    <input
                        id="novo-servidor-telefone"
                        name="telefone"
                        placeholder="Apenas números"
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-1/4">
                    <label
                        class="block text-[10px] font-bold uppercase text-slate-400 mb-1"
                        for="novo-servidor-lotacao">Lotação</label
                    >
                    <input
                        id="novo-servidor-lotacao"
                        name="lotacao"
                        placeholder="Ex: DPI SUL"
                        required
                        class="w-full bg-[#061325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                    />
                </div>
                <div class="w-full sm:w-auto flex items-center h-[38px] px-2">
                    <label
                        class="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-400"
                    >
                        <input
                            id="novo-servidor-ativo"
                            type="checkbox"
                            name="ativo"
                            checked
                            class="w-4 h-4 text-[#c5a059] rounded border-slate-700 focus:ring-[#c5a059] bg-[#061325]"
                        />
                        Ativo
                    </label>
                </div>
                <button
                    type="submit"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
                    >➕ Adicionar</button
                >
            </form>

            <div class="overflow-x-auto rounded-xl border border-slate-700">
                <table class="w-full text-sm text-left text-slate-300">
                    <thead
                        class="bg-[#061325] text-xs uppercase text-slate-400 border-b border-slate-700"
                    >
                        <tr>
                            <th class="px-4 py-3 font-bold"
                                >Servidor e Informações</th
                            >
                            <th class="px-4 py-3 font-bold w-24 text-center"
                                >Ações</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700 bg-[#112240]">
                        {#each servidoresPaginados as s}
                            <tr class="hover:bg-slate-800/50 transition-colors">
                                <td class="px-4 py-3">
                                    <form
                                        method="POST"
                                        use:enhance={adminEnhance}
                                        class="flex flex-wrap items-center gap-2"
                                    >
                                        <input
                                            type="hidden"
                                            name="acao"
                                            value="editar-servidor"
                                        />
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={s.id}
                                        />
                                        <div
                                            class="flex flex-col gap-2 flex-1 min-w-[200px]"
                                        >
                                            <input
                                                name="nome"
                                                value={s.nome}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Nome"
                                            />
                                            <input
                                                name="email"
                                                value={s.email}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Email"
                                            />
                                        </div>
                                        <div class="flex flex-col gap-2 w-32">
                                            <input
                                                name="matricula"
                                                value={s.matricula}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 font-mono outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Matrícula"
                                            />
                                            <input
                                                name="telefone"
                                                value={s.telefone ?? ""}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Telefone"
                                            />
                                        </div>
                                        <div
                                            class="flex flex-col gap-2 flex-1 min-w-[150px]"
                                        >
                                            <input
                                                name="cargo"
                                                value={s.cargo ?? ""}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Cargo"
                                            />
                                            <input
                                                name="lotacao"
                                                value={s.lotacao ?? ""}
                                                class="bg-[#061325] border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-slate-200 outline-none focus:ring-2 focus:ring-[#c5a059] placeholder:text-slate-500"
                                                placeholder="Lotação"
                                            />
                                        </div>
                                        <label
                                            class="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                name="ativo"
                                                checked={s.ativo === 1}
                                                class="w-3.5 h-3.5 rounded text-[#c5a059] focus:ring-[#c5a059] bg-[#061325] border border-slate-700"
                                            /> Ativo
                                        </label>
                                        <button
                                            type="submit"
                                            class="bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059]/20 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Salvar</button
                                        >
                                    </form>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <form
                                        method="POST"
                                        use:enhance={adminEnhance}
                                    >
                                        <input
                                            type="hidden"
                                            name="acao"
                                            value="excluir-servidor"
                                        />
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={s.id}
                                        />
                                        <button
                                            type="submit"
                                            class="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Excluir</button
                                        >
                                    </form>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Paginação Servidores -->
            {#if totalPaginasServidores > 1}
                <div
                    class="mt-4 border-t border-slate-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                    <div class="text-xs text-slate-400 font-bold">
                        Página {paginaServidores} de {totalPaginasServidores > 0
                            ? totalPaginasServidores
                            : 1} — Total: {servidoresAdmin.length} registros
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            onclick={() => (paginaServidores -= 1)}
                            disabled={paginaServidores <= 1}
                            class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            onclick={() => (paginaServidores += 1)}
                            disabled={paginaServidores >=
                                totalPaginasServidores}
                            class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </main>
</div>
