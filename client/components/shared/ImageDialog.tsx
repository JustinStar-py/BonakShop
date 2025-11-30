"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageDialog({ imageUrl, onClose }: ImageDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-sm w-full flex justify-center outline-none">
        <div className="relative bg-white p-2 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
          <img
            src={imageUrl}
            alt="Product"
            className="w-full h-auto rounded-2xl object-contain max-h-[60vh]"
          />
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
