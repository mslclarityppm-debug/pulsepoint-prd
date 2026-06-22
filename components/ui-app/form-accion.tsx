"use client";
// Wrapper de <form> que ejecuta una acción con FormData y propaga el estado
// `pending` a los descendientes mediante PendingContext.
import { ReactNode } from "react";

import { PendingContext } from "@/lib/use-accion";

export function FormAccion({
  ejecutar,
  pending,
  children,
  className,
  formRef,
  onSubmitExtra,
}: {
  ejecutar: (fd: FormData) => void;
  pending: boolean;
  children: ReactNode;
  className?: string;
  formRef?: React.Ref<HTMLFormElement>;
  onSubmitExtra?: (fd: FormData) => void;
}) {
  return (
    <PendingContext.Provider value={pending}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSubmitExtra?.(fd);
          ejecutar(fd);
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}
