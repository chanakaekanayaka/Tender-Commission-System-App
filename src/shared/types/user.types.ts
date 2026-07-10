export type UserRole = "Admin" | "Staff";

export type UserStatus = "Active" | "Blocked";

/** Individual access flags an Admin can restrict on a Staff account. Admin accounts always have every flag enabled — the Permissions section is hidden entirely for them in the form. */
export interface UserPermissions {
  canCreateJobOrders: boolean;
  canViewPriceSchedules: boolean;
  canApproveExpenses: boolean;
  canManageUsers: boolean;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreateJobOrders: true,
  canViewPriceSchedules: true,
  canApproveExpenses: true,
  canManageUsers: false,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  canCreateJobOrders: true,
  canViewPriceSchedules: true,
  canApproveExpenses: true,
  canManageUsers: true,
};

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  monthlyTarget: number;
  role: UserRole;
  permissions: UserPermissions;
  status: UserStatus;
}
