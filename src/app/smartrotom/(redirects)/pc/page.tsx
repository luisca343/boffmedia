"use client"
import { mcefQuery } from '@/services/mcefHelper';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PC() {
  const [salir, setSalir] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('test');
    abrirPC();
  }, []);

  function abrirPC() {
    mcefQuery('abrirPC', {})
      .then((msg) => {
        setSalir(true);
      })
      .catch((err) => {
        setSalir(true);
      });
  }

  useEffect(() => {
    if (salir) {
      router.push('/smartrotom');
    }
  }, [salir, router]);

  return (
    <div className='pantalla pantallaPrincipal'>
      {/* No need for Navigate component */}
    </div>
  );
}