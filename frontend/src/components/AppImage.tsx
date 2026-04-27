import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

interface AppImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'children'
> {
  src: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  fallbackLabel?: string;
}

export default function AppImage({
  src,
  alt,
  fill,
  priority,
  unoptimized,
  className,
  loading,
  style,
  fallbackLabel,
  onError,
  ...rest
}: AppImageProps) {
  void unoptimized;
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (errored || !src) {
    return (
      <ImagePlaceholder
        label={fallbackLabel ?? alt ?? 'Rasm mavjud emas'}
        className={cn(fill && 'absolute inset-0', className)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding='async'
      onError={event => {
        setErrored(true);
        onError?.(event);
      }}
      className={cn(fill && 'absolute inset-0 h-full w-full', className)}
      style={fill ? { ...style, inset: 0 } : style}
      {...rest}
    />
  );
}
