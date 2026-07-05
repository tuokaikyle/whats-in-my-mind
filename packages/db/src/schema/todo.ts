import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { category } from './category';

export const todo = pgTable(
  'todo',
  {
    id: serial('id').primaryKey(),
    text: text('text').notNull(),
    categoryId: integer('category_id').references(() => category.id, {
      onDelete: 'set null',
    }),
    progress: integer('progress'),
    effort: integer('effort'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('todo_userId_idx').on(table.userId)],
);

export const todoRelations = relations(todo, ({ one }) => ({
  user: one(user, {
    fields: [todo.userId],
    references: [user.id],
  }),
  category: one(category, {
    fields: [todo.categoryId],
    references: [category.id],
  }),
}));
