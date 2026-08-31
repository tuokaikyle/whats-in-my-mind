import { TRPCError } from '@trpc/server';
import { and, eq } from '@whats-in-my-mind/db';
import { category } from '@whats-in-my-mind/db/schema/category';
import z from 'zod';
import { protectedProcedure, router } from '../index';

export const categoryRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({ id: category.id, name: category.name, color: category.color })
      .from(category)
      .where(eq(category.userId, ctx.session.user.id))
      .orderBy(category.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const [created] = await ctx.db
        .insert(category)
        .values({
          name: input.name,
          color: input.color,
          userId: ctx.session.user.id,
        })
        .returning({
          id: category.id,
          name: category.name,
          color: category.color,
        });

      if (!created) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create category',
        });
      }

      return created;
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    return await ctx.db
      .delete(category)
      .where(and(eq(category.id, input.id), eq(category.userId, ctx.session.user.id)));
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return await ctx.db
        .update(category)
        .set(data)
        .where(and(eq(category.id, id), eq(category.userId, ctx.session.user.id)));
    }),
});
