import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc, gte, lte, and, isNotNull, asc } from "drizzle-orm";
import {
  InsertUser,
  users,
  pontoRegistros,
  justificativas,
  configuracoes,
  unidades,
  resumoDiario,
  resumoMensal,
  PontoRegistro,
  Justificativa,
  Configuracao,
  Unidade,
  ResumoDiario,
  ResumoMensal,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USERS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users);
}

export async function getColaboradores() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.role, "colaborador" as any));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(users).set(data).where(eq(users.id, id));
  return await getUserById(id);
}

// ==================== PONTO REGISTROS ====================

export async function createPontoRegistro(data: Omit<PontoRegistro, "id" | "criadoEm" | "atualizadoEm">) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(pontoRegistros).values(data as any);
  return await getPontoRegistroById(Number(result[0].insertId));
}

export async function getPontoRegistrosByUsuario(usuarioId: number, dataInicio?: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(pontoRegistros.usuarioId, usuarioId)];

  if (dataInicio && dataFim) {
    conditions.push(gte(pontoRegistros.dataRegistro, dataInicio));
    conditions.push(lte(pontoRegistros.dataRegistro, dataFim));
  }

  return await db
    .select()
    .from(pontoRegistros)
    .where(and(...(conditions as any)))
    .orderBy(desc(pontoRegistros.dataRegistro));
}

export async function getPontoRegistroById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pontoRegistros).where(eq(pontoRegistros.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePontoRegistro(id: number, data: Partial<PontoRegistro>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(pontoRegistros).set(data as any).where(eq(pontoRegistros.id, id));
  return await getPontoRegistroById(id);
}

export async function getUltimoPontoRegistro(usuarioId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(pontoRegistros)
    .where(eq(pontoRegistros.usuarioId, usuarioId))
    .orderBy(desc(pontoRegistros.dataRegistro))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== JUSTIFICATIVAS ====================

export async function createJustificativa(data: Omit<Justificativa, "id" | "criadoEm" | "atualizadoEm">) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(justificativas).values(data as any);
  return await getJustificativaById(Number(result[0].insertId));
}

export async function getJustificativasByUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(justificativas).where(eq(justificativas.usuarioId, usuarioId));
}

export async function getJustificativasPendentes() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(justificativas)
    .where(eq(justificativas.status, "pendente" as any))
    .orderBy(desc(justificativas.dataEvento));
}

export async function updateJustificativa(id: number, data: Partial<Justificativa>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(justificativas).set(data as any).where(eq(justificativas.id, id));
  return await getJustificativaById(id);
}

export async function getJustificativaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(justificativas).where(eq(justificativas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== CONFIGURACOES ====================

export async function getConfiguracao() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(configuracoes).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConfiguracao(data: Partial<Configuracao>) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getConfiguracao();
  if (existing) {
    await db.update(configuracoes).set(data as any).where(eq(configuracoes.id, existing.id));
    return await getConfiguracao();
  } else {
    const result = await db.insert(configuracoes).values(data as any);
    return await getConfiguracaoById(Number(result[0].insertId));
  }
}

export async function getConfiguracaoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(configuracoes).where(eq(configuracoes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== UNIDADES ====================

export async function createUnidade(data: Omit<Unidade, "id" | "criadoEm" | "atualizadoEm">) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(unidades).values(data as any);
  return await getUnidadeById(Number(result[0].insertId));
}

export async function getUnidades() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(unidades);
}

export async function getUnidadeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(unidades).where(eq(unidades.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUnidade(id: number, data: Partial<Unidade>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(unidades).set(data as any).where(eq(unidades.id, id));
  return await getUnidadeById(id);
}

// ==================== RESUMO DIARIO ====================

export async function createResumoDiario(data: Omit<ResumoDiario, "id" | "criadoEm" | "atualizadoEm">) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(resumoDiario).values(data as any);
  return await getResumoDiarioById(Number(result[0].insertId));
}

export async function getResumoDiario(usuarioId: number, data: Date) {
  const db = await getDb();
  if (!db) return undefined;

  const dataStr = data.toISOString().split("T")[0];
  const result = await db
    .select()
    .from(resumoDiario)
    .where(and(eq(resumoDiario.usuarioId, usuarioId), eq(resumoDiario.data, dataStr as any)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateResumoDiario(id: number, data: Partial<ResumoDiario>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(resumoDiario).set(data as any).where(eq(resumoDiario.id, id));
  return await getResumoDiarioById(id);
}

export async function getResumoDiarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resumoDiario).where(eq(resumoDiario.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== RESUMO MENSAL ====================

export async function getResumoMensal(usuarioId: number, mes: number, ano: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(resumoMensal)
    .where(
      and(
        eq(resumoMensal.usuarioId, usuarioId),
        eq(resumoMensal.mes, mes),
        eq(resumoMensal.ano, ano)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createResumoMensal(data: Omit<ResumoMensal, "id" | "criadoEm" | "atualizadoEm">) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(resumoMensal).values(data as any);
  return await getResumoMensalById(Number(result[0].insertId));
}

export async function updateResumoMensal(id: number, data: Partial<ResumoMensal>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(resumoMensal).set(data as any).where(eq(resumoMensal.id, id));
  return await getResumoMensalById(id);
}

export async function getResumoMensalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resumoMensal).where(eq(resumoMensal.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getResumosMensaisUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(resumoMensal)
    .where(eq(resumoMensal.usuarioId, usuarioId))
    .orderBy(desc(resumoMensal.ano), desc(resumoMensal.mes));
}

// ==================== REGISTROS RECENTES ====================

export async function getRegistrosRecentes(limite: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: pontoRegistros.id,
      usuarioId: pontoRegistros.usuarioId,
      tipo: pontoRegistros.tipo,
      dataRegistro: pontoRegistros.dataRegistro,
      latitude: pontoRegistros.latitude,
      longitude: pontoRegistros.longitude,
      precisao: pontoRegistros.precisao,
      endereco: pontoRegistros.endereco,
      dispositivo: pontoRegistros.dispositivo,
      observacao: pontoRegistros.observacao,
      status: pontoRegistros.status,
      usuario: {
        id: users.id,
        name: users.name,
        email: users.email,
        cargo: users.cargo,
        setor: users.setor,
      },
    })
    .from(pontoRegistros)
    .leftJoin(users, eq(pontoRegistros.usuarioId, users.id))
    .orderBy(desc(pontoRegistros.dataRegistro))
    .limit(limite);
}

export async function getRegistrosComLocalizacao(limite: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: pontoRegistros.id,
      usuarioId: pontoRegistros.usuarioId,
      tipo: pontoRegistros.tipo,
      dataRegistro: pontoRegistros.dataRegistro,
      latitude: pontoRegistros.latitude,
      longitude: pontoRegistros.longitude,
      precisao: pontoRegistros.precisao,
      endereco: pontoRegistros.endereco,
      dispositivo: pontoRegistros.dispositivo,
      observacao: pontoRegistros.observacao,
      status: pontoRegistros.status,
      usuario: {
        id: users.id,
        name: users.name,
        email: users.email,
        cargo: users.cargo,
        setor: users.setor,
      },
    })
    .from(pontoRegistros)
    .leftJoin(users, eq(pontoRegistros.usuarioId, users.id))
    .where(and(
      isNotNull(pontoRegistros.latitude),
      isNotNull(pontoRegistros.longitude)
    ))
    .orderBy(desc(pontoRegistros.dataRegistro))
    .limit(limite);
}

// ==================== RELATORIOS ====================

export async function gerarRelatorio(
  usuarioId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) return null;

  const registros = await db
    .select()
    .from(pontoRegistros)
    .where(
      and(
        eq(pontoRegistros.usuarioId, usuarioId),
        gte(pontoRegistros.dataRegistro, dataInicio),
        lte(pontoRegistros.dataRegistro, dataFim)
      )
    )
    .orderBy(asc(pontoRegistros.dataRegistro));

  const totalRegistros = registros.length;
  const diasTrabalhados = new Set(
    registros.map((r) => r.dataRegistro.toDateString())
  ).size;
  const atrasos = registros.filter((r) => r.tipo === "entrada").length;
  const faltas = 0; // Lógica de faltas seria mais complexa

  return {
    totalRegistros,
    diasTrabalhados,
    atrasos,
    faltas,
    registros,
  };
}
