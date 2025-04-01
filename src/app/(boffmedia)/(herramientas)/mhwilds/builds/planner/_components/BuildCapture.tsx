"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Download, Upload } from 'lucide-react';

interface BuildCaptureProps {
  captureElementId: string;
  buildName: string;
}

export function BuildCapture({ captureElementId, buildName }: BuildCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {

  };

  return (
    <div className="flex justify-center mt-4">
      <Button 
        onClick={handleCapture} 
        disabled={isCapturing}
        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md"
      >
        {isCapturing ? (
          <>Generating image...</>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Capture Build Image
          </>
        )}
      </Button>
    </div>
  );
}