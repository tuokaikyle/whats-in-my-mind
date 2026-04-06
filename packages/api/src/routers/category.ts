import { and, eq } from '@whats-in-my-mind/db';
import { category } from '@whats-in-my-mind/db/schema/category';
import z from 'zod';
import { protectedProcedure, router } from '../index';

export const categoryRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({ id: category.id, name: category.name, color: category.color })
      .from(category)
      .where(eq(category.userId, ctx.session.user.id));
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.insert(category).values({
        name: input.name,
        color: input.color,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db
        .delete(category)
        .where(
          and(eq(category.id, input.id), eq(category.userId, ctx.session.user.id)),
        );
    }),
});
