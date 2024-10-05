'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { useGetDocument } from '../_hooks/useGetDocument';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params, refresh} : {params: {id: string}, refresh: () => void}) {
  const { id } = params;
  const { data } = useGetDocument(id);

  return (
  <div className='h-full border'>
    <CustomEditor
      initialData={data}
      documentId={id}
      documentType={0}
      refresh={refresh}
    />
  </div>
  );
}

