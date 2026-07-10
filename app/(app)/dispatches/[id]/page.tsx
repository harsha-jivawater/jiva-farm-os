import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil } from "lucide-react";
import { confirmDealerDispatchPaymentAction } from "@/app/(app)/dispatches/actions";
import { DispatchStatusPill } from "@/components/dispatches/dispatch-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  destinationTypeOptions,
  dispatchTypeOptions,
  labelFor,
  paymentRequirementOptions
} from "@/lib/dispatches/options";
import {
  display,
  formatDate,
  formatDispatchLocation,
  type Dispatch
} from "@/lib/dispatches/types";
import { productModelOptions } from "@/lib/devices/options";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canConfirmPayment, canWriteModule } from "@/lib/users/permissions";
import { dispatchScope } from "@/lib/users/record-scope";

type DispatchDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function DetailItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function HandoffItem({
  children,
  label,
  value,
  helper,
  href,
  linkLabel
}: {
  children?: React.ReactNode;
  helper?: React.ReactNode;
  href?: string;
  label: string;
  linkLabel?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 break-words text-base font-semibold leading-6 text-slate-950">
        {value}
      </div>
      {children ? <div className="mt-1 text-sm text-slate-600">{children}</div> : null}
      {helper ? <p className="mt-1 text-sm text-slate-600">{helper}</p> : null}
      {href ? (
        <Link
          className="mt-3 inline-flex font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          href={href}
        >
          {linkLabel ?? "Open"}
        </Link>
      ) : null}
    </div>
  );
}

function dispatchRoute(dispatch: Dispatch) {
  if (
    dispatch.dispatch_type === "Farmer Sale Dispatch" ||
    dispatch.linked_farmer_lead_id ||
    dispatch.destination_farmer_lead_id
  ) {
    return "Paid Farmer Sale";
  }

  if (
    dispatch.dispatch_type === "Pilot Dispatch" ||
    dispatch.linked_pilot_id ||
    dispatch.destination_pilot_id
  ) {
    return "Free Pilot";
  }

  if (
    dispatch.dispatch_type === "Dealer Stock Dispatch" ||
    dispatch.linked_dealer_id ||
    dispatch.destination_dealer_id
  ) {
    return "Dealer Dispatch";
  }

  return "Manual admin exception";
}

function dispatchDevicePool(dispatch: Dispatch) {
  const route = dispatchRoute(dispatch);

  if (route === "Paid Farmer Sale") {
    return "Fresh Sale";
  }

  if (route === "Free Pilot") {
    return "Pilot Stock";
  }

  if (route === "Dealer Dispatch") {
    return "Fresh Sale";
  }

  return "Selected device pool";
}

function dispatchSourceLink(dispatch: Dispatch) {
  const farmerLeadId =
    dispatch.linked_farmer_lead_id ?? dispatch.destination_farmer_lead_id;
  const pilotId = dispatch.linked_pilot_id ?? dispatch.destination_pilot_id;
  const dealerId = dispatch.linked_dealer_id ?? dispatch.destination_dealer_id;

  if (farmerLeadId) {
    return {
      href: `/farmer-leads/${farmerLeadId}`,
      label: "Go to farmer lead",
      value: "Farmer Lead"
    };
  }

  if (pilotId) {
    return {
      href: `/pilots/${pilotId}`,
      label: "Go to pilot",
      value: "Pilot"
    };
  }

  if (dealerId) {
    return {
      href: `/dealers/${dealerId}`,
      label: "Go to dealer",
      value: "Dealer"
    };
  }

  return {
    href: undefined,
    label: undefined,
    value: "Manual / other source"
  };
}

function dispatchHandoff(
  dispatch: Dispatch,
  canCreateInstallation: boolean
) {
  if (dispatchRoute(dispatch) === "Dealer Dispatch") {
    if (!dispatch.payment_confirmed) {
      return {
        currentStage: "Dealer payment pending",
        nextAction:
          "Accounts must confirm dealer payment before this dispatch can be marked Dispatched.",
        nextHref: undefined,
        nextLinkLabel: undefined,
        nextOwner: "Accounts"
      };
    }

    if (["Dispatched", "Delivered"].includes(dispatch.dispatch_status)) {
      return {
        currentStage: "Dealer stock sold and dispatched",
        nextAction:
          "Confirm dealer stock availability. Dealer-to-farmer sale is recorded later through a dealer-linked farmer sale or installation.",
        nextHref: undefined,
        nextLinkLabel: undefined,
        nextOwner: "Stock / Dispatch"
      };
    }

    return {
      currentStage: "Dealer payment confirmed",
      nextAction:
        "Dispatch the Fresh Sale device to the dealer. This is a paid dealer sale, not a farmer sale.",
      nextHref: `/dispatches/${dispatch.id}/edit`,
      nextLinkLabel: "Update dispatch",
      nextOwner: "Stock / Dispatch"
    };
  }

  if (dispatch.dispatch_status === "Installed" || dispatch.linked_installation_id) {
    return {
      currentStage: "Installation linked",
      nextAction: "Continue post-installation follow-up.",
      nextHref: dispatch.linked_installation_id
        ? `/installations/${dispatch.linked_installation_id}`
        : undefined,
      nextLinkLabel: "Go to installation",
      nextOwner: "Sales / service team"
    };
  }

  if (
    ["Dispatched", "Delivered", "Installation Pending"].includes(
      dispatch.dispatch_status
    )
  ) {
    return {
      currentStage: "Device dispatched",
      nextAction: "Create or complete the installation record.",
      nextHref: canCreateInstallation
        ? `/installations/new?dispatch_id=${dispatch.id}`
        : undefined,
      nextLinkLabel: "Go to installation",
      nextOwner: "Installation / field team"
    };
  }

  return {
    currentStage: "Dispatch in progress",
    nextAction: "Assign or dispatch the device and update dispatch status.",
    nextHref: `/dispatches/${dispatch.id}/edit`,
    nextLinkLabel: "Update dispatch",
    nextOwner: "Stock / Dispatch"
  };
}

export default async function DispatchDetailPage({
  params
}: DispatchDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canWrite = canWriteModule(currentUser, "dispatches");
  const canConfirmDealerPayment = canConfirmPayment(currentUser);
  const canCreateInstallation = canWriteModule(currentUser, "installations");
  const scope = await dispatchScope(supabase, currentUser);
  let dispatchQuery = supabase
    .from("dispatches")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dispatchQuery = dispatchQuery.is("id", null);
  }

  if (scope.orFilter) {
    dispatchQuery = dispatchQuery.or(scope.orFilter);
  }

  const { data, error } = await dispatchQuery.single();

  if (error || !data) {
    notFound();
  }

  const dispatch = data as Dispatch;
  const source = dispatchSourceLink(dispatch);
  const handoff = dispatchHandoff(dispatch, canCreateInstallation);
  const isDealerRoute = dispatchRoute(dispatch) === "Dealer Dispatch";
  const showConfirmDealerPayment =
    isDealerRoute && !dispatch.payment_confirmed && canConfirmDealerPayment;
  const confirmDealerPaymentAction =
    confirmDealerDispatchPaymentAction.bind(null, dispatch.id);
  let paymentConfirmedBy = null as
    | { full_name: string; role: string }
    | null;

  if (dispatch.payment_confirmed_by_user_id) {
    const { data: paymentUser } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", dispatch.payment_confirmed_by_user_id)
      .maybeSingle();
    paymentConfirmedBy = paymentUser;
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dispatch"
          title={dispatch.dispatch_code}
          description={`${dispatch.serial_number_snapshot} · ${labelFor(
            dispatch.product_model,
            productModelOptions
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dispatches"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/dispatches/${dispatch.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
          {showConfirmDealerPayment ? (
            <form action={confirmDealerPaymentAction}>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                type="submit"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Confirm dealer payment
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <DispatchStatusPill status={dispatch.dispatch_status} />
      </div>

      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Dispatch handoff
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Route, source, owner, and next step for this dispatch.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HandoffItem
            helper={`Device pool: ${dispatchDevicePool(dispatch)}`}
            label="Route"
            value={dispatchRoute(dispatch)}
          />
          <HandoffItem
            href={source.href}
            label="Source"
            linkLabel={source.label}
            value={source.value}
          />
          <HandoffItem label="Next owner" value={handoff.nextOwner} />
          <HandoffItem
            href={handoff.nextHref}
            label="Next action"
            linkLabel={handoff.nextLinkLabel}
            value={handoff.currentStage}
          >
            {handoff.nextAction}
          </HandoffItem>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Dispatch code" value={dispatch.dispatch_code} />
        <DetailItem
          label="Dispatch type"
          value={labelFor(dispatch.dispatch_type, dispatchTypeOptions)}
        />
        <DetailItem
          label="Dispatch date"
          value={formatDate(dispatch.dispatch_date)}
        />
        <DetailItem
          label="Serial number"
          value={
            <Link
              className="text-brand-700 hover:text-brand-800"
              href={`/devices/${dispatch.device_id}`}
            >
              {dispatch.serial_number_snapshot}
            </Link>
          }
        />
        <DetailItem
          label="Product model"
          value={labelFor(dispatch.product_model, productModelOptions)}
        />
        <DetailItem
          label="Destination type"
          value={labelFor(dispatch.destination_type, destinationTypeOptions)}
        />
        <DetailItem
          label="Destination name"
          value={dispatch.destination_name_snapshot}
        />
        <DetailItem
          label="Destination contact"
          value={display(dispatch.destination_contact_snapshot)}
        />
        <DetailItem
          label="Destination location"
          value={formatDispatchLocation(dispatch)}
        />
        <DetailItem
          label="Payment requirement"
          value={labelFor(
            dispatch.payment_requirement_type,
            paymentRequirementOptions
          )}
        />
        <DetailItem
          label={isDealerRoute ? "Dealer payment" : "Payment confirmed"}
          value={
            dispatch.payment_confirmed
              ? "Payment confirmed"
              : "Pending confirmation"
          }
        />
        <DetailItem
          label="Confirmed by"
          value={
            paymentConfirmedBy
              ? `${paymentConfirmedBy.full_name} · ${labelForRole(
                  paymentConfirmedBy.role
                )}`
              : "Not set"
          }
        />
        <DetailItem
          label="Confirmed on"
          value={formatDate(dispatch.payment_confirmed_date)}
        />
        <DetailItem
          label="Zoho invoice"
          value={display(dispatch.zoho_invoice_reference)}
        />
        <DetailItem
          label="Zoho estimate"
          value={display(dispatch.zoho_estimate_reference)}
        />
        <DetailItem
          label="Transport"
          value={display(dispatch.courier_or_transport_name)}
        />
        <DetailItem
          label="Dispatch reference"
          value={display(dispatch.dispatch_reference_number)}
        />
        <DetailItem
          label="Expected delivery"
          value={formatDate(dispatch.expected_delivery_date)}
        />
        <DetailItem
          label="Delivered date"
          value={formatDate(dispatch.delivered_date)}
        />
        <DetailItem
          label="Delivery confirmed"
          value={dispatch.delivery_confirmed ? "Yes" : "No"}
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Delivery remarks</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {display(dispatch.delivery_remarks)}
        </p>
      </div>
    </section>
  );
}
