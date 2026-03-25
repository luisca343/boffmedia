"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { openPC } from "@/services/mcef/mcefApi";

export default function PC() {
  const [salir, setSalir] = useState(false);
  const router = useRouter();

  const abrirPC = useCallback(async () => {
    try {
      await openPC();
      setSalir(true);
    } catch (err) {
      console.error("Error opening PC:", err);
      setSalir(true);
    }
  }, []);

  useEffect(() => {
    abrirPC();
    if (salir) {
      router.push("/smartrotom");
    }
  }, [abrirPC, salir, router]);

  return (
    <div className="pantalla pantallaPrincipal">
      {/* No need for Navigate component */}
    </div>
  );
}