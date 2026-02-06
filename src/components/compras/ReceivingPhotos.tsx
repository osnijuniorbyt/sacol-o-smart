import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Camera, X, Loader2, ImagePlus, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [isExpanded, setIsExpanded] = useState(false);
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
    setIsExpanded(true); // Expand when adding photos
    
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

  // Hidden file inputs
  const FileInputs = () => (
    <>
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
    </>
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <FileInputs />
      
      {/* Compact header - always visible */}
      <div className="flex items-center justify-between py-2 border rounded-lg px-3 bg-muted/30">
        <CollapsibleTrigger asChild>
          <button 
            type="button"
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Camera className="h-4 w-4" />
            <span>Fotos ({photos.length}/{MAX_PHOTOS})</span>
          </button>
        </CollapsibleTrigger>
        
        {/* Quick add buttons - always visible */}
        {canAddMore && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 px-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 px-2"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Expandable photo thumbnails */}
      <CollapsibleContent>
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <div 
                key={photo.url} 
                className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Loading overlay */}
                {photo.isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                
                {/* Remove button */}
                {!photo.isUploading && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo)}
                    className="absolute top-0.5 right-0.5 p-1 rounded-full bg-destructive/90 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Add more button inline */}
            {canAddMore && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="flex-shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center text-muted-foreground"
              >
                <Camera className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
