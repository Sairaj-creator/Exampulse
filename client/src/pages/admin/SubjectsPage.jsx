import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { EmptyState } from "../../components/common/EmptyState";
import { FormDialog } from "../../components/common/FormDialog";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  createSubjectApi,
  deleteSubjectApi,
  listSubjectsApi,
  updateSubjectApi,
} from "../../features/admin/api";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function SubjectForm({ subject, busy, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  useEffect(() => {
    setForm(
      subject
        ? {
            name: subject.name,
            code: subject.code,
            description: subject.description || "",
          }
        : { name: "", code: "", description: "" },
    );
  }, [subject]);
  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
        Subject name
        <input
          autoFocus
          className={`${inputClass} mt-1.5`}
          value={form.name}
          onChange={set("name")}
          minLength={2}
          maxLength={100}
          placeholder="Database Management Systems"
          required
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
        Subject code
        <input
          className={`${inputClass} mt-1.5 uppercase`}
          value={form.code}
          onChange={set("code")}
          minLength={2}
          maxLength={20}
          placeholder="CS301"
          required
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
        Description
        <textarea
          className={`${inputClass} mt-1.5 min-h-24 resize-y`}
          value={form.description}
          onChange={set("description")}
          maxLength={500}
          placeholder="What this subject covers"
        />
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={busy}>
          {busy ? "Saving…" : subject ? "Save changes" : "Create subject"}
        </Button>
      </div>
    </form>
  );
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const query = useQuery({ queryKey: ["subjects"], queryFn: listSubjectsApi });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["subjects"] });
  const options = (message, close) => ({
    onSuccess: () => {
      toast.success(message);
      close();
      refresh();
    },
    onError: (error) => toast.error(error.message || "Request failed"),
  });
  const createMutation = useMutation({
    mutationFn: createSubjectApi,
    ...options("Subject created", () => setShowCreate(false)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSubjectApi(id, payload),
    ...options("Subject updated", () => setEditing(null)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSubjectApi,
    ...options("Subject deleted", () => setDeleting(null)),
  });
  const rows = query.data || [];
  const columns = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      label: "Subject",
      render: (row) => (
        <span className="font-semibold text-stone-900">{row.name}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="line-clamp-2 max-w-xl text-xs leading-5 text-stone-500">
          {row.description || "No description"}
        </span>
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
            title="Edit subject"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleting(row)}
            title="Delete subject"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];
  const closeForm = () => {
    setShowCreate(false);
    setEditing(null);
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Subject catalogue"
          description="Manage the subjects that organise question banks, exams, and performance analytics."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create subject
            </Button>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {query.isLoading ? (
            <div className="p-10 text-center text-sm text-stone-500">
              Loading subjects…
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center text-sm text-red-700">
              {query.error.message || "Could not load subjects."}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              empty={
                <EmptyState
                  icon={BookMarked}
                  title="No subjects yet"
                  description="Create a subject before teachers build their question banks."
                />
              }
            />
          )}
        </div>
        <FormDialog
          open={showCreate || Boolean(editing)}
          title={editing ? `Edit ${editing.code}` : "Create a subject"}
          description="Names and codes must be unique."
          onClose={closeForm}
        >
          <SubjectForm
            subject={editing}
            busy={createMutation.isPending || updateMutation.isPending}
            onCancel={closeForm}
            onSubmit={(payload) =>
              editing
                ? updateMutation.mutate({ id: editing._id, payload })
                : createMutation.mutate(payload)
            }
          />
        </FormDialog>
        <ConfirmDialog
          open={Boolean(deleting)}
          title={`Delete ${deleting?.code || "subject"}?`}
          description="Deletion succeeds only when no questions or exams reference this subject."
          confirmLabel="Delete subject"
          destructive
          busy={deleteMutation.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting._id)}
        />
      </div>
    </DashboardLayout>
  );
}
