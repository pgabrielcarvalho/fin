import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Input numérico com edição local.
 * O valor só é salvo no onBlur (ou Enter), permitindo apagar e reescrever livremente.
 *
 * Props:
 * - value: número atual
 * - onSave: callback com o novo valor numérico
 * - className: classes CSS do input
 * - placeholder: texto placeholder
 * - emptyAsZero: se true, mostra campo vazio quando valor é 0 (útil para campos opcionais)
 */
const EditableValue = ({ value, onSave, className = '', placeholder, emptyAsZero = false }) => {
  const formatDisplay = useCallback((v) => {
    if (emptyAsZero && (v === 0 || v === '0')) return '';
    return String(v);
  }, [emptyAsZero]);

  const [localValue, setLocalValue] = useState(formatDisplay(value));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Sincronizar com valor externo quando não está editando
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(formatDisplay(value));
    }
  }, [value, isEditing, formatDisplay]);

  const handleFocus = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    commitValue();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(formatDisplay(value));
      setIsEditing(false);
      e.target.blur();
    }
  };

  const commitValue = () => {
    const numValue = parseFloat(localValue);
    if (localValue === '' || isNaN(numValue)) {
      onSave(0);
      setLocalValue(emptyAsZero ? '' : '0');
    } else {
      onSave(numValue);
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default EditableValue;
