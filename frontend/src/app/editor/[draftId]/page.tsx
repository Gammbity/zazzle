'use client';

import { useParams } from 'next/navigation';

export default function EditorPage() {
  const params = useParams<{ draftId: string }>();

  return (
    <main className='mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4'>
      <h1 className='text-xl font-semibold'>Editor – Draft {params.draftId}</h1>
      {/* TODO: integrate Konva/Fabric canvas, S3 upload, and draft save APIs */}
      <div className='h-80 rounded border border-dashed border-gray-300 bg-gray-50' />
    </main>
  );
}

