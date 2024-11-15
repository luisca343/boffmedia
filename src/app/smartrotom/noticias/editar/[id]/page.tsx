'use client'

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { rotomGET } from '@/services/boffAPI';

const CustomEditor = dynamic( () => {
  return import( '@/components/editor/TestEditor' );
}, { ssr: false } );

export default function Note({params} : {params: {id: string}}){
  const { id } = params;
  const [data, setData] = React.useState<any>({});

  useEffect(() => {
    rotomGET(`/documents/news/${id}`)
    .then((res) => {
      setData(res);
      console.log(res);
    });
    
  }, [id]);

  return (
    <div className='w-full h-full bg-surface-800'>
        <div className='h-full w-[70%] m-auto'>
        <CustomEditor
            document={data}
            documentId={id}
            documentType={1}
            type='news'
        />
    </div>
  </div>
  );
}

