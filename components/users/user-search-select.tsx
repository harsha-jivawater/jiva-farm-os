"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { labelForRole } from "@/lib/users/options";

export type UserSearchOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  secondary_role?: string | null;
};

type UserSearchSelectProps = {
  defaultValue?: string | null;
  label: string;
  mode?: "search" | "filter";
  name: string;
  emptyLabel?: string;
  placeholder: string;
  notifyFilterChange?: boolean;
  required?: boolean;
  users: UserSearchOption[];
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function userLabel(user: UserSearchOption) {
  return `${user.full_name} · ${user.email}`;
}

export function UserSearchSelect({
  defaultValue,
  emptyLabel,
  label,
  mode = "search",
  name,
  notifyFilterChange = false,
  placeholder,
  required = false,
  users
}: UserSearchSelectProps) {
  const selectedUser = users.find((user) => user.id === defaultValue);
  const [selectedValue, setSelectedValue] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(selectedUser ? userLabel(selectedUser) : "");
  const [isOpen, setIsOpen] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const isFilterMode = mode === "filter";

  useEffect(() => {
    const nextUser = users.find((user) => user.id === defaultValue);
    setSelectedValue(defaultValue ?? "");
    setQuery(isFilterMode ? "" : nextUser ? userLabel(nextUser) : "");
    setIsOpen(false);
  }, [defaultValue, isFilterMode, users]);

  useEffect(() => {
    if (!isFilterMode || !isOpen) {
      return;
    }

    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, [isFilterMode, isOpen]);

  useEffect(() => {
    if (!isFilterMode) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isFilterMode]);

  useEffect(() => {
    if (!notifyFilterChange) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    hiddenInputRef.current?.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    hiddenInputRef.current?.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }, [notifyFilterChange, selectedValue]);
  const trimmedQuery = query.trim().toLowerCase();
  const matchingUsers = useMemo(() => {
    if (!isFilterMode && (!trimmedQuery || selectedValue)) {
      return [];
    }

    return users
      .filter((user) =>
        trimmedQuery
          ? [
              user.full_name,
              user.email,
              user.role,
              user.secondary_role ?? ""
            ]
              .join(" ")
              .toLowerCase()
              .includes(trimmedQuery)
          : true
      )
      .slice(0, isFilterMode ? 20 : 8);
  }, [isFilterMode, selectedValue, trimmedQuery, users]);
  const currentUser = users.find((user) => user.id === selectedValue);

  if (isFilterMode) {
    return (
      <div ref={containerRef}>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor={`${name}_trigger`}
        >
          {label}
        </label>
        <input
          name={name}
          ref={hiddenInputRef}
          type="hidden"
          value={selectedValue}
        />
        <div className="relative">
          <button
            aria-expanded={isOpen}
            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 pr-16 text-left text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            id={`${name}_trigger`}
            onClick={() => {
              setIsOpen((value) => !value);
              setQuery("");
            }}
            type="button"
          >
            <span
              className={currentUser ? "truncate" : "truncate text-slate-500"}
            >
              {currentUser
                ? userLabel(currentUser)
                : (emptyLabel ?? placeholder)}
            </span>
            <ChevronDown
              className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {selectedValue ? (
            <button
              aria-label={`Clear ${label}`}
              className="absolute right-8 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                setQuery("");
                setSelectedValue("");
                setIsOpen(false);
              }}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}

          {isOpen ? (
            <div className="absolute z-20 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  aria-autocomplete="list"
                  className={`${inputClassName()} pl-9`}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                  ref={searchInputRef}
                  type="search"
                  value={query}
                />
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto">
                {matchingUsers.length ? (
                  matchingUsers.map((user) => (
                    <button
                      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                      key={user.id}
                      onClick={() => {
                        setSelectedValue(user.id);
                        setQuery("");
                        setIsOpen(false);
                      }}
                      type="button"
                    >
                      <span className="block font-semibold text-slate-900">
                        {user.full_name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {user.email} · {labelForRole(user.role)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    No matching users found.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor={`${name}_search`}
      >
        {label}
      </label>
      <input
        name={name}
        ref={hiddenInputRef}
        type="hidden"
        value={selectedValue}
      />
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-autocomplete="list"
          className={`${inputClassName()} pl-9 pr-10`}
          id={`${name}_search`}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedValue("");
          }}
          placeholder={placeholder}
          required={required && !selectedValue}
          type="search"
          value={query}
        />
        {query || selectedValue ? (
          <button
            aria-label={`Clear ${label}`}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              setQuery("");
              setSelectedValue("");
            }}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {matchingUsers.length ? (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
          {matchingUsers.map((user) => (
            <button
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
              key={user.id}
              onClick={() => {
                setSelectedValue(user.id);
                setQuery(userLabel(user));
              }}
              type="button"
            >
              <span className="block font-semibold text-slate-900">
                {user.full_name}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {user.email} · {labelForRole(user.role)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {currentUser ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Selected: {currentUser.full_name} · {currentUser.email}
        </p>
      ) : null}
    </div>
  );
}
