import { cn } from '@/lib/utils';
import logoFull from '@/assets/logo-hortii-cream.png';
import logoIcon from '@/assets/logo-hortii-3d.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
  className?: string;
}

const sizeConfig = {
  sm: { icon: 48, full: 180 },
  md: { icon: 56, full: 220 },
  lg: { icon: 80, full: 320 },
  xl: { icon: 100, full: 400 },
};

export function BrandLogo({ size = 'md', variant = 'full', className }: BrandLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'icon-only') {
    return (
      <div className={className}>
        <img 
          src={logoIcon} 
          alt="Horti Campos" 
          width={config.icon} 
          height={config.icon}
          className="object-contain flex-shrink-0"
        />
      </div>
    );
  }

  // Logo completa profissional 3D metálica
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

// Version for light backgrounds (Login page) - uses full logo
export function BrandLogoLight({ size = 'lg', className }: Omit<BrandLogoProps, 'variant'>) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img 
        src={logoFull} 
        alt="Horti Campos - Hortifruti e Produtos Naturais" 
        style={{ width: config.full, height: 'auto' }}
        className="object-contain"
      />
    </div>
  );
}
