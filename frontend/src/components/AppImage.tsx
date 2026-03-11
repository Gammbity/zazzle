import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AppImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'children'
> {
  src: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
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
  ...rest
}: AppImageProps) {
  void unoptimized;

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding='async'
      className={cn(fill && 'absolute inset-0 h-full w-full', className)}
      style={fill ? { ...style, inset: 0 } : style}
      {...rest}
    />
  );
}
