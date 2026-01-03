import { useMemo, useCallback } from 'react';

/**
 * Hook para reordenação de itens com normalização automática
 *
 * @param {Array} items - Lista de itens a serem ordenados
 * @param {Function} onSave - Função para salvar item no banco
 * @returns {Object} - Itens ordenados e função de movimentação
 */
export const useReorder = (items, onSave) => {
  // Normaliza a ordem dos itens (garante sequência 1, 2, 3, 4...)
  const normalizeOrder = useCallback((itemsList) => {
    return itemsList.map((item, index) => ({
      ...item,
      order: index + 1
    }));
  }, []);

  // Itens ordenados por 'order'
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });

    // Se houver items sem order definida, normaliza tudo
    const hasUndefinedOrder = sorted.some(item => item.order === undefined || item.order === 999);
    if (hasUndefinedOrder) {
      return normalizeOrder(sorted);
    }

    return sorted;
  }, [items, normalizeOrder]);

  // Move um item para cima ou para baixo
  const moveItem = useCallback(async (item, direction) => {
    // Encontra o índice atual
    const currentIndex = sortedItems.findIndex(i => i.id === item.id);

    // Verifica limites
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedItems.length - 1)
    ) {
      return { success: false, message: 'Item já está no limite' };
    }

    // Calcula novo índice
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Cria novo array com a ordem trocada
    const reordered = [...sortedItems];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, movedItem);

    // Renumera todos os itens de 1 a N
    const renumbered = reordered.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    // Salva apenas os dois itens que trocaram de posição
    // (mais eficiente do que salvar todos)
    try {
      await onSave(renumbered[currentIndex]);
      await onSave(renumbered[newIndex]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      return { success: false, error };
    }
  }, [sortedItems, onSave]);

  return {
    sortedItems,
    moveItem,
    normalizeOrder
  };
};
