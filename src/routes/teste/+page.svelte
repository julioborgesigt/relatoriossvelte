<script lang="ts">
	let contador = $state(0); // Lógica reativa do Svelte 5
</script>

<div class="p-8 flex flex-col items-center gap-4">
	<h1 class="text-2xl font-bold text-orange-600">Svelte dentro do SvelteKit</h1>
	<p>Você está na rota <span class="font-mono bg-gray-200 px-2">/teste</span> (SvelteKit)</p>
	
	<button 
		onclick={() => contador++}
		class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
	>
		Cliques: {contador}
	</button>
</div>