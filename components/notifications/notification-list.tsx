import {
  markNotificationReadAction,
  markNotificationUnreadAction,
  openNotificationAction
} from "@/app/(app)/notifications/actions";
import { formatDisplayDateTime } from "@/lib/date-utils";
import type { Notification } from "@/lib/notifications/types";

type NotificationListProps = {
  compact?: boolean;
  notifications: Notification[];
};

function toneClassName(notification: Notification) {
  if (!notification.is_read) {
    return "border-brand-200 bg-brand-50";
  }

  return "border-slate-200 bg-white";
}

export function NotificationList({
  compact = false,
  notifications
}: NotificationListProps) {
  if (!notifications.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        You have no notifications.
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {notifications.map((notification) => {
        const openAction = openNotificationAction.bind(null, notification.id);
        const readAction = markNotificationReadAction.bind(
          null,
          notification.id,
          "/notifications"
        );
        const unreadAction = markNotificationUnreadAction.bind(
          null,
          notification.id
        );

        return (
          <article
            className={`rounded-lg border p-3 shadow-sm ${toneClassName(
              notification
            )}`}
            key={notification.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">
                    {notification.title}
                  </p>
                  {!notification.is_read ? (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Unread
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {notification.category}
                  </span>
                </div>
                {notification.message ? (
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {notification.message}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {formatDisplayDateTime(notification.created_at)}
                  {notification.record_code ? ` · ${notification.record_code}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={openAction}>
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                  type="submit"
                >
                  Open
                </button>
              </form>
              {notification.is_read ? (
                <form action={unreadAction}>
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    type="submit"
                  >
                    Mark unread
                  </button>
                </form>
              ) : (
                <form action={readAction}>
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    type="submit"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

