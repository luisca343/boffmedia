'use client'

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDocument } from '../_hooks/useDocument';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params} : {params: {id: string}}){
  const { id } = params;
  const { data } = useDocument(id);

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

