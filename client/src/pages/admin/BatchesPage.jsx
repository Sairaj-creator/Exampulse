import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/common/DataTable";
import { EmptyState } from "../../components/common/EmptyState";
import { FormDialog } from "../../components/common/FormDialog";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  createBatchApi,
  deleteBatchApi,
  listBatchesApi,
  updateBatchApi,
} from "../../features/admin/api";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function BatchForm({ batch, busy, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => {
    setName(batch?.name || "");
    setYear(batch?.year || new Date().getFullYear());
  }, [batch]);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, year: Number(year) });
      }}
    >
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
        Batch name
        <input
          autoFocus
          className={`${inputClass} mt-1.5`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={50}
          placeholder="CSE-A 2027"
          required
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
        Academic year
        <input
          className={`${inputClass} mt-1.5`}
          type="number"
          min="2000"
          max="2100"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
        />
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={busy}>
          {busy ? "Saving…" : batch ? "Save changes" : "Create batch"}
        </Button>
      </div>
    </form>
  );
}

export function BatchesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const query = useQuery({ queryKey: ["batches"], queryFn: listBatchesApi });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["batches"] });
  const options = (message, close) => ({
    onSuccess: () => {
      toast.success(message);
      close();
      refresh();
    },
    onError: (error) => toast.error(error.message || "Request failed"),
  });
  const createMutation = useMutation({
    mutationFn: createBatchApi,
    ...options("Batch created", () => setShowCreate(false)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBatchApi(id, payload),
    ...options("Batch updated", () => setEditing(null)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBatchApi,
    ...options("Batch deleted", () => setDeleting(null)),
  });
  const rows = query.data || [];
  const columns = [
    {
      key: "name",
      label: "Batch",
      render: (row) => (
        <span className="font-semibold text-stone-900">{row.name}</span>
      ),
    },
    { key: "year", label: "Academic year" },
    {
      key: "studentCount",
      label: "Students",
      render: (row) => <span>{row.studentCount} enrolled</span>,
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
            title="Edit batch"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleting(row)}
            title="Delete batch"
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
          title="Academic batches"
          description="Maintain the cohorts used for student registration and exam assignment. Referenced batches are protected from deletion."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create batch
            </Button>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {query.isLoading ? (
            <div className="p-10 text-center text-sm text-stone-500">
              Loading batches…
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center text-sm text-red-700">
              {query.error.message || "Could not load batches."}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              empty={
                <EmptyState
                  icon={Layers}
                  title="No batches yet"
                  description="Create a batch before students register."
                />
              }
            />
          )}
        </div>
        <FormDialog
          open={showCreate || Boolean(editing)}
          title={editing ? `Edit ${editing.name}` : "Create a batch"}
          description="Batch names must be unique."
          onClose={closeForm}
        >
          <BatchForm
            batch={editing}
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
          title={`Delete ${deleting?.name || "batch"}?`}
          description="Deletion succeeds only when no students or exams reference this batch."
          confirmLabel="Delete batch"
          destructive
          busy={deleteMutation.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting._id)}
        />
      </div>
    </DashboardLayout>
  );
}
