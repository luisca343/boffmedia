'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { useGetDocument } from '../_hooks/useGetDocument';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params} : {params: {id: string}}){
  const { id } = params;
  const { data } = useGetDocument(id);

  return (
  <div className='h-full border'>
    <CustomEditor
      initialData={data}
      documentId={id}
      documentType={0}
    />
  </div>
  );
}

