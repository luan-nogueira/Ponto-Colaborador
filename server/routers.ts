import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// ==================== HELPER PROCEDURES ====================

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const gestorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "gestor" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
  }
  return next({ ctx });
});

// ==================== MAIN ROUTER ====================

export const appRouter = router({
  system: systemRouter,

  // ==================== AUTH ====================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== USUARIOS ====================
  usuarios: router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),

    getAll: gestorProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getColaboradores: gestorProcedure.query(async () => {
      return await db.getColaboradores();
    }),

    getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
      return await db.getUserById(input);
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          cargo: z.string().optional(),
          setor: z.string().optional(),
          numeroMatricula: z.string().optional(),
          role: z.enum(["admin", "gestor", "colaborador"]),
        })
      )
      .mutation(async ({ input }) => {
        // Criar usuário com openId temporário
        const openId = `temp_${Date.now()}_${Math.random()}`;
        return await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          cargo: input.cargo,
          setor: input.setor,
          numeroMatricula: input.numeroMatricula,
          role: input.role as any,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          cargo: z.string().optional(),
          setor: z.string().optional(),
          numeroMatricula: z.string().optional(),
          ativo: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateUser(id, data as any);
      }),

    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.updateUser(input, { ativo: false });
    }),
  }),

  // ==================== PONTO ====================
  ponto: router({
    registrar: protectedProcedure
      .input(
        z.object({
          tipo: z.enum(["entrada", "saida", "intervalo_inicio", "intervalo_fim"]),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          precisao: z.number().optional(),
          endereco: z.string().optional(),
          dispositivo: z.string().optional(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const usuarioId = ctx.user.id;

        // Validar sequência de ponto
        const ultimoPonto = await db.getUltimoPontoRegistro(usuarioId);

        if (ultimoPonto) {
          const tiposValidos: Record<string, string[]> = {
            entrada: ["saida", "intervalo_inicio"],
            saida: ["entrada"],
            intervalo_inicio: ["intervalo_fim"],
            intervalo_fim: ["entrada", "saida"],
          };

          if (!tiposValidos[ultimoPonto.tipo]?.includes(input.tipo)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Sequência inválida. Último registro: ${ultimoPonto.tipo}`,
            });
          }
        } else {
          if (input.tipo !== "entrada") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Primeiro registro deve ser entrada",
            });
          }
        }

        const registro = await db.createPontoRegistro({
          usuarioId,
          tipo: input.tipo as any,
          dataRegistro: new Date(),
          latitude: input.latitude ? String(input.latitude) : (null as any),
          longitude: input.longitude ? String(input.longitude) : (null as any),
          precisao: input.precisao ? String(input.precisao) : (null as any),
          endereco: input.endereco || null,
          dispositivo: input.dispositivo || null,
          observacao: input.observacao || null,
          status: "confirmado" as any,
        });

        return registro;
      }),

    getHistorico: protectedProcedure
      .input(
        z.object({
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.getPontoRegistrosByUsuario(
          ctx.user.id,
          input.dataInicio,
          input.dataFim
        );
      }),

    getHistoricoUsuario: gestorProcedure
      .input(
        z.object({
          usuarioId: z.number(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getPontoRegistrosByUsuario(
          input.usuarioId,
          input.dataInicio,
          input.dataFim
        );
      }),

    getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
      return await db.getPontoRegistroById(input);
    }),

    update: gestorProcedure
      .input(
        z.object({
          id: z.number(),
          dataRegistro: z.date().optional(),
          observacao: z.string().optional(),
          status: z.enum(["confirmado", "pendente", "rejeitado"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePontoRegistro(id, data as any);
      }),

    getRegistrosRecentes: gestorProcedure.query(async () => {
      return await db.getRegistrosRecentes();
    }),

    getRegistrosComLocalizacao: gestorProcedure.query(async () => {
      return await db.getRegistrosComLocalizacao();
    }),
  }),

  // ==================== JUSTIFICATIVAS ====================
  justificativas: router({
    criar: protectedProcedure
      .input(
        z.object({
          tipo: z.enum(["esquecimento_ponto", "atraso", "saida_antecipada", "outro"]),
          descricao: z.string().min(1),
          dataEvento: z.date(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createJustificativa({
          usuarioId: ctx.user.id,
          tipo: input.tipo as any,
          descricao: input.descricao,
          dataEvento: input.dataEvento,
          status: "pendente" as any,
          comentarioGestor: null,
          analisadoPorId: null,
          dataAnalise: null,
        });
      }),

    getMinha: protectedProcedure.query(async ({ ctx }) => {
      return await db.getJustificativasByUsuario(ctx.user.id);
    }),

    getPendentes: gestorProcedure.query(async () => {
      return await db.getJustificativasPendentes();
    }),

    aprovar: gestorProcedure
      .input(
        z.object({
          id: z.number(),
          comentario: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.updateJustificativa(input.id, {
          status: "aprovada" as any,
          analisadoPorId: ctx.user.id,
          dataAnalise: new Date(),
          comentarioGestor: input.comentario || null,
        });
      }),

    rejeitar: gestorProcedure
      .input(
        z.object({
          id: z.number(),
          comentario: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.updateJustificativa(input.id, {
          status: "rejeitada" as any,
          analisadoPorId: ctx.user.id,
          dataAnalise: new Date(),
          comentarioGestor: input.comentario || null,
        });
      }),
  }),

  // ==================== CONFIGURACOES ====================
  configuracoes: router({
    get: protectedProcedure.query(async () => {
      return await db.getConfiguracao();
    }),

    getEmpresa: protectedProcedure.query(async () => {
      return await db.getConfiguracao();
    }),

    atualizar: adminProcedure
      .input(
        z.object({
          horaEntrada: z.string().optional(),
          horaSaida: z.string().optional(),
          toleranciaAtraso: z.number().optional(),
          intervaloMinutos: z.number().optional(),
          raioGeofencing: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const data: any = {};
        if (input.horaEntrada) data.horaEntrada = input.horaEntrada;
        if (input.horaSaida) data.horaSaida = input.horaSaida;
        if (input.toleranciaAtraso !== undefined) data.toleranciaAtrasominutos = input.toleranciaAtraso;
        if (input.intervaloMinutos !== undefined) data.duracaoIntervaloMinutos = input.intervaloMinutos;
        if (input.raioGeofencing !== undefined) data.raioPermitidoMetros = input.raioGeofencing;
        return await db.updateConfiguracao(data);
      }),

    update: adminProcedure
      .input(
        z.object({
          horaEntrada: z.string().optional(),
          horaSaida: z.string().optional(),
          horaIntervaloInicio: z.string().optional(),
          horaIntervaloFim: z.string().optional(),
          duracaoIntervaloMinutos: z.number().optional(),
          toleranciaAtrasominutos: z.number().optional(),
          raioPermitidoMetros: z.number().optional(),
          latitudeEmpresa: z.number().optional(),
          longitudeEmpresa: z.number().optional(),
          feriados: z.string().optional(),
          diasUteis: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const data: any = {};
        Object.entries(input).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === "latitudeEmpresa" || key === "longitudeEmpresa") {
              data[key] = String(value);
            } else {
              data[key] = value;
            }
          }
        });
        return await db.updateConfiguracao(data);
      }),
  }),

  // ==================== UNIDADES ====================
  unidades: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getUnidades();
    }),

    getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
      return await db.getUnidadeById(input);
    }),

    criar: adminProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          endereco: z.string().optional(),
          latitude: z.number(),
          longitude: z.number(),
          raioMetros: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createUnidade({
          nome: input.nome,
          endereco: input.endereco || null,
          latitude: String(input.latitude),
          longitude: String(input.longitude),
          raioMetros: input.raioMetros || 100,
          ativa: true,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          endereco: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          raioMetros: z.number().optional(),
          ativa: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === "latitude" || key === "longitude") {
              updateData[key] = String(value);
            } else {
              updateData[key] = value;
            }
          }
        });
        return await db.updateUnidade(id, updateData as any);
      }),
  }),

  // ==================== RESUMOS ====================
  resumos: router({
    getResumoDiario: protectedProcedure
      .input(z.object({ data: z.date() }))
      .query(async ({ input, ctx }) => {
        return await db.getResumoDiario(ctx.user.id, input.data);
      }),

    getResumoMensal: protectedProcedure
      .input(
        z.object({
          mes: z.number().min(1).max(12),
          ano: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await db.getResumoMensal(ctx.user.id, input.mes, input.ano);
      }),

    getResumosMensaisUsuario: protectedProcedure.query(async ({ ctx }) => {
      return await db.getResumosMensaisUsuario(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
