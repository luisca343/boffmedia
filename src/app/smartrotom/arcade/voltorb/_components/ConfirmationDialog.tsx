import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  cancelText: string
  variant: 'quit' | 'new'
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant
}: ConfirmationDialogProps) {
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('animate-appear')
    } else {
      setAnimationClass('')
    }
  }, [isOpen])

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={`bg-main-900 border-4 ${variant === 'quit' ? 'border-red-500' : 'border-yellow-500'} rounded-lg p-0 max-w-md w-full ${animationClass}`}>
        <div className="pixel-corners p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-center mb-6 text-white">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-center text-main-300">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col space-y-4 mt-8">
            <div className="grid grid-cols-2 gap-6 w-full">
              <AlertDialogAction
                onClick={onConfirm}
                className={`py-3 px-6 rounded-lg font-bold text-white ${
                  variant === 'quit' 
                    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' 
                    : 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700'
                } transition-colors duration-200 pixel-corners`}
              >
                {confirmText}
              </AlertDialogAction>
              <AlertDialogCancel 
                onClick={onClose}
                className="py-3 px-6 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200 pixel-corners"
              >
                {cancelText}
              </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}