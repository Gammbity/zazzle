// Resolves backend-relative media/static paths to absolute URLs the
// browser can load directly (bypasses the same-origin API proxy on
// purpose — images are served straight from the backend's public port).

export function useMediaUrl() {
  const config = useRuntimeConfig();

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${config.public.mediaUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getStaticUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${config.public.staticUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getImageUrl = (path: string, fallback = '/images/placeholder.png') => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/products/') || path.startsWith('/images/')) return path;
    return getMediaUrl(path);
  };

  return { getMediaUrl, getStaticUrl, getImageUrl };
}
