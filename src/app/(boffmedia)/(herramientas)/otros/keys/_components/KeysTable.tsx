"use client";

import { useState, Suspense, lazy } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Key, ExternalLink } from "lucide-react";
import useGetKeys from "../_hooks/useGetKeys";
import useFetchSteamData from "../_hooks/useFetchSteamData";
const SteamDialog = lazy(() => import("./SteamDialog"));

export default function KeysTable() {
  const { filteredKeys, filter, setFilter } = useGetKeys();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showClaimed, setShowClaimed] = useState<boolean>(false);
  const { selectedGame, isModalVisible, setIsModalVisible, fetchGameData } = useFetchSteamData();

  if (!filteredKeys) return <div>Loading...</div>;

  const displayedKeys = showClaimed
    ? filteredKeys
    : filteredKeys.filter((key) => key.claimed !== "s");

  // Aggregate keys by game name and activation state
  const aggregatedKeys = displayedKeys.reduce((acc: { [key: string]: any }, key) => {
    const keyIdentifier = `${key.name}-${key.claimed}`;
    if (!acc[keyIdentifier]) {
      acc[keyIdentifier] = { ...key, count: 1 };
    } else {
      acc[keyIdentifier].count += 1;
    }
    return acc;
  }, {});

  const aggregatedKeysArray = Object.values(aggregatedKeys);

  return (
    <div className="min-h-screen text-text-primary p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-5xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover flex items-center justify-center gap-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Claves de Steam
        </motion.h1>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar claves..."
            className="mb-6 bg-surface-3 border-border-dark text-text-primary placeholder-main-400 focus:ring-primary focus:border-primary"
          />
        </motion.div>
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showClaimed}
                onChange={() => setShowClaimed(!showClaimed)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-5 rounded-full transition peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/25"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform peer-checked:translate-x-5 peer-checked:bg-surface-2"></div>
            </div>
            <span className="text-lg font-medium text-primary group-hover:text-primary transition">
              Mostrar reclamados
            </span>
          </label>
        </motion.div>
        <motion.div
          className="bg-surface-3 rounded-lg shadow-lg overflow-hidden border border-border-dark"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-2">
                <TableHead className="text-primary">#</TableHead>
                <TableHead className="text-primary">Image</TableHead>
                <TableHead className="text-primary">Juego</TableHead>
                <TableHead className="text-primary">Bundle</TableHead>
                <TableHead className="text-primary">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {aggregatedKeysArray.map((key, index) => (
                  <motion.tr
                    key={`${key.name}-${key.claimed}`}
                    className="hover:bg-surface-3 transition-colors duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredRow(key.name)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => fetchGameData(key.steamID)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TableCell className="font-medium text-text-secondary">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <img
                        src={key.imageUrl}
                        alt={`Imagen de ${key.name}`}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" />
                        <span className="flex items-center gap-1 text-text-primary">
                          {key.name} {key.count > 1 && `x${key.count}`}
                        </span>
                        <a
                          href={`https://store.steampowered.com/app/${key.steamID}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:text-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary">{key.source}</TableCell>
                    <TableCell>
                      <motion.div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          key.claimed === "s" ? "bg-red-500" : "bg-green-500"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Key className="w-4 h-4" />
                        {key.claimed === "s" ? "Reclamado" : "Disponible"}
                      </motion.div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SteamDialog
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
          selectedGame={selectedGame}
        />
      </Suspense>
    </div>
  );
}