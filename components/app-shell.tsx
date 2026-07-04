"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { HelpCircle, KeyRound, LogOut, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const mustChangePassword = currentUser.must_change_password;
  const isPasswordPage = pathname === "/account/password";
  const shouldBlockContent = mustChangePassword && !isPasswordPage;
  const visibleNavigationItems = mustChangePassword
    ? []
    : navigationItems.filter((item) => canViewModule(currentUser, item.module));
  const visibleTeamItems = mustChangePassword
    ? []
    : teamItems.filter(
        (item) => !("module" in item) || canViewModule(currentUser, item.module)
      );

  useEffect(() => {
    if (shouldBlockContent) {
      router.replace("/account/password");
    }
  }, [router, shouldBlockContent]);

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
        <div className="relative flex h-16 items-center justify-center border-b border-slate-200 px-4">
          <Link
            className="flex min-w-0 flex-1 items-center justify-center px-8"
            href={mustChangePassword ? "/account/password" : "/dashboard"}
            onClick={() => setIsOpen(false)}
          >
            <BrandLogo className="max-h-14 w-[190px]" priority />
          </Link>
          <button
            aria-label="Close navigation"
            className="absolute right-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {mustChangePassword ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-800">
              Change your temporary password to unlock the app.
            </div>
          ) : (
            <>
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
            </>
          )}
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
              {currentUser.secondary_role
                ? ` + ${labelForRole(currentUser.secondary_role)}`
                : ""}
            </p>
          </div>
          {mustChangePassword ? null : (
            <Link
              className={[
                "mb-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50",
                pathname === "/help" ? "text-brand-700" : "text-slate-700"
              ].join(" ")}
              href="/help"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help
            </Link>
          )}
          <Link
            className={[
              "mb-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50",
              pathname === "/account/password"
                ? "text-brand-700"
                : "text-slate-700"
            ].join(" ")}
            href="/account/password"
            onClick={() => setIsOpen(false)}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Change Password
          </Link>
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
        <header className="sticky top-0 z-30 grid h-16 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            aria-label="Open navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 shadow-sm"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 justify-center">
            <BrandLogo className="max-h-12 w-[170px]" priority />
          </div>
          <div aria-hidden="true" />
        </header>

        <main className="min-h-screen min-w-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {shouldBlockContent ? (
              <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                Please change your temporary password before continuing.
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      </div>
    </CurrentUserProvider>
  );
}
