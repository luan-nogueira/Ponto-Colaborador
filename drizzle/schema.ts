import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "gestor", "colaborador"]).default("colaborador").notNull(),
  
  // Informações do colaborador (quando role = colaborador)
  cargo: varchar("cargo", { length: 255 }),
  setor: varchar("setor", { length: 255 }),
  numeroMatricula: varchar("numeroMatricula", { length: 50 }).unique(),
  ativo: boolean("ativo").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Registros de ponto (batidas)
 */
export const pontoRegistros = mysqlTable("ponto_registros", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  
  // Tipo de registro: entrada, saída, intervalo_inicio, intervalo_fim
  tipo: mysqlEnum("tipo", ["entrada", "saida", "intervalo_inicio", "intervalo_fim"]).notNull(),
  
  // Data e hora do registro
  dataRegistro: datetime("data_registro").notNull(),
  
  // Geolocalização
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  precisao: decimal("precisao", { precision: 10, scale: 2 }), // em metros
  endereco: text("endereco"), // endereço aproximado
  
  // Informações do dispositivo
  dispositivo: varchar("dispositivo", { length: 255 }), // navegador, SO, etc
  
  // Observações
  observacao: text("observacao"),
  
  // Status
  status: mysqlEnum("status", ["confirmado", "pendente", "rejeitado"]).default("confirmado").notNull(),
  
  // Auditoria
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type PontoRegistro = typeof pontoRegistros.$inferSelect;
export type InsertPontoRegistro = typeof pontoRegistros.$inferInsert;

/**
 * Justificativas de ponto
 */
export const justificativas = mysqlTable("justificativas", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  
  // Tipo de justificativa
  tipo: mysqlEnum("tipo", ["esquecimento_ponto", "atraso", "saida_antecipada", "outro"]).notNull(),
  
  // Descrição
  descricao: text("descricao").notNull(),
  
  // Data do evento
  dataEvento: datetime("data_evento").notNull(),
  
  // Status da justificativa
  status: mysqlEnum("status", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  
  // Comentário do gestor
  comentarioGestor: text("comentario_gestor"),
  
  // Quem aprovou/rejeitou
  analisadoPorId: int("analisado_por_id"),
  dataAnalise: timestamp("data_analise"),
  
  // Auditoria
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Justificativa = typeof justificativas.$inferSelect;
export type InsertJustificativa = typeof justificativas.$inferInsert;

/**
 * Configurações da empresa
 */
export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Horários de trabalho
  horaEntrada: varchar("hora_entrada", { length: 5 }), // HH:MM
  horaSaida: varchar("hora_saida", { length: 5 }), // HH:MM
  
  // Intervalo
  horaIntervaloInicio: varchar("hora_intervalo_inicio", { length: 5 }), // HH:MM
  horaIntervaloFim: varchar("hora_intervalo_fim", { length: 5 }), // HH:MM
  duracaoIntervaloMinutos: int("duracao_intervalo_minutos").default(60),
  
  // Tolerância
  toleranciaAtrasominutos: int("tolerancia_atraso_minutos").default(5),
  
  // Geolocalização
  raioPermitidoMetros: int("raio_permitido_metros").default(100),
  latitudeEmpresa: decimal("latitude_empresa", { precision: 10, scale: 8 }),
  longitudeEmpresa: decimal("longitude_empresa", { precision: 11, scale: 8 }),
  
  // Feriados (JSON array de datas)
  feriados: text("feriados"), // JSON: ["2024-01-01", "2024-12-25"]
  
  // Dias úteis (0-6, onde 0=domingo)
  diasUteis: varchar("dias_uteis", { length: 20 }), // JSON: [1,2,3,4,5]
  
  // Auditoria
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;

/**
 * Unidades/Locais permitidos para registro
 */
export const unidades = mysqlTable("unidades", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  endereco: text("endereco"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  raioMetros: int("raio_metros").default(100),
  ativa: boolean("ativa").default(true).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Unidade = typeof unidades.$inferSelect;
export type InsertUnidade = typeof unidades.$inferInsert;

/**
 * Resumo diário de ponto (cache para performance)
 */
export const resumoDiario = mysqlTable("resumo_diario", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  data: datetime("data").notNull(),
  
  // Status do dia
  entrada: datetime("entrada"),
  saida: datetime("saida"),
  intervaloInicio: datetime("intervalo_inicio"),
  intervaloFim: datetime("intervalo_fim"),
  
  // Cálculos
  horasTrabalhadas: decimal("horas_trabalhadas", { precision: 5, scale: 2 }),
  horasIntervalo: decimal("horas_intervalo", { precision: 5, scale: 2 }),
  atraso: int("atraso_minutos"), // em minutos
  status: mysqlEnum("status", ["presente", "ausente", "atrasado", "saida_antecipada"]).notNull(),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type ResumoDiario = typeof resumoDiario.$inferSelect;
export type InsertResumoDiario = typeof resumoDiario.$inferInsert;

/**
 * Resumo mensal de ponto
 */
export const resumoMensal = mysqlTable("resumo_mensal", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  mes: int("mes").notNull().default(1), // 1-12
  ano: int("ano").notNull().default(2024),
  
  // Contadores
  diasTrabalhados: int("dias_trabalhados").default(0),
  atrasos: int("atrasos").default(0),
  faltas: int("faltas").default(0),
  saidasAntecipadas: int("saidas_antecipadas").default(0),
  
  // Horas
  horasTrabalhadas: decimal("horas_trabalhadas", { precision: 8, scale: 2 }).default(0),
  horasExtras: decimal("horas_extras", { precision: 8, scale: 2 }).default(0),
  horasIntervalo: decimal("horas_intervalo", { precision: 8, scale: 2 }).default(0),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type ResumoMensal = typeof resumoMensal.$inferSelect;
export type InsertResumoMensal = typeof resumoMensal.$inferInsert;
