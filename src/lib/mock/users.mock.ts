import { ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS, type User } from "@/shared/types/user.types";

// TODO: replace with a real fetch (GET /api/users) once that route exists.
export const users: User[] = [
  {
    id: "u1",
    firstName: "Nadeesha",
    lastName: "Perera",
    email: "nadeesha.perera@tendercms.lk",
    address: "No. 24, Galle Road, Colombo 03",
    monthlyTarget: 250_000,
    role: "Staff",
    permissions: { ...DEFAULT_PERMISSIONS },
    status: "Active",
  },
  {
    id: "u2",
    firstName: "Kasun",
    lastName: "Fernando",
    email: "kasun.fernando@tendercms.lk",
    address: "No. 112, Kandy Road, Kadawatha",
    monthlyTarget: 225_000,
    role: "Staff",
    permissions: { ...DEFAULT_PERMISSIONS, canApproveExpenses: false },
    status: "Blocked",
  },
  {
    id: "u3",
    firstName: "Ishara",
    lastName: "Wickramasinghe",
    email: "ishara.w@tendercms.lk",
    address: "No. 8, Negombo Road, Wattala",
    monthlyTarget: 200_000,
    role: "Staff",
    permissions: { ...DEFAULT_PERMISSIONS, canViewPriceSchedules: false, canApproveExpenses: false },
    status: "Active",
  },
  {
    id: "u4",
    firstName: "Chamara",
    lastName: "Silva",
    email: "chamara.silva@tendercms.lk",
    address: "No. 45, Independence Avenue, Colombo 07",
    monthlyTarget: 0,
    role: "Admin",
    permissions: { ...ADMIN_PERMISSIONS },
    status: "Active",
  },
];
