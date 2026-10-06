import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
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

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case "student":
        return [
          { name: "Dashboard", path: "/student", icon: LayoutDashboard },
          { name: "My Exams", path: "/student/exams", icon: BookOpenCheck },
          { name: "My Analytics", path: "/student/analytics", icon: BarChart3 },
          { name: "Profile", path: "/profile", icon: User },
        ];
      case "teacher":
        return [
          { name: "Dashboard", path: "/teacher", icon: LayoutDashboard },
          { name: "Question Bank", path: "/teacher/questions", icon: Database },
          { name: "Exams & Builder", path: "/teacher/exams", icon: Calendar },
          { name: "Profile", path: "/profile", icon: User },
        ];
      case "admin":
        return [
          { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
          { name: "User Management", path: "/admin/users", icon: Users },
          { name: "Batches", path: "/admin/batches", icon: Layers },
          { name: "Subjects", path: "/admin/subjects", icon: BookMarked },
          { name: "Profile", path: "/profile", icon: User },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleStyles = {
    admin: {
      label: "Administrator",
      bg: "bg-purple-100 text-purple-800 border-purple-200",
    },
    teacher: {
      label: "Teacher",
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    student: {
      label: "Student",
      bg: "bg-blue-100 text-blue-800 border-blue-200",
    },
  };

  const currentRoleStyle = roleStyles[user?.role] || {
    label: user?.role,
    bg: "bg-stone-100 text-stone-700",
  };

  return (
    <div className="min-h-screen bg-[#f6f7f3] text-[#172f29] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-[#dfe3dc] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg focus:outline-hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-stone-900"
          >
            <span className="w-8 h-8 rounded-lg bg-primary text-[#cfe697] flex items-center justify-center shadow-xs">
              <Activity size={18} />
            </span>
            <span>ExamPulse</span>
          </Link>

          <span
            className={`hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full font-semibold border ${currentRoleStyle.bg}`}
          >
            {currentRoleStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-stone-900 leading-tight">
              {user?.name}
            </div>
            <div className="text-[11px] text-stone-500">{user?.email}</div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-red-700 bg-stone-50 hover:bg-red-50 border border-stone-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Log out of ExamPulse"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-[#dfe3dc] hidden md:flex flex-col justify-between p-4 sticky top-16 h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Menu Navigation
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white font-semibold shadow-xs"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-stone-200 pt-3">
            <div className="px-3 py-2 text-xs text-stone-500">
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
                  <div className="font-bold text-stone-900">ExamPulse Menu</div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-stone-500 hover:text-stone-800"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-white font-semibold"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
