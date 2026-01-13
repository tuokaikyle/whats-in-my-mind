import { relations } from 'drizzle-orm';
import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './auth';

export const todo = pgTable('todo', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const todoRelations = relations(todo, ({ one }) => ({
  user: one(user, {
    fields: [todo.userId],
    references: [user.id],
  }),
}));
