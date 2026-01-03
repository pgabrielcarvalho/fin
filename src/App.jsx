import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCollection, useDocument, useFirestoreOperations } from './hooks/useFirestore';
import { useToast } from './contexts/ToastContext';

// Componentes
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IncomeView from './components/IncomeView';
import MonthlyExpensesView from './components/MonthlyExpensesView';
import CreditCardView from './components/CreditCardView';
import YearlyView from './components/YearlyView';
import VacationFundView from './components/VacationFundView';

// Dados iniciais
import {
  INITIAL_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_CREDIT_EXPENSES,
  INITIAL_VACATION_INCOMES,
  INITIAL_VACATION_EXPENSES
} from './services/seedData';

const App = () => {
  // --- AUTENTICAÇÃO ---
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const toast = useToast();

  // --- ESTADO DA UI ---
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // --- OPERAÇÕES DO FIRESTORE ---
  const { saveItem, deleteItem, saveDocument } = useFirestoreOperations(user);

  // --- DADOS DO FIRESTORE ---
  const { data: incomes } = useCollection(user, 'incomes', INITIAL_INCOMES);
  const { data: expenses } = useCollection(user, 'expenses', INITIAL_EXPENSES);
  const { data: creditCardExpenses } = useCollection(user, 'credit_expenses', INITIAL_CREDIT_EXPENSES);
  const { data: vacationIncomes } = useCollection(user, 'vacation_incomes', INITIAL_VACATION_INCOMES);
  const { data: vacationExpenses } = useCollection(user, 'vacation_expenses', INITIAL_VACATION_EXPENSES);
  const { data: invoiceTotals } = useDocument(user, 'invoice_totals', Array(12).fill(0));
  const { data: incomesNotes } = useDocument(user, 'incomes_notes', Array(12).fill(''));
  const { data: expensesNotes } = useDocument(user, 'expenses_notes', Array(12).fill(''));
  const { data: creditNotes } = useDocument(user, 'credit_notes', Array(12).fill(''));
  const { data: vacationNotes } = useDocument(user, 'vacation_notes', Array(12).fill(''));

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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
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
            />
          )}

          {activeTab === 'incomes' && (
            <IncomeView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              incomes={incomes}
              onSave={saveItem}
              onDelete={deleteItem}
              notes={incomesNotes}
              onSaveNotes={handleSaveIncomesNotes}
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
              onDelete={deleteItem}
              onNavigate={setActiveTab}
              notes={expensesNotes}
              onSaveNotes={handleSaveExpensesNotes}
            />
          )}

          {activeTab === 'credit' && (
            <CreditCardView
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              creditCardExpenses={creditCardExpenses}
              invoiceTotals={invoiceTotals}
              onSave={saveItem}
              onDelete={deleteItem}
              onSaveInvoiceTotal={handleSaveInvoiceTotal}
              notes={creditNotes}
              onSaveNotes={handleSaveCreditNotes}
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
              onDelete={deleteItem}
              notes={vacationNotes}
              onSaveNotes={handleSaveVacationNotes}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
