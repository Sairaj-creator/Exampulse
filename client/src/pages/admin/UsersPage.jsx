import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  UserRoundX,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FormDialog } from "../../components/common/FormDialog";
import { useAuth } from "../../hooks/useAuth";
import {
  createUserApi,
  listBatchesApi,
  listUsersApi,
  resetUserPasswordApi,
  updateUserApi,
  updateUserStatusApi,
} from "../../features/admin/api";

const blankUser = {
  name: "",
  email: "",
  password: "",
  role: "teacher",
  batchId: "",
  rollNumber: "",
};

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-stone-600">
      <span className="mb-1.5 block uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function UserForm({ user, batches, busy, onSubmit, onCancel }) {
  const editing = Boolean(user);
  const [form, setForm] = useState(blankUser);

  useEffect(() => {
    setForm(
      user
        ? {
            name: user.name,
            role: user.role,
            batchId: user.batchId?._id || "",
            rollNumber: user.rollNumber || "",
          }
        : blankUser,
    );
  }, [user]);

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      batchId: form.role === "student" ? form.batchId : null,
      rollNumber: form.role === "student" ? form.rollNumber || null : null,
    };
    if (editing) {
      delete payload.email;
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name">
        <input
          className={inputClass}
          value={form.name || ""}
          onChange={set("name")}
          minLength={2}
          maxLength={100}
          required
        />
      </Field>
      {!editing && (
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={form.email || ""}
            onChange={set("email")}
            required
          />
        </Field>
      )}
      {!editing && (
        <Field label="Temporary password">
          <input
            className={inputClass}
            type="password"
            value={form.password || ""}
            onChange={set("password")}
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
            title="At least 8 characters with one letter and one number"
            required
          />
        </Field>
      )}
      <Field label="Role">
        <select className={inputClass} value={form.role} onChange={set("role")}>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="admin">Administrator</option>
        </select>
      </Field>
      {form.role === "student" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch">
            <select
              className={inputClass}
              value={form.batchId || ""}
              onChange={set("batchId")}
              required
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Roll number">
            <input
              className={inputClass}
              value={form.rollNumber || ""}
              onChange={set("rollNumber")}
            />
          </Field>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ busy, onSubmit, onCancel }) {
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(password);
      }}
      className="space-y-4"
    >
      <Field label="New temporary password">
        <input
          autoFocus
          className={inputClass}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
          required
        />
      </Field>
      <p className="text-xs text-stone-500">
        Use at least eight characters with one letter and one number.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={busy}>
          {busy ? "Resetting…" : "Reset password"}
        </Button>
      </div>
    </form>
  );
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    isActive: "",
  });
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", page, filters],
    queryFn: () =>
      listUsersApi({
        page,
        limit: 10,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== ""),
        ),
      }),
  });
  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: listBatchesApi,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  const mutationOptions = (message, close) => ({
    onSuccess: () => {
      toast.success(message);
      close?.();
      refresh();
    },
    onError: (error) => toast.error(error.message || "Request failed"),
  });
  const createMutation = useMutation({
    mutationFn: createUserApi,
    ...mutationOptions("User created", () => setShowCreate(false)),
  });
  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserApi(id, payload),
    ...mutationOptions("User updated", () => setEditing(null)),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatusApi(id, isActive),
    ...mutationOptions("Account status updated", () => setStatusTarget(null)),
  });
  const resetMutation = useMutation({
    mutationFn: ({ id, password }) => resetUserPasswordApi(id, password),
    ...mutationOptions("Password reset", () => setResetTarget(null)),
  });
  const rows = usersQuery.data?.users || [];
  const meta = usersQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const badge = (value, styles) => (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles}`}
    >
      {value}
    </span>
  );
  const columns = [
    {
      key: "name",
      label: "User",
      render: (row) => (
        <div>
          <div className="font-semibold text-stone-900">{row.name}</div>
          <div className="mt-0.5 text-xs text-stone-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) =>
        badge(
          row.role,
          row.role === "admin"
            ? "border-purple-200 bg-purple-50 text-purple-700"
            : row.role === "teacher"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-blue-200 bg-blue-50 text-blue-700",
        ),
    },
    { key: "batch", label: "Batch", render: (row) => row.batchId?.name || "—" },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        badge(
          row.isActive ? "Active" : "Inactive",
          row.isActive
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-stone-200 bg-stone-100 text-stone-500",
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(row)}
            title="Edit user"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetTarget(row)}
            title="Reset password"
          >
            <KeyRound size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={row._id === currentUser?._id}
            onClick={() => setStatusTarget(row)}
            title={row.isActive ? "Deactivate user" : "Activate user"}
          >
            {row.isActive ? (
              <UserRoundX size={14} />
            ) : (
              <UserRoundCheck size={14} />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="User management"
          description="Create staff accounts, maintain student assignments, and control access without deleting academic history."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create user
            </Button>
          }
        />
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <form
            className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setFilters((current) => ({ ...current, search: searchInput }));
            }}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-2.5 text-stone-400"
                size={16}
              />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search name, email or roll number"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <select
              className={`${inputClass} sm:w-40`}
              value={filters.role}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  role: event.target.value,
                }));
              }}
            >
              <option value="">All roles</option>
              <option value="admin">Admins</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
            <select
              className={`${inputClass} sm:w-40`}
              value={filters.isActive}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  isActive: event.target.value,
                }));
              }}
            >
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          {usersQuery.isLoading ? (
            <div className="p-10 text-center text-sm text-stone-500">
              Loading users…
            </div>
          ) : usersQuery.isError ? (
            <div className="p-10 text-center text-sm text-red-700">
              {usersQuery.error.message || "Could not load users."}
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                empty={
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description="Change the filters or create the first matching account."
                  />
                }
              />
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
        <FormDialog
          open={showCreate || Boolean(editing)}
          title={editing ? `Edit ${editing.name}` : "Create a user"}
          description={
            editing
              ? "Update role and academic assignment."
              : "Teachers and administrators must be created here. Students may also self-register."
          }
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
        >
          <UserForm
            user={editing}
            batches={batchesQuery.data || []}
            busy={createMutation.isPending || editMutation.isPending}
            onCancel={() => {
              setShowCreate(false);
              setEditing(null);
            }}
            onSubmit={(payload) =>
              editing
                ? editMutation.mutate({ id: editing._id, payload })
                : createMutation.mutate(payload)
            }
          />
        </FormDialog>
        <FormDialog
          open={Boolean(resetTarget)}
          title={`Reset ${resetTarget?.name || ""}'s password`}
          description="The new password takes effect immediately."
          onClose={() => setResetTarget(null)}
        >
          <ResetPasswordForm
            busy={resetMutation.isPending}
            onCancel={() => setResetTarget(null)}
            onSubmit={(password) =>
              resetMutation.mutate({ id: resetTarget._id, password })
            }
          />
        </FormDialog>
        <ConfirmDialog
          open={Boolean(statusTarget)}
          title={`${statusTarget?.isActive ? "Deactivate" : "Activate"} ${statusTarget?.name || "user"}?`}
          description={
            statusTarget?.isActive
              ? "They will be signed out on their next authenticated request. Their records and results stay intact."
              : "They will be able to sign in again immediately."
          }
          confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
          destructive={statusTarget?.isActive}
          busy={statusMutation.isPending}
          onClose={() => setStatusTarget(null)}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget._id,
              isActive: !statusTarget.isActive,
            })
          }
        />
      </div>
    </DashboardLayout>
  );
}
