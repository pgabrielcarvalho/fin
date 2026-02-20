import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';

const PIN_LENGTH = 4;

const PinDots = ({ filled, shake }) => (
  <div className={`flex gap-3 justify-center mb-8 ${shake ? 'animate-shake' : ''}`}>
    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
      <div
        key={i}
        className={`w-4 h-4 rounded-full transition-all duration-200 ${
          i < filled
            ? 'bg-emerald-500 scale-110'
            : 'bg-slate-300 dark:bg-slate-600'
        }`}
      />
    ))}
  </div>
);

const NumPad = ({ onPress, onDelete, disabled }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'delete'];

  return (
    <div className="grid grid-cols-3 gap-4 w-fit mx-auto">
      {keys.map((key, i) => {
        if (key === null) return <div key={i} className="w-[80px] h-[80px]" />;
        if (key === 'delete') {
          return (
            <button
              key={i}
              onClick={onDelete}
              disabled={disabled}
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors disabled:opacity-30"
            >
              <Delete size={28} />
            </button>
          );
        }
        return (
          <button
            key={i}
            onClick={() => onPress(key)}
            disabled={disabled}
            className="w-[80px] h-[80px] rounded-full bg-white dark:bg-slate-700 text-3xl font-light text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 active:scale-95 transition-all disabled:opacity-30"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

const PinLockScreen = ({ mode = 'unlock', onVerify, onSetup, onCancel }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('enter'); // 'enter' or 'confirm' (for setup)
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && disabled) {
      setDisabled(false);
      setMessage('');
    }
  }, [countdown, disabled]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handlePress = useCallback((digit) => {
    if (disabled) return;

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      if (mode === 'unlock') {
        // Verify PIN
        onVerify(newPin).then(result => {
          if (result.success) {
            setMessage('');
          } else if (result.locked) {
            setDisabled(true);
            setCountdown(30);
            setMessage('Muitas tentativas. Aguarde 30s');
            triggerShake();
          } else {
            setMessage(`PIN incorreto. ${result.attemptsLeft} tentativa${result.attemptsLeft > 1 ? 's' : ''} restante${result.attemptsLeft > 1 ? 's' : ''}`);
            triggerShake();
          }
          setPin('');
        });
      } else if (mode === 'setup') {
        if (step === 'enter') {
          setConfirmPin(newPin);
          setStep('confirm');
          setPin('');
          setMessage('');
        } else {
          // Confirm step
          if (newPin === confirmPin) {
            onSetup(newPin);
          } else {
            setMessage('PINs não coincidem. Tente novamente.');
            triggerShake();
            setStep('enter');
            setConfirmPin('');
            setPin('');
          }
        }
      }
    }
  }, [pin, mode, step, confirmPin, disabled, onVerify, onSetup, triggerShake]);

  const handleDelete = useCallback(() => {
    if (disabled) return;
    setPin(prev => prev.slice(0, -1));
  }, [disabled]);

  const title = mode === 'setup'
    ? (step === 'enter' ? 'Criar PIN' : 'Confirmar PIN')
    : 'Desbloquear';

  const subtitle = mode === 'setup'
    ? (step === 'enter' ? 'Escolha um PIN de 4 dígitos' : 'Digite o PIN novamente')
    : 'Digite seu PIN de 4 dígitos';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Icon */}
        <div className={`p-4 rounded-full mb-6 ${
          mode === 'setup'
            ? 'bg-emerald-100 dark:bg-emerald-900/30'
            : 'bg-slate-200 dark:bg-slate-700'
        }`}>
          {mode === 'setup'
            ? <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
            : <Lock size={32} className="text-slate-600 dark:text-slate-400" />
          }
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {subtitle}
        </p>

        {/* PIN Dots */}
        <PinDots filled={pin.length} shake={shake} />

        {/* Message */}
        <div className="h-6 mb-4 text-center">
          {message && (
            <p className="text-sm text-red-500 dark:text-red-400 font-medium">
              {message}
            </p>
          )}
          {countdown > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tentar novamente em {countdown}s
            </p>
          )}
        </div>

        {/* NumPad */}
        <NumPad
          onPress={handlePress}
          onDelete={handleDelete}
          disabled={disabled}
        />

        {/* Cancel button for setup */}
        {mode === 'setup' && onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default PinLockScreen;
