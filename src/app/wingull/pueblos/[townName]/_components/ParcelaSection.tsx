import Image from 'next/image';
import { motion } from 'framer-motion';

interface ParcelaSectionProps {
  index: number;
  townName: string;
  parcela: {
    info: string;
    detalle: string;
  };
}

export default function ParcelaSection({ index, townName, parcela }: ParcelaSectionProps) {
  return (
    <motion.section 
      id={`parcela${index + 1}`} 
      className="mb-16 bg-blue-800 rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
    >
      <div className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative aspect-video rounded-lg overflow-hidden shadow-xl"
            >
              <Image
                src={`/smartrotom/img/pueblos/${townName}/parcela${index + 1}-detalle.png`}
                alt={`Detalle de la parcela ${index + 1}`}
                layout="fill"
                objectFit="cover"
              />
            </motion.div>
            <div className="mt-6 flex items-center">
              <h3 className="text-3xl font-bold text-yellow-300 flex items-center">
                <span className="mr-2">PARCELA</span>
                <span className="bg-yellow-300 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center">
                  {index + 1}
                </span>
              </h3>
            </div>
            <p className="text-base text-blue-200 mt-2">{parcela.info}</p>
          </div>
          <div className="lg:w-1/2">
            <h4 className="text-2xl font-bold mb-4 text-yellow-300">SOBRE LA PARCELA</h4>
            <p className="text-base mb-6 text-blue-200">{parcela.detalle}</p>
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={`/smartrotom/img/pueblos/${townName}/parcela${index + 1}-extra1.png`}
                  alt={`Extra 1 de la parcela ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={`/smartrotom/img/pueblos/${townName}/parcela${index + 1}-extra2.png`}
                  alt={`Extra 2 de la parcela ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}