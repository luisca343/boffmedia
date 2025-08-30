import { HeaderCard } from "../cards/HeaderCard";

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
      <HeaderCard
        title={title}
        subtitle={subtitle}
        description={description}
        townName={townName}
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />
    </div>
  );
}
