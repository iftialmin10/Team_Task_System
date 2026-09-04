import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkItemInput, User, WorkItem } from '@team-task-system/contracts';
import { createWorkItem } from '../../services/api';
import { DialogShell } from './DialogShell';
import { WorkItemForm } from './WorkItemForm';

export function CreateWorkDialog({ users, onClose, onCreated }: { users: User[]; onClose: () => void; onCreated: (item: WorkItem) => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: (input: CreateWorkItemInput) => createWorkItem(input), onSuccess: async (item) => { await queryClient.invalidateQueries({ queryKey: ['work-items'] }); onCreated(item); } });
  return <DialogShell titleId="create-work-title" descriptionId="create-work-description" onClose={onClose}><div className="flex min-w-0 items-start justify-between gap-4 border-b px-5 py-5 sm:px-6"><div className="min-w-0"><h2 id="create-work-title" className="text-xl font-bold">Add work</h2><p id="create-work-description" className="mt-1 text-sm text-muted">Create a backlog item now; its status can change as work progresses.</p></div><button type="button" onClick={onClose} aria-label="Close add work dialog" className="min-h-11 min-w-11 shrink-0 rounded-lg text-xl hover:bg-slate-100 active:bg-slate-200">×</button></div><WorkItemForm users={users} submitLabel="Add work" pending={mutation.isPending} error={mutation.error?.message} onCancel={onClose} onSubmit={(input) => mutation.mutate(input)} /></DialogShell>;
}
