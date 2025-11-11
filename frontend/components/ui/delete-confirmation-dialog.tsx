"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar Eliminación",
  description,
  itemName,
  itemType,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
}: DeleteConfirmationDialogProps) {
  // Generate default description if not provided
  const getDescription = () => {
    if (description) return description;
    if (itemName) {
      return (
        <>
          ¿Estás seguro de que deseas eliminar{" "}
          {itemType ? `al ${itemType} ` : ""}
          <strong className="text-foreground">{itemName}</strong>? Esta acción
          no se puede deshacer.
        </>
      );
    }
    return "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground hover:bg-ui-surface-elevated"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
