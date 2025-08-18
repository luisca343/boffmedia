interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  description: React.ReactNode;
  townName: string;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function SectionHeader({ 
  title, 
  subtitle, 
  description, 
  townName, 
  colorClaro, 
  colorMedio, 
  colorOscuro 
}: SectionHeaderProps) {
  return (
    <div className="flex justify-center mb-16">
      <div className="relative max-w-4xl w-full">
  <div className="relative backdrop-blur-sm rounded-2xl p-8 lg:p-10 border shadow-lg transform hover:scale-[1.02] transition-all duration-300 text-slate-100"
    style={{ background: `${colorOscuro}70`, borderColor: `${colorMedio}30` }}
  >
          
          {/* Decorative accent bar using town colors */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }}
          />
          
          {/* Corner decorations using town colors */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl" style={{ borderColor: colorClaro }} />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl" style={{ borderColor: colorClaro }} />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 rounded-bl-xl" style={{ borderColor: colorMedio }} />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 rounded-br-xl" style={{ borderColor: colorMedio }} />
          
          {/* Ornamental dots using town colors */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorClaro }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorMedio }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorOscuro }} />
          </div>
          
          {/* Title content */}
          <div className="text-center space-y-6 pt-6">
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                <span style={{color: colorClaro}}>{title}</span>
                <br />
                <span style={{color: colorMedio}}>{subtitle}</span>
              </h2>
            </div>
            
            {/* Decorative divider using town colors */}
            <div className="flex justify-center items-center space-x-3 py-3">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colorMedio }} />
              <div className="w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-800" style={{ borderColor: colorClaro }} />
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colorMedio }} />
            </div>
            
            {/* Description */}
            <div className="max-w-3xl mx-auto">
              <p className="text-base lg:text-lg leading-relaxed" style={{color: colorMedio}}>
                {typeof description === 'string' ? description.replace('{townName}', townName) : description}
              </p>
            </div>
          </div>
          
          {/* Bottom ornamental elements using town colors */}
          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorOscuro }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMedio }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorClaro }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMedio }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorOscuro }} />
            </div>
          </div>
          
          {/* Subtle glow effect on hover using town colors */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"
            style={{ 
              background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
            }}
          />
        </div>
        
        {/* Floating decorative elements around the sign using town colors */}
        <div 
          className="absolute -top-3 -left-3 w-6 h-6 rounded-full opacity-60"
          style={{ backgroundColor: colorClaro }}
        />
        <div 
          className="absolute -top-2 -right-4 w-4 h-4 rounded-full opacity-50"
          style={{ backgroundColor: colorMedio }}
        />
        <div 
          className="absolute -bottom-4 -left-2 w-5 h-5 rounded-full opacity-40"
          style={{ backgroundColor: colorOscuro }}
        />
        <div 
          className="absolute -bottom-3 -right-3 w-3 h-3 rounded-full opacity-70"
          style={{ backgroundColor: colorMedio }}
        />
      </div>
    </div>
  );
}
