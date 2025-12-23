"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CartChange } from "@/hooks/useCartValidator";
import { DangerTriangleLinear } from "@solar-icons/react-perf";

interface CartValidationModalProps {
  changes: CartChange[];
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CartValidationModal({ changes, open, onConfirm, onCancel }: CartValidationModalProps) {
  if (!open) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md" dir="rtl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <DangerTriangleLinear size={20} className="text-orange-500" />
            <AlertDialogTitle>تغییرات در سبد خرید</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-600">
            متأسفانه برخی از اقلام موجود در سبد خرید شما دچار تغییر شده‌اند:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto">
          {changes.map((change, index) => (
            <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
              <p className="font-medium text-slate-900">{change.productName || "محصول نامشخص"}</p>
              <p className="text-slate-500 mt-1 text-xs leading-relaxed">{change.message}</p>
            </div>
          ))}
        </div>

      <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-0">
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          اعمال تغییرات و ادامه
        </AlertDialogAction>
        <AlertDialogCancel onClick={onCancel} className="flex-1">
          انصراف
        </AlertDialogCancel>
      </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
