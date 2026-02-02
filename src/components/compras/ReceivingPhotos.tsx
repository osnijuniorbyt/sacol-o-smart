import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Photo {
  id?: string;
  url: string;
  fileName: string;
  isUploading?: boolean;
  isNew?: boolean;
}

interface ReceivingPhotosProps {
  orderId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  disabled?: boolean;
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Max dimension 1200px
      const maxSize = 1200;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.8 // Quality 80%
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function ReceivingPhotos({ orderId, photos, onPhotosChange, disabled }: ReceivingPhotosProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos permitidas`);
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    
    for (const file of filesToProcess) {
      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }
      
      try {
        // Compress image
        const compressedBlob = await compressImage(file);
        
        // Check size after compression
        if (compressedBlob.size > MAX_FILE_SIZE) {
          toast.error(`Imagem muito grande após compressão: ${file.name}`);
          continue;
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileName = `${orderId}/${timestamp}-${randomId}.jpg`;
        
        // Add placeholder while uploading
        const tempUrl = URL.createObjectURL(compressedBlob);
        const tempPhoto: Photo = {
          url: tempUrl,
          fileName,
          isUploading: true,
          isNew: true,
        };
        const updatedPhotos = [...photos, tempPhoto];
        onPhotosChange(updatedPhotos);
        
        // Upload to storage
        const { error } = await supabase.storage
          .from('receiving-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '31536000', // 1 year cache
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('receiving-photos')
          .getPublicUrl(fileName);
        
        // Update photo with real URL
        const newPhoto: Photo = {
          url: urlData.publicUrl,
          fileName,
          isUploading: false,
          isNew: true,
        };
        
        // Update photos array with the uploaded photo
        const currentPhotos = [...photos, tempPhoto].map(p => 
          p.fileName === fileName ? newPhoto : p
        );
        onPhotosChange(currentPhotos);
        
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        toast.error(`Erro ao enviar foto: ${error.message}`);
        // Remove failed upload
        onPhotosChange(photos.filter(p => !p.isUploading));
      }
    }
    
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemovePhoto = async (photo: Photo) => {
    // Remove from UI immediately
    onPhotosChange(photos.filter(p => p.url !== photo.url));
    
    // If it was uploaded, delete from storage
    if (!photo.isUploading && photo.fileName) {
      try {
        await supabase.storage
          .from('receiving-photos')
          .remove([photo.fileName]);
      } catch (error) {
        console.error('Error deleting photo:', error);
        // Don't show error to user, photo is already removed from UI
      }
    }
  };

  const canAddMore = photos.length < MAX_PHOTOS && !disabled;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Fotos do Recebimento ({photos.length}/{MAX_PHOTOS})
        </span>
        
        {canAddMore && (
          <div className="flex gap-2">
            {/* Camera button (mobile) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-1" />
              Câmera
            </Button>
            
            {/* Gallery button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              Galeria
            </Button>
          </div>
        )}
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <Card 
              key={photo.url} 
              className="relative aspect-square overflow-hidden group"
            >
              <img
                src={photo.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Loading overlay */}
              {photo.isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              {/* Remove button */}
              {!photo.isUploading && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo)}
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Card>
          ))}
          
          {/* Add more button (if space available) */}
          {canAddMore && photos.length > 0 && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs">Adicionar</span>
            </button>
          )}
        </div>
      ) : (
        /* Empty state */
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Camera className="h-8 w-8" />
              <span className="text-sm">Tire fotos do recebimento</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
