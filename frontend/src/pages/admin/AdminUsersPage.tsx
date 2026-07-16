import { useState } from 'react';
import { Plus, UserCog, X } from 'lucide-react';
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateUserRole,
} from '@/hooks/queries';
import type { CommerceUser, UserRole } from '@/lib/commerce';

const inputClass =
  'w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Mijoz' },
  { value: 'print_operator', label: 'Bosmachi (operator)' },
  { value: 'support', label: 'Qo’llab-quvvatlash' },
  { value: 'manager', label: 'Menejer' },
  { value: 'admin', label: 'Admin' },
];

const PERMISSION_FIELDS = [
  { key: 'can_manage_orders', label: 'Buyurtmalar' },
  { key: 'can_manage_products', label: 'Mahsulotlar' },
  { key: 'can_manage_pickup_locations', label: 'Olib ketish punktlari' },
] as const;

interface NewUserForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

const EMPTY_NEW_USER: NewUserForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'manager',
};

function UserRow({ user }: { user: CommerceUser }) {
  const updateRole = useUpdateUserRole();

  const handleRoleChange = (role: UserRole) => {
    updateRole.mutate({ id: user.id, payload: { role } });
  };

  const handlePermissionToggle = (
    key: (typeof PERMISSION_FIELDS)[number]['key']
  ) => {
    updateRole.mutate({
      id: user.id,
      payload: { role: 'manager', [key]: !user[key] },
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

        <label className='flex items-center gap-2'>
          <span className='text-xs font-medium text-slate-500'>Rol</span>
          <select
            className='rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-400'
            value={user.role ?? 'customer'}
            onChange={event => handleRoleChange(event.target.value as UserRole)}
            disabled={updateRole.isPending}
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {user.role === 'manager' && (
        <div className='mt-4 flex flex-wrap gap-4 border-t border-stone-100 pt-4'>
          {PERMISSION_FIELDS.map(field => (
            <label key={field.key} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={Boolean(user[field.key])}
                onChange={() => handlePermissionToggle(field.key)}
                disabled={updateRole.isPending}
                className='h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-400'
              />
              <span className='text-sm text-slate-700'>{field.label}</span>
            </label>
          ))}
        </div>
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
            Rollarni va menejerlar uchun ruxsatlarni boshqaring. Faqat admin bu
            sahifaga kira oladi.
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
          </div>

          <p className='mt-3 text-xs text-slate-500'>
            Menejer ruxsatlarini yaratilgandan so&apos;ng quyidagi
            ro&apos;yxatdan belgilashingiz mumkin.
          </p>

          <div className='mt-5 flex items-center gap-3'>
            <button
              type='submit'
              disabled={createUser.isPending}
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
