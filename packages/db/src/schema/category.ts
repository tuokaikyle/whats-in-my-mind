import { relations } from 'drizzle-orm';
import { index, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { todo } from './todo';

export const category = pgTable(
  'category',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('category_userId_idx').on(table.userId),
    unique('category_name_userId_unique').on(table.name, table.userId),
  ],
);

export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, {
    fields: [category.userId],
    references: [user.id],
  }),
  todos: many(todo),
}));
