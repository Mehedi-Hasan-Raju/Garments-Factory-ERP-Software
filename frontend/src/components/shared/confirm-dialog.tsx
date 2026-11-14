"use client";

import { Loader2, AlertTriangle, Trash2 } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: "warning" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  variant = "warning",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-[420px] rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              isDanger
                ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-foreground"
          >
            {title}
          </h2>

          <p
            id="confirm-dialog-description"
            className="mt-2 text-sm leading-6 text-muted-foreground"
          >
            {description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 flex-1 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
