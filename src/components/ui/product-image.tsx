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

// Pastel backgrounds by category - ALWAYS applied
const getCategoryBg = (category: ProductCategory): string => {
  const bgColors: Record<ProductCategory, string> = {
    verduras: 'bg-green-50',
    frutas: 'bg-amber-50',
    legumes: 'bg-orange-50',
    temperos: 'bg-purple-50',
    outros: 'bg-gray-100',
  };
  return bgColors[category] || 'bg-gray-100';
};

// Adjust emoji size based on container size
const emojiSizes = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

// Image sizes relative to container
const imageSizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-20 w-20',
  xl: 'h-40 w-40',
};

export function ProductImage({ 
  src, 
  alt, 
  size = 'md', 
  category = 'outros',
  className 
}: ProductImageProps) {
  const sizeClass = sizes[size];
  const bgClass = getCategoryBg(category);
  
  // ALWAYS render container with pastel background
  return (
    <div
      className={cn(
        sizeClass,
        bgClass,
        'rounded-lg flex items-center justify-center flex-shrink-0',
        className
      )}
      title={CATEGORY_LABELS[category]}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(imageSizes[size], 'object-contain')}
          loading="lazy"
        />
      ) : (
        <span className={emojiSizes[size]}>{categoryEmojis[category]}</span>
      )}
    </div>
  );
}
