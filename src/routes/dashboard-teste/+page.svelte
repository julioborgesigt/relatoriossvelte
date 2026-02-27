<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let busca = $state('');
	// Estado para a confirmação visual (Toast)
	let mensagemConfirmacao = $state('');

	// Filtro reativo do Svelte 5
	let filtrados = $derived(
		(data.registros || []).filter((r: any) =>
			r.nome_indiciado?.toLowerCase().includes(busca.toLowerCase())
		)
	);

	/**
	 * Função para exibir a confirmação visual temporária
	 */
	function dispararNotificacao(status: string) {
		mensagemConfirmacao =
			status === 'concluida'
				? '✅ Remoção marcada como CONCLUÍDA'
				: '⚠️ Remoção revertida para PENDENTE';

		// Esconde a mensagem após 3 segundos
		setTimeout(() => {
			mensagemConfirmacao = '';
		}, 3000);
	}
</script>

{#if mensagemConfirmacao}
	<div
		class="fixed right-5 top-5 z-50 animate-bounce rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all"
	>
		{mensagemConfirmacao}
	</div>
{/if}

<div class="min-h-screen bg-slate-50 p-4 md:p-8">
	<header class="mx-auto mb-8 max-w-6xl">
		<h1 class="text-3xl font-black tracking-tight text-slate-800">Painel de Controle</h1>
		<p class="text-slate-500">
			Monitoramento do banco <span class="rounded bg-blue-50 px-2 font-mono text-blue-600"
				>remocoespcce</span
			>
		</p>
	</header>

	<main class="mx-auto max-w-6xl">
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<span class="text-xs font-bold uppercase text-slate-400">Total Geral</span>
				<p class="text-3xl font-black text-slate-800">{data.estatisticas.total}</p>
			</div>
			<div
				class="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-6 shadow-sm"
			>
				<span class="text-xs font-bold uppercase text-slate-400">Pendentes</span>
				<p class="text-3xl font-black text-slate-800">{data.estatisticas.pendentes}</p>
			</div>
			<div
				class="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm"
			>
				<span class="text-xs font-bold uppercase text-slate-400">Concluídas</span>
				<p class="text-3xl font-black text-slate-800">{data.estatisticas.concluidas}</p>
			</div>
		</div>

		<div class="relative mb-6">
			<input
				bind:value={busca}
				placeholder="Pesquisar indiciado..."
				class="w-full rounded-xl border border-slate-200 p-4 pl-12 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<span class="absolute left-4 top-4 text-slate-400">🔍</span>
		</div>

		{#if filtrados.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center"
			>
				<p class="text-slate-400">Nenhum registro corresponde à sua busca.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filtrados as item}
					<div
						class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
					>
						<div>
							<div class="mb-3 flex items-start justify-between">
								<h3 class="font-bold leading-tight text-slate-800">{item.nome_indiciado}</h3>
								<span
									class="rounded-full px-2 py-1 text-[10px] font-bold uppercase {item.status ===
									'pendente'
										? 'bg-amber-100 text-amber-700'
										: 'bg-emerald-100 text-emerald-700'}"
								>
									{item.status}
								</span>
							</div>
							<div class="space-y-1 text-sm text-slate-500">
								<p>📍 <span class="font-medium">Origem:</span> {item.origem}</p>
								<p>🏁 <span class="font-medium">Destino:</span> {item.destino}</p>
							</div>
						</div>

						<form
                            method="POST"
                            action="?/atualizarStatus"
                            use:enhance={() => {
                                return async ({ result, update }) => {
                                    // Verificamos se o sucesso ocorreu e se o dado é realmente uma string
                                    if (result.type === 'success' && typeof result.data?.statusAlterado === 'string') {
                                        dispararNotificacao(result.data.statusAlterado);
                                    }
                                    await update();
                                };
                            }}
                            class="mt-4"
                        >
							<input type="hidden" name="id" value={item.id} />

							{#if item.status === 'pendente'}
								<input type="hidden" name="status" value="concluida" />
								<button
									type="submit"
									class="w-full rounded-lg bg-emerald-500 py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-emerald-600"
								>
									CONCLUIR REMOÇÃO
								</button>
							{:else}
								<input type="hidden" name="status" value="pendente" />
								<button
									type="submit"
									class="w-full rounded-lg bg-slate-200 py-2 text-[10px] font-bold tracking-widest text-slate-600 transition-colors hover:bg-slate-300"
								>
									REVERTER PARA PENDENTE
								</button>
							{/if}
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>