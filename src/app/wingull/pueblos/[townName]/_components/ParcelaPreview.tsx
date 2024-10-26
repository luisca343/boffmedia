import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface ParcelaPreviewProps {
  index: number;
  townName: string;
  backgroundColor: string;
}

export default function ParcelaPreview({ index, townName, backgroundColor }: ParcelaPreviewProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  return (
    <motion.div
      className="wform-parcela hoverEspecial"
      style={{ x, y, rotateX, rotateY, perspective: 1000 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={`#parcela${index + 1}`} className="block">
        <div className="nombre-parcela text-lg font-bold p-2" style={{ backgroundColor }}>
          {`Parcela 00${index + 1}`}
        </div>
        <div className="img-parcela-wrapper relative h-48">
          <Image
            src={`/smartrotom/img/pueblos/${townName}/parcela${index + 1}-preview.png`}
            alt={`Parcela ${index + 1}`}
            layout="fill"
            objectFit="cover"
          />
        </div>
      </Link>
    </motion.div>
  );
}