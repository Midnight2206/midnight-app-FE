import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

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

const ConfirmDialogContext = createContext(null);

const DEFAULT_OPTIONS = {
  title: "Xác nhận thao tác",
  description: "Bạn có chắc chắn muốn tiếp tục?",
  confirmText: "Xác nhận",
  cancelText: "Hủy",
  variant: "default",
};

export function ConfirmDialogProvider({ children }) {
  const resolverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const closeWithValue = useCallback((value) => {
    setOpen(false);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    if (resolver) resolver(value);
  }, []);

  const confirm = useCallback((incomingOptions = {}) => {
    setOptions({
      ...DEFAULT_OPTIONS,
      ...incomingOptions,
    });
    setOpen(true);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}

      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeWithValue(false);
            return;
          }
          setOpen(true);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeWithValue(false)}>
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options.variant}
              onClick={() => closeWithValue(true)}
            >
              {options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return ctx;
}

