import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { ReactNode } from "react";
  
  interface InstructionsModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }
  
  export default function InstructionsModal({
    title,
    isOpen,
    onClose,
    children,
  }: InstructionsModalProps) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-indigo-900/95 border-2 border-indigo-700/50 text-white font-mono max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-yellow-300">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-gray-200">
            {children}
          </div>
          <DialogFooter>
            <Button 
              onClick={onClose}
              className="bg-indigo-700 hover:bg-indigo-600 text-white"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }