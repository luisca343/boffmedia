'use client'

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { rotomGET } from '@/services/boffAPI';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params} : {params: {id: string}}){
  const { id } = params;
  const [data, setData] = React.useState<any>(null);

  useEffect(() => {
    const data = rotomGET(`/documents/${id}`)
    .then((res) => {
      setData(res.content);
      //rewrite url
    });
    
  }, [id]);

  return (
  <div className='h-full'>
  <CustomEditor
    initialData={data}
    documentId={id}
    documentType={0}
  /></div>
  );
}

