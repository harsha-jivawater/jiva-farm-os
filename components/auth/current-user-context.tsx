"use client";

import { createContext, type ReactNode, useContext } from "react";

export type CurrentInternalUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  secondary_role: string | null;
  region_id: string | null;
  state: string | null;
  reports_to_user_id: string | null;
  can_create_leads: boolean;
  can_own_pilots: boolean;
  can_confirm_payment: boolean;
  can_manage_dispatch: boolean;
  is_active: boolean;
};

const CurrentUserContext = createContext<CurrentInternalUser | null>(null);

export function CurrentUserProvider({
  children,
  user
}: {
  children: ReactNode;
  user: CurrentInternalUser;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentInternalUser() {
  return useContext(CurrentUserContext);
}
