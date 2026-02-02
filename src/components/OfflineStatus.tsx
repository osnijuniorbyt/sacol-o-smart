import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OfflineStatusProps {
  isOnline: boolean;
  isFromCache: boolean;
  lastUpdated: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function OfflineStatus({
  isOnline,
  isFromCache,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: OfflineStatusProps) {
  if (isOnline && !isFromCache) {
    return null; // Don't show anything when fully online
  }

  const formattedTime = lastUpdated
    ? formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isOnline ? (
        <Badge variant="destructive" className="gap-1.5 h-8 px-3">
          <CloudOff className="h-4 w-4" />
          Offline
        </Badge>
      ) : isFromCache ? (
        <Badge variant="secondary" className="gap-1.5 h-8 px-3">
          <Cloud className="h-4 w-4" />
          Cache
        </Badge>
      ) : null}
      
      {formattedTime && (
        <span className="text-xs text-muted-foreground">
          Atualizado {formattedTime}
        </span>
      )}

      {isOnline && onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
