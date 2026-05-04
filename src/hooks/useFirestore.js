import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, appId, getUserYearPath, getUserLegacyPath } from '../services/firebase';

/**
 * Hook para gerenciar coleções do Firestore (com namespace de ano)
 */
export const useCollection = (user, collectionName, seedData = null, year = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !year) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const basePath = getUserYearPath(user.uid, year);
    const collectionRef = collection(db, ...basePath, collectionName);
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Popula dados iniciais se vazio
        if (items.length === 0 && seedData) {
          const shouldSeed = !localStorage.getItem(
            `seeded_${collectionName}_v5_${user.uid}_${year}`
          );

          if (shouldSeed) {
            seedCollection(user.uid, collectionName, seedData, year);
            localStorage.setItem(
              `seeded_${collectionName}_v5_${user.uid}_${year}`,
              'true'
            );
          }
        }

        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName, year]);

  return { data, loading, error };
};

/**
 * Hook para gerenciar documentos individuais do Firestore (com namespace de ano)
 */
export const useDocument = (user, docPath, defaultValue = null, year = null) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !year) {
      setData(defaultValue);
      setLoading(false);
      return;
    }

    setLoading(true);

    const basePath = getUserYearPath(user.uid, year);
    const docRef = doc(db, ...basePath, 'general', docPath);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data().data);
        } else {
          // Documento não existe — usa defaultValue apenas localmente,
          // sem gravar no Firestore (evita sobrescrever dados reais
          // que ainda não chegaram do servidor)
          setData(defaultValue);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar documento ${docPath}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, docPath, year]);

  return { data, loading, error };
};

/**
 * Hook lazy para coleções - só cria listener quando enabled=true (com namespace de ano)
 */
export const useLazyCollection = (user, collectionName, enabled, seedData = null, year = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !enabled || !year) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const basePath = getUserYearPath(user.uid, year);
    const collectionRef = collection(db, ...basePath, collectionName);
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (items.length === 0 && seedData) {
          const shouldSeed = !localStorage.getItem(
            `seeded_${collectionName}_v5_${user.uid}_${year}`
          );

          if (shouldSeed) {
            seedCollection(user.uid, collectionName, seedData, year);
            localStorage.setItem(
              `seeded_${collectionName}_v5_${user.uid}_${year}`,
              'true'
            );
          }
        }

        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName, enabled, year]);

  return { data, loading, error };
};

/**
 * Hook lazy para documentos - só cria listener quando enabled=true (com namespace de ano)
 */
export const useLazyDocument = (user, docPath, enabled, defaultValue = null, year = null) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !enabled || !year) {
      setData(defaultValue);
      setLoading(false);
      return;
    }

    setLoading(true);

    const basePath = getUserYearPath(user.uid, year);
    const docRef = doc(db, ...basePath, 'general', docPath);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data().data);
        } else {
          setData(defaultValue);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar documento ${docPath}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, docPath, enabled, year]);

  return { data, loading, error };
};

/**
 * Hook para operações CRUD (com namespace de ano)
 */
export const useFirestoreOperations = (user, year = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Salva múltiplos itens em batch (máx 500 ops por batch)
   */
  const batchSaveItems = useCallback(async (items) => {
    if (!user || !year) {
      throw new Error('Usuário não autenticado ou ano não definido');
    }

    setLoading(true);
    setError(null);

    try {
      const BATCH_LIMIT = 500;
      const basePath = getUserYearPath(user.uid, year);

      for (let i = 0; i < items.length; i += BATCH_LIMIT) {
        const chunk = items.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);

        for (const { collectionName, item } of chunk) {
          let docRef;

          if (item.id) {
            docRef = doc(db, ...basePath, collectionName, item.id);
          } else {
            docRef = doc(collection(db, ...basePath, collectionName));
          }

          const { id, ...data } = item;
          batch.set(docRef, data);
        }

        await batch.commit();
      }

      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar batch:", err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, year]);

  /**
   * Salva um item em uma coleção
   */
  const saveItem = useCallback(async (collectionName, item) => {
    if (!user || !year) {
      throw new Error('Usuário não autenticado ou ano não definido');
    }

    setLoading(true);
    setError(null);

    try {
      const basePath = getUserYearPath(user.uid, year);
      let docRef;

      if (item.id) {
        docRef = doc(db, ...basePath, collectionName, item.id);
      } else {
        docRef = doc(collection(db, ...basePath, collectionName));
      }

      const { id, ...data } = item;
      await setDoc(docRef, data);

      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, year]);

  /**
   * Deleta um item de uma coleção
   */
  const deleteItem = useCallback(async (collectionName, itemId) => {
    if (!user || !year) {
      throw new Error('Usuário não autenticado ou ano não definido');
    }

    setLoading(true);
    setError(null);

    try {
      const basePath = getUserYearPath(user.uid, year);
      await deleteDoc(doc(db, ...basePath, collectionName, itemId));

      return { success: true };
    } catch (err) {
      console.error("Erro ao deletar:", err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, year]);

  /**
   * Salva um documento
   */
  const saveDocument = useCallback(async (docPath, data) => {
    if (!user || !year) {
      throw new Error('Usuário não autenticado ou ano não definido');
    }

    setLoading(true);
    setError(null);

    try {
      const basePath = getUserYearPath(user.uid, year);
      const docRef = doc(db, ...basePath, 'general', docPath);
      await setDoc(docRef, { data });

      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar documento:", err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, year]);

  return {
    saveItem,
    batchSaveItems,
    deleteItem,
    saveDocument,
    loading,
    error
  };
};

/**
 * Função auxiliar para popular coleção com dados iniciais (com namespace de ano)
 */
const seedCollection = async (userId, collectionName, initialData, year) => {
  const basePath = getUserYearPath(userId, year);
  const batch = writeBatch(db);

  initialData.forEach(item => {
    const docRef = doc(collection(db, ...basePath, collectionName));
    batch.set(docRef, item);
  });

  try {
    await batch.commit();
    console.log(`Dados iniciais populados para ${collectionName} (${year})`);
  } catch (e) {
    console.error("Erro ao popular dados iniciais:", e);
  }
};

/**
 * Migra dados do caminho legado (sem anos) para o caminho novo (years/{ano})
 */
export const migrateToYearNamespace = async (userId, targetYear = 2026) => {
  const migrationKey = `migrated_to_years_v1_${userId}`;
  const migrationFlagRef = doc(db, 'artifacts', appId, 'users', userId, 'meta', 'migration');

  // Verificar flag no localStorage (sessões recentes, evita leitura desnecessária)
  if (localStorage.getItem(migrationKey)) {
    return { migrated: false, reason: 'already_done' };
  }

  // Verificar flag no Firestore (persiste entre reinstalações do PWA)
  try {
    const migrationSnap = await getDocs(
      query(collection(db, 'artifacts', appId, 'users', userId, 'meta'))
    );
    const migrationDoc = migrationSnap.docs.find(d => d.id === 'migration');
    if (migrationDoc?.data()?.completed) {
      // Restaurar flag no localStorage para evitar leituras futuras
      localStorage.setItem(migrationKey, migrationDoc.data().completedAt || 'true');
      return { migrated: false, reason: 'already_done' };
    }
  } catch {
    // Se não conseguir verificar, prosseguir com cautela
  }

  const legacyPath = getUserLegacyPath(userId);
  const yearPath = getUserYearPath(userId, targetYear);

  // Coleções para migrar
  const collections = [
    'incomes',
    'expenses',
    'credit_expenses',
    'vacation_incomes',
    'vacation_expenses',
    'obligations'
  ];

  // Documentos (em general/) para migrar
  const documents = [
    'invoice_totals',
    'goals',
    'expense_categories',
    'income_categories',
    'incomes_notes',
    'expenses_notes',
    'credit_notes',
    'vacation_notes',
    'obligations_notes',
    'card_settings'
  ];

  let totalMigrated = 0;

  try {
    // Migrar coleções (cada uma isolada para não parar tudo se uma falhar)
    for (const colName of collections) {
      try {
        const legacyRef = collection(db, ...legacyPath, colName);
        const snapshot = await getDocs(query(legacyRef));

        if (snapshot.empty) continue;

        const BATCH_LIMIT = 500;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
          const chunk = docs.slice(i, i + BATCH_LIMIT);
          const batch = writeBatch(db);

          for (const docSnap of chunk) {
            const newDocRef = doc(db, ...yearPath, colName, docSnap.id);
            batch.set(newDocRef, docSnap.data());
          }

          await batch.commit();
          totalMigrated += chunk.length;
        }
      } catch (colErr) {
        console.warn(`Migração da coleção ${colName} falhou:`, colErr.message);
      }
    }

    // Migrar documentos em general/ (ler todos de uma vez para economizar leituras)
    try {
      const generalSnap = await getDocs(collection(db, ...legacyPath, 'general'));

      for (const docName of documents) {
        const docSnap = generalSnap.docs.find(d => d.id === docName);
        if (docSnap && docSnap.exists()) {
          try {
            const newDocRef = doc(db, ...yearPath, 'general', docName);
            await setDoc(newDocRef, docSnap.data());
            totalMigrated++;
          } catch (docErr) {
            console.warn(`Migração do documento ${docName} falhou:`, docErr.message);
          }
        }
      }
    } catch (generalErr) {
      console.warn('Migração dos documentos general/ falhou:', generalErr.message);
    }

    // Registrar ano disponível
    try {
      const availableYearsRef = doc(db, ...getUserLegacyPath(userId), 'meta', 'available_years');
      await setDoc(availableYearsRef, { years: [targetYear] });
    } catch (metaErr) {
      console.warn('Registro de anos disponíveis falhou:', metaErr.message);
    }

    // Marcar migração como concluída — no Firestore (persiste entre reinstalações)
    // e no localStorage (evita leitura desnecessária em sessões futuras)
    const completedAt = new Date().toISOString();
    try {
      await setDoc(migrationFlagRef, { completed: true, completedAt });
    } catch {
      // Se falhar ao gravar flag, não é crítico — localStorage garante a sessão atual
    }
    localStorage.setItem(migrationKey, completedAt);
    console.log(`Migração concluída: ${totalMigrated} itens migrados para years/${targetYear}`);

    return { migrated: true, count: totalMigrated };
  } catch (err) {
    console.error('Erro na migração:', err);
    // Mesmo com erro, marcar como feita para não travar o app
    const errorAt = `error_${new Date().toISOString()}`;
    try {
      await setDoc(migrationFlagRef, { completed: true, completedAt: errorAt });
    } catch { /* ignorar */ }
    localStorage.setItem(migrationKey, errorAt);
    return { migrated: false, reason: 'error', error: err.message };
  }
};

/**
 * Copia dados de um ano para outro (para "Iniciar Novo Ano")
 */
export const copyYearData = async (userId, fromYear, toYear) => {
  const fromPath = getUserYearPath(userId, fromYear);
  const toPath = getUserYearPath(userId, toYear);

  // Coleções que devem ser copiadas (com reset de status)
  const collectionsToReset = ['incomes', 'expenses', 'obligations'];
  // Coleção de cartão: copiar apenas fixas
  const creditCollection = 'credit_expenses';

  let totalCopied = 0;

  try {
    // Copiar coleções com reset de paidStatus/doneStatus
    for (const colName of collectionsToReset) {
      const fromRef = collection(db, ...fromPath, colName);
      const snapshot = await getDocs(query(fromRef));

      if (snapshot.empty) continue;

      const batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Para expenses e incomes: copiar apenas fixas
        if ((colName === 'expenses' || colName === 'incomes') && data.type && data.type !== 'fixed') {
          continue;
        }

        // Reset de status
        const newData = { ...data };
        if (newData.paidStatus) {
          newData.paidStatus = Array(12).fill(false);
        }
        if (newData.doneStatus) {
          newData.doneStatus = Array(12).fill(false);
        }
        // Limpar overrides
        if (newData.overrides) {
          newData.overrides = {};
        }

        const newDocRef = doc(collection(db, ...toPath, colName));
        batch.set(newDocRef, newData);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      totalCopied += batchCount;
    }

    // Copiar despesas fixas do cartão (sem eventuais e parceladas)
    const creditRef = collection(db, ...fromPath, creditCollection);
    const creditSnapshot = await getDocs(query(creditRef));

    if (!creditSnapshot.empty) {
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnap of creditSnapshot.docs) {
        const data = docSnap.data();

        // Só copiar fixas
        if (data.type && data.type !== 'fixed') {
          continue;
        }

        const newData = { ...data, overrides: {} };
        if (newData.paidStatus) {
          newData.paidStatus = Array(12).fill(false);
        }

        const newDocRef = doc(collection(db, ...toPath, creditCollection));
        batch.set(newDocRef, newData);
        batchCount++;
      }

      if (batchCount > 0) {
        await batch.commit();
        totalCopied += batchCount;
      }
    }

    // Copiar categorias e configurações do cartão
    const catDocs = ['expense_categories', 'income_categories', 'card_settings'];
    for (const catDoc of catDocs) {
      const fromDocRef = doc(db, ...fromPath, 'general', catDoc);
      // Ler via getDocs da subcoleção general
      const generalSnap = await getDocs(collection(db, ...fromPath, 'general'));
      const catSnap = generalSnap.docs.find(d => d.id === catDoc);
      if (catSnap && catSnap.exists()) {
        const toDocRef = doc(db, ...toPath, 'general', catDoc);
        await setDoc(toDocRef, catSnap.data());
        totalCopied++;
      }
    }

    // Registrar novo ano na lista de anos disponíveis
    const metaRef = doc(db, ...getUserLegacyPath(userId), 'meta', 'available_years');
    const metaSnap = await getDocs(collection(db, ...getUserLegacyPath(userId), 'meta'));
    const yearsDoc = metaSnap.docs.find(d => d.id === 'available_years');
    const currentYears = yearsDoc?.data()?.years || [fromYear];

    if (!currentYears.includes(toYear)) {
      currentYears.push(toYear);
      currentYears.sort();
    }

    await setDoc(metaRef, { years: currentYears });

    console.log(`Ano ${toYear} criado com ${totalCopied} itens copiados de ${fromYear}`);
    return { success: true, count: totalCopied };
  } catch (err) {
    console.error('Erro ao copiar dados do ano:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Busca a lista de anos disponíveis para o usuário
 */
export const getAvailableYears = async (userId) => {
  try {
    const metaRef = collection(db, ...getUserLegacyPath(userId), 'meta');
    const snapshot = await getDocs(metaRef);
    const yearsDoc = snapshot.docs.find(d => d.id === 'available_years');

    if (yearsDoc && yearsDoc.data().years) {
      return yearsDoc.data().years;
    }

    return [new Date().getFullYear()];
  } catch (err) {
    console.error('Erro ao buscar anos disponíveis:', err);
    return [new Date().getFullYear()];
  }
};
