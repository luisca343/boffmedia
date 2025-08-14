'use client'

import dynamic from 'next/dynamic';
import { useGetNewsById } from '@/hooks/documents/useGetNewsById';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'

const CustomEditor = dynamic(() => import('@/components/ckeditor/TestEditor'), { ssr: false });

export default function EditNote({ params }: { params: { id: string } }) {
  const { id } = params;
  const { article, error, isLoading } = useGetNewsById(id);

  if (isLoading) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-surface-800'>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-surface-800 p-4'>
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load the article. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!article) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-surface-800 p-4'>
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The requested article could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='w-full h-full bg-surface-800'>
      <div className='h-full w-[70%] m-auto'>
        <CustomEditor
          document={article}
          documentId={id}
          documentType={1}
          type='news'
        />
      </div>
    </div>
  );
}

