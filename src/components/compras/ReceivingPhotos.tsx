import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, ImagePlus } from 'lucide-react';
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
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        0.8
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
      toast.error(`Máximo de ${MAX_PHOTOS} fotos`);
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    
    for (const file of filesToProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }
      
      try {
        const compressedBlob = await compressImage(file);
        
        if (compressedBlob.size > MAX_FILE_SIZE) {
          toast.error(`Imagem muito grande: ${file.name}`);
          continue;
        }
        
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileName = `${orderId}/${timestamp}-${randomId}.jpg`;
        
        const tempUrl = URL.createObjectURL(compressedBlob);
        const tempPhoto: Photo = {
          url: tempUrl,
          fileName,
          isUploading: true,
          isNew: true,
        };
        const updatedPhotos = [...photos, tempPhoto];
        onPhotosChange(updatedPhotos);
        
        const { error } = await supabase.storage
          .from('receiving-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('receiving-photos')
          .getPublicUrl(fileName);
        
        const newPhoto: Photo = {
          url: urlData.publicUrl,
          fileName,
          isUploading: false,
          isNew: true,
        };
        
        const currentPhotos = [...photos, tempPhoto].map(p => 
          p.fileName === fileName ? newPhoto : p
        );
        onPhotosChange(currentPhotos);
        
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        toast.error(`Erro ao enviar foto: ${error.message}`);
        onPhotosChange(photos.filter(p => !p.isUploading));
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemovePhoto = async (photo: Photo) => {
    onPhotosChange(photos.filter(p => p.url !== photo.url));
    
    if (!photo.isUploading && photo.fileName) {
      try {
        await supabase.storage
          .from('receiving-photos')
          .remove([photo.fileName]);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const canAddMore = photos.length < MAX_PHOTOS && !disabled;

  return (
    <div className="flex items-center gap-2 h-[40px]">
      {/* Hidden inputs */}
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
      
      {/* Compact buttons */}
      {canAddMore && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="h-9 px-2 text-xs"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Camera className="h-4 w-4 mr-1" />
                Câmera
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-9 px-2 text-xs"
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Galeria
          </Button>
        </>
      )}
      
      {/* Compact thumbnails row (40x40px) */}
      {photos.length > 0 && (
        <div className="flex gap-1 overflow-x-auto flex-1">
          {photos.map((photo, index) => (
            <div 
              key={photo.url} 
              className="relative flex-shrink-0 w-10 h-10 rounded overflow-hidden border"
            >
              <img
                src={photo.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {photo.isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              )}
              
              {!photo.isUploading && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo)}
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Counter */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {photos.length}/{MAX_PHOTOS}
      </span>
    </div>
  );
}
