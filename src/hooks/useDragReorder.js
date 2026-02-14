import { useCallback } from 'react';

/**
 * Hook para reordenação via drag-and-drop.
 *
 * @param {string} collectionName - Nome da coleção no Firestore
 * @param {Array} sortedItems - Lista de itens já ordenados
 * @param {Function} onBatchSave - Função batchSaveItems do App
 * @param {Array} [globalItems] - Lista global (se diferente da visível, ex: expenses com filtro de mês)
 * @returns {{ handleDragReorder: Function }}
 */
export const useDragReorder = (collectionName, sortedItems, onBatchSave, globalItems) => {
  const handleDragReorder = useCallback(async (oldIndex, newIndex) => {
    const item = sortedItems[oldIndex];
    const neighbor = sortedItems[newIndex];

    // Se há uma lista global separada (ex: todas as despesas, não só as ativas),
    // fazemos splice nela para manter order consistente
    const baseList = globalItems || sortedItems;

    if (globalItems) {
      const globalIdx = baseList.findIndex(e => e.id === item.id);
      const reordered = [...baseList];
      const [moved] = reordered.splice(globalIdx, 1);
      const insertAt = reordered.findIndex(e => e.id === neighbor.id);
      reordered.splice(oldIndex < newIndex ? insertAt + 1 : insertAt, 0, moved);

      const renumbered = reordered.map((e, idx) => ({ ...e, order: idx + 1 }));
      try {
        await onBatchSave([
          { collectionName, item: renumbered.find(e => e.id === item.id) },
          { collectionName, item: renumbered.find(e => e.id === neighbor.id) }
        ]);
      } catch { /* silent */ }
    } else {
      const reordered = [...sortedItems];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const renumbered = reordered.map((e, idx) => ({ ...e, order: idx + 1 }));
      try {
        await onBatchSave([
          { collectionName, item: renumbered.find(e => e.id === item.id) },
          { collectionName, item: renumbered.find(e => e.id === neighbor.id) }
        ]);
      } catch { /* silent */ }
    }
  }, [collectionName, sortedItems, onBatchSave, globalItems]);

  return { handleDragReorder };
};
