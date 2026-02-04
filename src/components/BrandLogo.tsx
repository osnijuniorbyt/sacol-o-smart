import { cn } from '@/lib/utils';
import logoFull from '@/assets/logo-hortii-cream.png';
import logoTransparent from '@/assets/logo-hortii-transparent.png';
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

// Version for light backgrounds (Login page) - uses transparent logo with sunset container
export function BrandLogoLight({ size = 'lg', className }: Omit<BrandLogoProps, 'variant'>) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Container com tema sunset e efeitos metálicos */}
      <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_-4px_hsl(38,70%,45%,0.35),0_4px_16px_-2px_hsl(30,60%,35%,0.25)]">
        {/* Borda metálica dourada */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[hsl(40,60%,60%,0.4)]" />
        
        {/* Gradiente de fundo sunset */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(42,40%,96%)] via-[hsl(38,50%,88%)] to-[hsl(32,55%,78%)]" />
        
        {/* Shimmer na base */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px] animate-shimmer z-10 opacity-60"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(40,70%,60%), hsl(45,30%,85%), hsl(40,70%,60%), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
        
        {/* Logo */}
        <div className="relative p-4">
          <img 
            src={logoTransparent} 
            alt="Horti Campos - Hortifruti e Produtos Naturais" 
            style={{ width: config.full, height: 'auto' }}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
