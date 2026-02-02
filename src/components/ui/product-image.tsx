import { cn } from '@/lib/utils';
import { ProductCategory, CATEGORY_LABELS } from '@/types/database';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  category?: ProductCategory;
  className?: string;
}

const sizes = {
  xs: 'h-8 w-8',      // 32px - Pedido Sugerido
  sm: 'h-10 w-10',    // 40px - Compras grid
  md: 'h-12 w-12',    // 48px - PDV
  lg: 'h-24 w-24',    // 96px - Listagens
  xl: 'h-48 w-48',    // 192px - Cadastro/Edição
};

const categoryEmojis: Record<ProductCategory, string> = {
  frutas: '🍎',
  verduras: '🥬',
  legumes: '🥕',
  temperos: '🌿',
  outros: '📦',
};

const categoryColors: Record<ProductCategory, string> = {
  frutas: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  verduras: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  legumes: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  temperos: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  outros: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function ProductImage({ 
  src, 
  alt, 
  size = 'md', 
  category = 'outros',
  className 
}: ProductImageProps) {
  const sizeClass = sizes[size];
  
  // If there's an image URL, show the image
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeClass,
          'rounded-lg object-cover flex-shrink-0',
          className
        )}
        loading="lazy"
      />
    );
  }
  
  // Placeholder with category emoji
  const emoji = categoryEmojis[category];
  const colorClass = categoryColors[category];
  
  // Adjust emoji size based on container size
  const emojiSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };
  
  return (
    <div
      className={cn(
        sizeClass,
        colorClass,
        'rounded-lg flex items-center justify-center flex-shrink-0',
        className
      )}
      title={CATEGORY_LABELS[category]}
    >
      <span className={emojiSizes[size]}>{emoji}</span>
    </div>
  );
}
