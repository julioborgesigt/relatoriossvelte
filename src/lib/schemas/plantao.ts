import { z } from 'zod';
import { TIPOS_PROC } from '$lib/constants';

export const EnvolvidoSchema = z.object({
    id: z.number().optional(), // Para controle do Svelte
    texto: z.string().trim().min(1, 'Nome ou detalhamento obrigatório (use "A APURAR" se desconhecido)')
});

export const ProcedimentoSchema = z.object({
    id: z.number().optional(),
    tipo: z.enum(TIPOS_PROC),
    numero: z.string().trim().min(1, 'Número do procedimento é obrigatório'),
    natureza: z.string().trim().min(3, 'Natureza da infração obrigatória'),
    envolvidos: z.string().trim().optional(),
    resumo: z.string().trim().optional(),
    vitimas: z.array(EnvolvidoSchema).min(1, 'Adicione pelo menos uma vítima (ou "A APURAR")'),
    suspeitos: z.array(EnvolvidoSchema).min(1, 'Adicione pelo menos um suspeito (ou "A APURAR")'),
});

const ESCALAS = ['Normal', 'Extraordinaria', ''] as const;

export const MembroEquipeSchema = z.object({
    id: z.number().optional(),
    nome: z.string().trim().min(3, 'Nome do servidor obrigatório'),
    matricula: z.string().trim().min(3, 'Matrícula obrigatória'),
    cargo: z.string().trim().optional(),
    telefone: z.string().trim().optional(),
    lotacao: z.string().trim().optional(),
    escala: z.enum(ESCALAS).refine(val => val !== '', { message: 'Selecione a escala' }),
    data_entrada: z.string().trim().optional(),
    hora_entrada: z.string().trim().optional(),
    data_saida: z.string().trim().optional(),
    hora_saida: z.string().trim().optional(),
    mostrarHorario: z.boolean().default(false).optional()
}).superRefine((val, ctx) => {
    // Nós verificamos se os horários estão preenchidos de forma geral se for finalizar no nível do PlantaoSchema,
    // mas também podemos adicionar validações extra aqui se precisar. A lógica atual no PlantaoSchema cuidará disso.
});

export const PlantaoSchema = z.object({
    draft_id: z.number().int().optional(),
    acao: z.enum(['finalizar', 'rascunho']).default('rascunho'),
    delegacia: z.string().trim().min(3, 'A unidade policial de atuação é obrigatória'),
    data_entrada: z.string().trim().min(1, 'Data de entrada obrigatória'),
    hora_entrada: z.string().trim().min(1, 'Hora de entrada obrigatória'),
    data_saida: z.string().trim().min(1, 'Data de saída obrigatória'),
    hora_saida: z.string().trim().min(1, 'Hora de saída obrigatória'),
    observacoes: z.string().trim().optional(),

    q_bo: z.number().int().min(0).default(0),
    q_guias: z.number().int().min(0).default(0),
    q_apreensoes: z.number().int().min(0).default(0),
    q_presos: z.number().int().min(0).default(0),
    q_medidas: z.number().int().min(0).default(0),
    q_outros: z.number().int().min(0).default(0),

    equipe: z.array(MembroEquipeSchema).default([]),
    procedimentos: z.array(ProcedimentoSchema).default([])
}).superRefine((val, ctx) => {
    if (val.data_entrada && val.hora_entrada && val.data_saida && val.hora_saida) {
        const de = new Date(`${val.data_entrada}T${val.hora_entrada}`);
        const ate = new Date(`${val.data_saida}T${val.hora_saida}`);

        if (!isNaN(de.getTime()) && !isNaN(ate.getTime())) {
            const diffHours = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);

            if (diffHours <= 0 && val.acao === 'finalizar') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A saída deve ser posterior à entrada.', path: ['hora_saida'] });
            }
            if (diffHours > 24 && val.acao === 'finalizar') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O plantão não pode exceder 24h.', path: ['hora_saida'] });
            }
        }
    }

    if (val.acao === 'finalizar') {
        if (val.equipe.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Adicione pelo menos um policial na equipe', path: ['equipe'] });
        }

        if (val.data_entrada && val.hora_entrada && val.data_saida && val.hora_saida) {
            const deGeral = new Date(`${val.data_entrada}T${val.hora_entrada}`);
            const ateGeral = new Date(`${val.data_saida}T${val.hora_saida}`);

            val.equipe.forEach((membro, i) => {
                if (!membro.data_entrada) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data de entrada obrigatória para todos os servidores', path: ['equipe', i, 'data_entrada'] });
                if (!membro.hora_entrada) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hora de entrada obrigatória para todos os servidores', path: ['equipe', i, 'hora_entrada'] });
                if (!membro.data_saida) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data de saída obrigatória para todos os servidores', path: ['equipe', i, 'data_saida'] });
                if (!membro.hora_saida) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hora de saída obrigatória para todos os servidores', path: ['equipe', i, 'hora_saida'] });

                if (membro.escala === 'Extraordinaria' && membro.data_entrada && membro.hora_entrada && membro.data_saida && membro.hora_saida) {
                    const deExtra = new Date(`${membro.data_entrada}T${membro.hora_entrada}`);
                    const ateExtra = new Date(`${membro.data_saida}T${membro.hora_saida}`);

                    if (deExtra < deGeral || ateExtra > ateGeral) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Horário do membro extra não pode exceder o horário geral do plantão', path: ['equipe', i, 'hora_saida'] });
                    }
                }
            });
        }
    }
});

export type PlantaoSchemaType = z.infer<typeof PlantaoSchema>;
