"use client";
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/primitives/button';
import {
  ImageIcon,
  XIcon,
  CloudUploadIcon,
  TriangleAlertIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
  previewClassName?: string;
  disabled?: boolean;
  multiple?: boolean;
  value?: string | File | null;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
  previewClassName,
  disabled = false,
  multiple = false,
  value,
  placeholder = "Arrastra una imagen aquí o haz clic para seleccionar"
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL from value prop
  React.useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        setPreview(value);
      } else if (value instanceof File) {
        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Se aceptan: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeInMB) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeInMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxSizeInMB]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    // Simulate upload delay (remove in production)
    setTimeout(() => {
      if (onImageSelect) {
        onImageSelect(file);
      }
      
      const url = URL.createObjectURL(file);
      setPreview(url);
      setIsUploading(false);
    }, 1000);
  }, [validateFile, onImageSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleRemove = useCallback(() => {
    if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemove) {
      onImageRemove();
    }
  }, [preview, onImageRemove]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview Section */}
      {preview && (
        <div className={cn(
          "relative mb-4 rounded-lg border-2 border-blue-200 overflow-hidden bg-white",
          previewClassName
        )}>
          <div className="aspect-video w-full relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay with remove button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group">
              <Button
                variant="error"
                size="sm"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                disabled={disabled}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!preview && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
            dragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-blue-300 hover:border-blue-400 hover:bg-blue-50",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50 border-gray-300",
            error && "border-red-300 bg-red-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm text-blue-600 font-medium">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  {error ? (
                    <TriangleAlertIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <CloudUploadIcon className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <span className="font-semibold text-blue-600 hover:text-blue-500">
                    Seleccionar archivo
                  </span>
                  <p className="pl-1">o arrastra y suelta</p>
                </div>
                
                <p className="text-xs leading-5 text-gray-500 mt-2">
                  {placeholder}
                </p>
                
                <p className="text-xs text-gray-400 mt-1">
                  {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} hasta {maxSizeInMB}MB
                </p>
              </>
            )}
          </div>

          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 shadow-lg border border-blue-200">
                <ImageIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-800">Suelta la imagen aquí</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <TriangleAlertIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!error && !preview && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Formatos soportados: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}</p>
          <p>Tamaño máximo: {maxSizeInMB}MB</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;