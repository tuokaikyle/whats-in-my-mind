import { and, asc, eq } from '@whats-in-my-mind/db';
import { todo } from '@whats-in-my-mind/db/schema/todo';
import z from 'zod';
import { protectedProcedure, router } from '../index';

const metadataSchema = z.record(z.string(), z.unknown());

export const todoRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        categoryId: todo.categoryId,
        importance: todo.importance,
        progress: todo.progress,
        effort: todo.effort,
        deadline: todo.deadline,
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
        importance: z.number().int().min(1).max(5).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        effort: z.number().int().min(0).optional(),
        deadline: z.string().datetime().nullable().optional(),
        metadata: metadataSchema.nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.insert(todo).values({
        text: input.text,
        categoryId: input.categoryId,
        importance: input.importance,
        progress: input.progress,
        effort: input.effort,
        deadline: input.deadline ? new Date(input.deadline) : null,
        metadata: input.metadata,
        userId: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().min(1).optional(),
        completed: z.boolean().optional(),
        categoryId: z.number().int().nullable().optional(),
        importance: z.number().int().min(1).max(5).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        effort: z.number().int().min(0).optional(),
        deadline: z.string().datetime().nullable().optional(),
        metadata: metadataSchema.nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, deadline, ...rest } = input;
      return await ctx.db
        .update(todo)
        .set({
          ...rest,
          ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        })
        .where(
          and(eq(todo.id, id), eq(todo.userId, ctx.session.user.id)),
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
