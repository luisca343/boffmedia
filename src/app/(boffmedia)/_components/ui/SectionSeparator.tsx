interface SectionSeparatorProps {
  variant?: 'default' | 'purple' | 'blue' | 'orange';
  className?: string;
}

export function SectionSeparator({ variant = 'purple', className = "" }: SectionSeparatorProps) {
  const colors = {
    default: 'purple-500',
    purple: 'purple-500',
    blue: 'blue-500', 
    orange: 'primary-500'
  };

  const dotColors = {
    default: ['purple-400', 'cyan-400', 'pink-400'],
    purple: ['purple-400', 'cyan-400', 'pink-400'],
    blue: ['blue-400', 'cyan-400', 'indigo-400'],
    orange: ['primary-400', 'amber-400', 'yellow-400']
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className={`w-full h-px bg-gradient-to-r from-transparent via-${colors[variant]} to-transparent`}></div>
      </div>
      <div className={`relative bg-slate-900 px-8 py-4 rounded-full border border-${colors[variant].replace('/50', '/30')}`}>
        <div className="flex items-center gap-3">
          {dotColors[variant].map((color, index) => (
            <div 
              key={index}
              className={`w-2 h-2 bg-${color} rounded-full animate-ping`}
              style={{ animationDelay: `${index * 150}ms` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}