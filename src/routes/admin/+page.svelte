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
</script>

<div class="min-h-screen bg-slate-100 pb-10 relative">
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
        <h2 class="text-2xl font-black text-slate-800 mb-6 uppercase">
            Administração
        </h2>

        <!-- Unidades policiais -->
        <div
            class="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] bg-white"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
                    />
                </div>
                <button
                    type="submit"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
                    >➕ Adicionar</button
                >
            </form>

            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead
                        class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200"
                    >
                        <tr>
                            <th class="px-4 py-3 font-bold">Unidade e Opções</th
                            >
                            <th class="px-4 py-3 font-bold w-24 text-center"
                                >Ações</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each delegaciasAdmin as d}
                            <tr class="hover:bg-slate-50 transition-colors">
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
                                            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 outline-none focus:ring-2 focus:ring-[#c5a059]"
                                        />
                                        <select
                                            name="status"
                                            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c5a059] bg-white"
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
                                            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
                                        />
                                        <button
                                            type="submit"
                                            class="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
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
                                            class="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Excluir</button
                                        >
                                    </form>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Servidores policiais -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c5a059]"
                    />
                </div>
                <div class="w-full sm:w-auto flex items-center h-[38px] px-2">
                    <label
                        class="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600"
                    >
                        <input
                            id="novo-servidor-ativo"
                            type="checkbox"
                            name="ativo"
                            checked
                            class="w-4 h-4 text-[#c5a059] rounded border-slate-300 focus:ring-[#c5a059]"
                        />
                        Ativo
                    </label>
                </div>
                <button
                    type="submit"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
                    >➕ Adicionar</button
                >
            </form>

            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead
                        class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200"
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
                    <tbody class="divide-y divide-slate-100">
                        {#each servidoresAdmin as s}
                            <tr class="hover:bg-slate-50 transition-colors">
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
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Nome"
                                            />
                                            <input
                                                name="email"
                                                value={s.email}
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Email"
                                            />
                                        </div>
                                        <div class="flex flex-col gap-2 w-32">
                                            <input
                                                name="matricula"
                                                value={s.matricula}
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full font-mono outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Matrícula"
                                            />
                                            <input
                                                name="telefone"
                                                value={s.telefone ?? ""}
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Telefone"
                                            />
                                        </div>
                                        <div
                                            class="flex flex-col gap-2 flex-1 min-w-[150px]"
                                        >
                                            <input
                                                name="cargo"
                                                value={s.cargo ?? ""}
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Cargo"
                                            />
                                            <input
                                                name="lotacao"
                                                value={s.lotacao ?? ""}
                                                class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                placeholder="Lotação"
                                            />
                                        </div>
                                        <label
                                            class="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                name="ativo"
                                                checked={s.ativo === 1}
                                                class="w-3.5 h-3.5 rounded text-[#c5a059] focus:ring-[#c5a059]"
                                            /> Ativo
                                        </label>
                                        <button
                                            type="submit"
                                            class="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
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
                                            class="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                            >Excluir</button
                                        >
                                    </form>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</div>
