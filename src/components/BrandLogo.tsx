import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'w-8 h-8', text: 'text-sm', subtext: 'text-[10px]', gap: 'gap-2' },
  md: { icon: 'w-12 h-12', text: 'text-base', subtext: 'text-xs', gap: 'gap-3' },
  lg: { icon: 'w-20 h-20', text: 'text-2xl', subtext: 'text-sm', gap: 'gap-4' },
  xl: { icon: 'w-28 h-28', text: 'text-3xl', subtext: 'text-base', gap: 'gap-5' },
};

export function BrandLogo({ size = 'md', variant = 'full', className }: BrandLogoProps) {
  const config = sizeConfig[size];

  const LogoIcon = () => (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl blur-md opacity-50 scale-110" />
      
      {/* Main icon container */}
      <div className={cn(
        "relative rounded-2xl bg-gradient-to-b from-amber-100 via-white to-amber-50 shadow-xl flex items-center justify-center ring-2 ring-amber-400/60 border-t border-amber-200",
        config.icon
      )}>
        {/* Inner green container */}
        <div className="w-full h-full p-1.5">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* SVG Logo */}
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <defs>
                {/* Gradient for the H letter */}
                <linearGradient id="hGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                
                {/* Gradient for leaves */}
                <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                
                {/* Shadow filter */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {/* Decorative leaves */}
              <path 
                d="M25 35 Q15 25 28 15 Q38 20 35 32 Q32 38 25 35" 
                fill="url(#leafGradient)" 
                filter="url(#shadow)"
              />
              <path 
                d="M75 35 Q85 25 72 15 Q62 20 65 32 Q68 38 75 35" 
                fill="url(#leafGradient)" 
                filter="url(#shadow)"
              />
              
              {/* The H letter with 3D effect */}
              <g filter="url(#shadow)">
                {/* Left vertical bar */}
                <rect x="28" y="30" width="14" height="50" rx="4" fill="url(#hGradient)" />
                {/* Right vertical bar */}
                <rect x="58" y="30" width="14" height="50" rx="4" fill="url(#hGradient)" />
                {/* Horizontal bar */}
                <rect x="28" y="47" width="44" height="12" rx="3" fill="url(#hGradient)" />
              </g>
              
              {/* Top shine effect */}
              <rect x="30" y="32" width="10" height="4" rx="2" fill="white" opacity="0.4" />
              <rect x="60" y="32" width="10" height="4" rx="2" fill="white" opacity="0.4" />
            </svg>
            
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const LogoText = () => (
    <div className="flex flex-col">
      <span className={cn(
        "font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent leading-tight",
        config.text
      )}>
        Horti Campos
      </span>
      <span className={cn(
        "text-emerald-300/80 tracking-wider",
        config.subtext
      )}>
        Hortifruti & Naturais
      </span>
    </div>
  );

  if (variant === 'icon-only') {
    return <LogoIcon />;
  }

  if (variant === 'text-only') {
    return <LogoText />;
  }

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      <LogoIcon />
      <LogoText />
    </div>
  );
}

// Versão para fundos claros (Login page)
export function BrandLogoLight({ size = 'lg', className }: Omit<BrandLogoProps, 'variant'>) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center", config.gap, className)}>
      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-3xl blur-md opacity-60 scale-105" />
        <div className={cn(
          "relative rounded-3xl bg-gradient-to-b from-amber-100 via-white to-amber-50 shadow-xl flex items-center justify-center p-3 ring-4 ring-amber-400/50 border-t-2 border-amber-200",
          config.icon
        )}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-2 shadow-inner flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="hGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="leafGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <filter id="shadowLight" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              
              {/* Leaves */}
              <path d="M25 35 Q15 25 28 15 Q38 20 35 32 Q32 38 25 35" fill="url(#leafGradientLight)" filter="url(#shadowLight)" />
              <path d="M75 35 Q85 25 72 15 Q62 20 65 32 Q68 38 75 35" fill="url(#leafGradientLight)" filter="url(#shadowLight)" />
              
              {/* H letter */}
              <g filter="url(#shadowLight)">
                <rect x="28" y="30" width="14" height="50" rx="4" fill="url(#hGradientLight)" />
                <rect x="58" y="30" width="14" height="50" rx="4" fill="url(#hGradientLight)" />
                <rect x="28" y="47" width="44" height="12" rx="3" fill="url(#hGradientLight)" />
              </g>
              
              <rect x="30" y="32" width="10" height="4" rx="2" fill="white" opacity="0.4" />
              <rect x="60" y="32" width="10" height="4" rx="2" fill="white" opacity="0.4" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Text */}
      <div className="text-center">
        <h1 className={cn(
          "font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent drop-shadow-sm",
          config.text
        )}>
          Horti Campos
        </h1>
        <p className={cn(
          "text-emerald-700 font-medium mt-1",
          config.subtext
        )}>
          Hortifruti & Produtos Naturais
        </p>
      </div>
    </div>
  );
}
