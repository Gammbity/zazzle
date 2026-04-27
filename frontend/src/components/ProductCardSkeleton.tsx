import Skeleton from '@/components/ui/Skeleton';

export default function ProductCardSkeleton() {
  return (
    <div className='flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40'>
      <Skeleton className='aspect-square w-full' rounded='sm' />
      <div className='flex flex-1 flex-col gap-3 p-5'>
        <Skeleton className='h-5 w-3/4' rounded='md' />
        <Skeleton className='h-4 w-full' rounded='md' />
        <Skeleton className='h-4 w-5/6' rounded='md' />
        <div className='mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4'>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-20' rounded='md' />
            <Skeleton className='h-5 w-28' rounded='md' />
          </div>
          <Skeleton className='h-10 w-10' rounded='full' />
        </div>
      </div>
    </div>
  );
}
