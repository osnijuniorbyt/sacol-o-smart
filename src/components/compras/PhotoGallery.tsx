import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ImageIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReceivingPhoto } from '@/types/database';

interface PhotoGalleryProps {
  orderId: string;
  compact?: boolean;
}

export function PhotoGallery({ orderId, compact = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<ReceivingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('receiving_photos')
          .select('*')
          .eq('order_id', orderId)
          .order('captured_at', { ascending: true });

        if (error) throw error;
        setPhotos(data || []);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPhotos();
  }, [orderId]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, photos.length]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando fotos...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return null; // Don't show anything if no photos
  }

  // Compact view (for accordion/inline display)
  if (compact) {
    return (
      <>
        <button
          onClick={() => openLightbox(0)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Camera className="h-4 w-4" />
          <span>{photos.length} foto{photos.length > 1 ? 's' : ''} do recebimento</span>
        </button>

        <Lightbox
          photos={photos}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          currentIndex={currentIndex}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      </>
    );
  }

  // Full gallery view
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          <span>Fotos do Recebimento ({photos.length})</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
            >
              <img
                src={photo.photo_url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        photos={photos}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        currentIndex={currentIndex}
        onPrevious={goToPrevious}
        onNext={goToNext}
      />
    </>
  );
}

// Lightbox component for fullscreen viewing
interface LightboxProps {
  photos: ReceivingPhoto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

function Lightbox({ 
  photos, 
  open, 
  onOpenChange, 
  currentIndex, 
  onPrevious, 
  onNext 
}: LightboxProps) {
  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-sm">
              Foto {currentIndex + 1} de {photos.length}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main image */}
        <div className="relative flex items-center justify-center h-full">
          <img
            src={currentPhoto.photo_url}
            alt={`Foto ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex justify-center gap-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    // Update currentIndex through parent
                    const diff = index - currentIndex;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) onNext();
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                    }
                  }}
                  className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-white ring-2 ring-white/50' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
