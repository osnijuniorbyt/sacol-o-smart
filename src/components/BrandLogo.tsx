import { cn } from '@/lib/utils';
import logoFull from '@/assets/logo-hortii-cream.png';
import logoTransparent from '@/assets/logo-hortii-transparent.png';
import logoIconOnly from '@/assets/logo-hortii-icon-only.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
  className?: string;
}

const sizeConfig = {
  sm: { icon: 40, full: 180 },
  md: { icon: 48, full: 220 },
  lg: { icon: 64, full: 320 },
  xl: { icon: 80, full: 400 },
};

export function BrandLogo({ size = 'md', variant = 'full', className }: BrandLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'icon-only') {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <img 
          src={logoIconOnly} 
          alt="Horti Campos" 
          width={config.icon} 
          height={config.icon}
          className="object-contain flex-shrink-0"
        />
      </div>
    );
  }

  // Logo completa
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={logoFull} 
        alt="Horti Campos - Hortifruti e Produtos Naturais" 
        style={{ width: config.full, height: 'auto' }}
        className="object-contain flex-shrink-0"
      />
    </div>
  );
}

// Version for light backgrounds (Auth pages) - clean design
export function BrandLogoLight({ size = 'lg', className }: Omit<BrandLogoProps, 'variant'>) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative rounded-xl bg-[hsl(42,25%,92%)] p-4 shadow-md">
        <img 
          src={logoTransparent} 
          alt="Horti Campos - Hortifruti e Produtos Naturais" 
          style={{ width: config.full, height: 'auto' }}
          className="object-contain"
        />
      </div>
    </div>
  );
}
