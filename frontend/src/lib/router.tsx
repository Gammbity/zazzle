import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const LOCATION_CHANGE_EVENT = 'app:location-change';

export interface RouterLocation {
  href: string;
  pathname: string;
  search: string;
  hash: string;
}

interface NavigateOptions {
  replace?: boolean;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

const RouterContext = createContext<RouterLocation | null>(null);

function readLocation(): RouterLocation {
  return {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

function emitLocationChange() {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

export function navigate(to: string, options: NavigateOptions = {}) {
  const url = new URL(to, window.location.origin);

  if (url.origin !== window.location.origin) {
    window.location.assign(url.toString());
    return;
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', nextUrl);
  } else {
    window.history.pushState({}, '', nextUrl);
  }

  emitLocationChange();
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<RouterLocation>(() =>
    readLocation()
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(readLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    };
  }, []);

  return (
    <RouterContext.Provider value={location}>{children}</RouterContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useLocation must be used inside RouterProvider');
  }

  return context;
}

export function useNavigate() {
  return useCallback((to: string, options?: NavigateOptions) => {
    navigate(to, options);
  }, []);
}

export function Link({
  to,
  replace,
  onClick,
  target,
  rel,
  children,
  ...rest
}: LinkProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        target === '_blank' ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      window.dispatchEvent(new CustomEvent('navigation-start'));
      navigate(to, { replace });
    },
    [onClick, replace, target, to]
  );

  return (
    <a href={to} onClick={handleClick} target={target} rel={rel} {...rest}>
      {children}
    </a>
  );
}

export function matchPath(pattern: string, pathname: string) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}
