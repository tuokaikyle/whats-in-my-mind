import { TRPCError } from '@trpc/server';
import { and, asc, count, eq, sql } from '@whats-in-my-mind/db';
import { category } from '@whats-in-my-mind/db/schema/category';
import { todo } from '@whats-in-my-mind/db/schema/todo';
import z from 'zod';
import { MAX_TODOS_PER_USER, TODO_LIMIT_MESSAGE } from '../constants';
import { protectedProcedure, router } from '../index';

const metadataSchema = z.record(z.string(), z.unknown());
const effortSchema = z
  .number()
  .int()
  .refine((v) => v === 1 || v === 2 || v === 3 || v === 5, { message: 'effort must be 1, 2, 3, or 5' })
  .optional();
const progressSchema = z.number().int().min(0).max(5).optional();

export const todoRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: todo.id,
        text: todo.text,
        categoryId: todo.categoryId,
        progress: todo.progress,
        effort: todo.effort,
        metadata: todo.metadata,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
        completedAt: todo.completedAt,
      })
      .from(todo)
      .where(eq(todo.userId, ctx.session.user.id))
      .orderBy(asc(todo.createdAt), asc(todo.id));
  }),

  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        categoryId: z.number().int().nullable().optional(),
        progress: progressSchema,
        effort: effortSchema,
        metadata: metadataSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.categoryId != null) {
        const cats = await ctx.db
          .select({ id: category.id })
          .from(category)
          .where(and(eq(category.id, input.categoryId), eq(category.userId, ctx.session.user.id)))
          .limit(1);
        if (cats.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
      }

      // Not race-free: the count and insert are separate statements, so concurrent creates can
      // each read the same count and overshoot by the number of requests in flight. The overshoot
      // is bounded and does not compound, which is acceptable for a growth guardrail. An exact cap
      // would need a per-user advisory lock plus a conditional insert inside a db.batch().
      const [existingCount] = await ctx.db
        .select({ value: count() })
        .from(todo)
        .where(eq(todo.userId, ctx.session.user.id));
      if ((existingCount?.value ?? 0) >= MAX_TODOS_PER_USER) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: TODO_LIMIT_MESSAGE,
        });
      }

      return await ctx.db.insert(todo).values({
        text: input.text,
        categoryId: input.categoryId,
        progress: input.progress,
        effort: input.effort,
        metadata: input.metadata,
        userId: ctx.session.user.id,
        completedAt:
          input.effort != null && input.effort > 0 && (input.progress ?? 0) >= input.effort ? new Date() : null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().min(1).optional(),
        categoryId: z.number().int().nullable().optional(),
        progress: progressSchema,
        effort: effortSchema,
        metadata: metadataSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.categoryId != null) {
        const cats = await ctx.db
          .select({ id: category.id })
          .from(category)
          .where(and(eq(category.id, input.categoryId), eq(category.userId, ctx.session.user.id)))
          .limit(1);
        if (cats.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
      }
      const { id, ...rest } = input;

      const existing = await ctx.db
        .select({ progress: todo.progress, effort: todo.effort, completedAt: todo.completedAt })
        .from(todo)
        .where(and(eq(todo.id, id), eq(todo.userId, ctx.session.user.id)))
        .limit(1);
      const current = existing[0];

      const nextEffort = input.effort ?? current?.effort ?? null;
      const nextProgress = input.progress ?? current?.progress ?? null;
      const isCompleted = nextEffort != null && nextEffort > 0 && nextProgress != null && nextProgress >= nextEffort;

      const completedAt = isCompleted ? (current?.completedAt ?? new Date()) : null;

      return await ctx.db
        .update(todo)
        .set({ ...rest, completedAt })
        .where(and(eq(todo.id, id), eq(todo.userId, ctx.session.user.id)));
    }),

  reorderSimple: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        simpleOrder: z.number().finite(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db
        .update(todo)
        .set({
          metadata: sql`jsonb_set(coalesce(${todo.metadata}, '{}'::jsonb), '{simpleOrder}', to_jsonb(${input.simpleOrder}::double precision), true)`,
        })
        .where(and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)));
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    return await ctx.db.delete(todo).where(and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)));
  }),
});
