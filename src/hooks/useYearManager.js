import { useState, useEffect, useCallback } from 'react';
import { migrateToYearNamespace, copyYearData, getAvailableYears } from './useFirestore';

const STORAGE_KEY = 'finpg_selected_year';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Hook para gerenciar o ano selecionado e multi-ano
 */
export const useYearManager = (user) => {
  const [selectedYear, setSelectedYearState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored) : CURRENT_YEAR;
  });

  const [availableYears, setAvailableYears] = useState([CURRENT_YEAR]);
  const [migrating, setMigrating] = useState(false);

  // Persistir ano selecionado no localStorage
  const setSelectedYear = useCallback((year) => {
    setSelectedYearState(year);
    localStorage.setItem(STORAGE_KEY, String(year));
  }, []);

  // Carregar anos disponíveis
  useEffect(() => {
    if (!user) return;

    getAvailableYears(user.uid).then(years => {
      setAvailableYears(years);
    }).catch(() => {
      // Silently fall back to current year
    });
  }, [user]);

  // Migração automática em background (não bloqueia a UI)
  useEffect(() => {
    if (!user) return;

    const migrationKey = `migrated_to_years_v1_${user.uid}`;
    if (localStorage.getItem(migrationKey)) {
      return;
    }

    // Executar migração em background sem bloquear
    setMigrating(true);

    const timeout = setTimeout(() => {
      // Safety timeout: se a migração demorar mais de 10s, desbloqueia a UI
      setMigrating(false);
    }, 10000);

    migrateToYearNamespace(user.uid, 2026)
      .then((result) => {
        if (result.migrated) {
          console.log(`Migração concluída: ${result.count} itens`);
          getAvailableYears(user.uid).then(years => {
            setAvailableYears(years);
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Migração falhou (será tentada novamente):', err);
      })
      .finally(() => {
        clearTimeout(timeout);
        setMigrating(false);
      });
  }, [user]);

  // Iniciar novo ano
  const startNewYear = useCallback(async (newYear) => {
    if (!user) return { success: false };

    const result = await copyYearData(user.uid, selectedYear, newYear);

    if (result.success) {
      // Atualizar lista de anos
      const updatedYears = [...availableYears];
      if (!updatedYears.includes(newYear)) {
        updatedYears.push(newYear);
        updatedYears.sort();
      }
      setAvailableYears(updatedYears);
      setSelectedYear(newYear);
    }

    return result;
  }, [user, selectedYear, availableYears, setSelectedYear]);

  return {
    selectedYear,
    setSelectedYear,
    availableYears,
    migrating,
    startNewYear
  };
};
