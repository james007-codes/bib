import React from "react";
import { Menu } from "lucide-react";
import { COLORS } from "../../styles/tokens.js";
import { initials } from "../../utils/format.js";

export function Header({ setMobileOpen, user, role }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b" style={{ borderColor: COLORS.line }}>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
            {role === "admin" ? "Maintenance Control Room" : "Campus Help Desk"}
          </div>
          <div className="text-xs" style={{ color: COLORS.slate }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
            {initials(user?.name)}
          </div>
          <span className="hidden sm:block text-sm font-medium" style={{ color: COLORS.ink }}>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
