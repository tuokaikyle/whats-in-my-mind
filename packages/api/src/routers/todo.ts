import { TRPCError } from '@trpc/server';
import { and, asc, eq, sql } from '@whats-in-my-mind/db';
import { category } from '@whats-in-my-mind/db/schema/category';
import { todo } from '@whats-in-my-mind/db/schema/todo';
import z from 'zod';
import { protectedProcedure, router } from '../index';

const metadataSchema = z.record(z.string(), z.unknown());
const effortSchema = z.number().int().min(1).optional();

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
        progress: z.number().int().min(0).max(100).optional(),
        effort: effortSchema,
        metadata: metadataSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.categoryId != null) {
        const cats = await ctx.db
          .select({ id: category.id })
          .from(category)
          .where(
            and(
              eq(category.id, input.categoryId),
              eq(category.userId, ctx.session.user.id),
            ),
          )
          .limit(1);
        if (cats.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
      }
      return await ctx.db.insert(todo).values({
        text: input.text,
        categoryId: input.categoryId,
        progress: input.progress,
        effort: input.effort,
        metadata: input.metadata,
        userId: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().min(1).optional(),
        categoryId: z.number().int().nullable().optional(),
        progress: z.number().int().min(0).max(100).optional(),
        effort: effortSchema,
        metadata: metadataSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.categoryId != null) {
        const cats = await ctx.db
          .select({ id: category.id })
          .from(category)
          .where(
            and(
              eq(category.id, input.categoryId),
              eq(category.userId, ctx.session.user.id),
            ),
          )
          .limit(1);
        if (cats.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
      }
      const { id, ...rest } = input;
      return await ctx.db
        .update(todo)
        .set(rest)
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
        .where(
          and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)),
        );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db
        .delete(todo)
        .where(
          and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)),
        );
    }),
});
