<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData, PageData } from './$types';
    import { TIPOS_PROC, COR_TIPO_DARK, type TipoProc } from '$lib/constants';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    type Envolvido = { id: number; texto: string };
    type Procedimento = {
        id: number;
        tipo: TipoProc;
        numero: string;
        natureza: string;
        envolvidos: string;
        resumo: string;
        vitimas: Envolvido[];
        suspeitos: Envolvido[];
    };
    type Membro = {
        id: number;
        nome: string;
        matricula: string;
        cargo: string;
        lotacao: string;
        telefone: string;
        escala: 'Normal' | 'Extraordinaria';
        data_entrada: string;
        hora_entrada: string;
        data_saida: string;
        hora_saida: string;
        mostrarHorario: boolean;
    };

    // Estado inicializado com dados do relatório original
    let delegacia = $state(data.original.delegacia ?? '');
    let data_entrada = $state(data.original.data_entrada ?? '');
    let hora_entrada = $state(data.original.hora_entrada ?? '');
    let data_saida = $state(data.original.data_saida ?? '');
    let hora_saida = $state(data.original.hora_saida ?? '');
    let observacoes = $state(data.original.observacoes ?? '');

    // Quantitativos
    let q_bo = $state(data.original.q_bo ?? 0);
    let q_guias = $state(data.original.q_guias ?? 0);
    let q_apreensoes = $state(data.original.q_apreensoes ?? 0);
    let q_presos = $state(data.original.q_presos ?? 0);
    let q_medidas = $state(data.original.q_medidas ?? 0);
    let q_outros = $state(data.original.q_outros ?? 0);

    // Equipe inicializada do original
    let equipe = $state<Membro[]>(
        data.equipeOriginal.length > 0
            ? data.equipeOriginal.map((m, i) => ({
                id: i,
                nome: m.nome_servidor ?? '',
                matricula: m.matricula ?? '',
                cargo: m.cargo ?? '',
                lotacao: m.classe ?? '',   // coluna classe armazena lotação
                telefone: '',
                escala: (m.escala as 'Normal' | 'Extraordinaria') ?? 'Normal',
                data_entrada: m.data_entrada ?? '',
                hora_entrada: m.hora_entrada ?? '',
                data_saida: m.data_saida ?? '',
                hora_saida: m.hora_saida ?? '',
                mostrarHorario: false
            }))
            : [{ id: 0, nome: '', matricula: '', cargo: '', lotacao: '', telefone: '', escala: 'Normal' as const, data_entrada: '', hora_entrada: '', data_saida: '', hora_saida: '', mostrarHorario: false }]
    );
    let nextMembroId = $state(data.equipeOriginal.length);

    // Procedimentos inicializados do original
    let envolvidoCounter = $state(0);
    let procedimentos = $state<Procedimento[]>(
        data.procedimentosOriginal.map((p, i) => {
            const vitimas = (p.vitimas as string[]).map(texto => ({ id: envolvidoCounter++, texto }));
            if (vitimas.length === 0) vitimas.push({ id: envolvidoCounter++, texto: '' });
            const suspeitos = (p.suspeitos as string[]).map(texto => ({ id: envolvidoCounter++, texto }));
            if (suspeitos.length === 0) suspeitos.push({ id: envolvidoCounter++, texto: '' });
            return {
                id: i,
                tipo: p.tipo as TipoProc,
                numero: p.numero ?? '',
                natureza: p.natureza ?? '',
                envolvidos: p.envolvidos ?? '',
                resumo: p.resumo ?? '',
                vitimas,
                suspeitos
            };
        })
    );
    let nextProcId = $state(data.procedimentosOriginal.length);
    let nextEnvolvidoId = $state(envolvidoCounter);

    let carregando = $state(false);
    let relatorioFinalizado = $state(data.original.status === 'retificado');
    let protocoloGerado = $state(data.original.status === 'retificado' ? (data.original.protocolo ?? '') : '');
    let relatorioIdNovo = $state(data.original.status === 'retificado' ? data.original.id : 0);

    // Modal do relatório extra
    let mostrarModalExtra = $state(false);
    let justificativaExtra = $state('');
    let nomeDiretorExtra = $state('');
    let membrosExtraIncluidos = $state<string[]>([]);
    let membrosExtraordinarios = $derived(equipe.filter(m => m.escala === 'Extraordinaria'));

    const servidores = data.servidores ?? [];
    const delegacias = data.delegacias ?? [];

    // Quando o usuário navega para uma Nova Retificação (mesmo componente,
    // params diferentes), o SvelteKit reutiliza a instância e os $state
    // persistem. Este $effect detecta a troca de relatório e reseta o estado
    // de finalização para que o botão FINALIZAR apareça corretamente.
    // Reseta/inicializa o estado de finalização sempre que o relatório mudar
    // (ex: navegação de /retificar/5 para /retificar/7 — mesmo componente).
    // Se o relatório já foi retificado (status='retificado'), inicia como finalizado.
    $effect(() => {
        const isRetificado = data.original.status === 'retificado';
        relatorioFinalizado = isRetificado;
        protocoloGerado = isRetificado ? (data.original.protocolo ?? '') : '';
        relatorioIdNovo = isRetificado ? data.original.id : 0;
    });

    function abrirModalExtra() {
        justificativaExtra = `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${protocoloGerado}.`;
        membrosExtraIncluidos = membrosExtraordinarios.map(m => m.nome);
        mostrarModalExtra = true;
    }

    function toggleMembroExtra(nome: string) {
        if (membrosExtraIncluidos.includes(nome)) {
            membrosExtraIncluidos = membrosExtraIncluidos.filter(n => n !== nome);
        } else {
            membrosExtraIncluidos = [...membrosExtraIncluidos, nome];
        }
    }

    function gerarRelatorioExtra() {
        if (!nomeDiretorExtra.trim()) return;
        if (membrosExtraordinarios.length > 0 && membrosExtraIncluidos.length === 0) return;
        const url = new URL(`/plantao/extra/${relatorioIdNovo}`, window.location.origin);
        url.searchParams.set('dir', nomeDiretorExtra.trim());
        url.searchParams.set('just', justificativaExtra);
        if (membrosExtraIncluidos.length < membrosExtraordinarios.length) {
            url.searchParams.set('mb', membrosExtraIncluidos.join(','));
        }
        window.open(url.toString(), '_blank');
        mostrarModalExtra = false;
    }

    function adicionarMembro() {
        equipe.push({
            id: nextMembroId++, nome: '', matricula: '', cargo: '', lotacao: '', telefone: '',
            escala: 'Normal', data_entrada: data_entrada, hora_entrada: hora_entrada,
            data_saida: data_saida, hora_saida: hora_saida, mostrarHorario: false
        });
    }

    function removerMembro(id: number) {
        const idx = equipe.findIndex(m => m.id === id);
        if (idx > 0) equipe.splice(idx, 1);
    }

    function buscarServidor(nome: string, membroId: number) {
        const encontrado = servidores.find(s =>
            s.nome.toLowerCase() === nome.toLowerCase() || s.matricula === nome
        );
        if (encontrado) {
            const membro = equipe.find(m => m.id === membroId);
            if (membro) {
                membro.nome     = encontrado.nome;
                membro.matricula = encontrado.matricula;
                membro.cargo    = encontrado.cargo || '';
                membro.lotacao  = encontrado.lotacao || '';
            }
        }
    }

    function adicionarProcedimento(tipo: TipoProc) {
        procedimentos.push({
            id: nextProcId++, tipo, numero: '', natureza: '',
            envolvidos: '', resumo: '',
            vitimas: [{ id: nextEnvolvidoId++, texto: '' }],
            suspeitos: [{ id: nextEnvolvidoId++, texto: '' }]
        });
    }

    function removerProcedimento(id: number) {
        const idx = procedimentos.findIndex(p => p.id === id);
        if (idx >= 0) procedimentos.splice(idx, 1);
    }

    function adicionarVitima(procId: number) {
        const proc = procedimentos.find(p => p.id === procId);
        if (proc) proc.vitimas.push({ id: nextEnvolvidoId++, texto: '' });
    }

    function removerVitima(procId: number, vitimaId: number) {
        const proc = procedimentos.find(p => p.id === procId);
        if (proc && proc.vitimas.length > 1) {
            const idx = proc.vitimas.findIndex(v => v.id === vitimaId);
            if (idx >= 0) proc.vitimas.splice(idx, 1);
        }
    }

    function adicionarSuspeito(procId: number) {
        const proc = procedimentos.find(p => p.id === procId);
        if (proc) proc.suspeitos.push({ id: nextEnvolvidoId++, texto: '' });
    }

    function removerSuspeito(procId: number, suspeitoId: number) {
        const proc = procedimentos.find(p => p.id === procId);
        if (proc && proc.suspeitos.length > 1) {
            const idx = proc.suspeitos.findIndex(s => s.id === suspeitoId);
            if (idx >= 0) proc.suspeitos.splice(idx, 1);
        }
    }

    function calcularHoras(membro: Membro): string {
        const de = membro.data_entrada && membro.hora_entrada
            ? new Date(`${membro.data_entrada}T${membro.hora_entrada}`)
            : (data_entrada && hora_entrada ? new Date(`${data_entrada}T${hora_entrada}`) : null);
        const ate = membro.data_saida && membro.hora_saida
            ? new Date(`${membro.data_saida}T${membro.hora_saida}`)
            : (data_saida && hora_saida ? new Date(`${data_saida}T${hora_saida}`) : null);
        if (!de || !ate || isNaN(de.getTime()) || isNaN(ate.getTime())) return '—';
        const diff = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
        if (diff < 0 || diff > 72) return 'inválido';
        const h = Math.floor(diff);
        const m = Math.round((diff - h) * 60);
        return `${h}h${m > 0 ? m + 'm' : ''}`;
    }

    // Máscara para número do procedimento: xxx-xxxxx/xxxx
    function mascaraProcedimento(e: Event) {
        const input = e.target as HTMLInputElement;
        let v = input.value.replace(/\D/g, '').slice(0, 12);
        if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
        if (v.length > 9) v = v.slice(0, 9) + '/' + v.slice(9);
        input.value = v;
        const idx = parseInt(input.name.match(/proc_(\d+)_numero/)?.[1] ?? '-1');
        if (idx >= 0) {
            const proc = procedimentos.find((_, i) => i === idx);
            if (proc) proc.numero = v;
        }
    }

    function corTipo(tipo: string): string {
        return COR_TIPO_DARK[tipo] ?? 'bg-slate-800 border-slate-600 text-slate-300';
    }

</script>

<svelte:head>
    <title>Retificação {data.original.protocolo} — DPI SUL</title>
</svelte:head>

<!-- Modal: Configurar Relatório Extra -->
{#if mostrarModalExtra}
<div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div class="bg-[#0d2340] border border-[#c5a059]/40 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h3 class="text-[#c5a059] font-bold uppercase text-sm mb-1">Configurar Relatório Extra</h3>
        <p class="text-slate-400 text-xs mb-5">Preencha os campos antes de gerar o relatório para impressão.</p>

        <label class="block text-[#c5a059] text-xs font-bold uppercase mb-1">
            Justificativa do Serviço Extraordinário
        </label>
        <textarea bind:value={justificativaExtra} rows="4"
            placeholder="Descreva a justificativa para o serviço extraordinário..."
            class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm resize-none mb-4 focus:outline-none focus:border-[#c5a059] placeholder-slate-600">
        </textarea>

        <label class="block text-[#c5a059] text-xs font-bold uppercase mb-1">
            Diretor / Delegado Signatário <span class="text-red-400">*</span>
        </label>
        <input bind:value={nomeDiretorExtra} type="text"
            list="sugestoes-diretor-extra"
            placeholder="Nome completo do diretor ou delegado"
            class="w-full bg-[#0a192f] border border-[#c5a059]/30 rounded-lg p-3 text-white text-sm mb-1 focus:outline-none focus:border-[#c5a059] placeholder-slate-600" />
        <datalist id="sugestoes-diretor-extra">
            {#each equipe as m}
                {#if m.nome.trim()}
                    <option value={m.nome}>{m.cargo ? `${m.cargo}` : ''}</option>
                {/if}
            {/each}
        </datalist>
        {#if !nomeDiretorExtra.trim()}
            <p class="text-red-400 text-[11px] mb-4">Campo obrigatório para gerar o relatório.</p>
        {:else}
            <div class="mb-4"></div>
        {/if}

        {#if membrosExtraordinarios.length > 0}
            <label class="block text-[#c5a059] text-xs font-bold uppercase mb-2">
                Servidores em Escala Extraordinária
            </label>
            <div class="bg-[#0a192f] border border-[#c5a059]/20 rounded-lg p-3 mb-4 space-y-2 max-h-40 overflow-y-auto">
                {#each membrosExtraordinarios as membro}
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox"
                            checked={membrosExtraIncluidos.includes(membro.nome)}
                            onchange={() => toggleMembroExtra(membro.nome)}
                            class="accent-[#c5a059] w-4 h-4" />
                        <span class="text-white text-xs uppercase group-hover:text-[#c5a059] transition">
                            {membro.nome}
                        </span>
                    </label>
                {/each}
            </div>
            {#if membrosExtraIncluidos.length === 0}
                <p class="text-red-400 text-[11px] mb-3">Selecione ao menos um servidor.</p>
            {/if}
        {:else}
            <p class="text-slate-500 text-xs mb-4 italic">Nenhum servidor em escala extraordinária neste plantão.</p>
        {/if}

        <div class="flex gap-3 justify-end">
            <button type="button" onclick={() => mostrarModalExtra = false}
                class="px-5 py-2 text-slate-400 text-sm hover:text-white transition rounded-lg">
                Cancelar
            </button>
            <button type="button" onclick={gerarRelatorioExtra}
                disabled={!nomeDiretorExtra.trim() || (membrosExtraordinarios.length > 0 && membrosExtraIncluidos.length === 0)}
                class="bg-[#c5a059] text-[#0a192f] px-6 py-2 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition">
                Gerar Relatório
            </button>
        </div>
    </div>
</div>
{/if}

<div class="min-h-screen bg-[#0a192f] p-4 md:p-8 text-white font-sans">
    <div class="max-w-4xl mx-auto">

        <!-- Banner de retificação -->
        <div class="mb-4 bg-blue-900/40 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
            <span class="text-blue-400 text-lg">✏️</span>
            <div>
                <span class="font-bold uppercase tracking-wide">Retificação do relatório </span>
                <span class="font-mono font-black">{data.original.protocolo}</span>
                <span class="block text-xs text-blue-400 mt-0.5">Corrija os dados abaixo. Ao finalizar, o relatório original será marcado como retificado.</span>
            </div>
        </div>

        <!-- Header -->
        <header class="mb-6 flex justify-between items-start border-b border-[#c5a059] pb-4 flex-wrap gap-3">
            <div>
                <h1 class="text-2xl font-black text-[#c5a059] tracking-tight uppercase">Retificação de Plantão</h1>
                <p class="text-xs text-slate-400 uppercase tracking-widest mt-1">DPI SUL — Formulário Oficial</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="text-right">
                    <span class="text-xs font-bold text-[#c5a059]">{data.usuario?.nome ?? 'Usuário'}</span>
                    <span class="block text-xs text-slate-500 font-mono">{data.usuario?.matricula ?? ''}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <a href="/plantao/imprimir/{data.original.id}"
                        class="text-xs border border-slate-600 text-slate-400 px-3 py-1 rounded hover:bg-slate-800 transition">
                        ← Voltar
                    </a>
                    <a href="/logout"
                        class="flex items-center gap-1.5 bg-red-950/60 border border-red-700/50 text-red-400 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 hover:text-white hover:border-red-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair
                    </a>
                </div>
            </div>
        </header>

        {#if form && 'erro' in form && form.erro}
            <div class="mb-5 bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-xl text-sm">
                ✗ {form.erro}
            </div>
        {/if}

        <form method="POST" action="?/finalizar" use:enhance={() => {
            carregando = true;
            return async ({ result, update }) => {
                carregando = false;
                // invalidateAll: false → load não re-executa (evita o erro 400
                // "Apenas relatórios finalizados podem ser retificados" que
                // ocorreria porque o original já foi marcado como 'retificado')
                await update({ reset: false, invalidateAll: false });
                // Lê o resultado diretamente do callback (não do prop `form`)
                // para evitar que a prop persista na navegação para a Nova Retificação
                if (result.type === 'success' && (result.data as any)?.acao === 'finalizado') {
                    relatorioFinalizado = true;
                    protocoloGerado = (result.data as any).protocolo ?? '';
                    relatorioIdNovo = (result.data as any).id ?? 0;
                }
            };
        }}>

            <!-- ── Seção 1: Unidade e Período ── -->
            <section class="mb-6">
                <h2 class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]">1</span>
                    Dados do Período
                </h2>

                <div class="mb-4">
                    <label for="delegacia" class="block text-slate-300 text-xs font-bold uppercase mb-1">Unidade Policial de Atuação *</label>
                    <input
                        id="delegacia" name="delegacia" type="text"
                        list="lista-delegacias"
                        bind:value={delegacia}
                        placeholder="Digite ou selecione a delegacia..."
                        required
                        class="w-full bg-white/90 text-slate-900 p-3 rounded-lg font-medium focus:ring-2 focus:ring-[#c5a059] outline-none uppercase"
                    />
                    <datalist id="lista-delegacias">
                        {#each delegacias as d}
                            <option value={d.nome}>{d.nome}</option>
                        {/each}
                    </datalist>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label for="data_ent" class="block text-[#c5a059] text-[10px] font-bold uppercase mb-1">Entrada (Data) *</label>
                        <input id="data_ent" name="data_entrada" type="date" bind:value={data_entrada} required
                            class="w-full bg-white/90 text-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#c5a059] text-sm" />
                    </div>
                    <div>
                        <label for="hora_ent" class="block text-[#c5a059] text-[10px] font-bold uppercase mb-1">Entrada (Hora) *</label>
                        <input id="hora_ent" name="hora_entrada" type="time" bind:value={hora_entrada} required
                            class="w-full bg-white/90 text-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#c5a059] text-sm" />
                    </div>
                    <div>
                        <label for="data_said" class="block text-[#c5a059] text-[10px] font-bold uppercase mb-1">Saída (Data)</label>
                        <input id="data_said" name="data_saida" type="date" bind:value={data_saida}
                            class="w-full bg-white/90 text-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#c5a059] text-sm" />
                    </div>
                    <div>
                        <label for="hora_said" class="block text-[#c5a059] text-[10px] font-bold uppercase mb-1">Saída (Hora)</label>
                        <input id="hora_said" name="hora_saida" type="time" bind:value={hora_saida}
                            class="w-full bg-white/90 text-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#c5a059] text-sm" />
                    </div>
                </div>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 2: Equipe ── -->
            <section class="mb-6">
                <h2 class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]">2</span>
                    Composição da Equipe de Serviço
                </h2>

                <div class="space-y-3">
                    {#each equipe as membro, idx (membro.id)}
                        <div class="bg-black/20 border {membro.escala === 'Extraordinaria' || membro.mostrarHorario ? 'border-yellow-700/40' : 'border-[#c5a059]/20'} rounded-xl p-3">

                            <!-- Linha 1: Nome + controles -->
                            <div class="flex items-center gap-2 mb-2">
                                <label class="text-[#c5a059] text-[9px] font-black uppercase tracking-wider whitespace-nowrap">Nome do Policial</label>
                                <input
                                    name="equipe_{idx}_nome"
                                    type="text"
                                    list="lista-servidores"
                                    bind:value={membro.nome}
                                    onchange={() => buscarServidor(membro.nome, membro.id)}
                                    placeholder="Nome completo ou matrícula..."
                                    class="flex-1 bg-black/30 border-l-4 border-[#c5a059] text-white placeholder-slate-600 px-3 py-2 rounded-lg outline-none uppercase text-sm"
                                />
                                <span class="text-xs font-mono {membro.escala === 'Extraordinaria' ? 'text-yellow-400 bg-yellow-900/40 border border-yellow-700' : 'text-slate-500 bg-slate-800'} px-2 py-1.5 rounded font-bold min-w-[3rem] text-center">
                                    {calcularHoras(membro)}
                                </span>
                                <select name="equipe_{idx}_escala" bind:value={membro.escala}
                                    class="bg-slate-800 border border-slate-700 text-slate-300 text-xs p-2 rounded-lg outline-none">
                                    <option value="Normal">Normal</option>
                                    <option value="Extraordinaria">Extraordinária</option>
                                </select>
                                {#if membro.escala !== 'Extraordinaria'}
                                <button type="button"
                                    onclick={() => membro.mostrarHorario = !membro.mostrarHorario}
                                    class="text-xs border border-slate-700 text-slate-400 px-2 py-1.5 rounded hover:bg-slate-800 transition"
                                    title="Horário individual">🕐</button>
                                {/if}
                                {#if idx > 0}
                                    <button type="button" onclick={() => removerMembro(membro.id)}
                                        class="bg-red-900/50 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg transition text-xs font-bold">✕</button>
                                {/if}
                            </div>

                            <!-- Linha 2: Cargo | Matrícula | Telefone | Lotação -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                    <label class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Cargo</label>
                                    <input type="text" name="equipe_{idx}_cargo" bind:value={membro.cargo}
                                        placeholder="—"
                                        class="w-full bg-black/30 border border-slate-700 text-white text-xs px-2 py-1.5 rounded outline-none uppercase" />
                                </div>
                                <div>
                                    <label class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Matrícula</label>
                                    <input type="text" name="equipe_{idx}_matricula" bind:value={membro.matricula}
                                        placeholder="—"
                                        class="w-full bg-black/30 border border-slate-700 text-white text-xs px-2 py-1.5 rounded outline-none font-mono" />
                                </div>
                                <div>
                                    <label class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Telefone</label>
                                    <input type="text" bind:value={membro.telefone}
                                        placeholder="—"
                                        class="w-full bg-black/30 border border-slate-700 text-white text-xs px-2 py-1.5 rounded outline-none font-mono" />
                                </div>
                                <div>
                                    <label class="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Lotação</label>
                                    <input type="text" name="equipe_{idx}_classe" bind:value={membro.lotacao}
                                        placeholder="—"
                                        class="w-full bg-black/30 border border-slate-700 text-white text-xs px-2 py-1.5 rounded outline-none uppercase" />
                                </div>
                            </div>

                            <!-- Horário individual expandível -->
                            {#if membro.escala === 'Extraordinaria' || membro.mostrarHorario}
                                <div class="mt-2 bg-black/20 p-2.5 rounded-lg border border-slate-700">
                                    {#if membro.escala === 'Extraordinaria'}
                                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                                            <input type="checkbox" class="accent-yellow-400 w-3.5 h-3.5"
                                                onchange={(e) => {
                                                    if ((e.target as HTMLInputElement).checked) {
                                                        membro.data_entrada = data_entrada;
                                                        membro.hora_entrada = hora_entrada;
                                                        membro.data_saida = data_saida;
                                                        membro.hora_saida = hora_saida;
                                                    }
                                                }} />
                                            <span class="text-yellow-400 text-[10px] font-bold uppercase tracking-wide">Mesmo horário do plantão ordinário</span>
                                        </label>
                                    {/if}
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div>
                                            <label class="text-slate-400 text-[10px] uppercase">Entrada — Data</label>
                                            <input type="date" name="equipe_{idx}_data_entrada" bind:value={membro.data_entrada}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5" />
                                        </div>
                                        <div>
                                            <label class="text-slate-400 text-[10px] uppercase">Entrada — Hora</label>
                                            <input type="time" name="equipe_{idx}_hora_entrada" bind:value={membro.hora_entrada}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5" />
                                        </div>
                                        <div>
                                            <label class="text-slate-400 text-[10px] uppercase">Saída — Data</label>
                                            <input type="date" name="equipe_{idx}_data_saida" bind:value={membro.data_saida}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5" />
                                        </div>
                                        <div>
                                            <label class="text-slate-400 text-[10px] uppercase">Saída — Hora</label>
                                            <input type="time" name="equipe_{idx}_hora_saida" bind:value={membro.hora_saida}
                                                class="w-full bg-white/10 text-white p-1.5 rounded text-xs outline-none mt-0.5" />
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <datalist id="lista-servidores">
                    {#each servidores as s}
                        <option value={s.nome}>{s.cargo} — Mat. {s.matricula}</option>
                    {/each}
                </datalist>

                <button type="button" onclick={adicionarMembro}
                    class="mt-3 text-xs font-bold text-[#c5a059] border border-[#c5a059] px-3 py-2 rounded-lg hover:bg-[#c5a059] hover:text-[#0a192f] transition-colors">
                    + ADICIONAR POLICIAL
                </button>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 3: Quantitativos ── -->
            <section class="mb-6">
                <h2 class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]">3</span>
                    Procedimentos Quantitativos
                </h2>
                <div class="grid grid-cols-3 md:grid-cols-6 gap-3 bg-black/20 p-4 rounded-xl border border-dashed border-[#c5a059]/40">
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">B.O.</label>
                        <input type="number" name="q_bo" min="0" bind:value={q_bo}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">Guias</label>
                        <input type="number" name="q_guias" min="0" bind:value={q_guias}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">Apreensões</label>
                        <input type="number" name="q_apreensoes" min="0" bind:value={q_apreensoes}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">Presos</label>
                        <input type="number" name="q_presos" min="0" bind:value={q_presos}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">Med. Prot.</label>
                        <input type="number" name="q_medidas" min="0" bind:value={q_medidas}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                        <label class="block text-[#c5a059] text-[10px] font-bold text-center uppercase mb-1">Outros</label>
                        <input type="number" name="q_outros" min="0" bind:value={q_outros}
                            class="w-full text-center bg-white/90 text-slate-900 p-2 rounded-lg font-bold outline-none text-lg focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                </div>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 4: Procedimentos Qualitativos ── -->
            <section class="mb-6">
                <h2 class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]">4</span>
                    Procedimentos Qualitativos
                    <span class="text-slate-500 text-[10px] font-normal">(Detalhe cada ocorrência registrada)</span>
                </h2>

                <div class="flex flex-wrap gap-2 mb-4">
                    {#each TIPOS_PROC as tipo}
                        <button type="button" onclick={() => adicionarProcedimento(tipo)}
                            class="text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:brightness-110 {
                                tipo === 'IP-FLAGRANTE' ? 'bg-red-900/40 border-red-700 text-red-300 hover:bg-red-800/60' :
                                tipo === 'IP-PORTARIA' ? 'bg-orange-900/40 border-orange-700 text-orange-300 hover:bg-orange-800/60' :
                                tipo === 'TCO' ? 'bg-blue-900/40 border-blue-700 text-blue-300 hover:bg-blue-800/60' :
                                'bg-purple-900/40 border-purple-700 text-purple-300 hover:bg-purple-800/60'
                            }">
                            + {tipo}
                        </button>
                    {/each}
                </div>

                {#if procedimentos.length === 0}
                    <div class="text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-600 text-sm">
                        Nenhum procedimento qualitativo. Use os botões acima para adicionar.
                    </div>
                {/if}

                <div class="space-y-4">
                    {#each procedimentos as proc, idx (proc.id)}
                        <div class="border rounded-xl p-4 {corTipo(proc.tipo)}">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs font-black uppercase tracking-widest">{proc.tipo}</span>
                                <button type="button" onclick={() => removerProcedimento(proc.id)}
                                    class="text-current opacity-60 hover:opacity-100 text-xs border border-current px-2 py-0.5 rounded transition">
                                    ✕ Remover
                                </button>
                            </div>

                            <input type="hidden" name="proc_{idx}_tipo" value={proc.tipo} />

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label class="text-[10px] font-bold uppercase opacity-70 block mb-1">Número do Procedimento</label>
                                    <input type="text" name="proc_{idx}_numero" bind:value={proc.numero}
                                        placeholder="000-00000/0000"
                                        maxlength="14"
                                        oninput={mascaraProcedimento}
                                        class="w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current font-mono" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-bold uppercase opacity-70 block mb-1">Natureza / Infração *</label>
                                    <input type="text" name="proc_{idx}_natureza" bind:value={proc.natureza}
                                        placeholder="Ex: Tráfico de Entorpecentes"
                                        required
                                        class="w-full bg-black/30 border border-current/30 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-current uppercase" />
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="text-[10px] font-bold uppercase opacity-70 block mb-1">Vítimas / Ofendidos</label>
                                {#each proc.vitimas as vitima, vi (vitima.id)}
                                    <div class="flex gap-2 mb-1">
                                        <input type="text" name="proc_{idx}_vitima_{vi}" bind:value={vitima.texto}
                                            placeholder="Nome e qualificação..."
                                            class="flex-1 bg-black/20 border border-current/20 text-white p-2 rounded text-xs outline-none uppercase" />
                                        {#if proc.vitimas.length > 1}
                                            <button type="button" onclick={() => removerVitima(proc.id, vitima.id)}
                                                class="text-current opacity-50 hover:opacity-100 px-2 text-xs transition">✕</button>
                                        {/if}
                                    </div>
                                {/each}
                                <button type="button" onclick={() => adicionarVitima(proc.id)}
                                    class="text-[10px] opacity-60 hover:opacity-100 transition">+ Adicionar vítima</button>
                            </div>

                            <div class="mb-3">
                                <label class="text-[10px] font-bold uppercase opacity-70 block mb-1">Suspeitos / Indiciados</label>
                                {#each proc.suspeitos as suspeito, si (suspeito.id)}
                                    <div class="flex gap-2 mb-1">
                                        <input type="text" name="proc_{idx}_suspeito_{si}" bind:value={suspeito.texto}
                                            placeholder="Nome e qualificação..."
                                            class="flex-1 bg-black/20 border border-current/20 text-white p-2 rounded text-xs outline-none uppercase" />
                                        {#if proc.suspeitos.length > 1}
                                            <button type="button" onclick={() => removerSuspeito(proc.id, suspeito.id)}
                                                class="text-current opacity-50 hover:opacity-100 px-2 text-xs transition">✕</button>
                                        {/if}
                                    </div>
                                {/each}
                                <button type="button" onclick={() => adicionarSuspeito(proc.id)}
                                    class="text-[10px] opacity-60 hover:opacity-100 transition">+ Adicionar suspeito</button>
                            </div>

                            <div>
                                <label class="text-[10px] font-bold uppercase opacity-70 block mb-1">Resumo dos Fatos</label>
                                <textarea name="proc_{idx}_resumo" bind:value={proc.resumo} rows="3"
                                    placeholder="Descreva os fatos em detalhes..."
                                    class="w-full bg-black/20 border border-current/20 text-white p-2 rounded-lg text-sm outline-none resize-y uppercase"></textarea>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <hr class="border-[#c5a059]/20 my-6" />

            <!-- ── Seção 5: Observações ── -->
            <section class="mb-8">
                <h2 class="text-[#c5a059] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="bg-[#c5a059] text-[#0a192f] px-2 py-0.5 rounded text-[10px]">5</span>
                    Observações Gerais
                </h2>
                <textarea name="observacoes" bind:value={observacoes} rows="4"
                    placeholder="Registre aqui quaisquer observações relevantes sobre o plantão..."
                    class="w-full bg-black/20 border border-slate-700 text-white placeholder-slate-600 p-3 rounded-xl outline-none resize-y text-sm focus:ring-2 focus:ring-[#c5a059] uppercase"></textarea>
            </section>

            <!-- ── Barra de ações ── -->
            <div class="pt-6 border-t border-[#c5a059]/30">
                <div class="flex flex-wrap justify-center gap-2">

                    {#if !relatorioFinalizado}
                        <button type="submit"
                            disabled={carregando}
                            class="px-6 py-2.5 bg-gradient-to-r from-[#8a6d3b] to-[#c5a059] text-[#0a192f] text-xs font-black rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider">
                            {carregando ? 'PROCESSANDO...' : '✓ FINALIZAR RETIFICAÇÃO'}
                        </button>
                    {/if}

                    <a href={relatorioFinalizado ? `/plantao/imprimir/${relatorioIdNovo}` : '#'}
                        target={relatorioFinalizado ? '_blank' : undefined}
                        class="px-4 py-2.5 bg-emerald-700 text-white text-xs font-black rounded-lg transition
                               {relatorioFinalizado ? 'hover:bg-emerald-600 cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none'}">
                        🖨 PLANTÃO
                    </a>

                    <button type="button"
                        disabled={!relatorioFinalizado}
                        onclick={abrirModalExtra}
                        class="px-4 py-2.5 bg-cyan-700 text-white text-xs font-black rounded-lg transition
                               {relatorioFinalizado ? 'hover:bg-cyan-600' : 'opacity-40 cursor-not-allowed'}">
                        📋 EXTRA
                    </button>

                    {#if relatorioFinalizado}
                        <button type="button"
                            onclick={() => { relatorioFinalizado = false; }}
                            class="px-4 py-2.5 bg-amber-700 text-white text-xs font-black rounded-lg hover:bg-amber-600 transition">
                            ✏️ NOVA RETIFICAÇÃO
                        </button>
                    {/if}
                </div>

                {#if relatorioFinalizado}
                    <p class="text-center mt-3 font-mono text-emerald-400 font-black text-sm tracking-widest">
                        ✅ {protocoloGerado} — Retificação finalizada
                        <a href="/plantao" class="ml-4 text-[10px] border border-slate-600 text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-800 transition font-sans font-bold uppercase">+ Novo Relatório</a>
                    </p>
                {:else}
                    <p class="text-slate-600 text-[10px] text-center mt-2 uppercase tracking-wider">
                        🖨 PLANTÃO e 📋 EXTRA serão habilitados após a finalização
                    </p>
                {/if}
            </div>
        </form>
    </div>
</div>
