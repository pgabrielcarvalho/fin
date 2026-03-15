import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCollection, useDocument, useLazyCollection, useLazyDocument, useFirestoreOperations } from './hooks/useFirestore';
import { useYearManager } from './hooks/useYearManager';
import { useToast } from './contexts/ToastContext';
import { useTheme } from './contexts/ThemeContext';
import { usePinLock } from './hooks/usePinLock';

// Componentes
import LoginScreen from './components/LoginScreen';
import PinLockScreen from './components/PinLockScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IncomeView from './components/IncomeView';
import MonthlyExpensesView from './components/MonthlyExpensesView';
import CreditCardView from './components/CreditCardView';
import YearlyView from './components/YearlyView';
import VacationFundView from './components/VacationFundView';
import ExportMenu from './components/ExportMenu';
import MonthComparison from './components/MonthComparison';
import OfficeView from './components/OfficeView';
import QuickAddFAB from './components/QuickAddFAB';
import QuickAddModal from './components/QuickAddModal';

// Services
import { exportToJSON, exportToCSV, exportToPDF, importFromJSON } from './services/exportService';

// Dados iniciais
import {
  INITIAL_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_CREDIT_EXPENSES,
  INITIAL_VACATION_INCOMES,
  INITIAL_VACATION_EXPENSES,
  INITIAL_OBLIGATIONS,
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from './services/seedData';

const App = () => {
  // --- AUTENTICAÇÃO ---
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = useTheme();
  const pinLock = usePinLock();

  // --- ANO ---
  const {
    selectedYear,
    setSelectedYear,
    availableYears,
    migrating,
    startNewYear
  } = useYearManager(user);

  // --- ESTADO DA UI ---
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // --- OPERAÇÕES DO FIRESTORE (com ano) ---
  const { saveItem, batchSaveItems, deleteItem, saveDocument } = useFirestoreOperations(user, selectedYear);

  // --- DADOS DO FIRESTORE (sempre ativos, com ano) ---
  const { data: incomes } = useCollection(user, 'incomes', INITIAL_INCOMES, selectedYear);
  const { data: expenses } = useCollection(user, 'expenses', INITIAL_EXPENSES, selectedYear);
  const { data: creditCardExpenses } = useCollection(user, 'credit_expenses', INITIAL_CREDIT_EXPENSES, selectedYear);
  const { data: invoiceTotals } = useDocument(user, 'invoice_totals', Array(12).fill(0), selectedYear);
  const { data: goals } = useDocument(user, 'goals', { monthlyGoals: [], alerts: { lowBalance: true, highExpenses: true, balanceThreshold: 1000, expenseThreshold: 80 } }, selectedYear);
  const { data: expenseCategories } = useDocument(user, 'expense_categories', DEFAULT_CATEGORIES, selectedYear);

  // --- DADOS LAZY (ativam só na aba correspondente, com ano) ---
  const { data: vacationIncomes } = useLazyCollection(user, 'vacation_incomes', activeTab === 'vacation', INITIAL_VACATION_INCOMES, selectedYear);
  const { data: vacationExpenses } = useLazyCollection(user, 'vacation_expenses', activeTab === 'vacation', INITIAL_VACATION_EXPENSES, selectedYear);
  const { data: incomesNotes } = useLazyDocument(user, 'incomes_notes', activeTab === 'incomes', Array(12).fill(''), selectedYear);
  const { data: expensesNotes } = useLazyDocument(user, 'expenses_notes', activeTab === 'monthly', Array(12).fill(''), selectedYear);
  const { data: creditNotes } = useLazyDocument(user, 'credit_notes', activeTab === 'credit', Array(12).fill(''), selectedYear);
  const { data: vacationNotes } = useLazyDocument(user, 'vacation_notes', activeTab === 'vacation', Array(12).fill(''), selectedYear);
  const { data: incomeCategories } = useLazyDocument(user, 'income_categories', activeTab === 'incomes', DEFAULT_INCOME_CATEGORIES, selectedYear);
  const { data: obligations } = useCollection(user, 'obligations', INITIAL_OBLIGATIONS, selectedYear);
  const { data: obligationsNotes } = useLazyDocument(user, 'obligations_notes', activeTab === 'office', Array(12).fill(''), selectedYear);
  const { data: cardSettings } = useDocument(user, 'card_settings', { closingDates: Array(12).fill(10) }, selectedYear);

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

  const handleSaveObligationsNotes = async (newNotes) => {
    await saveDocument('obligations_notes', newNotes);
  };

  const handleSaveCardSettings = async (newSettings) => {
    await saveDocument('card_settings', newSettings);
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
      goals,
      obligations,
      obligationsNotes,
      expenseCategories,
      incomeCategories,
      cardSettings,
      year: selectedYear
    };

    try {
      if (format === 'json') {
        exportToJSON(data);
        toast.success('Backup JSON exportado com sucesso!');
      } else if (format === 'csv') {
        exportToCSV(data, month, selectedYear);
        toast.success('Relatório CSV exportado com sucesso!');
      } else if (format === 'pdf') {
        exportToPDF(data, month, selectedYear);
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
      if (data.obligations) {
        for (const item of data.obligations) {
          batchItems.push({ collectionName: 'obligations', item });
        }
      }

      if (batchItems.length > 0) {
        await batchSaveItems(batchItems);
      }

      // Importar documentos singleton
      if (data.invoiceTotals) await saveDocument('invoice_totals', data.invoiceTotals);
      if (data.goals) await saveDocument('goals', data.goals);
      if (data.expenseCategories) await saveDocument('expense_categories', data.expenseCategories);
      if (data.incomeCategories) await saveDocument('income_categories', data.incomeCategories);
      if (data.incomesNotes) await saveDocument('incomes_notes', data.incomesNotes);
      if (data.expensesNotes) await saveDocument('expenses_notes', data.expensesNotes);
      if (data.creditNotes) await saveDocument('credit_notes', data.creditNotes);
      if (data.vacationNotes) await saveDocument('vacation_notes', data.vacationNotes);
      if (data.obligationsNotes) await saveDocument('obligations_notes', data.obligationsNotes);
      if (data.cardSettings) await saveDocument('card_settings', data.cardSettings);

      toast.success('Dados importados com sucesso!');
    } catch (error) {
      toast.error('Erro ao importar dados: ' + error.message);
    }
  };

  const handleStartNewYear = async () => {
    const nextYear = Math.max(...availableYears) + 1;
    toast.info(`Criando ano ${nextYear}...`);

    const result = await startNewYear(nextYear);

    if (result.success) {
      toast.success(`Ano ${nextYear} criado! Despesas e receitas fixas foram copiadas.`);
    } else {
      toast.error(`Erro ao criar ano ${nextYear}: ${result.error || 'Erro desconhecido'}`);
    }
  };

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

  // --- PIN LOCK ---
  if (pinLock.isSettingUp) {
    return (
      <PinLockScreen
        mode="setup"
        onSetup={(pin) => {
          pinLock.setupPin(pin);
          toast.success('PIN configurado com sucesso!');
        }}
        onCancel={pinLock.cancelSetup}
      />
    );
  }

  if (pinLock.isLocked && pinLock.isPinEnabled) {
    return (
      <PinLockScreen
        mode="unlock"
        onVerify={pinLock.verifyPin}
      />
    );
  }

  // --- MAIN APP ---
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onExport={() => setShowExportMenu(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        pinEnabled={pinLock.isPinEnabled}
        obligations={obligations}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={setSelectedYear}
        onStartNewYear={handleStartNewYear}
        onTogglePin={() => {
          if (pinLock.isPinEnabled) {
            pinLock.disablePin();
            toast.info('PIN desativado');
          } else {
            pinLock.startSetup();
          }
        }}
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
              categories={expenseCategories}
              selectedYear={selectedYear}
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
              selectedYear={selectedYear}
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
              selectedYear={selectedYear}
              cardSettings={cardSettings}
              onSaveCardSettings={handleSaveCardSettings}
            />
          )}

          {activeTab === 'yearly' && (
            <YearlyView
              incomes={incomes}
              expenses={expenses}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              selectedYear={selectedYear}
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

          {activeTab === 'office' && (
            <OfficeView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              obligations={obligations}
              onSave={saveItem}
              onBatchSave={batchSaveItems}
              onDelete={deleteItem}
              notes={obligationsNotes}
              onSaveNotes={handleSaveObligationsNotes}
            />
          )}

          {activeTab === 'comparison' && (
            <MonthComparison
              incomes={incomes}
              expenses={expenses}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              selectedYear={selectedYear}
            />
          )}
        </div>
      </main>

      <QuickAddFAB onClick={() => setShowQuickAdd(true)} />
      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSave={saveItem}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          cardSettings={cardSettings}
          creditCardExpenses={creditCardExpenses}
        />
      )}
    </div>
  );
};

export default App;
