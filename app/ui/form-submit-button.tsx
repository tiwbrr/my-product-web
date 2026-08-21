"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  ariaLabel?: string;
};

export function FormSubmitButton({ children, pendingLabel, className, ariaLabel }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return <button
    type="submit"
    className={className}
    aria-label={ariaLabel}
    aria-busy={pending}
    disabled={pending}
  >{pending ? <><span className="button-spinner" aria-hidden="true" />{pendingLabel}</> : children}</button>;
}
