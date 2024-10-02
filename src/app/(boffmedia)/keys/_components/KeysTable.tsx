"use client";
import { Suspense } from "react";
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

interface SteamKey {
  name: string;
  source: string;
  claimed: string;
}

export default function KeysTable() {
  const { filteredKeys, filter, setFilter } = useGetKeys();

  if (!filteredKeys) return <div>Loading...</div>;
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-cyan-400 animate-pulse">
        Claves de Steam
      </h1>
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Buscar claves..."
        className="mb-6 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
      />
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <Suspense fallback={<div>Loading table...</div>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-cyan-400">Juego</TableHead>
                <TableHead className="text-cyan-400">Bundle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeys.map((key) => (
                <TableRow
                  key={key.name}
                  className="hover:bg-gray-700 transition-colors duration-200"
                >
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>{key.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Suspense>
      </div>
    </div>
  );
}
