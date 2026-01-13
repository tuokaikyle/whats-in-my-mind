import { and, db, eq, todo } from '@whats-in-my-mind/db';
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
        category: z.string().min(1).optional(),
        importance: z.number().optional(),
        progress: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [newTodo] = await db
        .insert(todo)
        .values({
          text: input.text,
          category: input.category,
          importance: input.importance,
          progress: input.progress,
          userId: ctx.session.user.id,
        })
        .returning();
      return newTodo;
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [updatedTodo] = await db
        .update(todo)
        .set({ completed: input.completed })
        .where(and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)))
        .returning();
      return updatedTodo;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedTodo] = await db
        .delete(todo)
        .where(and(eq(todo.id, input.id), eq(todo.userId, ctx.session.user.id)))
        .returning();
      return deletedTodo;
    }),
});
