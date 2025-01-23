import * as React from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  lifetime?: number;
  onDismiss?: () => void;
};

type ToastState = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
};

const useToastStore = React.createContext<ToastState | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      if (toast.lifetime) {
        setTimeout(() => {
          removeToast(id);
          toast.onDismiss?.();
        }, toast.lifetime);
      }
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <use-ToastStore.Provider value = {{ toasts, addToast, removeToast }
}>
  { children }
  </use-ToastStore.Provider>
  );
}

export function useToast() {
  const context = React.useContext(useToastStore);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}