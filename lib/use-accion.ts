"use client";
// Hook utilitario que emula `useFormState` y `useFormStatus` para React 18.2
// (Next.js 14). Funciona con Server Actions invocadas via FormData.
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
} from "react";

export type AccionFn<S> = (prev: S, fd: FormData) => Promise<S>;

export function useAccion<S>(
  action: AccionFn<S>,
  initial: S,
): [S, (fd: FormData) => void, boolean] {
  const [estado, setEstado] = useState<S>(initial);
  const [pending, startTransition] = useTransition();

  const ejecutar = useCallback(
    (fd: FormData) => {
      startTransition(async () => {
        const next = await action(estado, fd);
        if (next !== undefined) setEstado(next);
      });
    },
    [action, estado],
  );

  return [estado, ejecutar, pending];
}

// Contexto para exponer estado de pending al botón hijo.
export const PendingContext = createContext<boolean>(false);
export function usePending(): boolean {
  return useContext(PendingContext);
}
