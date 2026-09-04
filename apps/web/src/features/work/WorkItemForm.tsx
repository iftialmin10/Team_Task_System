import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { createWorkItemSchema, type CreateWorkItemInput, type User, type WorkItem } from '@team-task-system/contracts';

type FormValues = { title: string; description: string; ownerId: string; dueDate: string; priority: 'NORMAL' | 'HIGH' | 'URGENT' };

function OwnerCombobox({ users, value, onChange }: { users: User[]; value: string; onChange: (ownerId: string) => void }) {
  const listboxId = useId();
  const selectedOwner = users.find((user) => user.id === value);
  const [query, setQuery] = useState(selectedOwner?.name ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = normalizedQuery
    ? users.filter((user) => user.name.toLocaleLowerCase().includes(normalizedQuery))
    : users;

  const selectOwner = (user?: User) => {
    onChange(user?.id ?? '');
    setQuery(user?.name ?? '');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (!matches.length) return -1;
        if (event.key === 'ArrowDown') return current >= matches.length - 1 ? 0 : current + 1;
        return current <= 0 ? matches.length - 1 : current - 1;
      });
      return;
    }
    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      selectOwner(matches[activeIndex]);
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setOpen(false);
        setActiveIndex(-1);
        setQuery(users.find((user) => user.id === value)?.name ?? '');
      }}
    >
      <input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        placeholder="Type an owner name…"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange('');
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={onKeyDown}
        className="min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 pr-9 text-sm"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear owner"
          onClick={() => selectOwner()}
          className="absolute right-1 top-1 min-h-9 min-w-9 rounded-md text-lg text-muted hover:bg-slate-100"
        >
          ×
        </button>
      )}
      {open && (
        <ul id={listboxId} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white py-1 shadow-overlay">
          {!normalizedQuery && (
            <li role="option" aria-selected={!value}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectOwner()} className="min-h-11 w-full px-3 text-left text-sm text-muted hover:bg-slate-100">
                Unassigned
              </button>
            </li>
          )}
          {matches.map((user, index) => (
            <li id={`${listboxId}-option-${index}`} key={user.id} role="option" aria-selected={user.id === value || index === activeIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOwner(user)}
                className={`min-h-11 w-full px-3 text-left text-sm ${index === activeIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-100'}`}
              >
                <span className="block truncate font-medium">{user.name}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-3 text-sm text-muted">No matching owners</li>}
        </ul>
      )}
    </div>
  );
}

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
  const titleRef = useRef<HTMLInputElement>(null);
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
    if (!parsed.success) {
      setTitleError(parsed.error.issues.find((issue) => issue.path[0] === 'title')?.message ?? 'Check the form fields.');
      requestAnimationFrame(() => titleRef.current?.focus());
      return;
    }
    setTitleError('');
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={submit} noValidate aria-busy={pending}>
      <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
        <label className="min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Title <span className="text-red-700" aria-hidden="true">*</span><span className="sr-only">(required)</span></span><input ref={titleRef} data-dialog-initial-focus required maxLength={200} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? 'title-error' : undefined} {...field('title')} className="min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm" />{titleError && <span id="title-error" className="mt-1 block break-words text-sm text-red-700" role="alert">{titleError}</span>}</label>
        <label className="min-w-0"><span className="mb-1.5 block text-sm font-semibold">Owner</span>{item ? <select {...field('ownerId')} className="min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm"><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select> : <OwnerCombobox users={users} value={values.ownerId} onChange={(ownerId) => setValues((current) => ({ ...current, ownerId }))} />}</label>
        <label className="min-w-0"><span className="mb-1.5 block text-sm font-semibold">Due date</span><input type="date" {...field('dueDate')} className="min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm" /></label>
        <label className="min-w-0"><span className="mb-1.5 block text-sm font-semibold">Priority</span><select {...field('priority')} className="min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm"><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        <label className="min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Description <span className="font-normal text-muted">(optional)</span></span><textarea rows={5} maxLength={5000} {...field('description')} className="w-full min-w-0 resize-y rounded-lg border bg-white px-3 py-2.5 text-sm" /></label>
        {error && <div className="break-words rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2" role="alert">{error} Your entries have been kept; try again.</div>}
      </div>
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-white px-5 py-4 sm:px-6"><button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-800 active:bg-blue-900">{pending ? 'Saving…' : submitLabel}</button></div>
    </form>
  );
}
