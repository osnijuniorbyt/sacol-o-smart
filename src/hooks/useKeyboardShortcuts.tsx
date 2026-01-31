import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutHandlers {
  onSearch?: () => void;
}

export function useKeyboardShortcuts(handlers?: ShortcutHandlers) {
  const navigate = useNavigate();
  const handlersRef = useRef(handlers);
  
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          navigate('/pdv');
          break;
        case 'F3':
          e.preventDefault();
          navigate('/quebras');
          break;
        case 'F4':
          e.preventDefault();
          handlersRef.current?.onSearch?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

// Hook to show shortcuts tooltip
export function useShortcutsInfo() {
  return [
    { key: 'F2', action: 'Abrir PDV' },
    { key: 'F3', action: 'Registrar Quebra' },
    { key: 'F4', action: 'Buscar Produto' },
  ];
}
