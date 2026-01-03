import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { getMonthlyBalance, getMonthlyIncome, getMonthlyFixedExpenses, getMonthlyCardTotal } from '../services/calculations';

const GoalsAndAlerts = ({
  selectedMonth,
  incomes,
  expenses,
  creditCardExpenses,
  invoiceTotals,
  goals,
  onSaveGoals
}) => {
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [localGoals, setLocalGoals] = useState(goals || {
    monthlyGoals: [],
    alerts: {
      lowBalance: true,
      highExpenses: true,
      balanceThreshold: 1000,
      expenseThreshold: 80 // porcentagem da receita
    }
  });

  const [newGoal, setNewGoal] = useState({
    description: '',
    targetValue: '',
    currentValue: 0,
    type: 'savings' // savings, expense-reduction, income-increase
  });

  // Calcula estatísticas do mês
  const income = getMonthlyIncome(incomes, selectedMonth);
  const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth);
  const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);
  const totalExpenses = fixedExpenses + cardExpenses;
  const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

  // Verifica alertas
  const alerts = [];

  if (localGoals.alerts.lowBalance && balance < localGoals.alerts.balanceThreshold) {
    alerts.push({
      type: 'warning',
      message: `Saldo abaixo do limite (${formatCurrency(localGoals.alerts.balanceThreshold)})`,
      value: balance
    });
  }

  const expensePercentage = income > 0 ? (totalExpenses / income) * 100 : 0;
  if (localGoals.alerts.highExpenses && expensePercentage > localGoals.alerts.expenseThreshold) {
    alerts.push({
      type: 'danger',
      message: `Despesas acima de ${localGoals.alerts.expenseThreshold}% da receita (${expensePercentage.toFixed(1)}%)`,
      value: totalExpenses
    });
  }

  if (balance < 0) {
    alerts.push({
      type: 'danger',
      message: 'Saldo negativo!',
      value: balance
    });
  }

  const handleAddGoal = () => {
    if (!newGoal.description || !newGoal.targetValue) return;

    const updatedGoals = {
      ...localGoals,
      monthlyGoals: [
        ...localGoals.monthlyGoals,
        {
          id: Date.now(),
          ...newGoal,
          targetValue: parseFloat(newGoal.targetValue),
          createdAt: new Date().toISOString()
        }
      ]
    };

    setLocalGoals(updatedGoals);
    onSaveGoals(updatedGoals);
    setNewGoal({
      description: '',
      targetValue: '',
      currentValue: 0,
      type: 'savings'
    });
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = {
      ...localGoals,
      monthlyGoals: localGoals.monthlyGoals.filter(g => g.id !== goalId)
    };
    setLocalGoals(updatedGoals);
    onSaveGoals(updatedGoals);
  };

  const handleUpdateGoalProgress = (goalId, currentValue) => {
    const updatedGoals = {
      ...localGoals,
      monthlyGoals: localGoals.monthlyGoals.map(g =>
        g.id === goalId ? { ...g, currentValue: parseFloat(currentValue) || 0 } : g
      )
    };
    setLocalGoals(updatedGoals);
    onSaveGoals(updatedGoals);
  };

  const handleUpdateAlerts = (field, value) => {
    const updatedGoals = {
      ...localGoals,
      alerts: {
        ...localGoals.alerts,
        [field]: value
      }
    };
    setLocalGoals(updatedGoals);
    onSaveGoals(updatedGoals);
  };

  return (
    <>
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                alert.type === 'danger'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <AlertTriangle
                size={20}
                className={alert.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}
              />
              <div className="flex-1">
                <div className={`font-semibold ${
                  alert.type === 'danger' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {alert.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card de Metas */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Target size={20} className="text-emerald-600" />
            Metas e Alertas
          </h3>
          <button
            onClick={() => setShowGoalsModal(true)}
            className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
          >
            Configurar
          </button>
        </div>

        {/* Lista de Metas */}
        {localGoals.monthlyGoals.length > 0 ? (
          <div className="space-y-3">
            {localGoals.monthlyGoals.map(goal => {
              const progress = (goal.currentValue / goal.targetValue) * 100;
              const isComplete = goal.currentValue >= goal.targetValue;

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {goal.description}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(goal.currentValue)} / {formatCurrency(goal.targetValue)}
                      </div>
                    </div>
                    {isComplete && (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    )}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isComplete ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
            Nenhuma meta configurada. Clique em "Configurar" para adicionar.
          </p>
        )}
      </div>

      {/* Modal de Configuração */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Configurar Metas e Alertas
              </h3>
              <button
                onClick={() => setShowGoalsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Adicionar Nova Meta */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Adicionar Nova Meta
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Descrição da meta"
                    value={newGoal.description}
                    onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="w-full p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Valor alvo"
                      value={newGoal.targetValue}
                      onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Valor atual"
                      value={newGoal.currentValue}
                      onChange={e => setNewGoal({ ...newGoal, currentValue: parseFloat(e.target.value) || 0 })}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddGoal}
                    className="w-full bg-emerald-600 text-white py-2 rounded font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Adicionar Meta
                  </button>
                </div>
              </div>

              {/* Metas Existentes */}
              {localGoals.monthlyGoals.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Metas Atuais
                  </h4>
                  <div className="space-y-3">
                    {localGoals.monthlyGoals.map(goal => (
                      <div key={goal.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {goal.description}
                          </div>
                          <input
                            type="number"
                            value={goal.currentValue}
                            onChange={e => handleUpdateGoalProgress(goal.id, e.target.value)}
                            className="w-full mt-2 p-1 text-sm rounded bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500"
                            placeholder="Progresso atual"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configurações de Alertas */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Configurações de Alertas
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localGoals.alerts.lowBalance}
                      onChange={e => handleUpdateAlerts('lowBalance', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Alertar quando saldo estiver abaixo de:
                    </span>
                    <input
                      type="number"
                      value={localGoals.alerts.balanceThreshold}
                      onChange={e => handleUpdateAlerts('balanceThreshold', parseFloat(e.target.value) || 0)}
                      className="w-32 p-1 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localGoals.alerts.highExpenses}
                      onChange={e => handleUpdateAlerts('highExpenses', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Alertar quando despesas excederem:
                    </span>
                    <input
                      type="number"
                      value={localGoals.alerts.expenseThreshold}
                      onChange={e => handleUpdateAlerts('expenseThreshold', parseFloat(e.target.value) || 0)}
                      className="w-20 p-1 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">% da receita</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoalsAndAlerts;
