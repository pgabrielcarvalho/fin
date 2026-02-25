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
  const [migrationDone, setMigrationDone] = useState(false);

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
    });
  }, [user]);

  // Migração automática na primeira carga
  useEffect(() => {
    if (!user) return;

    const migrationKey = `migrated_to_years_v1_${user.uid}`;
    if (localStorage.getItem(migrationKey)) {
      setMigrationDone(true);
      return;
    }

    setMigrating(true);

    migrateToYearNamespace(user.uid, 2026).then((result) => {
      setMigrating(false);
      setMigrationDone(true);

      if (result.migrated) {
        console.log(`Migração concluída: ${result.count} itens`);
        // Atualizar anos disponíveis após migração
        getAvailableYears(user.uid).then(years => {
          setAvailableYears(years);
        });
      }
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
    migrationDone,
    startNewYear
  };
};
