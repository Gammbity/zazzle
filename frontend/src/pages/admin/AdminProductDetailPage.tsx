import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import {
  useAdminProduct,
  useCreateAdminVariant,
  useDeleteAdminVariant,
  useUpdateAdminProduct,
  useUpdateAdminVariant,
} from '@/hooks/queries';
import { getCommerceErrorMessage, type CommerceVariant } from '@/lib/commerce';
import { Link } from '@/lib/router';
import { useAdminPath } from '@/components/admin/AdminBaseContext';

interface AdminProductDetailPageProps {
  productId: string;
}

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

function VariantRow({
  productId,
  variant,
}: {
  productId: number;
  variant: CommerceVariant;
}) {
  const [form, setForm] = useState({
    size: variant.size,
    color: variant.color,
    color_hex: variant.color_hex,
    sale_price: variant.sale_price,
    production_cost: variant.production_cost ?? '',
    stock_quantity: variant.stock_quantity ?? 0,
    is_active: variant.is_active,
  });
  const updateMutation = useUpdateAdminVariant();
  const deleteMutation = useDeleteAdminVariant();

  const handleSave = () => {
    updateMutation.mutate({ productId, variantId: variant.id, payload: form });
  };

  const handleDelete = () => {
    if (!window.confirm(`${variant.variant_name} variantini o'chirasizmi?`))
      return;
    deleteMutation.mutate({ productId, variantId: variant.id });
  };

  return (
    <tr className='border-b border-stone-100 last:border-0'>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.size}
          onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))}
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.color}
          onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.color_hex}
          onChange={e =>
            setForm(prev => ({ ...prev, color_hex: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.sale_price}
          onChange={e =>
            setForm(prev => ({ ...prev, sale_price: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.production_cost}
          onChange={e =>
            setForm(prev => ({ ...prev, production_cost: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          type='number'
          className={inputClass}
          value={form.stock_quantity}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              stock_quantity: Number(e.target.value),
            }))
          }
        />
      </td>
      <td className='py-2 pr-2 text-center'>
        <input
          type='checkbox'
          checked={form.is_active}
          onChange={e =>
            setForm(prev => ({ ...prev, is_active: e.target.checked }))
          }
        />
      </td>
      <td className='py-2 pl-2'>
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition hover:bg-amber-200 disabled:opacity-60'
            title='Saqlash'
          >
            <Save className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'
            title="O'chirish"
          >
            <Trash2 className='h-3.5 w-3.5' />
          </button>
        </div>
      </td>
    </tr>
  );
}

function NewVariantRow({ productId }: { productId: number }) {
  const [form, setForm] = useState({
    size: '',
    color: '',
    color_hex: '#000000',
    sale_price: '',
    production_cost: '',
    stock_quantity: 0,
  });
  const createMutation = useCreateAdminVariant();

  const handleCreate = () => {
    if (!form.sale_price) return;
    createMutation.mutate(
      { productId, payload: form },
      {
        onSuccess: () =>
          setForm({
            size: '',
            color: '',
            color_hex: '#000000',
            sale_price: '',
            production_cost: '',
            stock_quantity: 0,
          }),
      }
    );
  };

  return (
    <tr>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          placeholder='S/M/L'
          value={form.size}
          onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))}
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          placeholder='Rang'
          value={form.color}
          onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          value={form.color_hex}
          onChange={e =>
            setForm(prev => ({ ...prev, color_hex: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          placeholder='Narx'
          value={form.sale_price}
          onChange={e =>
            setForm(prev => ({ ...prev, sale_price: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          className={inputClass}
          placeholder='Tannarx'
          value={form.production_cost}
          onChange={e =>
            setForm(prev => ({ ...prev, production_cost: e.target.value }))
          }
        />
      </td>
      <td className='py-2 pr-2'>
        <input
          type='number'
          className={inputClass}
          value={form.stock_quantity}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              stock_quantity: Number(e.target.value),
            }))
          }
        />
      </td>
      <td />
      <td className='py-2 pl-2'>
        <button
          type='button'
          onClick={handleCreate}
          disabled={createMutation.isPending || !form.sale_price}
          className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white transition hover:bg-amber-700 disabled:opacity-60'
          title="Qo'shish"
        >
          <Plus className='h-3.5 w-3.5' />
        </button>
      </td>
    </tr>
  );
}

export default function AdminProductDetailPage({
  productId,
}: AdminProductDetailPageProps) {
  const productQuery = useAdminProduct(productId);
  const product = productQuery.data ?? null;
  const updateProductMutation = useUpdateAdminProduct();
  const adminPath = useAdminPath();

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name,
      description: product.description,
      is_active: product.is_active ?? true,
    });
  }, [product]);

  if (productQuery.isLoading) {
    return <div className='h-96 animate-pulse rounded-[2rem] bg-amber-50' />;
  }

  if (!product) {
    return (
      <div className='rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
        <h1 className='text-2xl font-semibold text-slate-900'>
          Mahsulot topilmadi
        </h1>
      </div>
    );
  }

  const handleSave = async () => {
    setError(null);
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        payload: form,
      });
    } catch (err) {
      setError(getCommerceErrorMessage(err, "Saqlab bo'lmadi."));
    }
  };

  return (
    <div>
      <Link
        to={adminPath('/products')}
        className='inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50'
      >
        <ArrowLeft className='h-4 w-4' />
        Mahsulotlar
      </Link>

      <h1 className='mt-6 text-3xl font-semibold text-slate-950'>
        {product.name}
      </h1>

      {error && (
        <div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
          {error}
        </div>
      )}

      <section className='mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Umumiy ma&apos;lumot
        </h2>
        <div className='mt-4 space-y-3'>
          <label className='block'>
            <span className='mb-1.5 block text-sm font-medium text-slate-700'>
              Nomi
            </span>
            <input
              className={inputClass}
              value={form.name}
              onChange={e =>
                setForm(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </label>
          <label className='block'>
            <span className='mb-1.5 block text-sm font-medium text-slate-700'>
              Tavsif
            </span>
            <textarea
              className={`${inputClass} min-h-20 resize-none`}
              value={form.description}
              onChange={e =>
                setForm(prev => ({ ...prev, description: e.target.value }))
              }
            />
          </label>
          <label className='flex items-center gap-2 text-sm font-medium text-slate-700'>
            <input
              type='checkbox'
              checked={form.is_active}
              onChange={e =>
                setForm(prev => ({ ...prev, is_active: e.target.checked }))
              }
            />
            Faol (katalogda ko&apos;rinadi)
          </label>
          <button
            type='button'
            onClick={() => void handleSave()}
            disabled={updateProductMutation.isPending}
            className='inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60'
          >
            <Save className='h-4 w-4' />
            {updateProductMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </section>

      <section className='mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
        <h2 className='text-lg font-semibold text-slate-900'>Variantlar</h2>
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full min-w-[720px] text-left text-sm'>
            <thead>
              <tr className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
                <th className='pb-2 pr-2 font-medium'>O&apos;lcham</th>
                <th className='pb-2 pr-2 font-medium'>Rang</th>
                <th className='pb-2 pr-2 font-medium'>Hex</th>
                <th className='pb-2 pr-2 font-medium'>Narx</th>
                <th className='pb-2 pr-2 font-medium'>Tannarx</th>
                <th className='pb-2 pr-2 font-medium'>Zaxira</th>
                <th className='pb-2 pr-2 font-medium'>Faol</th>
                <th className='pb-2 pl-2 font-medium' />
              </tr>
            </thead>
            <tbody>
              {product.variants.map(variant => (
                <VariantRow
                  key={variant.id}
                  productId={product.id}
                  variant={variant}
                />
              ))}
              <NewVariantRow productId={product.id} />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
