"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/lib/notifications/types";

type NotificationBellProps = {
  latest: Notification[];
  unreadCount: number;
};

export function NotificationBell({
  latest,
  unreadCount
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);
  const unreadNotifications = latest
    .filter((notification) => !notification.is_read)
    .slice(0, 5);
  const unreadOrLatest =
    unreadNotifications.length > 0 ? unreadNotifications : latest.slice(0, 5);

  return (
    <div className="relative">
      <button
        aria-label="Open notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Notifications
              </p>
              <p className="text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>
            <Link
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              href="/notifications"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
          <NotificationList compact notifications={unreadOrLatest} />
        </div>
      ) : null}
    </div>
  );
}
