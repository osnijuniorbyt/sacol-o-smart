import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface SyncTask {
  id: string;
  name: string;
  syncFn: () => Promise<void>;
  priority: number; // Lower = higher priority
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingTasks: number;
  currentTask: string | null;
  syncProgress: number; // 0-100
}

// Global registry of sync tasks
const syncTasksRegistry: Map<string, SyncTask> = new Map();

// Global state for sync status
let globalSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingTasks: 0,
  currentTask: null,
  syncProgress: 0,
};

// Listeners for status updates
const statusListeners: Set<(status: SyncStatus) => void> = new Set();

const notifyListeners = () => {
  statusListeners.forEach(listener => listener({ ...globalSyncStatus }));
};

const updateGlobalStatus = (updates: Partial<SyncStatus>) => {
  globalSyncStatus = { ...globalSyncStatus, ...updates };
  notifyListeners();
};

// Register a sync task
export function registerSyncTask(task: SyncTask) {
  syncTasksRegistry.set(task.id, task);
}

// Unregister a sync task
export function unregisterSyncTask(taskId: string) {
  syncTasksRegistry.delete(taskId);
}

// Execute all sync tasks
let syncInProgress = false;

async function executeSync() {
  if (syncInProgress || !navigator.onLine) return;
  
  const tasks = Array.from(syncTasksRegistry.values())
    .sort((a, b) => a.priority - b.priority);
  
  if (tasks.length === 0) return;
  
  syncInProgress = true;
  updateGlobalStatus({
    isSyncing: true,
    pendingTasks: tasks.length,
    syncProgress: 0,
  });
  
  let completed = 0;
  let errors = 0;
  
  for (const task of tasks) {
    if (!navigator.onLine) {
      // Lost connection during sync
      break;
    }
    
    updateGlobalStatus({
      currentTask: task.name,
      syncProgress: Math.round((completed / tasks.length) * 100),
    });
    
    try {
      await task.syncFn();
      completed++;
    } catch (e) {
      console.error(`Sync error for ${task.id}:`, e);
      errors++;
    }
  }
  
  syncInProgress = false;
  updateGlobalStatus({
    isSyncing: false,
    lastSyncAt: new Date(),
    pendingTasks: 0,
    currentTask: null,
    syncProgress: 100,
  });
  
  // Show completion toast
  if (completed > 0 && errors === 0) {
    toast.success('🔄 Sincronização completa', {
      description: `${completed} item(s) atualizado(s)`,
      duration: 3000,
    });
  } else if (errors > 0) {
    toast.warning('⚠️ Sincronização parcial', {
      description: `${completed} sucesso, ${errors} erro(s)`,
      duration: 4000,
    });
  }
}

// Initialize online/offline listeners (only once)
let initialized = false;

function initializeListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  
  window.addEventListener('online', () => {
    updateGlobalStatus({ isOnline: true });
    toast.success('🌐 Conexão restaurada', {
      description: 'Iniciando sincronização...',
      duration: 2000,
    });
    // Small delay to ensure connection is stable
    setTimeout(executeSync, 1000);
  });
  
  window.addEventListener('offline', () => {
    updateGlobalStatus({ isOnline: false });
    toast.warning('📴 Sem conexão', {
      description: 'Modo offline ativado',
      duration: 3000,
    });
  });
}

// Hook to use background sync
export function useBackgroundSync() {
  const [status, setStatus] = useState<SyncStatus>(globalSyncStatus);
  
  useEffect(() => {
    initializeListeners();
    
    // Subscribe to status updates
    statusListeners.add(setStatus);
    
    return () => {
      statusListeners.delete(setStatus);
    };
  }, []);
  
  const triggerSync = useCallback(() => {
    if (navigator.onLine) {
      executeSync();
    } else {
      toast.error('Sem conexão', {
        description: 'Aguarde a conexão para sincronizar',
      });
    }
  }, []);
  
  return {
    ...status,
    triggerSync,
    registerTask: registerSyncTask,
    unregisterTask: unregisterSyncTask,
  };
}

// Hook to register a component's sync task
export function useSyncTask(
  taskId: string,
  taskName: string,
  syncFn: () => Promise<void>,
  priority: number = 10
) {
  const syncFnRef = useRef(syncFn);
  syncFnRef.current = syncFn;
  
  useEffect(() => {
    registerSyncTask({
      id: taskId,
      name: taskName,
      syncFn: () => syncFnRef.current(),
      priority,
    });
    
    return () => {
      unregisterSyncTask(taskId);
    };
  }, [taskId, taskName, priority]);
}
