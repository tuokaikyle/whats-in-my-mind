/** Caps total rows per user (active and completed) to bound database growth. */
export const MAX_TODOS_PER_USER = 100;

/** Shared by the server mutation and the guest-mode client path so the two cannot drift. */
export const TODO_LIMIT_MESSAGE = `Todo limit reached (${MAX_TODOS_PER_USER}). Delete a todo before adding a new one.`;
