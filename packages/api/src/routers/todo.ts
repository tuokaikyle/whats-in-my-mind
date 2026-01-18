import { and, db, eq } from '@whats-in-my-mind/db';
import { todo } from '@whats-in-my-mind/db/schema/todo';
import z from 'zod';
import { protectedProcedure, router } from '../index';

export const todoRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(todo)
      .where(eq(todo.userId, ctx.session.user.id));
  }),

  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        category: z.string().optional(),
        importance: z.number().int().min(1).max(5).optional(),
        progress: z.number().int().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.insert(todo).values({
        text: input.text,
        category: input.category,
        importance: input.importance,
        progress: input.progress,
        userId: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().min(1).optional(),
        completed: z.boolean().optional(),
        category: z.string().optional(),
        importance: z.number().int().min(1).max(5).optional(),
        progress: z.number().int().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      return await db
        .update(todo)
        .set(updates)
        .where(
          and(eq(todo.id, id), eq(todo.userId, ctx.session.user.id)),
        );
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await db
        .update(todo)
        .set({ completed: input.completed })
        .where(
          and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)),
        );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await db
        .delete(todo)
        .where(
          and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)),
        );
    }),
});
