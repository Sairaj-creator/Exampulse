import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpenCheck,
  BarChart3,
  Database,
  Calendar,
  Users,
  Layers,
  BookMarked,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useTileTilt } from "../../hooks/useTileTilt";
import { BrandMark, BrandWordmark } from "../common/BrandMark";
import { ThemeToggle } from "../ui/ThemeToggle";
import { MotionToggle } from "../ui/MotionToggle";

const NAV_LINKS = {
  student: [
    { name: "Dashboard", path: "/student", icon: LayoutDashboard, exact: true },
    {
      name: "My Exams",
      path: "/student/exams",
      icon: BookOpenCheck,
      also: ["/student/attempts"],
    },
    { name: "My Analytics", path: "/student/analytics", icon: BarChart3 },
    { name: "Profile", path: "/profile", icon: User },
  ],
  teacher: [
    { name: "Dashboard", path: "/teacher", icon: LayoutDashboard, exact: true },
    { name: "Question Bank", path: "/teacher/questions", icon: Database },
    {
      name: "Exams & Builder",
      path: "/teacher/exams",
      icon: Calendar,
      also: ["/teacher/attempts", "/teacher/students"],
    },
    { name: "Profile", path: "/profile", icon: User },
  ],
  admin: [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { name: "User Management", path: "/admin/users", icon: Users },
    { name: "Batches", path: "/admin/batches", icon: Layers },
    { name: "Subjects", path: "/admin/subjects", icon: BookMarked },
    { name: "Question Bank", path: "/teacher/questions", icon: Database },
    {
      name: "Exams",
      path: "/teacher/exams",
      icon: Calendar,
      also: ["/teacher/attempts", "/teacher/students"],
    },
    { name: "Profile", path: "/profile", icon: User },
  ],
};

const ROLE_STYLES = {
  admin: {
    label: "Administrator",
    chip: "bg-purple-100 text-purple-800 border-purple-200",
  },
  teacher: {
    label: "Teacher",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  student: {
    label: "Student",
    chip: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

// A section stays highlighted on its detail pages, not only its index page.
function isLinkActive(link, pathname) {
  if (link.exact) return pathname === link.path;
  return [link.path, ...(link.also || [])].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?"
  );
}

function NavList({ links, pathname, onNavigate }) {
  return (
    <nav className="space-y-1" aria-label="Main">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isLinkActive(link, pathname);
        return (
          <Link
            key={link.path}
            to={link.path}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              active
                ? "bg-primary font-semibold text-white shadow-[0_10px_20px_-12px_rgb(var(--c-emerald-900)/0.8)]"
                : "font-medium text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            <Icon size={18} />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tileTilt = useTileTilt();

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);
  useEscapeKey(mobileMenuOpen, closeMenu);

  // The drawer closes on navigation, including browser back/forward.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = NAV_LINKS[user?.role] || [];
  const roleStyle = ROLE_STYLES[user?.role] || {
    label: user?.role,
    chip: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <div className="flex min-h-screen flex-col text-stone-900">
      {/* Top bar */}
      <header className="glass-strong sticky top-0 z-20 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 sm:px-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 md:hidden"
            aria-label="Toggle Navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 text-lg">
            <BrandMark size={32} />
            <BrandWordmark className="text-stone-900" />
          </Link>

          <span
            className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${roleStyle.chip}`}
          >
            {roleStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <MotionToggle className="hidden sm:grid" />
          <ThemeToggle />

          <div className="hidden items-center gap-3 border-l border-stone-200 pl-3 lg:flex">
            <div className="text-right">
              <div className="text-sm font-semibold leading-tight text-stone-900">
                {user?.name}
              </div>
              <div className="text-[11px] text-stone-500">{user?.email}</div>
            </div>
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-xs font-bold text-white ring-2 ring-white/60"
              aria-hidden="true"
            >
              {initials(user?.name)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white/60 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            title="Log out of ExamPulse"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 flex-none p-4 pr-0 md:block">
          <div className="glass flex h-full flex-col justify-between rounded-3xl p-4">
            <div>
              <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Menu Navigation
              </div>
              <NavList links={navLinks} pathname={location.pathname} />
            </div>

            <div className="border-t border-stone-200 px-3 pt-3 text-xs text-stone-500">
              {user?.batchId && (
                <div className="mb-1 text-stone-600">
                  <span className="font-semibold">Batch:</span>{" "}
                  {user.batchId.name || "Assigned"}
                </div>
              )}
              <div className="text-[11px] text-stone-400">ExamPulse v1.0.0</div>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="animate-fade fixed inset-0 z-30 flex bg-black/45 backdrop-blur-sm md:hidden">
            <div className="glass-strong animate-drawer flex h-full w-72 max-w-[85vw] flex-col justify-between rounded-r-3xl border-y-0 border-l-0 p-4">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-4">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <BrandMark size={26} /> ExamPulse Menu
                  </div>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>
                <NavList
                  links={navLinks}
                  pathname={location.pathname}
                  onNavigate={closeMenu}
                />
                <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-100/60 px-3 py-2.5 text-xs font-semibold text-stone-600">
                  Animations
                  <MotionToggle />
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-700"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
            <div className="flex-1" onClick={closeMenu} />
          </div>
        )}

        {/* Main content */}
        <main
          {...tileTilt}
          className="page-enter mx-auto w-full min-w-0 max-w-7xl flex-1 p-4 sm:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
