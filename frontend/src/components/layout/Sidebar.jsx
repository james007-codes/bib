import React from "react";
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  Bot,
  ListChecks,
  MapPinned,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";

import { COLORS } from "../../styles/tokens.js";
import { Logo } from "../shared/Brand.jsx";
import { initials } from "../../utils/format.js";

/* =========================
   NAVIGATION ITEMS (per role)
========================= */

export const NAV_ITEMS = {
  user: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "report", label: "Report Issue", icon: FilePlus2 },
    { key: "my-complaints", label: "My Complaints", icon: ClipboardList },
    { key: "assistant", label: "Assistant", icon: Bot },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "complaints", label: "Complaints", icon: ListChecks },
    { key: "locations", label: "Locations", icon: MapPinned },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ],
};

/* =========================
   SIDEBAR
========================= */

export function Sidebar({ role, user, page, setPage, mobileOpen, setMobileOpen, onLogout, badges = {} }) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.user;

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          const badge = badges[item.key];

          return (
            <button
              key={item.key}
              onClick={() => {
                setPage(item.key);
                setMobileOpen(false);
              }}
              aria-current={active ? "page" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: active ? COLORS.primarySoft : undefined,
                color: active ? COLORS.primary : COLORS.slate,
                "--tw-ring-color": COLORS.primary,
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span className="flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span className="text-xs font-semibold rounded-full px-1.5 py-0.5 text-white" style={{ backgroundColor: COLORS.critical }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: COLORS.line }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: COLORS.primary }}>
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: COLORS.ink }}>{user?.name}</div>
            <div className="text-xs truncate" style={{ color: COLORS.slate }}>
              {role === "admin" ? "Maintenance admin" : "Student / Faculty"}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          style={{ color: COLORS.slate }}
        >
          <LogOut style={{ width: 18, height: 18 }} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r bg-white h-screen sticky top-0" style={{ borderColor: COLORS.line }}>
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
