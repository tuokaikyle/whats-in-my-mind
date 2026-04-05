import { protectedProcedure, publicProcedure, router } from '../index';
import { categoryRouter } from './category';
import { todoRouter } from './todo';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private, only logged in users can see this.',
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  category: categoryRouter,
});
export type AppRouter = typeof appRouter;
