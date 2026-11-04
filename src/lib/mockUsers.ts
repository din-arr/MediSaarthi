export type AppRole = "CUSTOMER" | "PHARMACIST" | "STORE_STAFF" | "OPS";

export type MockUser = {
  id: string;
  phone: string;
  role: AppRole;
  name: string;
};

export const mockUsers: MockUser[] = [
  { id: "demo-customer", phone: "9000000001", role: "CUSTOMER", name: "Demo customer" },
  { id: "demo-pharmacist", phone: "9000000002", role: "PHARMACIST", name: "Demo pharmacist" },
];
