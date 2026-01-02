import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

/**
 * Hook para gerenciar coleções do Firestore
 */
export const useCollection = (user, collectionName, seedData = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const collectionRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      collectionName
    );

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
            `seeded_${collectionName}_v5_${user.uid}`
          );

          if (shouldSeed) {
            seedCollection(user.uid, collectionName, seedData);
            localStorage.setItem(
              `seeded_${collectionName}_v5_${user.uid}`,
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
  }, [user, collectionName]);

  return { data, loading, error };
};

/**
 * Hook para gerenciar documentos individuais do Firestore
 */
export const useDocument = (user, docPath, defaultValue = null) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setData(defaultValue);
      setLoading(false);
      return;
    }

    setLoading(true);

    const docRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'general',
      docPath
    );

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data().data);
        } else if (defaultValue !== null) {
          // Cria documento com valor padrão
          setDoc(docRef, { data: defaultValue }).catch(e =>
            console.error("Erro ao criar documento:", e)
          );
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
  }, [user, docPath]);

  return { data, loading, error };
};

/**
 * Hook para operações CRUD
 */
export const useFirestoreOperations = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Salva um item em uma coleção
   */
  const saveItem = useCallback(async (collectionName, item) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      let docRef;

      if (item.id) {
        docRef = doc(
          db,
          'artifacts',
          appId,
          'users',
          user.uid,
          collectionName,
          item.id
        );
      } else {
        docRef = doc(
          collection(db, 'artifacts', appId, 'users', user.uid, collectionName)
        );
      }

      const { id, ...data } = item;
      await setDoc(docRef, data);

      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Deleta um item de uma coleção
   */
  const deleteItem = useCallback(async (collectionName, itemId) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      await deleteDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, collectionName, itemId)
      );

      return { success: true };
    } catch (err) {
      console.error("Erro ao deletar:", err);
      setError(err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Salva um documento
   */
  const saveDocument = useCallback(async (docPath, data) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'general',
        docPath
      );

      await setDoc(docRef, { data });

      return { success: true };
    } catch (err) {
      console.error("Erro ao salvar documento:", err);
      setError(err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    saveItem,
    deleteItem,
    saveDocument,
    loading,
    error
  };
};

/**
 * Função auxiliar para popular coleção com dados iniciais
 */
const seedCollection = async (userId, collectionName, initialData) => {
  const batch = writeBatch(db);

  initialData.forEach(item => {
    const docRef = doc(
      collection(db, 'artifacts', appId, 'users', userId, collectionName)
    );
    batch.set(docRef, item);
  });

  try {
    await batch.commit();
    console.log(`✅ Dados iniciais populados para ${collectionName}`);
  } catch (e) {
    console.error("Erro ao popular dados iniciais:", e);
  }
};
