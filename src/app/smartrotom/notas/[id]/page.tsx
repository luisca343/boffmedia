'use client'

import React from 'react';
import dynamic from 'next/dynamic';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params} : {params: {id: string}}){
  const { id } = params;

  return (
  <div className='h-full'>
  <CustomEditor
    initialData='Título de tu documento'
    documentId={id}
  /></div>
  );
}

