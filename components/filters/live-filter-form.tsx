"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

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

function isNamedHiddenInput(element: EventTarget | null) {
  return (
    element instanceof HTMLInputElement &&
    element.type === "hidden" &&
    Boolean(element.name)
  );
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

function clearDependentFields(element: EventTarget | null, form: HTMLFormElement) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const fieldNames = element.dataset.clearFields
    ?.split(",")
    .map((fieldName) => fieldName.trim())
    .filter(Boolean);

  if (!fieldNames?.length) {
    return;
  }

  for (const fieldName of fieldNames) {
    const field = form.elements.namedItem(fieldName);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ) {
      field.value = "";
    }
  }
}

export function LiveFilterForm({
  action,
  children,
  className,
  debounceMs = 400
}: LiveFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formKey = searchParams.toString();

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <form
      action={action}
      className={className}
      key={formKey}
      method="get"
      onChange={(event) => {
        if (isNamedHiddenInput(event.target)) {
          return;
        }

        if (!isNamedFormControl(event.target)) {
          return;
        }

        clearDependentFields(event.target, event.currentTarget);
        scheduleUpdate(event.currentTarget, shouldDebounce(event.target));
      }}
      onInput={(event) => {
        if (!isNamedHiddenInput(event.target)) {
          return;
        }

        scheduleUpdate(event.currentTarget, false);
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
