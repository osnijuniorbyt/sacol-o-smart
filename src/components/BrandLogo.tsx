import { cn } from '@/lib/utils';

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

// SVG Icon Component - Fruit with H and leaves
function LogoIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Gradient for orange fruit */}
        <linearGradient id="fruitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAA33" />
          <stop offset="50%" stopColor={COLORS.orange} />
          <stop offset="100%" stopColor="#E08200" />
        </linearGradient>
        
        {/* Gradient for leaves */}
        <linearGradient id="leafGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#004d29" />
          <stop offset="50%" stopColor={COLORS.green} />
          <stop offset="100%" stopColor="#008045" />
        </linearGradient>
        
        {/* Shadow filter */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      
      {/* Left leaf */}
      <path 
        d="M35 22 Q25 8 38 4 Q50 8 45 22 Q42 28 35 22" 
        fill="url(#leafGradient)"
        filter="url(#dropShadow)"
      />
      
      {/* Right leaf */}
      <path 
        d="M65 22 Q75 8 62 4 Q50 8 55 22 Q58 28 65 22" 
        fill="url(#leafGradient)"
        filter="url(#dropShadow)"
      />
      
      {/* Stem */}
      <rect 
        x="47" 
        y="8" 
        width="6" 
        height="16" 
        rx="3" 
        fill={COLORS.green}
      />
      
      {/* Orange fruit body */}
      <ellipse 
        cx="50" 
        cy="58" 
        rx="38" 
        ry="36" 
        fill="url(#fruitGradient)"
        filter="url(#dropShadow)"
      />
      
      {/* Fruit highlight */}
      <ellipse 
        cx="38" 
        cy="45" 
        rx="12" 
        ry="8" 
        fill="white" 
        opacity="0.25"
      />
      
      {/* H letter - white on orange */}
      <g fill={COLORS.white}>
        {/* Left vertical bar */}
        <rect x="30" y="42" width="10" height="34" rx="2" />
        {/* Right vertical bar */}
        <rect x="60" y="42" width="10" height="34" rx="2" />
        {/* Horizontal bar */}
        <rect x="30" y="54" width="40" height="10" rx="2" />
      </g>
    </svg>
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
