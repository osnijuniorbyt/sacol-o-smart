import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { RefreshCw, Wifi, WifiOff, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function SyncStatusIndicator({ 
  showDetails = false,
  className 
}: SyncStatusIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    lastSyncAt, 
    currentTask,
    syncProgress,
    triggerSync 
  } = useBackgroundSync();

  if (!showDetails) {
    // Compact indicator for header
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
        ) : isOnline ? (
          <Wifi className="h-4 w-4 text-primary" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
      </div>
    );
  }

  // Detailed view with sync button
  return (
    <div className={cn(
      "relative flex items-center gap-3 p-3 rounded-lg bg-muted/50",
      className
    )}>
      {/* Status Icon */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full",
        isSyncing ? "bg-primary/10" : 
        isOnline ? "bg-primary/10" : "bg-destructive/10"
      )}>
        {isSyncing ? (
          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        ) : isOnline ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <AlertCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isSyncing ? 'Sincronizando...' : 
           isOnline ? 'Online' : 'Offline'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isSyncing && currentTask ? (
            `${currentTask} (${syncProgress}%)`
          ) : lastSyncAt ? (
            `Última sync: ${formatDistanceToNow(lastSyncAt, { 
              addSuffix: true, 
              locale: ptBR 
            })}`
          ) : (
            'Nenhuma sincronização'
          )}
        </p>
      </div>

      {/* Sync Button */}
      {isOnline && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerSync}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      {/* Progress bar when syncing */}
      {isSyncing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-lg">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
