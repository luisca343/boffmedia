"use client";
import { motion } from "framer-motion";

export default function PaletteViewer() {
  const palettes = [
    { name: "Surface", varPrefix: "surface", weights: [50,100,200,300,400,500,600,700,800,900,950] },
    { name: "Primary", varPrefix: "primary", weights: [50,100,200,300,400,500,600,700,800,900] },
    { name: "Secondary", varPrefix: "secondary", weights: [50,100,200,300,400,500,600,700,800,900] },
    { name: "Accent", varPrefix: "accent", weights: [50,100,200,300,400,500,600,700,800,900] },
    { name: "Highlight", varPrefix: "highlight", weights: [50,100,200,300,400,500,600,700,800,900] },
    { name: "Success", varPrefix: "success", weights: [50,100,200,300,400,500,600,700,800,900,950] },
    { name: "Info", varPrefix: "info", weights: [50,100,200,300,400,500,600,700,800,900,950] },
    { name: "Warning", varPrefix: "warning", weights: [50,100,200,300,400,500,600,700,800,900,950] },
    { name: "Error", varPrefix: "error", weights: [50,100,200,300,400,500,600,700,800,900,950] },
  ];

  return (
    <div className="container mx-auto p-6 pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-base via-layer-1 to-layer-2 -z-10" />
      <h1 className="text-4xl font-extrabold mb-10 text-center text-white tracking-wide drop-shadow-lg">
        🎮 Color System Preview
      </h1>
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {palettes.map((palette) => (
          <motion.div
            key={palette.varPrefix}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl overflow-hidden border border-edge bg-layer-2/70 backdrop-blur shadow-lg"
          >
            <div className="px-5 py-3 flex items-center gap-3 bg-layer-1 border-b border-edge">
              <div
                className="w-5 h-5 rounded-full shadow"
                style={{
                  backgroundColor: `rgb(var(--${palette.varPrefix}-500))`,
                }}
              />
              <h2 className="text-lg font-bold text-white">{palette.name}</h2>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 p-4">
              {palette.weights.map((weight) => {
                const bg = `rgb(var(--${palette.varPrefix}-${weight}))`;
                const textColor =
                  weight < 400 ? "text-black" : "text-white"; // auto contrast heuristic

                return (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    key={`${palette.varPrefix}-${weight}`}
                    className="rounded-md overflow-hidden shadow cursor-pointer group"
                  >
                    <div
                      className={`w-full h-14 flex items-center justify-center text-xs font-semibold ${textColor}`}
                      style={{ backgroundColor: bg }}
                    >
                      {weight}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
