import { getContext, setContext } from 'svelte';
import type { TipoProc } from '$lib/constants';

export type Envolvido = { id: number; texto: string };
export type Procedimento = {
    id: number;
    tipo: TipoProc;
    numero: string;
    natureza: string;
    envolvidos: string;
    resumo: string;
    vitimas: Envolvido[];
    suspeitos: Envolvido[];
};
export type Membro = {
    id: number;
    nome: string;
    matricula: string;
    cargo: string;
    telefone: string;
    lotacao: string;
    escala: "Normal" | "Extraordinaria" | "";
    data_entrada: string;
    hora_entrada: string;
    data_saida: string;
    hora_saida: string;
    mostrarHorario: boolean;
};

export function getLocalYYYYMMDD(d: Date) {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
}

export class PlantaoFormState {
    delegacia = $state("");
    data_entrada = $state("");
    hora_entrada = $state("");
    data_saida = $state("");
    hora_saida = $state("");
    observacoes = $state("");

    q_bo = $state(0);
    q_guias = $state(0);
    q_apreensoes = $state(0);
    q_presos = $state(0);
    q_medidas = $state(0);
    q_outros = $state(0);

    equipe = $state<Membro[]>([]);
    procedimentos = $state<Procedimento[]>([]);

    carregando = $state(false);
    mostrarModalRascunho = $state(false);
    mostrarModalRetificar = $state(false);
    codigoRetificar = $state("");
    erroRetificar = $state("");
    isDirty = $state(false);

    relatorioFinalizado = $state(false);
    protocoloGerado = $state("");
    relatorioId = $state(0);

    mostrarModalExtra = $state(false);
    justificativaExtra = $state("");
    nomeDiretorExtra = $state("");
    membrosExtraIncluidos = $state<string[]>([]);

    private membroIdCounter = 0;
    private procIdCounter = 0;
    private envolvidoCounter = 0;

    constructor(
        isRetificacao: boolean,
        dadosIniciais: any,
        equipeInicial: any[],
        procedimentosIniciais: any[]
    ) {
        const hoje = new Date();
        const amanha = new Date();
        amanha.setDate(hoje.getDate() + 1);

        this.data_entrada = getLocalYYYYMMDD(hoje);
        this.data_saida = getLocalYYYYMMDD(amanha);

        this.init(isRetificacao, dadosIniciais, equipeInicial, procedimentosIniciais);

        // Sempre forçar no mínimo 1 membro inicial se for criação
        if (this.equipe.length === 0) {
            this.equipe = [{
                id: ++this.membroIdCounter, nome: "", matricula: "", cargo: "", telefone: "", lotacao: "", escala: "",
                data_entrada: "", hora_entrada: "", data_saida: "", hora_saida: "", mostrarHorario: false
            }];
        }
    }

    init(isRetificacao: boolean, dados: any, equipeInicial: any[], procIniciais: any[]) {
        if (!dados) return;

        if (dados.delegacia) this.delegacia = dados.delegacia;
        if (dados.data_entrada) this.data_entrada = dados.data_entrada;
        if (dados.hora_entrada) this.hora_entrada = dados.hora_entrada;
        if (dados.data_saida) this.data_saida = dados.data_saida;
        if (dados.hora_saida) this.hora_saida = dados.hora_saida;
        if (dados.observacoes) this.observacoes = dados.observacoes;

        this.q_bo = dados.q_bo ?? 0;
        this.q_guias = dados.q_guias ?? 0;
        this.q_apreensoes = dados.q_apreensoes ?? 0;
        this.q_presos = dados.q_presos ?? 0;
        this.q_medidas = dados.q_medidas ?? 0;
        this.q_outros = dados.q_outros ?? 0;

        if (equipeInicial && equipeInicial.length > 0) {
            this.equipe = equipeInicial.map((m: any, i: number) => ({
                id: ++this.membroIdCounter,
                nome: m.nome_servidor ?? m.nome ?? "",
                matricula: m.matricula ?? "",
                cargo: m.cargo ?? "",
                telefone: m.telefone ?? "",
                lotacao: m.lotacao ?? m.classe ?? "",
                escala: (m.escala as "Normal" | "Extraordinaria" | "") ?? "",
                data_entrada: m.data_entrada ?? "",
                hora_entrada: m.hora_entrada ?? "",
                data_saida: m.data_saida ?? "",
                hora_saida: m.hora_saida ?? "",
                mostrarHorario: false,
            }));
        }

        if (procIniciais && procIniciais.length > 0) {
            this.procedimentos = procIniciais.map((p: any) => {
                const vitimas = (p.vitimas as string[]).map((texto: string) => ({ id: ++this.envolvidoCounter, texto }));
                if (vitimas.length === 0) vitimas.push({ id: ++this.envolvidoCounter, texto: "" });

                const suspeitos = (p.suspeitos as string[]).map((texto: string) => ({ id: ++this.envolvidoCounter, texto }));
                if (suspeitos.length === 0) suspeitos.push({ id: ++this.envolvidoCounter, texto: "" });

                return {
                    id: ++this.procIdCounter,
                    tipo: p.tipo as TipoProc,
                    numero: p.numero ?? "",
                    natureza: p.natureza ?? "",
                    envolvidos: p.envolvidos ?? "",
                    resumo: p.resumo ?? "",
                    vitimas,
                    suspeitos,
                };
            });
        }

        if (isRetificacao && dados?.status === "retificado") {
            this.relatorioFinalizado = true;
            this.protocoloGerado = dados.protocolo ?? "";
            this.relatorioId = dados.id ?? 0;
        } else if (!isRetificacao && dados.id) {
            this.relatorioId = dados.id;
        }
    }

    marcarDirty() {
        this.isDirty = true;
    }

    get duracaoHoras() {
        if (!this.data_entrada || !this.hora_entrada || !this.data_saida || !this.hora_saida)
            return null;
        const de = new Date(`${this.data_entrada}T${this.hora_entrada}`);
        const ate = new Date(`${this.data_saida}T${this.hora_saida}`);
        if (isNaN(de.getTime()) || isNaN(ate.getTime())) return null;
        return (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
    }

    get duracaoInvalida() {
        const d = this.duracaoHoras;
        return d !== null && (d <= 0 || d > 24);
    }

    membroExtraForaDoPlantao(membro: Membro): boolean {
        if (membro.escala !== "Extraordinaria") return false;
        if (!this.data_entrada || !this.hora_entrada || !this.data_saida || !this.hora_saida)
            return false;
        const entradaPlantao = new Date(`${this.data_entrada}T${this.hora_entrada}`);
        const saidaPlantao = new Date(`${this.data_saida}T${this.hora_saida}`);
        const entradaMembro =
            membro.data_entrada && membro.hora_entrada
                ? new Date(`${membro.data_entrada}T${membro.hora_entrada}`)
                : entradaPlantao;
        const saidaMembro =
            membro.data_saida && membro.hora_saida
                ? new Date(`${membro.data_saida}T${membro.hora_saida}`)
                : saidaPlantao;
        if (isNaN(entradaMembro.getTime()) || isNaN(saidaMembro.getTime()))
            return false;
        return entradaMembro < entradaPlantao || saidaMembro > saidaPlantao;
    }

    get temErrosHorario() {
        return this.duracaoInvalida || this.equipe.some((m) => this.membroExtraForaDoPlantao(m));
    }

    get membrosExtraordinarios() {
        return this.equipe.filter((m) => m.escala === "Extraordinaria");
    }

    adicionarMembro() {
        this.equipe.push({
            id: ++this.membroIdCounter,
            nome: "", matricula: "", cargo: "", telefone: "", lotacao: "", escala: "",
            data_entrada: this.data_entrada, hora_entrada: this.hora_entrada,
            data_saida: this.data_saida, hora_saida: this.hora_saida,
            mostrarHorario: false,
        });
        this.marcarDirty();
    }

    removerMembro(id: number) {
        const idx = this.equipe.findIndex((m) => m.id === id);
        if (idx > 0) this.equipe.splice(idx, 1);
        this.marcarDirty();
    }

    buscarServidor(nome: string, membroId: number, servidores: any[]) {
        const encontrado = servidores.find(
            (s) => s.nome.toLowerCase() === nome.toLowerCase() || s.matricula === nome
        );
        if (encontrado) {
            const membro = this.equipe.find((m) => m.id === membroId);
            if (membro) {
                membro.nome = encontrado.nome;
                membro.matricula = encontrado.matricula;
                membro.cargo = encontrado.cargo || "";
                membro.lotacao = encontrado.lotacao || "";
            }
        }
        this.marcarDirty();
    }

    adicionarProcedimento(tipo: TipoProc) {
        this.procedimentos.push({
            id: ++this.procIdCounter,
            tipo, numero: "", natureza: "", envolvidos: "", resumo: "",
            vitimas: [{ id: ++this.envolvidoCounter, texto: "" }],
            suspeitos: [{ id: ++this.envolvidoCounter, texto: "" }],
        });
        this.marcarDirty();
    }

    removerProcedimento(id: number) {
        const idx = this.procedimentos.findIndex((p) => p.id === id);
        if (idx >= 0) this.procedimentos.splice(idx, 1);
        this.marcarDirty();
    }

    adicionarVitima(procId: number) {
        const proc = this.procedimentos.find((p) => p.id === procId);
        if (proc) proc.vitimas.push({ id: ++this.envolvidoCounter, texto: "" });
    }

    removerVitima(procId: number, vitimaId: number) {
        const proc = this.procedimentos.find((p) => p.id === procId);
        if (proc && proc.vitimas.length > 1) {
            const idx = proc.vitimas.findIndex((v) => v.id === vitimaId);
            if (idx >= 0) proc.vitimas.splice(idx, 1);
        }
    }

    adicionarSuspeito(procId: number) {
        const proc = this.procedimentos.find((p) => p.id === procId);
        if (proc) proc.suspeitos.push({ id: ++this.envolvidoCounter, texto: "" });
    }

    removerSuspeito(procId: number, suspeitoId: number) {
        const proc = this.procedimentos.find((p) => p.id === procId);
        if (proc && proc.suspeitos.length > 1) {
            const idx = proc.suspeitos.findIndex((s) => s.id === suspeitoId);
            if (idx >= 0) proc.suspeitos.splice(idx, 1);
        }
    }

    calcularHoras(membro: Membro): string {
        const de = membro.data_entrada && membro.hora_entrada
            ? new Date(`${membro.data_entrada}T${membro.hora_entrada}`)
            : this.data_entrada && this.hora_entrada
                ? new Date(`${this.data_entrada}T${this.hora_entrada}`)
                : null;
        const ate = membro.data_saida && membro.hora_saida
            ? new Date(`${membro.data_saida}T${membro.hora_saida}`)
            : this.data_saida && this.hora_saida
                ? new Date(`${this.data_saida}T${this.hora_saida}`)
                : null;

        if (!de || !ate || isNaN(de.getTime()) || isNaN(ate.getTime())) return "—";
        const diff = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
        if (diff < 0 || diff > 72) return "inválido";
        const h = Math.floor(diff);
        const m = Math.round((diff - h) * 60);
        return `${h}h${m > 0 ? m + "m" : ""}`;
    }

    handleFormResult(formResult: any) {
        if (!formResult) return;
        if ("sucesso" in formResult && formResult.sucesso) {
            this.isDirty = false;
        }
        if ("acao" in formResult && formResult.acao === "finalizado") {
            this.relatorioFinalizado = true;
            this.protocoloGerado = formResult.protocolo ?? "";
            this.relatorioId = formResult.id ?? 0;
            this.isDirty = false;
        }
    }

    abrirModalExtra() {
        this.justificativaExtra = `O serviço extraordinário acima descrito foi necessário em razão da demanda operacional da unidade policial, conforme relatório de plantão ${this.protocoloGerado}.`;
        this.membrosExtraIncluidos = this.membrosExtraordinarios.map((m) => m.nome);
        this.nomeDiretorExtra = "";
        this.mostrarModalExtra = true;
    }

    toggleMembroExtra(nome: string) {
        if (this.membrosExtraIncluidos.includes(nome)) {
            this.membrosExtraIncluidos = this.membrosExtraIncluidos.filter((n) => n !== nome);
        } else {
            this.membrosExtraIncluidos = [...this.membrosExtraIncluidos, nome];
        }
    }

    gerarRelatorioExtra() {
        if (!this.nomeDiretorExtra.trim()) return;
        if (this.membrosExtraordinarios.length > 0 && this.membrosExtraIncluidos.length === 0) return;

        const url = new URL(`/plantao/extra/${this.relatorioId}`, window.location.origin);
        url.searchParams.set("dir", this.nomeDiretorExtra.trim());
        url.searchParams.set("just", this.justificativaExtra);
        if (this.membrosExtraIncluidos.length < this.membrosExtraordinarios.length) {
            url.searchParams.set("mb", this.membrosExtraIncluidos.join(","));
        }
        window.open(url.toString(), "_blank");
        this.mostrarModalExtra = false;
    }
}

const CONTEXT_KEY = Symbol("plantao-form");

export function setPlantaoForm(state: PlantaoFormState) {
    setContext(CONTEXT_KEY, state);
}

export function getPlantaoForm() {
    return getContext<PlantaoFormState>(CONTEXT_KEY);
}
