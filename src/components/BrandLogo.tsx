import { cn } from '@/lib/utils';
import logoHortii from '@/assets/logo-hortii-3d.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
  className?: string;
}

// Official brand colors
const COLORS = {
  green: '#006837',
  orange: '#F39200',
  white: '#FFFFFF',
};

const sizeConfig = {
  sm: { icon: 48, textMain: 'text-base', textSub: 'text-xs', tagline: false },
  md: { icon: 56, textMain: 'text-lg', textSub: 'text-sm', tagline: false },
  lg: { icon: 80, textMain: 'text-2xl', textSub: 'text-base', tagline: true },
  xl: { icon: 100, textMain: 'text-3xl', textSub: 'text-xl', tagline: true },
};

// Logo Icon using the professional 3D metallic image
function LogoIcon({ size }: { size: number }) {
  return (
    <img 
      src={logoHortii} 
      alt="Horti Campos" 
      width={size} 
      height={size}
      className="object-contain flex-shrink-0"
    />
  );
}

// Brand text using Google Fonts
function LogoText({ 
  mainClass, 
  subClass, 
  showTagline,
  forDarkBg = true 
}: { 
  mainClass: string; 
  subClass: string; 
  showTagline: boolean;
  forDarkBg?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {/* HORTII */}
      <span 
        className={cn(mainClass, "leading-tight")}
        style={{ 
          fontFamily: "'Merriweather', serif", 
          fontWeight: 900,
          color: forDarkBg ? COLORS.white : COLORS.green,
        }}
      >
        HORTII
      </span>
      
      {/* campos */}
      <span 
        className={cn(subClass, "leading-tight -mt-0.5")}
        style={{ 
          fontFamily: "'Nunito', sans-serif", 
          fontWeight: 700,
          color: COLORS.orange,
        }}
      >
        campos
      </span>
      
      {/* Tagline */}
      {showTagline && (
        <span 
          className="text-xs tracking-wider mt-2 pt-2 border-t"
          style={{ 
            fontFamily: "'Roboto', sans-serif", 
            fontWeight: 500,
            color: forDarkBg ? 'rgba(255,255,255,0.8)' : COLORS.green,
            borderColor: forDarkBg ? 'rgba(255,255,255,0.3)' : COLORS.green,
          }}
        >
          HORTIFRUTI E PRODUTOS NATURAIS
        </span>
      )}
    </div>
  );
}

export function BrandLogo({ size = 'md', variant = 'full', className }: BrandLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'icon-only') {
    return (
      <div className={className}>
        <LogoIcon size={config.icon} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon size={config.icon} />
      <LogoText 
        mainClass={config.textMain}
        subClass={config.textSub}
        showTagline={config.tagline}
        forDarkBg={true}
      />
    </div>
  );
}

// Version for light backgrounds (Login page)
export function BrandLogoLight({ size = 'lg', className }: Omit<BrandLogoProps, 'variant'>) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <LogoIcon size={config.icon * 1.2} />
      <div className="text-center">
        {/* HORTII */}
        <h1 
          className={cn(config.textMain, "leading-tight")}
          style={{ 
            fontFamily: "'Merriweather', serif", 
            fontWeight: 900,
            color: COLORS.green,
          }}
        >
          HORTII
        </h1>
        
        {/* campos */}
        <span 
          className={cn(config.textSub, "leading-tight block")}
          style={{ 
            fontFamily: "'Nunito', sans-serif", 
            fontWeight: 700,
            color: COLORS.orange,
          }}
        >
          campos
        </span>
        
        {/* Tagline */}
        <p 
          className="text-sm tracking-wider mt-3 pt-3 border-t inline-block"
          style={{ 
            fontFamily: "'Roboto', sans-serif", 
            fontWeight: 500,
            color: COLORS.green,
            borderColor: COLORS.green,
          }}
        >
          HORTIFRUTI E PRODUTOS NATURAIS
        </p>
      </div>
    </div>
  );
}
