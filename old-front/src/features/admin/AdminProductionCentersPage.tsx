'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Factory, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  useAdminProductionCenters,
  useCreateAdminProductionCenter,
  useDeleteAdminProductionCenter,
  useUpdateAdminProductionCenter,
} from '@/hooks/queries';
import type { ProductionCenter, ProductionCenterType } from '@/lib/commerce';

const AddressMapPicker = dynamic(
  () => import('@/components/checkout/AddressMapPicker'),
  { ssr: false }
);

const inputClass =
  'w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

interface FormState {
  name: string;
  type: ProductionCenterType;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'PARTNER',
  address: '',
  latitude: null,
  longitude: null,
  phone: '',
  email: '',
  is_active: true,
  supports_pickup: true,
  supports_delivery: true,
  sort_order: 0,
};

function toFormState(center: ProductionCenter): FormState {
  return {
    name: center.name,
    type: center.type,
    address: center.address,
    latitude: center.latitude != null ? Number(center.latitude) : null,
    longitude: center.longitude != null ? Number(center.longitude) : null,
    phone: center.phone,
    email: center.email,
    is_active: center.is_active,
    supports_pickup: center.supports_pickup,
    supports_delivery: center.supports_delivery,
    sort_order: center.sort_order,
  };
}

export default function AdminProductionCentersPage() {
  const centersQuery = useAdminProductionCenters();
  const createMutation = useCreateAdminProductionCenter();
  const updateMutation = useUpdateAdminProductionCenter();
  const deleteMutation = useDeleteAdminProductionCenter();

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const data = centersQuery.data;
  const centers = data ? (Array.isArray(data) ? data : data.results) : [];

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId('new');
  };

  const startEdit = (center: ProductionCenter) => {
    setForm(toFormState(center));
    setEditingId(center.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form };
    if (editingId === 'new') {
      createMutation.mutate(payload, { onSuccess: cancelEdit });
    } else if (editingId != null) {
      updateMutation.mutate(
        { id: editingId, payload },
        { onSuccess: cancelEdit }
      );
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
            Ishlab chiqarish markazlari
          </h1>
          <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
            Buyurtmalar tayinlanadigan hamkor bosmaxonalar va o&apos;z
            filiallaringizni boshqaring.
          </p>
        </div>
        <button
          type='button'
          onClick={startCreate}
          className='inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
        >
          <Plus className='h-4 w-4' />
          Yangi markaz
        </button>
      </div>

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className='mt-6 rounded-[2rem] border border-amber-200 bg-amber-50/40 p-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>
              {editingId === 'new' ? 'Yangi markaz' : 'Markazni tahrirlash'}
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
            <label className='block'>
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
                Turi
              </span>
              <select
                className={inputClass}
                value={form.type}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    type: event.target.value as ProductionCenterType,
                  }))
                }
              >
                <option value='PARTNER'>Hamkor (Partner)</option>
                <option value='OWN'>O&apos;z filialimiz (Own)</option>
              </select>
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Telefon
              </span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={event =>
                  setForm(prev => ({ ...prev, phone: event.target.value }))
                }
                placeholder='+998901234567'
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

            <div className='flex flex-wrap items-center gap-4 pt-6'>
              <label className='flex items-center gap-2'>
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
                <span className='text-sm font-medium text-slate-700'>Faol</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={form.supports_pickup}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      supports_pickup: event.target.checked,
                    }))
                  }
                  className='h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-400'
                />
                <span className='text-sm font-medium text-slate-700'>
                  Olib ketish
                </span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={form.supports_delivery}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      supports_delivery: event.target.checked,
                    }))
                  }
                  className='h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-400'
                />
                <span className='text-sm font-medium text-slate-700'>
                  Yetkazib berish
                </span>
              </label>
            </div>
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

      {centersQuery.isLoading ? (
        <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : centers.length === 0 ? (
        <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
          <p className='text-base text-slate-600'>Markaz topilmadi.</p>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {centers.map(center => (
            <article
              key={center.id}
              className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
                    <Factory className='h-4 w-4' />
                  </div>
                  <div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                      <h2 className='text-lg font-semibold text-slate-950'>
                        {center.name}
                      </h2>
                      <span className='rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600'>
                        {center.type === 'OWN' ? "O'z filial" : 'Hamkor'}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          center.is_active
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {center.is_active ? 'Faol' : 'Faol emas'}
                      </span>
                      {center.supports_pickup && (
                        <span className='rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700'>
                          Olib ketish
                        </span>
                      )}
                      {center.supports_delivery && (
                        <span className='rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700'>
                          Yetkazib berish
                        </span>
                      )}
                    </div>
                    <p className='mt-1 text-sm text-slate-500'>
                      {center.address}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => startEdit(center)}
                    className='inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                    Tahrirlash
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm(`"${center.name}" o'chirilsinmi?`)) {
                        deleteMutation.mutate(center.id);
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
