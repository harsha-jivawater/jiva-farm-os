"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Leaf, LogOut, Menu, X } from "lucide-react";
import { navigationItems, teamItems } from "@/lib/navigation";
import { CurrentUserProvider, type CurrentInternalUser } from "@/components/auth/current-user-context";
import { canViewModule } from "@/lib/users/permissions";
import { labelForRole } from "@/lib/users/options";

type AppShellProps = {
  children: ReactNode;
  currentUser: CurrentInternalUser;
  signOutAction: () => Promise<void>;
};

export function AppShell({
  children,
  currentUser,
  signOutAction
}: AppShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const visibleNavigationItems = navigationItems.filter((item) =>
    canViewModule(currentUser, item.module)
  );
  const visibleTeamItems = teamItems.filter(
    (item) => !("module" in item) || canViewModule(currentUser, item.module)
  );

  return (
    <CurrentUserProvider user={currentUser}>
      <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {isOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link
            className="flex min-w-0 items-center gap-3"
            href="/dashboard"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">
                Jiva Farm
              </span>
              <span className="block truncate text-xs text-slate-500">
                Devices OS
              </span>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div>
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Operations
            </p>
            <div className="mt-2 space-y-1">
              {visibleNavigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    className={[
                      "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      "gapAfter" in item && item.gapAfter ? "mb-3" : ""
                    ].join(" ")}
                    href={item.href}
                    key={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Network
            </p>
            <div className="mt-2 space-y-1">
              {visibleTeamItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    className={[
                      "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    ].join(" ")}
                    href={item.href}
                    key={item.label}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-3 rounded-md bg-slate-50 px-3 py-2">
            <p className="truncate text-xs font-medium text-slate-500">
              Signed in as
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentUser.email}
            </p>
            <p className="truncate text-xs text-slate-500">
              {labelForRole(currentUser.role)}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              type="submit"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            aria-label="Open navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 shadow-sm"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-slate-950">
              Jiva Farm
            </p>
            <p className="truncate text-xs text-slate-500">Devices OS</p>
          </div>
        </header>

        <main className="min-h-screen min-w-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      </div>
    </CurrentUserProvider>
  );
}
