import { createFileRoute } from '@tanstack/react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { GridStack, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

export const Route = createFileRoute('/grid')({
  component: RouteComponent,
});

type TodoWidget = GridStackWidget & {
  id: string;
  content: string;
};

type StoredGridState = {
  dependent: TodoWidget[];
  done: TodoWidget[];
  nextId: number;
};

type ActiveWidget = {
  gridIndex: 0 | 1;
  sectionLabel: 'dependent' | 'done';
};

const STORAGE_KEY = 'todo-gridstack-state-v3';
const PREVIEW_TEXT_LIMIT = 24;

const GRID_ROWS = 6;

function generateFixedGridItems(): TodoWidget[] {
  return [
    { id: '0', x: 0, y: 0, w: 2, h: 2, content: 'write something' },
    { id: '1', x: 3, y: 1, w: 2, h: 2, content: 'write something' },
    { id: '2', x: 5, y: 0, w: 1, h: 1, content: 'write something' },
    { id: '3', x: 3, y: 4, w: 1, h: 1, content: 'write something' },
    { id: '4', x: 1, y: 3, w: 1, h: 1, content: 'write something' },
  ];
}

const defaultDependentItems: TodoWidget[] = generateFixedGridItems();

const defaultDoneItems: TodoWidget[] = [];

function cloneWidgets(widgets: TodoWidget[]) {
  return widgets.map((widget) => ({ ...widget }));
}

function getDefaultGridState(): StoredGridState {
  return {
    dependent: cloneWidgets(defaultDependentItems),
    done: cloneWidgets(defaultDoneItems),
    nextId: defaultDependentItems.length,
  };
}

function normalizeWidgets(value: unknown): TodoWidget[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((widget, index) => {
    if (!widget || typeof widget !== 'object') {
      return [];
    }

    const candidate = widget as GridStackWidget & {
      id?: unknown;
      content?: unknown;
    };

    return [
      {
        ...candidate,
        id: String(candidate.id ?? index),
        content: String(candidate.content ?? ''),
      },
    ];
  });
}

function loadStoredGridState(): StoredGridState {
  const fallback = getDefaultGridState();

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as {
      dependent?: unknown;
      done?: unknown;
      nextId?: unknown;
    };

    const dependent =
      parsed.dependent === undefined
        ? fallback.dependent
        : normalizeWidgets(parsed.dependent);
    const done =
      parsed.done === undefined ? fallback.done : normalizeWidgets(parsed.done);

    const nextIdFromWidgets =
      Math.max(
        -1,
        ...[...dependent, ...done]
          .map((widget) => Number(widget.id))
          .filter((value) => Number.isFinite(value))
      ) + 1;

    return {
      dependent,
      done,
      nextId:
        typeof parsed.nextId === 'number'
          ? parsed.nextId
          : Math.max(fallback.nextId, nextIdFromWidgets),
    };
  } catch {
    return fallback;
  }
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

function RouteComponent() {
  const routeRef = useRef<HTMLDivElement>(null);
  const leftGridRef = useRef<HTMLDivElement>(null);
  const rightGridRef = useRef<HTMLDivElement>(null);
  const gridsRef = useRef<GridStack[]>([]);
  const nextWidgetIdRef = useRef(defaultDependentItems.length);
  const activeWidgetElementRef = useRef<HTMLElement | null>(null);
  const persistGridsRef = useRef<() => void>(() => {});
  const [floatStates, setFloatStates] = useState([true, false]);
  const [activeWidget, setActiveWidget] = useState<ActiveWidget | null>(null);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    const routeEl = routeRef.current;
    const leftEl = leftGridRef.current;
    const rightEl = rightGridRef.current;

    if (!routeEl || !leftEl || !rightEl) {
      return;
    }

    const storedState = loadStoredGridState();
    nextWidgetIdRef.current = storedState.nextId;

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
        children: storedState.dependent,
      },
      leftEl
    );
    const rightGrid = GridStack.init(
      {
        ...options,
        float: false,
        maxRow: GRID_ROWS,
        disableResize: true,
        children: storedState.done,
      },
      rightEl
    );

    // When widgets are moved to the done grid, force them to 1×1
    const normalizeDoneWidgets = () => {
      const nodes = rightGrid.engine.nodes;
      for (const node of nodes) {
        if (node.w !== 1 || node.h !== 1) {
          rightGrid.update(node.el as HTMLElement, { w: 1, h: 1 });
        }
      }
      rightGrid.compact();
    };

    // Also normalize any existing done widgets loaded from storage
    normalizeDoneWidgets();

    gridsRef.current = [leftGrid, rightGrid];
    setFloatStates([leftGrid.getFloat(), rightGrid.getFloat()]);

    const persistGrids = () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dependent: serializeGrid(leftGrid),
          done: serializeGrid(rightGrid),
          nextId: nextWidgetIdRef.current,
        })
      );
    };

    persistGridsRef.current = persistGrids;
    persistGrids();

    leftGrid.on('change', persistGrids);
    leftGrid.on('added', persistGrids);
    leftGrid.on('removed', persistGrids);
    rightGrid.on('change', persistGrids);
    rightGrid.on('added', () => {
      normalizeDoneWidgets();
      persistGrids();
    });
    rightGrid.on('removed', persistGrids);

    const handleRouteClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const removeButton = target.closest('.gridstack-remove-btn');

      if (removeButton instanceof HTMLButtonElement) {
        const widgetEl = removeButton.closest('.grid-stack-item');
        const gridEl = widgetEl?.closest('.grid-stack');

        if (
          !(widgetEl instanceof HTMLElement) ||
          !(gridEl instanceof HTMLElement)
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const grid =
          gridEl === leftEl
            ? gridsRef.current[0]
            : gridEl === rightEl
            ? gridsRef.current[1]
            : undefined;

        grid?.removeWidget(widgetEl);
        persistGrids();

        if (activeWidgetElementRef.current === widgetEl) {
          activeWidgetElementRef.current = null;
          setActiveWidget(null);
          setDraftText('');
        }

        return;
      }

      const contentEl = target.closest('.grid-stack-item-content');

      if (!(contentEl instanceof HTMLElement)) {
        return;
      }

      const widgetEl = contentEl.closest('.grid-stack-item');
      const gridEl = widgetEl?.closest('.grid-stack');

      if (
        !(widgetEl instanceof HTMLElement) ||
        !(gridEl instanceof HTMLElement)
      ) {
        return;
      }

      const widget = getGridNode(widgetEl);
      const gridIndex = gridEl === leftEl ? 0 : gridEl === rightEl ? 1 : null;

      if (!widget || gridIndex === null) {
        return;
      }

      const text = String(widget.content ?? '');
      activeWidgetElementRef.current = widgetEl;
      setActiveWidget({
        gridIndex,
        sectionLabel: gridIndex === 0 ? 'dependent' : 'done',
      });
      setDraftText(text);
    };

    routeEl.addEventListener('click', handleRouteClick);

    return () => {
      routeEl.removeEventListener('click', handleRouteClick);
      gridsRef.current = [];
      persistGridsRef.current = () => {};
      leftGrid.destroy(false);
      rightGrid.destroy(false);
      GridStack.renderCB = previousRenderCB;
    };
  }, []);

  const toggleFloat = (index: number) => {
    const grid = gridsRef.current[index];

    if (!grid) {
      return;
    }

    grid.float(!grid.getFloat());
    setFloatStates(
      gridsRef.current.map((currentGrid) => currentGrid.getFloat())
    );
  };

  const compactGrid = (index: number) => {
    gridsRef.current[index]?.compact();
  };

  const closeModal = () => {
    activeWidgetElementRef.current = null;
    setActiveWidget(null);
    setDraftText('');
  };

  const addGrid = () => {
    const leftGrid = gridsRef.current[0];

    if (!leftGrid) {
      return;
    }

    const nextId = nextWidgetIdRef.current;
    nextWidgetIdRef.current += 1;

    leftGrid.addWidget({
      id: String(nextId),
      w: 1,
      h: 1,
      content: 'write something',
    });
    persistGridsRef.current();
  };

  const resetGrids = () => {
    const leftGrid = gridsRef.current[0];
    const rightGrid = gridsRef.current[1];

    if (!leftGrid || !rightGrid || typeof window === 'undefined') {
      return;
    }

    const defaults = getDefaultGridState();
    window.localStorage.removeItem(STORAGE_KEY);
    nextWidgetIdRef.current = defaults.nextId;
    closeModal();
    leftGrid.load(cloneWidgets(defaults.dependent));
    rightGrid.load(cloneWidgets(defaults.done));
    setFloatStates([leftGrid.getFloat(), rightGrid.getFloat()]);
    persistGridsRef.current();
  };

  const saveWidgetText = () => {
    const widgetEl = activeWidgetElementRef.current;

    if (!activeWidget || !widgetEl) {
      return;
    }

    const grid = gridsRef.current[activeWidget.gridIndex];

    if (!grid) {
      return;
    }

    const nextText = draftText;
    grid.update(widgetEl, { content: nextText });
    persistGridsRef.current();
    closeModal();
  };

  return (
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
          <h1 className='text-2xl font-semibold'>Two grids demo</h1>
          <p className='text-sm text-muted-foreground'>
            Add widgets to the left grid, move them between grids, resize them,
            or remove them with the hover action. Changes are saved in local
            storage.
          </p>
        </div>

        <div className='space-y-6'>
          {[
            { label: 'dependent', ref: leftGridRef, index: 0 },
            { label: 'done', ref: rightGridRef, index: 1 },
          ].map((grid) => (
            <section key={grid.label} className='space-y-3'>
              <div className='text-sm font-medium'>{grid.label}</div>
              <div className='flex items-center gap-3'>
                {grid.index === 0 ? (
                  <>
                    <button
                      type='button'
                      className='rounded-md border px-3 py-2 text-sm'
                      onClick={addGrid}
                    >
                      Add grid
                    </button>
                    <button
                      type='button'
                      className='rounded-md border border-red-600 px-3 py-2 text-sm text-red-600'
                      onClick={resetGrids}
                    >
                      Reset saved grids
                    </button>
                  </>
                ) : null}
                <button
                  type='button'
                  className='rounded-md border px-3 py-2 text-sm'
                  onClick={() => toggleFloat(grid.index)}
                >
                  {`float: ${String(floatStates[grid.index])}`}
                </button>
                <button
                  type='button'
                  className='rounded-md border px-3 py-2 text-sm'
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
                  <Dialog.Title className='text-lg font-semibold'>
                    {activeWidget.sectionLabel}
                  </Dialog.Title>
                  <Dialog.Description className='text-sm text-muted-foreground'>
                    Widget details
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
  );
}
