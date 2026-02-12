import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCollection, useDocument, useLazyCollection, useLazyDocument, useFirestoreOperations } from './hooks/useFirestore';
import { useToast } from './contexts/ToastContext';
import { useTheme } from './contexts/ThemeContext';
import { useKeyboardShortcuts, APP_SHORTCUTS } from './hooks/useKeyboardShortcuts';

// Componentes
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IncomeView from './components/IncomeView';
import MonthlyExpensesView from './components/MonthlyExpensesView';
import CreditCardView from './components/CreditCardView';
import YearlyView from './components/YearlyView';
import VacationFundView from './components/VacationFundView';
import ExportMenu from './components/ExportMenu';
import MonthComparison from './components/MonthComparison';

// Services
import { exportToJSON, exportToCSV, exportToPDF, importFromJSON } from './services/exportService';

// Dados iniciais
import {
  INITIAL_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_CREDIT_EXPENSES,
  INITIAL_VACATION_INCOMES,
  INITIAL_VACATION_EXPENSES,
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from './services/seedData';

const App = () => {
  // --- AUTENTICAÇÃO ---
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = useTheme();

  // --- ESTADO DA UI ---
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showExportMenu, setShowExportMenu] = useState(false);

  // --- OPERAÇÕES DO FIRESTORE ---
  const { saveItem, batchSaveItems, deleteItem, saveDocument } = useFirestoreOperations(user);

  // --- DADOS DO FIRESTORE (sempre ativos) ---
  const { data: incomes } = useCollection(user, 'incomes', INITIAL_INCOMES);
  const { data: expenses } = useCollection(user, 'expenses', INITIAL_EXPENSES);
  const { data: creditCardExpenses } = useCollection(user, 'credit_expenses', INITIAL_CREDIT_EXPENSES);
  const { data: invoiceTotals } = useDocument(user, 'invoice_totals', Array(12).fill(0));
  const { data: goals } = useDocument(user, 'goals', { monthlyGoals: [], alerts: { lowBalance: true, highExpenses: true, balanceThreshold: 1000, expenseThreshold: 80 } });
  const { data: expenseCategories } = useDocument(user, 'expense_categories', DEFAULT_CATEGORIES);

  // --- DADOS LAZY (ativam só na aba correspondente) ---
  const { data: vacationIncomes } = useLazyCollection(user, 'vacation_incomes', activeTab === 'vacation', INITIAL_VACATION_INCOMES);
  const { data: vacationExpenses } = useLazyCollection(user, 'vacation_expenses', activeTab === 'vacation', INITIAL_VACATION_EXPENSES);
  const { data: incomesNotes } = useLazyDocument(user, 'incomes_notes', activeTab === 'incomes', Array(12).fill(''));
  const { data: expensesNotes } = useLazyDocument(user, 'expenses_notes', activeTab === 'monthly', Array(12).fill(''));
  const { data: creditNotes } = useLazyDocument(user, 'credit_notes', activeTab === 'credit', Array(12).fill(''));
  const { data: vacationNotes } = useLazyDocument(user, 'vacation_notes', activeTab === 'vacation', Array(12).fill(''));
  const { data: incomeCategories } = useLazyDocument(user, 'income_categories', activeTab === 'incomes', DEFAULT_INCOME_CATEGORIES);

  // --- HANDLERS ---
  const handleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error(`Erro no login: ${result.error}`);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.info('Você saiu da aplicação');
    }
  };

  const handleSaveInvoiceTotal = async (newTotals) => {
    await saveDocument('invoice_totals', newTotals);
  };

  const handleSaveIncomesNotes = async (newNotes) => {
    await saveDocument('incomes_notes', newNotes);
  };

  const handleSaveExpensesNotes = async (newNotes) => {
    await saveDocument('expenses_notes', newNotes);
  };

  const handleSaveCreditNotes = async (newNotes) => {
    await saveDocument('credit_notes', newNotes);
  };

  const handleSaveVacationNotes = async (newNotes) => {
    await saveDocument('vacation_notes', newNotes);
  };

  const handleSaveGoals = async (newGoals) => {
    await saveDocument('goals', newGoals);
  };

  const handleSaveCategories = async (newCategories) => {
    await saveDocument('expense_categories', newCategories);
  };

  const handleSaveIncomeCategories = async (newCategories) => {
    await saveDocument('income_categories', newCategories);
  };

  const handleExport = (format, month) => {
    const data = {
      incomes,
      expenses,
      creditCardExpenses,
      invoiceTotals,
      vacationIncomes,
      vacationExpenses,
      incomesNotes,
      expensesNotes,
      creditNotes,
      vacationNotes,
      goals
    };

    try {
      if (format === 'json') {
        exportToJSON(data);
        toast.success('Backup JSON exportado com sucesso!');
      } else if (format === 'csv') {
        exportToCSV(data, month);
        toast.success('Relatório CSV exportado com sucesso!');
      } else if (format === 'pdf') {
        exportToPDF(data, month);
        toast.success('Abrindo visualização para impressão...');
      }
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const handleImport = async (file) => {
    try {
      const data = await importFromJSON(file);
      toast.success('Importação iniciada... Isso pode levar alguns segundos.');

      const batchItems = [];

      if (data.incomes) {
        for (const item of data.incomes) {
          batchItems.push({ collectionName: 'incomes', item });
        }
      }
      if (data.expenses) {
        for (const item of data.expenses) {
          batchItems.push({ collectionName: 'expenses', item });
        }
      }
      if (data.creditCardExpenses) {
        for (const item of data.creditCardExpenses) {
          batchItems.push({ collectionName: 'credit_expenses', item });
        }
      }
      if (data.vacationIncomes) {
        for (const item of data.vacationIncomes) {
          batchItems.push({ collectionName: 'vacation_incomes', item });
        }
      }
      if (data.vacationExpenses) {
        for (const item of data.vacationExpenses) {
          batchItems.push({ collectionName: 'vacation_expenses', item });
        }
      }

      if (batchItems.length > 0) {
        await batchSaveItems(batchItems);
      }

      toast.success('Dados importados com sucesso!');
    } catch (error) {
      toast.error('Erro ao importar dados: ' + error.message);
    }
  };

  // Atalhos de teclado
  useKeyboardShortcuts([
    { keys: APP_SHORTCUTS.DASHBOARD, action: () => setActiveTab('dashboard') },
    { keys: APP_SHORTCUTS.INCOMES, action: () => setActiveTab('incomes') },
    { keys: APP_SHORTCUTS.EXPENSES, action: () => setActiveTab('monthly') },
    { keys: APP_SHORTCUTS.CREDIT_CARD, action: () => setActiveTab('credit') },
    { keys: APP_SHORTCUTS.YEARLY, action: () => setActiveTab('yearly') },
    { keys: APP_SHORTCUTS.VACATION, action: () => setActiveTab('vacation') },
    { keys: APP_SHORTCUTS.EXPORT, action: () => setShowExportMenu(true) },
    { keys: APP_SHORTCUTS.DARK_MODE, action: toggleDarkMode },
    { keys: APP_SHORTCUTS.NEXT_MONTH, action: () => setSelectedMonth(m => (m + 1) % 12) },
    { keys: APP_SHORTCUTS.PREV_MONTH, action: () => setSelectedMonth(m => (m - 1 + 12) % 12) }
  ]);

  // --- DADOS CONSOLIDADOS ---
  const vacationFund = {
    incomes: vacationIncomes || [],
    expenses: vacationExpenses || []
  };

  // --- LOADING STATE ---
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 gap-2">
        <Loader2 className="animate-spin" /> Carregando...
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={authLoading} />;
  }

  // --- MAIN APP ---
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onExport={() => setShowExportMenu(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <ExportMenu
        isOpen={showExportMenu}
        onClose={() => setShowExportMenu(false)}
        onExport={handleExport}
        onImport={handleImport}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              incomes={incomes}
              expenses={expenses}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              onNavigate={setActiveTab}
              goals={goals}
              onSaveGoals={handleSaveGoals}
              categories={expenseCategories}
            />
          )}

          {activeTab === 'incomes' && (
            <IncomeView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              incomes={incomes}
              onSave={saveItem}
              onBatchSave={batchSaveItems}
              onDelete={deleteItem}
              notes={incomesNotes}
              onSaveNotes={handleSaveIncomesNotes}
              categories={incomeCategories}
              onSaveCategories={handleSaveIncomeCategories}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyExpensesView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              expenses={expenses}
              incomes={incomes}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              onSave={saveItem}
              onBatchSave={batchSaveItems}
              onDelete={deleteItem}
              onNavigate={setActiveTab}
              notes={expensesNotes}
              onSaveNotes={handleSaveExpensesNotes}
              categories={expenseCategories}
              onSaveCategories={handleSaveCategories}
            />
          )}

          {activeTab === 'credit' && (
            <CreditCardView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              onSave={saveItem}
              onBatchSave={batchSaveItems}
              onDelete={deleteItem}
              onSaveInvoiceTotal={handleSaveInvoiceTotal}
              notes={creditNotes}
              onSaveNotes={handleSaveCreditNotes}
              categories={expenseCategories}
              onSaveCategories={handleSaveCategories}
            />
          )}

          {activeTab === 'yearly' && (
            <YearlyView
              incomes={incomes}
              expenses={expenses}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
            />
          )}

          {activeTab === 'vacation' && (
            <VacationFundView
              vacationFund={vacationFund}
              onSave={saveItem}
              onBatchSave={batchSaveItems}
              onDelete={deleteItem}
              notes={vacationNotes}
              onSaveNotes={handleSaveVacationNotes}
            />
          )}

          {activeTab === 'comparison' && (
            <MonthComparison
              incomes={incomes}
              expenses={expenses}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
