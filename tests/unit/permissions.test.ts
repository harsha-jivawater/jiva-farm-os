import { describe, expect, it } from "vitest";
import {
  canConfirmPayment,
  canCreateTechnicalReport,
  canManageDispatch,
  canManageInstitutionProfile,
  canViewModule,
  canWriteModule,
  getEffectiveRoles,
  hasReadOnlyRole,
  type ModuleKey,
  type UserRole
} from "@/lib/users/permissions";

type TestUser = {
  can_confirm_payment: boolean;
  can_manage_dispatch: boolean;
  role: UserRole;
  secondary_role: UserRole | null;
};

function user(
  role: UserRole,
  secondaryRole: UserRole | null = null,
  flags: Partial<Pick<TestUser, "can_confirm_payment" | "can_manage_dispatch">> = {}
): TestUser {
  return {
    can_confirm_payment: false,
    can_manage_dispatch: false,
    role,
    secondary_role: secondaryRole,
    ...flags
  };
}

describe("role permissions", () => {
  it("combines primary and secondary roles without duplicates", () => {
    expect(getEffectiveRoles(user("Salesperson", "Agronomist"))).toEqual([
      "Salesperson",
      "Agronomist"
    ]);
    expect(getEffectiveRoles(user("RSM", "RSM"))).toEqual(["RSM"]);
    expect(getEffectiveRoles(null)).toEqual(["Viewer"]);
  });

  it.each<
    [UserRole, ModuleKey, boolean, boolean]
  >([
    ["Salesperson", "farmer-leads", true, true],
    ["Salesperson", "payment-links", true, false],
    ["Salesperson", "pilots", true, false],
    ["Research Assistant", "pilots", true, true],
    ["Research Assistant", "institutional-partners", false, false],
    ["Agronomist", "institutional-partners", true, true],
    ["Agronomist", "dispatches", true, false],
    ["Accounts", "dispatches", true, true],
    ["Viewer", "kpi-dashboard", true, false],
    ["Viewer", "internal-users", false, false]
  ])(
    "%s has the intended %s access",
    (role, module, expectedView, expectedWrite) => {
      const currentUser = user(role);
      expect(canViewModule(currentUser, module)).toBe(expectedView);
      expect(canWriteModule(currentUser, module)).toBe(expectedWrite);
    }
  );

  it("grants the additive access of a secondary role", () => {
    const salespersonAgronomist = user("Salesperson", "Agronomist");

    expect(canViewModule(salespersonAgronomist, "payment-links")).toBe(true);
    expect(canWriteModule(salespersonAgronomist, "pilots")).toBe(true);
    expect(canCreateTechnicalReport(salespersonAgronomist)).toBe(true);
  });

  it("keeps payment confirmation with Accounts and Admin", () => {
    expect(canConfirmPayment(user("Accounts"))).toBe(true);
    expect(canConfirmPayment(user("Admin"))).toBe(true);
    expect(
      canConfirmPayment(user("Salesperson", null, { can_confirm_payment: true }))
    ).toBe(false);
  });

  it("allows explicit dispatch managers while protecting institution management", () => {
    expect(
      canManageDispatch(user("Salesperson", null, { can_manage_dispatch: true }))
    ).toBe(true);
    expect(canManageDispatch(user("Stock / Dispatch"))).toBe(true);
    expect(canManageInstitutionProfile(user("Agronomist"))).toBe(true);
    expect(canManageInstitutionProfile(user("Research Assistant"))).toBe(false);
  });

  it("treats Viewer and Management as read-only roles", () => {
    expect(hasReadOnlyRole(user("Viewer"))).toBe(true);
    expect(hasReadOnlyRole(user("Management"))).toBe(true);
    expect(hasReadOnlyRole(user("RSM"))).toBe(false);
  });
});
