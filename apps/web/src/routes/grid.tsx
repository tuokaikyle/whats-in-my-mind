import { createFileRoute } from '@tanstack/react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GridStack, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer } from '@/components/add-task-drawer';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useCategories, useTodos } from '@/hooks/use-todos';
import type { Task, TodoMetadata } from '@/utils/types';

export const Route = createFileRoute('/grid')({
  component: RouteComponent,
});

type TodoWidget = GridStackWidget & {
  id: string;
  content: string;
};

type ActiveWidget = {
  gridIndex: 0 | 1;
  sectionLabel: 'active' | 'done';
};

type GridPosition = { x: number; y: number; w: number; h: number };
type PositionCache = Record<string, GridPosition>;

const POSITION_CACHE_KEY = 'todo-grid-v1';
const PREVIEW_TEXT_LIMIT = 24;
const GRID_ROWS = 6;
const MAX_ACTIVE_TODOS = 5;

function loadPositionCache(): PositionCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(POSITION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as PositionCache) : {};
  } catch {
    return {};
  }
}

function savePositionCache(cache: PositionCache) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
}

function getPreviewText(text: string) {
  const trimmed = text.trim();
  const normalized = trimmed || '(empty)';
  return normalized.length > PREVIEW_TEXT_LIMIT
    ? `${normalized.slice(0, PREVIEW_TEXT_LIMIT)}...`
    : normalized;
}

function getGridNode(element: HTMLElement) {
  return (element as HTMLElement & { gridstackNode?: TodoWidget })
    .gridstackNode;
}

function serializeGrid(grid: GridStack): TodoWidget[] {
  const nodes = ((grid.engine.nodes ?? []) as TodoWidget[]).slice();
  return nodes.map((widget, index) => ({
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
    id: String(widget.id ?? index),
    content: String(widget.content ?? ''),
  }));
}

function getGridMetadata(todo: Task): GridPosition | null {
  const entry = todo.metadata?.grid;
  if (!entry || typeof entry !== 'object') return null;
  const pos = entry as { x?: unknown; y?: unknown; w?: unknown; h?: unknown };
  if (
    typeof pos.x !== 'number' ||
    typeof pos.y !== 'number' ||
    typeof pos.w !== 'number' ||
    typeof pos.h !== 'number'
  )
    return null;
  return { x: pos.x, y: pos.y, w: pos.w, h: pos.h };
}

function RouteComponent() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const {
    todos,
    todosLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    isGuest,
  } = useTodos();
  const { categories } = useCategories();

  const activeTodos = useMemo(
    () =>
      (todos as Task[]).filter((t) => !t.completed).slice(0, MAX_ACTIVE_TODOS),
    [todos]
  );
  const doneTodos = useMemo(
    () => (todos as Task[]).filter((t) => t.completed),
    [todos]
  );

  const routeRef = useRef<HTMLDivElement>(null);
  const leftGridRef = useRef<HTMLDivElement>(null);
  const rightGridRef = useRef<HTMLDivElement>(null);
  const gridsRef = useRef<GridStack[]>([]);
  const activeWidgetElementRef = useRef<HTMLElement | null>(null);
  const persistGridsRef = useRef<() => void>(() => {});
  const pendingRemovalsRef = useRef<Set<string>>(new Set());
  const isSyncingRef = useRef(false);
  const initializedRef = useRef(false);

  const [floatStates, setFloatStates] = useState([true, false]);
  const [activeWidget, setActiveWidget] = useState<ActiveWidget | null>(null);
  const [draftText, setDraftText] = useState('');

  // ── GridStack initialization (once) ──
  useEffect(() => {
    const routeEl = routeRef.current;
    const leftEl = leftGridRef.current;
    const rightEl = rightGridRef.current;
    if (!routeEl || !leftEl || !rightEl) return;

    const previousRenderCB = GridStack.renderCB;
    GridStack.renderCB = (el, widget) => {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'gridstack-remove-btn';
      removeButton.setAttribute('aria-label', 'Remove widget');
      removeButton.textContent = 'x';
      removeButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      const label = document.createElement('span');
      label.className = 'gridstack-item-text';
      label.textContent = getPreviewText(String(widget.content ?? ''));

      el.replaceChildren(removeButton, label);
    };

    const options = {
      column: 12,
      minRow: 1,
      margin: '5px',
      acceptWidgets: () => true,
    };

    const leftGrid = GridStack.init(
      {
        ...options,
        float: true,
        minRow: GRID_ROWS,
        maxRow: GRID_ROWS,
        children: [],
      },
      leftEl
    );
    const rightGrid = GridStack.init(
      {
        ...options,
        float: false,
        maxRow: GRID_ROWS,
        disableResize: true,
        children: [],
      },
      rightEl
    );

    const normalizeDoneWidgets = () => {
      for (const node of rightGrid.engine.nodes) {
        if (node.w !== 1 || node.h !== 1) {
          rightGrid.update(node.el as HTMLElement, { w: 1, h: 1 });
        }
      }
      rightGrid.compact();
    };

    gridsRef.current = [leftGrid, rightGrid];
    setFloatStates([leftGrid.getFloat(), rightGrid.getFloat()]);

    // Persist grid positions to localStorage
    const persistGrids = () => {
      if (isSyncingRef.current) return;
      const cache = loadPositionCache();
      for (const node of [
        ...leftGrid.engine.nodes,
        ...rightGrid.engine.nodes,
      ]) {
        const widget = node as TodoWidget;
        cache[widget.id] = {
          x: widget.x ?? 0,
          y: widget.y ?? 0,
          w: widget.w ?? 1,
          h: widget.h ?? 1,
        };
      }
      savePositionCache(cache);
    };

    persistGridsRef.current = persistGrids;

    // ── GridStack event handlers ──

    // Detect moves between grids via pending-removals tracking
    leftGrid.on('removed', (_e, items) => {
      for (const item of items) {
        pendingRemovalsRef.current.add(String((item as TodoWidget).id));
      }
      persistGrids();
    });

    rightGrid.on('removed', (_e, items) => {
      for (const item of items) {
        pendingRemovalsRef.current.add(String((item as TodoWidget).id));
      }
      persistGrids();
    });

    rightGrid.on('added', (_e, items) => {
      for (const item of items) {
        const id = String((item as TodoWidget).id);
        if (pendingRemovalsRef.current.has(id)) {
          pendingRemovalsRef.current.delete(id);
          // Widget moved from left → right: mark completed
          updateMutation.mutate({ id: Number(id), completed: true });
        }
      }
      normalizeDoneWidgets();
      persistGrids();
    });

    leftGrid.on('added', (_e, items) => {
      for (const item of items) {
        const id = String((item as TodoWidget).id);
        if (pendingRemovalsRef.current.has(id)) {
          pendingRemovalsRef.current.delete(id);
          // Widget moved from right → left: mark active
          updateMutation.mutate({ id: Number(id), completed: false });
        }
      }
      persistGrids();
    });

    leftGrid.on('change', persistGrids);
    rightGrid.on('change', () => {
      normalizeDoneWidgets();
      persistGrids();
    });

    // If no position cache exists yet, seed it from metadata (logged-in mode)
    if (!isGuest) {
      const cache = loadPositionCache();
      let cacheChanged = false;
      for (const todo of todos as Task[]) {
        if (cache[String(todo.id)]) continue;
        const pos = getGridMetadata(todo);
        if (pos) {
          cache[String(todo.id)] = pos;
          cacheChanged = true;
        }
      }
      if (cacheChanged) savePositionCache(cache);
    }

    // ── Click handler for remove & edit ──
    const handleRouteClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const removeButton = target.closest('.gridstack-remove-btn');
      if (removeButton instanceof HTMLButtonElement) {
        const widgetEl = removeButton.closest('.grid-stack-item');
        if (!(widgetEl instanceof HTMLElement)) return;

        event.preventDefault();
        event.stopPropagation();

        const widget = getGridNode(widgetEl);
        if (!widget) return;

        const gridEl = widgetEl.closest('.grid-stack');
        const grid =
          gridEl === leftEl
            ? gridsRef.current[0]
            : gridEl === rightEl
            ? gridsRef.current[1]
            : undefined;

        grid?.removeWidget(widgetEl);
        persistGrids();
        deleteMutation.mutate({ id: Number(widget.id) });

        if (activeWidgetElementRef.current === widgetEl) {
          activeWidgetElementRef.current = null;
          setActiveWidget(null);
          setDraftText('');
        }
        return;
      }

      const contentEl = target.closest('.grid-stack-item-content');
      if (!(contentEl instanceof HTMLElement)) return;

      const widgetEl = contentEl.closest('.grid-stack-item');
      if (!(widgetEl instanceof HTMLElement)) return;

      const widget = getGridNode(widgetEl);
      if (!widget) return;

      const gridEl = widgetEl.closest('.grid-stack');
      const gridIndex = gridEl === leftEl ? 0 : gridEl === rightEl ? 1 : null;
      if (gridIndex === null) return;

      activeWidgetElementRef.current = widgetEl;
      setActiveWidget({
        gridIndex: gridIndex as 0 | 1,
        sectionLabel: gridIndex === 0 ? 'active' : 'done',
      });
      setDraftText(String(widget.content ?? ''));
    };

    routeEl.addEventListener('click', handleRouteClick);
    initializedRef.current = true;

    return () => {
      routeEl.removeEventListener('click', handleRouteClick);
      initializedRef.current = false;
      gridsRef.current = [];
      persistGridsRef.current = () => {};
      leftGrid.destroy(false);
      rightGrid.destroy(false);
      GridStack.renderCB = previousRenderCB;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync GridStack widgets with todos ──
  const syncGrids = useCallback(() => {
    const leftGrid = gridsRef.current[0];
    const rightGrid = gridsRef.current[1];
    if (!leftGrid || !rightGrid) return;

    isSyncingRef.current = true;

    const activeIds = new Set(activeTodos.map((t) => String(t.id)));
    const doneIds = new Set(doneTodos.map((t) => String(t.id)));
    const allTodoIds = new Set([...activeIds, ...doneIds]);

    const leftWidgets = serializeGrid(leftGrid);
    const rightWidgets = serializeGrid(rightGrid);
    const allWidgetIds = new Set([
      ...leftWidgets.map((w) => w.id),
      ...rightWidgets.map((w) => w.id),
    ]);

    const positionCache = loadPositionCache();

    // 1. Remove widgets for deleted todos
    for (const grid of [leftGrid, rightGrid]) {
      for (const node of [...grid.engine.nodes]) {
        const widget = node as TodoWidget;
        if (!allTodoIds.has(widget.id)) {
          grid.removeWidget(node.el as HTMLElement, false);
        }
      }
    }

    // 2. Move widgets that changed completion status
    for (const node of [...leftGrid.engine.nodes]) {
      const widget = node as TodoWidget;
      if (doneIds.has(widget.id)) {
        leftGrid.removeWidget(node.el as HTMLElement, false);
        rightGrid.addWidget({ ...widget, w: 1, h: 1 });
      }
    }
    for (const node of [...rightGrid.engine.nodes]) {
      const widget = node as TodoWidget;
      if (activeIds.has(widget.id)) {
        rightGrid.removeWidget(node.el as HTMLElement, false);
        const pos = positionCache[widget.id];
        leftGrid.addWidget({
          ...widget,
          ...(pos ?? { w: 1, h: 1 }),
        });
      }
    }

    // 3. Add widgets for new active todos
    for (const todo of activeTodos) {
      const id = String(todo.id);
      if (allWidgetIds.has(id)) continue;
      const pos = positionCache[id] ?? (isGuest ? null : getGridMetadata(todo));
      leftGrid.addWidget({
        id,
        content: todo.text,
        ...(pos ?? { w: 1, h: 1 }),
      });
      if (pos) {
        positionCache[id] = pos;
      }
    }

    // 4. Add widgets for new done todos
    for (const todo of doneTodos) {
      const id = String(todo.id);
      if (allWidgetIds.has(id)) continue;
      rightGrid.addWidget({
        id,
        content: todo.text,
        w: 1,
        h: 1,
      });
    }

    // 5. Update text for existing widgets
    const todoById = new Map(todos.map((t) => [String(t.id), t]));
    for (const grid of [leftGrid, rightGrid]) {
      for (const node of [...grid.engine.nodes]) {
        const widget = node as TodoWidget;
        const todo = todoById.get(widget.id);
        if (todo && widget.content !== todo.text) {
          grid.update(node.el as HTMLElement, { content: todo.text });
        }
      }
    }

    savePositionCache(positionCache);
    isSyncingRef.current = false;
  }, [activeTodos, doneTodos, todos, isGuest]);

  // Run sync when todos change and GridStack is initialized
  useEffect(() => {
    if (!initializedRef.current || todosLoading) return;
    syncGrids();
  }, [syncGrids, todosLoading]);

  // ── Save grid metadata for logged-in users ──
  const saveMetadata = useCallback(
    (todoId: number, pos: GridPosition) => {
      if (isGuest) return;
      const todo = (todos as Task[]).find((t) => t.id === todoId);
      if (!todo) return;
      const currentMetadata = (todo.metadata ?? {}) as TodoMetadata;
      const existing = getGridMetadata(todo);
      if (
        existing &&
        existing.x === pos.x &&
        existing.y === pos.y &&
        existing.w === pos.w &&
        existing.h === pos.h
      )
        return;
      updateMutation.mutate({
        id: todoId,
        metadata: {
          ...currentMetadata,
          grid: { x: pos.x, y: pos.y, w: pos.w, h: pos.h },
        },
      });
    },
    [todos, isGuest, updateMutation]
  );

  // ── UI handlers ──
  const toggleFloat = (index: number) => {
    const grid = gridsRef.current[index];
    if (!grid) return;
    grid.float(!grid.getFloat());
    setFloatStates(gridsRef.current.map((g) => g?.getFloat() ?? false));
  };

  const compactGrid = (index: number) => {
    gridsRef.current[index]?.compact();
  };

  const closeModal = () => {
    activeWidgetElementRef.current = null;
    setActiveWidget(null);
    setDraftText('');
  };

  const saveWidgetText = () => {
    const widgetEl = activeWidgetElementRef.current;
    if (!activeWidget || !widgetEl) return;

    const grid = gridsRef.current[activeWidget.gridIndex];
    if (!grid) return;

    const nextText = draftText;
    const widget = getGridNode(widgetEl);
    if (!widget) return;

    grid.update(widgetEl, { content: nextText });
    updateMutation.mutate({ id: Number(widget.id), text: nextText });

    // Save position to metadata on text save (for logged-in users)
    const updatedWidget = getGridNode(widgetEl);
    if (updatedWidget && activeWidget.gridIndex === 0) {
      saveMetadata(Number(updatedWidget.id), {
        x: updatedWidget.x ?? 0,
        y: updatedWidget.y ?? 0,
        w: updatedWidget.w ?? 1,
        h: updatedWidget.h ?? 1,
      });
    }

    closeModal();
  };

  return (
    <>
      <div ref={routeRef} className='p-4 md:p-6'>
        <style>{`
        .gridstack-page .grid-stack {
          background: color-mix(in oklab, var(--muted) 40%, transparent);
          border: 1px solid var(--border);
          min-height: 160px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .gridstack-page .grid-stack-item-content {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0.75rem;
          border: 1px dotted color-mix(in oklab, var(--foreground) 45%, transparent);
          background: color-mix(in oklab, var(--card) 92%, var(--primary) 8%);
          user-select: none;
        }

        .gridstack-page .gridstack-item-text {
          max-width: 100%;
          overflow-wrap: anywhere;
          text-align: center;
        }

        .gridstack-page .grid-stack-placeholder > .placeholder-content {
          background: color-mix(in oklab, var(--primary) 18%, transparent);
        }

        .gridstack-page .gridstack-remove-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          height: 1.25rem;
          width: 1.25rem;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--muted-foreground);
          font-size: 0.875rem;
          line-height: 1;
          opacity: 0;
          pointer-events: none;
          transition: opacity 150ms ease, color 150ms ease;
        }

        .gridstack-page .grid-stack-item:hover .gridstack-remove-btn,
        .gridstack-page .gridstack-remove-btn:focus-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .gridstack-page .gridstack-remove-btn:hover,
        .gridstack-page .gridstack-remove-btn:focus-visible {
          color: var(--foreground);
        }
      `}</style>

        <div className='gridstack-page mx-auto max-w-8xl space-y-6'>
          <div>
            <h1 className='text-2xl font-semibold'>Grid View</h1>
            <p className='text-sm text-muted-foreground'>
              Drag tiles between grids to mark complete. Resize them to assign
              effort. Changes persist across views.
            </p>
          </div>

          {isGuest && <GuestBanner />}

          {todosLoading ? <PageLoader /> : null}

          <div
            className={`space-y-6 ${todosLoading ? 'invisible' : ''}`}
            aria-hidden={todosLoading}
          >
            {[
              { label: 'Active', ref: leftGridRef, index: 0 },
              { label: 'Done', ref: rightGridRef, index: 1 },
            ].map((grid) => (
              <section key={grid.label} className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium'>{grid.label}</span>
                  <button
                    type='button'
                    className='rounded-md border px-2 py-1 text-xs'
                    onClick={() => toggleFloat(grid.index)}
                  >
                    {`float: ${String(floatStates[grid.index])}`}
                  </button>
                  <button
                    type='button'
                    className='rounded-md border px-2 py-1 text-xs'
                    onClick={() => compactGrid(grid.index)}
                  >
                    Compact
                  </button>
                </div>
                <div ref={grid.ref} className='grid-stack' />
              </section>
            ))}
          </div>
        </div>

        <Dialog.Root
          open={Boolean(activeWidget)}
          onOpenChange={(open) => (!open ? closeModal() : undefined)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className='fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
            {activeWidget ? (
              <Dialog.Content className='fixed top-1/2 left-1/2 z-51 w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 border bg-background p-4 shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-1'>
                    <Dialog.Title className='text-lg font-semibold capitalize'>
                      {activeWidget.sectionLabel}
                    </Dialog.Title>
                    <Dialog.Description className='text-sm text-muted-foreground'>
                      Edit task text
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type='button'
                      className='rounded-md border p-1 text-sm'
                    >
                      <XIcon className='size-4' />
                      <span className='sr-only'>Close</span>
                    </button>
                  </Dialog.Close>
                </div>

                <textarea
                  autoFocus
                  className='min-h-40 w-full border p-3 text-sm outline-none'
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                />

                <div className='flex justify-end gap-3'>
                  <button
                    type='button'
                    className='rounded-md border px-3 py-2 text-sm'
                    onClick={saveWidgetText}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Content>
            ) : null}
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <AddTaskDrawer
        categories={categories}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        onAddCategory={() => setAddCategoryOpen(true)}
      />
      <AddCategory open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </>
  );
}
