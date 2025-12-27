import { db, and, eq } from "@OverchargedList/db";
import { todo } from "@OverchargedList/db/schema/todo";
import z from "zod";
import { protectedProcedure, router } from "../index";

export const todoRouter = router({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(todo)
			.where(eq(todo.userId, ctx.session.user.id));
	}),

	create: protectedProcedure
		.input(z.object({ text: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			return await db.insert(todo).values({
				text: input.text,
				userId: ctx.session.user.id,
			});
		}),

	toggle: protectedProcedure
		.input(z.object({ id: z.number(), completed: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			return await db
				.update(todo)
				.set({ completed: input.completed })
				.where(
					and(
						eq(todo.id, input.id),
						eq(todo.userId, ctx.session.user.id),
					),
				);
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			return await db
				.delete(todo)
				.where(
					and(
						eq(todo.id, input.id),
						eq(todo.userId, ctx.session.user.id),
					),
				);
		}),
});
