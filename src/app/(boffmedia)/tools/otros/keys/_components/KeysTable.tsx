"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useGetKeys from "../_hooks/useGetKeys";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Key, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import useFetchSteamData from "../_hooks/useFetchSteamData";
import { SteamDialog } from "./SteamDialog";

export default function KeysTable() {
  const { filteredKeys, filter, setFilter } = useGetKeys();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showClaimed, setShowClaimed] = useState<boolean>(false);
  const { selectedGame, isModalVisible, setIsModalVisible, fetchGameData } =
    useFetchSteamData();

  if (!filteredKeys) return <div>Loading...</div>;

  const displayedKeys = showClaimed
    ? filteredKeys
    : filteredKeys.filter((key) => key.claimed !== "s");

  return (
    <div className="min-h-screen text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-5xl font-bold mb-8 text-center text-cyan-400 flex items-center justify-center gap-4"
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
            className="mb-6 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-400"
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
              <div className="w-11 h-6 bg-gray-600 rounded-full transition peer-checked:bg-cyan-400 peer-focus:ring-4 peer-focus:ring-cyan-400/25"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform peer-checked:translate-x-5 peer-checked:bg-gray-900"></div>
            </div>
            <span className="text-lg font-medium text-gray-300 group-hover:text-cyan-400 transition">
              Mostrar reclamados
            </span>
          </label>
        </motion.div>
        <motion.div
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-cyan-400">#</TableHead>
                <TableHead className="text-cyan-400">Image</TableHead>
                <TableHead className="text-cyan-400">Juego</TableHead>
                <TableHead className="text-cyan-400">Bundle</TableHead>
                <TableHead className="text-cyan-400">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {displayedKeys.map((key) => (
                  <motion.tr
                    key={key.name}
                    className="hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredRow(key.name)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => fetchGameData(key.steamID)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TableCell className="font-medium">
                      {displayedKeys.indexOf(key) + 1}
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
                        <Gift className="w-5 h-5 text-cyan-400" />
                        <span className="flex items-center gap-1">
                          {key.name}
                        </span>
                        <a
                          href={`https://store.steampowered.com/app/${key.steamID}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{key.source}</TableCell>
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

      <SteamDialog
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        selectedGame={selectedGame}
      />
    </div>
  );
}
