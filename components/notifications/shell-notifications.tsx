import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NotificationSummary } from "@/lib/notifications/types";

export async function ShellNotifications({ summary, compact = false }: {
  summary: Promise<NotificationSummary | null>;
  compact?: boolean;
}) {
  const result = await summary;
  if (!result) {
    return compact ? (
      <Link href="/notifications" aria-label="Open notifications (summary unavailable)">
        <Bell className="h-5 w-5" aria-hidden="true" />
      </Link>
    ) : <span className="text-xs text-slate-500">Notifications unavailable · Open Action Center</span>;
  }
  const bell = <NotificationBell latest={result.latest} unreadCount={result.unreadCount} />;
  if (compact) return bell;
  return <>
    <div>
      <p className="text-xs font-medium text-slate-500">Action Center</p>
      <p className="text-sm font-semibold text-slate-900">{result.unreadCount} unread</p>
    </div>
    <div data-action-center-bell>{bell}</div>
  </>;
}
