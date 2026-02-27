import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const remocoes = sqliteTable('remocoes', {
    id: integer('id').primaryKey(),
    nome: text('nome').notNull(),
    status: text('status').default('pendente'),
    dataCriacao: text('data_criacao')
});