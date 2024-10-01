"use client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET, apiGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { Suspense } from "react";

interface SteamKey {
  name: string;
  source: string;
  claimed: string;
}

export default function KeysPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [steamKeys, setSteamKeys] = useState<SteamKey[]>([]);

  useEffect(() => {
    apiGET(`/steamkeys`).then((res) => {
      setSteamKeys(res);
    });
  });

  const filteredData = steamKeys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.claimed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!steamKeys) return <div>Loading...</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-cyan-400 animate-pulse">
          Claves de Steam
        </h1>
        <Input
          placeholder="Buscar claves..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
        />
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-cyan-400">Juego</TableHead>
                <TableHead className="text-cyan-400">Bundle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((key) => (
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
        </div>
      </div>
    </div>
  );
}
