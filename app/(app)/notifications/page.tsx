import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/(app)/notifications/actions";
import { NotificationList } from "@/components/notifications/notification-list";
import { PageHeader } from "@/components/page-header";
import { getNotificationsForUser } from "@/lib/notifications/queries";
import type {
  Notification,
  NotificationFilter
} from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

type NotificationsPageProps = {
  searchParams: Promise<{
    error?: string;
    filter?: string;
  }>;
};

const filters: Array<{ label: string; value: NotificationFilter }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Assigned to me", value: "assigned" },
  { label: "Mentions", value: "mentions" },
  { label: "Due today", value: "due-today" },
  { label: "Overdue", value: "overdue" }
];

function readFilter(value: string | undefined): NotificationFilter {
  return filters.some((filter) => filter.value === value)
    ? (value as NotificationFilter)
    : "all";
}

export default async function NotificationsPage({
  searchParams
}: NotificationsPageProps) {
  const params = await searchParams;
  const filter = readFilter(params.filter);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/notifications");
  let loadError = params.error ?? "";
  let notifications: Notification[] = [];

  try {
    notifications = await getNotificationsForUser({
      filter,
      supabase,
      userId: currentUser.id
    });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load notifications. Please contact Admin.";
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Action Center"
          title="Notifications"
          description="Assignments, mentions, reminders, and workflow updates."
        />
        <form action={markAllNotificationsReadAction}>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            type="submit"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </button>
        </form>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {loadError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((option) => (
          <Link
            className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
              option.value === filter
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            href={
              option.value === "all"
                ? "/notifications"
                : `/notifications?filter=${option.value}`
            }
            key={option.value}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <NotificationList notifications={notifications} />
      </div>
    </section>
  );
}
