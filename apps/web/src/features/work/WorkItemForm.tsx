import { useState, type FormEvent } from 'react';
import { createWorkItemSchema, type CreateWorkItemInput, type User, type WorkItem } from '@team-task-system/contracts';

type FormValues = { title: string; description: string; ownerId: string; dueDate: string; priority: 'NORMAL' | 'HIGH' | 'URGENT' };

export function WorkItemForm({ item, users, submitLabel, pending, error, onCancel, onSubmit }: {
  item?: WorkItem;
  users: User[];
  submitLabel: string;
  pending: boolean;
  error: string | undefined;
  onCancel: () => void;
  onSubmit: (input: CreateWorkItemInput) => void;
}) {
  const [values, setValues] = useState<FormValues>({
    title: item?.title ?? '', description: item?.description ?? '', ownerId: item?.ownerId ?? '',
    dueDate: item?.dueDate?.slice(0, 10) ?? '', priority: item?.priority ?? 'NORMAL',
  });
  const [titleError, setTitleError] = useState('');
  const field = (name: keyof FormValues) => ({ value: values[name], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [name]: event.target.value })) });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input: CreateWorkItemInput = {
      title: values.title,
      description: values.description.trim() || null,
      ownerId: values.ownerId || null,
      dueDate: values.dueDate || null,
      priority: values.priority,
    };
    const parsed = createWorkItemSchema.safeParse(input);
    if (!parsed.success) { setTitleError(parsed.error.issues.find((issue) => issue.path[0] === 'title')?.message ?? 'Check the form fields.'); return; }
    setTitleError('');
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Title <span className="text-red-700">*</span></span><input autoFocus maxLength={200} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? 'title-error' : undefined} {...field('title')} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm" />{titleError && <span id="title-error" className="mt-1 block text-sm text-red-700">{titleError}</span>}</label>
        <label><span className="mb-1.5 block text-sm font-semibold">Owner</span><select {...field('ownerId')} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        <label><span className="mb-1.5 block text-sm font-semibold">Due date</span><input type="date" {...field('dueDate')} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm" /></label>
        <label><span className="mb-1.5 block text-sm font-semibold">Priority</span><select {...field('priority')} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Description <span className="font-normal text-muted">(optional)</span></span><textarea rows={5} maxLength={5000} {...field('description')} className="w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm" /></label>
        {error && <div className="sm:col-span-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error} Your entries have been kept; try again.</div>}
      </div>
      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-5 py-4 sm:px-6"><button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-800 active:bg-blue-900">{pending ? 'Saving…' : submitLabel}</button></div>
    </form>
  );
}
