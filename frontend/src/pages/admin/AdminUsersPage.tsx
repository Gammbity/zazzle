import { useState } from 'react';
import { Plus, UserCog, X } from 'lucide-react';
import {
  useAdminProductionCenters,
  useAdminUsers,
  useCreateAdminUser,
  useUpdateUserRole,
} from '@/hooks/queries';
import type { CommerceUser, UserRole } from '@/lib/commerce';

const inputClass =
  'w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Mijoz' },
  { value: 'support', label: 'Qo’llab-quvvatlash' },
  { value: 'production_manager', label: 'Ishlab chiqarish menejeri' },
  { value: 'production_admin', label: 'Ishlab chiqarish admini' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ROLES_REQUIRING_CENTER: UserRole[] = [
  'production_admin',
  'production_manager',
];

interface NewUserForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  production_center: number | null;
}

const EMPTY_NEW_USER: NewUserForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'production_manager',
  production_center: null,
};

function CenterSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const centersQuery = useAdminProductionCenters();
  const data = centersQuery.data;
  const centers = data ? (Array.isArray(data) ? data : data.results) : [];

  return (
    <select
      className='rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-400'
      value={value ?? ''}
      onChange={event =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
    >
      <option value=''>Markaz tanlang...</option>
      {centers.map(center => (
        <option key={center.id} value={center.id}>
          {center.name}
        </option>
      ))}
    </select>
  );
}

function UserRow({ user }: { user: CommerceUser }) {
  const updateRole = useUpdateUserRole();

  const handleRoleChange = (role: UserRole) => {
    updateRole.mutate({
      id: user.id,
      payload: {
        role,
        production_center: ROLES_REQUIRING_CENTER.includes(role)
          ? user.production_center
          : null,
      },
    });
  };

  const handleCenterChange = (production_center: number | null) => {
    updateRole.mutate({
      id: user.id,
      payload: { role: user.role, production_center },
    });
  };

  return (
    <article className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <p className='text-base font-semibold text-slate-950'>
            {user.full_name || user.email}
          </p>
          <p className='text-sm text-slate-500'>{user.email}</p>
        </div>

        <div className='flex items-center gap-3'>
          <label className='flex items-center gap-2'>
            <span className='text-xs font-medium text-slate-500'>Rol</span>
            <select
              className='rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-400'
              value={user.role ?? 'customer'}
              onChange={event =>
                handleRoleChange(event.target.value as UserRole)
              }
              disabled={updateRole.isPending}
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {user.role && ROLES_REQUIRING_CENTER.includes(user.role) && (
            <CenterSelect
              value={user.production_center ?? null}
              onChange={handleCenterChange}
            />
          )}
        </div>
      </div>

      {user.role &&
        ROLES_REQUIRING_CENTER.includes(user.role) &&
        !user.production_center && (
          <p className='mt-3 text-xs font-medium text-rose-600'>
            Markaz tanlanmaguncha bu foydalanuvchi ishlay olmaydi.
          </p>
        )}
    </article>
  );
}

export default function AdminUsersPage() {
  const usersQuery = useAdminUsers();
  const createUser = useCreateAdminUser();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewUserForm>(EMPTY_NEW_USER);

  const data = usersQuery.data;
  const users = data ? (Array.isArray(data) ? data : data.results) : [];

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    createUser.mutate(form, {
      onSuccess: () => {
        setForm(EMPTY_NEW_USER);
        setShowCreate(false);
      },
    });
  };

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
            Admin
          </p>
          <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
            Foydalanuvchilar
          </h1>
          <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
            Rollarni va ishlab chiqarish markaziga tayinlashni boshqaring. Faqat
            super admin bu sahifaga kira oladi.
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowCreate(true)}
          className='inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
        >
          <Plus className='h-4 w-4' />
          Yangi foydalanuvchi
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className='mt-6 rounded-[2rem] border border-amber-200 bg-amber-50/40 p-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-2 text-lg font-semibold text-slate-900'>
              <UserCog className='h-4 w-4' />
              Yangi foydalanuvchi
            </h2>
            <button
              type='button'
              onClick={() => setShowCreate(false)}
              className='rounded-full p-1.5 text-slate-500 hover:bg-white'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Ism
              </span>
              <input
                className={inputClass}
                value={form.first_name}
                onChange={event =>
                  setForm(prev => ({ ...prev, first_name: event.target.value }))
                }
                required
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Familiya
              </span>
              <input
                className={inputClass}
                value={form.last_name}
                onChange={event =>
                  setForm(prev => ({ ...prev, last_name: event.target.value }))
                }
                required
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Username
              </span>
              <input
                className={inputClass}
                value={form.username}
                onChange={event =>
                  setForm(prev => ({ ...prev, username: event.target.value }))
                }
                required
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Email
              </span>
              <input
                type='email'
                className={inputClass}
                value={form.email}
                onChange={event =>
                  setForm(prev => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Parol
              </span>
              <input
                type='password'
                className={inputClass}
                value={form.password}
                onChange={event =>
                  setForm(prev => ({ ...prev, password: event.target.value }))
                }
                minLength={8}
                required
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Rol
              </span>
              <select
                className={inputClass}
                value={form.role}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    role: event.target.value as UserRole,
                    production_center: ROLES_REQUIRING_CENTER.includes(
                      event.target.value as UserRole
                    )
                      ? prev.production_center
                      : null,
                  }))
                }
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {ROLES_REQUIRING_CENTER.includes(form.role) && (
              <label className='block'>
                <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                  Ishlab chiqarish markazi{' '}
                  <span className='text-amber-600'>*</span>
                </span>
                <CenterSelect
                  value={form.production_center}
                  onChange={value =>
                    setForm(prev => ({ ...prev, production_center: value }))
                  }
                />
              </label>
            )}
          </div>

          <div className='mt-5 flex items-center gap-3'>
            <button
              type='submit'
              disabled={
                createUser.isPending ||
                (ROLES_REQUIRING_CENTER.includes(form.role) &&
                  !form.production_center)
              }
              className='rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50'
            >
              {createUser.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
            <button
              type='button'
              onClick={() => setShowCreate(false)}
              className='rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white'
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {usersQuery.isLoading ? (
        <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : users.length === 0 ? (
        <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
          <p className='text-base text-slate-600'>Foydalanuvchi topilmadi.</p>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {users.map(user => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
