"use client";
import { LogOut, PackageCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import { staffAccess } from "../../lib/access";
import type { Role } from "../../lib/session";

const roleLabel: Record<string, string> = { PHARMACIST: "Pharmacist", STORE_STAFF: "Store", OPS: "Operations" };

export default function PharmacistHeader({ name, regNo, role }: { name?: string; regNo?: string | null; role?: Role }) {
  const router = useRouter();
  const path = usePathname();
  const links = [{ href: "/pharmacist/queue", label: "Queue" }, { href: "/pharmacist/store", label: "Store orders" }, { href: "/pharmacist/dashboard", label: "Dashboard" }]
    .filter((link) => !role || staffAccess.find((rule) => link.href.startsWith(rule.prefix))?.roles.includes(role));
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };
  return (
    <header className="customer-topbar">
      <div className="app-shell">
        <Link className="logo" href={links[0]?.href ?? "/"}>
          <span className="logo-mark"><PackageCheck size={18} /></span>
          <span>Medi<span className="logo-accent">Saarthi</span></span>
          <span className="role-badge">{roleLabel[role ?? "PHARMACIST"] ?? "Staff"}</span>
        </Link>
        <nav className="ph-nav">{links.map((link) => <Link key={link.href} href={link.href} className={path.startsWith(link.href) ? "on" : ""}>{link.label}</Link>)}</nav>
        <div className="customer-actions">
          {name && <span className="ph-who">{name}{regNo ? ` · ${regNo}` : ""}</span>}
          <ThemeToggle />
          <button className="icon-button" type="button" aria-label="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );
}

export function ScheduleBadge({ schedule }: { schedule: string }) {
  const label = schedule === "OTC" ? "OTC" : `Schedule ${schedule}`;
  return <span className={`schedule-badge schedule-${schedule}`}>{label}</span>;
}
