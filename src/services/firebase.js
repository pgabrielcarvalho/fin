import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuração do Firebase usando variáveis de ambiente (Vite)
const getFirebaseConfig = () => {
  return {
    config: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    },
    appId: import.meta.env.VITE_APP_ID || 'planejamento-2026'
  };
};

// Inicializa Firebase
const { config: firebaseConfig, appId } = getFirebaseConfig();

// Validação de configuração
const validateConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = requiredFields.filter(field => !config[field]);

  if (missing.length > 0) {
    throw new Error(
      `Configuração Firebase incompleta. Campos faltando: ${missing.join(', ')}\n` +
      'Verifique o arquivo .env.local'
    );
  }
};

validateConfig(firebaseConfig);

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Habilita persistência offline (opcional, mas recomendado)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência não habilitada: múltiplas abas abertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistência não suportada neste navegador');
    }
  });
}

/**
 * Retorna os segmentos de caminho base do usuário com namespace de ano
 */
const getUserYearPath = (userId, year) => [
  'artifacts', appId, 'users', userId, 'years', String(year)
];

/**
 * Retorna os segmentos de caminho base do usuário (sem ano - caminho legado)
 */
const getUserLegacyPath = (userId) => [
  'artifacts', appId, 'users', userId
];

export { auth, db, appId, getUserYearPath, getUserLegacyPath };
