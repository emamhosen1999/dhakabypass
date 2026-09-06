'use client';

import { useState, useTransition } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Drag-and-drop reordering for the block editor.
 *
 * Replaces the per-block ↑/↓ forms, each of which was a separate server
 * round-trip and a full page re-render: moving a block from position 9 to
 * position 1 cost eight page reloads. One drag is now one optimistic local
 * reorder plus one `reorderBlocksAction`, which writes the whole ordering in a
 * single transaction.
 *
 * KEYBOARD IS NOT OPTIONAL HERE. Drag-only reordering would lock every
 * keyboard and switch user out of the ordering controls entirely, so the drag
 * handle is a real <button> carrying dnd-kit's KeyboardSensor: Tab to it,
 * Space/Enter to pick the block up, ↑/↓ to move it, Space/Enter to drop,
 * Escape to cancel. The same code path runs for pointer and keyboard, so the
 * two cannot drift.
 *
 * Each block's editor arrives as a pre-rendered server node in `items[].editor`
 * — the forms inside it keep their own server actions and are untouched by the
 * drag layer. PointerSensor carries an 8px activation distance so clicking a
 * button or focusing a field inside a block never starts a drag.
 */
function SortableBlock({ id, label, status, position, total, editor }) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border rounded p-4 space-y-4 bg-white ${isDragging ? 'opacity-60 shadow-lg z-10 relative' : ''}`}
    >
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="flex items-center gap-3 font-semibold">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${label}, position ${position} of ${total}`}
            title="Drag, or press Space then the arrow keys, to reorder"
            className="cursor-grab active:cursor-grabbing px-2 py-1 border rounded text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 touch-none"
          >
            <span aria-hidden="true">⠿</span>
          </button>
          <span>
            <span className="mr-2 text-xs font-normal tabular-nums text-gray-400">{position}</span>
            {label}
            <span className="ml-3 text-xs uppercase tracking-wider text-gray-500">{status}</span>
          </span>
        </h2>
        {/* Duplicate / Delete forms are rendered server-side inside `editor`. */}
      </div>
      {editor}
    </section>
  );
}

export default function BlockSortableList({ pageId, slug, items, reorderAction }) {
  const serverOrder = items.map((b) => b.id).join(',');
  const [ids, setIds] = useState(() => items.map((b) => b.id));
  // When the server re-renders after a save (add, delete, duplicate, or our own
  // reorder), adopt its ordering rather than keeping stale local state. This is
  // React's documented "adjust state during render" pattern — cheaper and
  // flicker-free compared with an effect.
  const [seenOrder, setSeenOrder] = useState(serverOrder);
  if (seenOrder !== serverOrder) {
    setSeenOrder(serverOrder);
    setIds(items.map((b) => b.id));
  }

  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const byId = new Map(items.map((b) => [b.id, b]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  const labelOf = (id) => byId.get(id)?.label ?? 'Block';

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from === -1 || to === -1) return;

    const previous = ids;
    const next = arrayMove(ids, from, to);
    setIds(next);
    setError('');

    const fd = new FormData();
    fd.set('pageId', String(pageId));
    fd.set('slug', slug || '');
    fd.set('order', next.join(','));

    startTransition(async () => {
      try {
        await reorderAction(fd);
      } catch (err) {
        // Put the list back where the operator found it — a silent revert to a
        // different order than the database holds is worse than an error.
        setIds(previous);
        setError(err?.message || 'Could not save the new order.');
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-gray-500">No blocks yet. Add one above.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-gray-500" aria-live="polite">
        <span>
          Drag a block by its handle to reorder, or focus the handle and press Space then ↑ / ↓.
        </span>
        {pending ? <span className="text-gray-400">Saving order…</span> : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      ) : null}

      <DndContext
        id="pages-v2-blocks"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.`,
            onDragOver: ({ active, over }) =>
              (over ? `${labelOf(active.id)} is now over position ${ids.indexOf(over.id) + 1} of ${ids.length}.` : ''),
            onDragEnd: ({ active, over }) =>
              (over
                ? `${labelOf(active.id)} dropped at position ${ids.indexOf(over.id) + 1} of ${ids.length}.`
                : `${labelOf(active.id)} returned to its original position.`),
            onDragCancel: ({ active }) => `Reordering cancelled. ${labelOf(active.id)} returned to its original position.`,
          },
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {ordered.map((block, i) => (
              <SortableBlock
                key={block.id}
                id={block.id}
                label={block.label}
                status={block.status}
                position={i + 1}
                total={ordered.length}
                editor={block.editor}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
