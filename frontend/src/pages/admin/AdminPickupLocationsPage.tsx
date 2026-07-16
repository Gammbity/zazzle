import { useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  useAdminPickupLocations,
  useCreateAdminPickupLocation,
  useDeleteAdminPickupLocation,
  useUpdateAdminPickupLocation,
} from '@/hooks/queries';
import type { PickupLocation } from '@/lib/commerce';
import AddressMapPicker from '@/components/checkout/AddressMapPicker';

const inputClass =
  'w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

interface FormState {
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  working_hours: string;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  city: 'Tashkent',
  latitude: null,
  longitude: null,
  working_hours: '',
  is_active: true,
  sort_order: 0,
};

function toFormState(location: PickupLocation): FormState {
  return {
    name: location.name,
    address: location.address,
    city: location.city,
    latitude: location.latitude != null ? Number(location.latitude) : null,
    longitude: location.longitude != null ? Number(location.longitude) : null,
    working_hours: location.working_hours,
    is_active: location.is_active,
    sort_order: location.sort_order,
  };
}

export default function AdminPickupLocationsPage() {
  const locationsQuery = useAdminPickupLocations();
  const createMutation = useCreateAdminPickupLocation();
  const updateMutation = useUpdateAdminPickupLocation();
  const deleteMutation = useDeleteAdminPickupLocation();

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const data = locationsQuery.data;
  const locations = data ? (Array.isArray(data) ? data : data.results) : [];

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId('new');
  };

  const startEdit = (location: PickupLocation) => {
    setForm(toFormState(location));
    setEditingId(location.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    if (editingId === null) return;
    const onSuccess = createMutation.isSuccess || updateMutation.isSuccess;
    if (onSuccess) cancelEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createMutation.isSuccess, updateMutation.isSuccess]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      latitude: form.latitude,
      longitude: form.longitude,
      working_hours: form.working_hours,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (editingId === 'new') {
      createMutation.mutate(payload);
    } else if (editingId != null) {
      updateMutation.mutate({ id: editingId, payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
            Admin
          </p>
          <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
            Olib ketish punktlari
          </h1>
          <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
            Checkout sahifasida mijozlarga ko&apos;rsatiladigan olib ketish
            punktlarini boshqaring.
          </p>
        </div>
        <button
          type='button'
          onClick={startCreate}
          className='inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
        >
          <Plus className='h-4 w-4' />
          Yangi punkt
        </button>
      </div>

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className='mt-6 rounded-[2rem] border border-amber-200 bg-amber-50/40 p-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>
              {editingId === 'new' ? 'Yangi punkt' : 'Punktni tahrirlash'}
            </h2>
            <button
              type='button'
              onClick={cancelEdit}
              className='rounded-full p-1.5 text-slate-500 hover:bg-white'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <label className='block sm:col-span-2'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Nomi
              </span>
              <input
                className={inputClass}
                value={form.name}
                onChange={event =>
                  setForm(prev => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Shahar
              </span>
              <input
                className={inputClass}
                value={form.city}
                onChange={event =>
                  setForm(prev => ({ ...prev, city: event.target.value }))
                }
                required
              />
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Ish vaqti
              </span>
              <input
                className={inputClass}
                value={form.working_hours}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    working_hours: event.target.value,
                  }))
                }
                placeholder='Dush-Shan 09:00-19:00'
              />
            </label>

            <div className='sm:col-span-2'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Manzil <span className='text-amber-600'>*</span>
              </span>
              <AddressMapPicker
                address={form.address}
                latitude={form.latitude}
                longitude={form.longitude}
                onAddressChange={value =>
                  setForm(prev => ({ ...prev, address: value }))
                }
                onCoordsChange={(latitude, longitude) =>
                  setForm(prev => ({ ...prev, latitude, longitude }))
                }
                inputClassName={inputClass}
              />
            </div>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Tartib raqami
              </span>
              <input
                type='number'
                className={inputClass}
                value={form.sort_order}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    sort_order: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>

            <label className='flex items-center gap-2.5 pt-6'>
              <input
                type='checkbox'
                checked={form.is_active}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
                className='h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-400'
              />
              <span className='text-sm font-medium text-slate-700'>
                Faol (checkoutda ko&apos;rinadi)
              </span>
            </label>
          </div>

          <div className='mt-5 flex items-center gap-3'>
            <button
              type='submit'
              disabled={isSaving || !form.address}
              className='rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50'
            >
              {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button
              type='button'
              onClick={cancelEdit}
              className='rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white'
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {locationsQuery.isLoading ? (
        <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : locations.length === 0 ? (
        <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
          <p className='text-base text-slate-600'>Punkt topilmadi.</p>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {locations.map(location => (
            <article
              key={location.id}
              className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
                    <MapPin className='h-4 w-4' />
                  </div>
                  <div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                      <h2 className='text-lg font-semibold text-slate-950'>
                        {location.name}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          location.is_active
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {location.is_active ? 'Faol' : 'Faol emas'}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-slate-500'>
                      {location.address}, {location.city}
                    </p>
                    {location.working_hours && (
                      <p className='mt-0.5 text-xs text-slate-400'>
                        {location.working_hours}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => startEdit(location)}
                    className='inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                    Tahrirlash
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm(`"${location.name}" o'chirilsinmi?`)) {
                        deleteMutation.mutate(location.id);
                      }
                    }}
                    className='inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
