import type { Role } from "./session";

/** Which staff roles may open which staff screens. Customers can't open any of them. */
export const staffAccess: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/pharmacist/queue", roles: ["PHARMACIST"] },
  { prefix: "/pharmacist/orders", roles: ["PHARMACIST"] },
  { prefix: "/pharmacist/store", roles: ["STORE_STAFF", "PHARMACIST", "OPS"] },
  { prefix: "/pharmacist/dashboard", roles: ["OPS", "PHARMACIST"] },
];

export function canOpen(role: Role, path: string) {
  if (!path.startsWith("/pharmacist")) return role === "CUSTOMER";
  const rule = staffAccess.find((entry) => path.startsWith(entry.prefix));
  return rule ? rule.roles.includes(role) : role !== "CUSTOMER";
}
