import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Delete, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  allowDecimal?: boolean;
  maxDecimals?: number;
  maxValue?: number;
  minValue?: number;
  placeholder?: string;
  label?: string;
  unit?: string;
  className?: string;
}

export function NumericKeypad({
  value,
  onChange,
  onConfirm,
  onCancel,
  allowDecimal = true,
  maxDecimals = 2,
  maxValue,
  minValue = 0,
  placeholder = '0',
  label,
  unit,
  className,
}: NumericKeypadProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const validateValue = useCallback((val: string): boolean => {
    if (!val || val === '' || val === ',') return true;
    
    const numVal = parseFloat(val.replace(',', '.'));
    if (isNaN(numVal)) return false;
    if (maxValue !== undefined && numVal > maxValue) return false;
    if (minValue !== undefined && numVal < minValue) return false;
    
    return true;
  }, [maxValue, minValue]);

  const handleDigit = useCallback((digit: string) => {
    setHasError(false);
    
    let newValue = internalValue;
    
    // Handle decimal
    if (digit === ',') {
      if (!allowDecimal) return;
      if (internalValue.includes(',')) return;
      newValue = internalValue === '' ? '0,' : internalValue + ',';
    } else {
      // Regular digit
      // Prevent leading zeros (except for decimal)
      if (internalValue === '0' && digit !== ',') {
        newValue = digit;
      } else {
        // Check decimal places limit
        const parts = internalValue.split(',');
        if (parts.length === 2 && parts[1].length >= maxDecimals) {
          return;
        }
        newValue = internalValue + digit;
      }
    }
    
    // Validate max value
    if (maxValue !== undefined) {
      const numVal = parseFloat(newValue.replace(',', '.'));
      if (!isNaN(numVal) && numVal > maxValue) {
        setHasError(true);
        setTimeout(() => setHasError(false), 300);
        return;
      }
    }
    
    setInternalValue(newValue);
    onChange(newValue);
  }, [internalValue, allowDecimal, maxDecimals, maxValue, onChange]);

  const handleBackspace = useCallback(() => {
    setHasError(false);
    const newValue = internalValue.slice(0, -1);
    setInternalValue(newValue);
    onChange(newValue);
  }, [internalValue, onChange]);

  const handleClear = useCallback(() => {
    setHasError(false);
    setInternalValue('');
    onChange('');
  }, [onChange]);

  const handleConfirm = useCallback(() => {
    if (!validateValue(internalValue)) {
      setHasError(true);
      return;
    }
    onConfirm?.();
  }, [internalValue, validateValue, onConfirm]);

  const displayValue = internalValue || placeholder;
  const numericValue = internalValue ? parseFloat(internalValue.replace(',', '.')) : 0;

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [allowDecimal ? ',' : 'C', '0', 'backspace'],
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Display */}
      <div className={cn(
        "relative rounded-xl border-2 p-4 transition-all",
        hasError 
          ? "border-destructive bg-destructive/10 animate-shake" 
          : "border-border bg-muted/30"
      )}>
        {label && (
          <span className="absolute top-2 left-3 text-xs text-muted-foreground">
            {label}
          </span>
        )}
        <div className="flex items-baseline justify-end gap-1 min-h-[48px]">
          <span className={cn(
            "text-4xl font-bold tabular-nums transition-colors",
            internalValue ? "text-foreground" : "text-muted-foreground/50"
          )}>
            {displayValue}
          </span>
          {unit && (
            <span className="text-lg text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key, index) => {
          if (key === 'backspace') {
            return (
              <Button
                key={index}
                variant="outline"
                className="h-16 text-xl font-semibold active:scale-95 transition-transform"
                onClick={handleBackspace}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Delete className="h-6 w-6" />
              </Button>
            );
          }
          
          if (key === 'C') {
            return (
              <Button
                key={index}
                variant="outline"
                className="h-16 text-xl font-semibold active:scale-95 transition-transform text-muted-foreground"
                onClick={handleClear}
                onMouseDown={(e) => e.preventDefault()}
              >
                C
              </Button>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-16 text-2xl font-semibold active:scale-95 transition-transform",
                key === ',' && "text-muted-foreground"
              )}
              onClick={() => handleDigit(key)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {key}
            </Button>
          );
        })}
      </div>

      {/* Action buttons */}
      {(onConfirm || onCancel) && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {onCancel && (
            <Button
              variant="outline"
              className="h-14 text-lg gap-2"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
              Cancelar
            </Button>
          )}
          {onConfirm && (
            <Button
              className={cn(
                "h-14 text-lg gap-2",
                !onCancel && "col-span-2"
              )}
              onClick={handleConfirm}
              disabled={!internalValue && minValue !== undefined && minValue > 0}
            >
              <Check className="h-5 w-5" />
              Confirmar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Shake animation for error feedback
const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
`;

// Inject animation if not exists
if (typeof document !== 'undefined') {
  const styleId = 'numeric-keypad-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shakeKeyframes + `
      .animate-shake {
        animation: shake 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }
}
