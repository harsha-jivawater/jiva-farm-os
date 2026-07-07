"use client";

import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useRef } from "react";

type LiveFilterFormProps = {
  action?: string;
  children: ReactNode;
  className?: string;
  debounceMs?: number;
};

function shouldDebounce(element: EventTarget | null) {
  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  return ["search", "text", "email", "tel", "url", "number"].includes(
    element.type
  );
}

function isNamedFormControl(element: EventTarget | null) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) && Boolean(element.name);
}

function formSearchParams(form: HTMLFormElement) {
  const params = new URLSearchParams();
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed) {
      params.set(key, trimmed);
    }
  }

  return params;
}

export function LiveFilterForm({
  action,
  children,
  className,
  debounceMs = 400
}: LiveFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUrl = useCallback(
    (form: HTMLFormElement) => {
      const params = formSearchParams(form);
      const query = params.toString();
      const targetPath = action ?? pathname;

      router.replace(query ? `${targetPath}?${query}` : targetPath, {
        scroll: false
      });
    },
    [action, pathname, router]
  );

  const scheduleUpdate = useCallback(
    (form: HTMLFormElement, debounce: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!debounce) {
        updateUrl(form);
        return;
      }

      timeoutRef.current = setTimeout(() => updateUrl(form), debounceMs);
    },
    [debounceMs, updateUrl]
  );

  return (
    <form
      action={action}
      className={className}
      method="get"
      onChange={(event) => {
        if (!isNamedFormControl(event.target)) {
          return;
        }

        scheduleUpdate(event.currentTarget, shouldDebounce(event.target));
      }}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        scheduleUpdate(event.currentTarget, false);
      }}
    >
      {children}
    </form>
  );
}
