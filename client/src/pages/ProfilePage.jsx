import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/button";

export function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);

    try {
      await updateProfile({ name });
      setProfileMsg("Profile updated successfully.");
    } catch (err) {
      setProfileErr(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);

    if (newPassword !== confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }

    setSavingPw(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwErr(err.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Account Profile
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your personal credentials, contact email, and security
            settings.
          </p>
        </div>

        {/* Account Details Card */}
        <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
            <User size={18} className="text-stone-600" /> Account Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Role Authorization
              </span>
              <span className="font-semibold text-stone-800 capitalize flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-700" />{" "}
                {user?.role}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Email Address
              </span>
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Mail size={16} className="text-blue-700" /> {user?.email}
              </span>
            </div>

            {user?.batchId && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                  Enrolled Cohort
                </span>
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Layers size={16} className="text-purple-700" />{" "}
                  {user.batchId.name} ({user.batchId.year})
                </span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Account Status
              </span>
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Update Name Form */}
        <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 mb-4">
            Update Profile Details
          </h2>

          {profileMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> {profileMsg}
            </div>
          )}

          {profileErr && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} /> {profileErr}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
              />
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile Changes"}
            </Button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Lock size={18} className="text-stone-600" /> Change Password
          </h2>

          {pwMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> {pwMsg}
            </div>
          )}

          {pwErr && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} /> {pwErr}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                New Password (min 8 chars, 1 letter & 1 number)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:border-stone-600 bg-white"
              />
            </div>

            <Button type="submit" disabled={savingPw}>
              {savingPw ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
