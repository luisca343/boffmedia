"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toPng } from 'html-to-image';
import { Share2, Download, Upload } from 'lucide-react';

interface BuildCaptureProps {
  captureElementId: string;
  buildName: string;
}

export function BuildCapture({ captureElementId, buildName }: BuildCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    
    try {
      const element = document.getElementById(captureElementId);
      
      if (!element) {
        throw new Error("Couldn't find element to capture");
      }

      // Create the image
      const dataUrl = await toPng(element, { 
        quality: 0.95,
        backgroundColor: '#1a1a1a', // Match your site background
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.download = `${buildName.replace(/\s+/g, '-')}-mhwilds.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error capturing build:', error);
      alert('Failed to capture the build. Please try again.');
    } finally {
      setIsCapturing(false);
    }
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