import { useState, useEffect, useCallback, useRef } from 'react';

type QualityStatus = 'ok' | 'parcial' | 'recusado';

export interface DraftItemData {
  id: string;
  quantity_received: number;
  unit_cost_actual: number;
  quality_status: QualityStatus;
  quality_notes: string;
}

export interface ReceivingDraft {
  orderId: string;
  items: DraftItemData[];
  generalNotes: string;
  savedAt: string;
}

const DRAFT_KEY_PREFIX = 'receiving_draft_';
const AUTO_SAVE_DELAY = 500; // ms

export function useReceivingDraft(orderId: string | undefined) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if draft exists for this order
  useEffect(() => {
    if (!orderId) {
      setHasDraft(false);
      return;
    }
    
    const key = DRAFT_KEY_PREFIX + orderId;
    const saved = localStorage.getItem(key);
    setHasDraft(!!saved);
  }, [orderId]);

  // Load draft from localStorage
  const loadDraft = useCallback((): ReceivingDraft | null => {
    if (!orderId) return null;
    
    try {
      const key = DRAFT_KEY_PREFIX + orderId;
      const saved = localStorage.getItem(key);
      if (saved) {
        const draft = JSON.parse(saved) as ReceivingDraft;
        return draft;
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
    return null;
  }, [orderId]);

  // Save draft to localStorage
  const saveDraft = useCallback((items: DraftItemData[], generalNotes: string) => {
    if (!orderId) return;
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Debounce the save
    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        const key = DRAFT_KEY_PREFIX + orderId;
        const draft: ReceivingDraft = {
          orderId,
          items,
          generalNotes,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(draft));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error);
      }
    }, AUTO_SAVE_DELAY);
  }, [orderId]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!orderId) return;
    
    try {
      const key = DRAFT_KEY_PREFIX + orderId;
      localStorage.removeItem(key);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Erro ao limpar rascunho:', error);
    }
  }, [orderId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    hasDraft,
    lastSaved,
    loadDraft,
    saveDraft,
    clearDraft,
  };
}
