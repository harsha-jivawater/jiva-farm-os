"use client";

import { Search, X } from "lucide-react";
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
  name: string;
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
  label,
  name,
  notifyFilterChange = false,
  placeholder,
  required = false,
  users
}: UserSearchSelectProps) {
  const selectedUser = users.find((user) => user.id === defaultValue);
  const [selectedValue, setSelectedValue] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(selectedUser ? userLabel(selectedUser) : "");
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const nextUser = users.find((user) => user.id === defaultValue);
    setSelectedValue(defaultValue ?? "");
    setQuery(nextUser ? userLabel(nextUser) : "");
  }, [defaultValue, users]);

  useEffect(() => {
    if (!notifyFilterChange) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    hiddenInputRef.current?.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }, [notifyFilterChange, selectedValue]);
  const trimmedQuery = query.trim().toLowerCase();
  const matchingUsers = useMemo(() => {
    if (!trimmedQuery || selectedValue) {
      return [];
    }

    return users
      .filter((user) =>
        [
          user.full_name,
          user.email,
          user.role,
          user.secondary_role ?? ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(trimmedQuery)
      )
      .slice(0, 8);
  }, [selectedValue, trimmedQuery, users]);
  const currentUser = users.find((user) => user.id === selectedValue);

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
