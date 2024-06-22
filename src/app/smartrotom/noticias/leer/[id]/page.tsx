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
  const [error, setError] = React.useState<any>(null);

  useEffect(() => {
    rotomGET(`/documents/${id}`)
    .then((res) => {
       if(res.type !== 1) setError('No se puede leer este documento');
      setData(res.content);
      //rewrite url
    });
    
  }, [id]);

    if(error) return <div>{error}</div>
  return (
    <div className='w-full h-full bg-main-800'>
        <div className='h-full w-[70%] m-auto'>
        <CustomEditor
            initialData={data}
            documentId={id}
            documentType={1}
            readonly={true}
        />
    </div>
  </div>
  );
}

