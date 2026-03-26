import { useCallback, useRef, useState } from 'react';
import AppImage from '@/components/AppImage';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ImageUploadProps {
  onImageSelected: (url: string | null) => void;
  className?: string;
}

export default function ImageUpload({
  onImageSelected,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Iltimos, PNG, JPG yoki WebP rasm yuklang.');
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError("Fayl hajmi 5 MB dan kichik bo'lishi kerak.");
        return;
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelected(url);
    },
    [onImageSelected, preview]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onImageSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onImageSelected, preview]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label className='text-sm font-medium text-gray-700'>
        Dizayn rasmini yuklang
      </label>

      <div
        role='button'
        tabIndex={0}
        aria-label='Dizayn rasmini yuklash'
        onClick={() => inputRef.current?.click()}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={event => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        )}
      >
        {preview ? (
          <div className='relative h-32 w-32'>
            <AppImage
              src={preview}
              alt="Yuklangan dizayn ko'rinishi"
              fill
              className='rounded-lg object-contain'
              unoptimized
            />
          </div>
        ) : (
          <>
            <svg
              className='h-10 w-10 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1'
              />
            </svg>
            <p className='text-sm text-gray-600'>
              <span className='font-medium text-primary-600'>Bosing</span> yoki
              sudrab tashlang
            </p>
            <p className='text-xs text-gray-400'>
              PNG, JPG yoki WebP, eng ko'pi 5 MB
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='.png,.jpg,.jpeg,.webp'
        onChange={handleChange}
        className='sr-only'
        aria-hidden='true'
      />

      {error && (
        <p className='text-sm text-red-600' role='alert'>
          {error}
        </p>
      )}

      {preview && (
        <button
          type='button'
          onClick={handleClear}
          className='self-start text-sm font-medium text-gray-500 underline transition-colors hover:text-gray-700'
        >
          Rasmni olib tashlash
        </button>
      )}
    </div>
  );
}
