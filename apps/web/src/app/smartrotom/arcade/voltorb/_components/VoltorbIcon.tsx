import Image from 'next/image';

type VoltorbImageProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export default function VoltorbImage({ size = 'md', className = '' }: VoltorbImageProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const pixelSize = sizeMap[size];

  return (
    <Image
      src="/smartrotom/img/apps/arcade/voltorb.png"
      alt="Voltorb"
      width={pixelSize}
      height={pixelSize}
      className={className}
    />
  );
}