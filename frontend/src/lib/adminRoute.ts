export interface AdminRouteMatch {
  /** URL prefix admin links should be built from, e.g. '/admin' or '/print-uz-lab/admin'. */
  base: string;
  /** Production-center slug from the URL, or null for the generic '/admin'. */
  slug: string | null;
  /** Remainder of the path after the admin base, e.g. '', '/orders', '/orders/12'. */
  rest: string;
}

const SLUG_ADMIN_PATTERN = /^\/([a-z0-9-]+)\/admin(\/.*)?$/;

/**
 * Recognizes both the generic '/admin(/...)' shell and a per-partner
 * '/<production-center-slug>/admin(/...)' alias so each partner can bookmark
 * their own entry point into the same admin UI (see AdminGuard for the
 * access check that keeps a partner's staff scoped to their own slug).
 */
export function matchAdminRoute(pathname: string): AdminRouteMatch | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return { base: '/admin', slug: null, rest: pathname.slice('/admin'.length) };
  }

  const match = pathname.match(SLUG_ADMIN_PATTERN);
  if (match) {
    return { base: `/${match[1]}/admin`, slug: match[1], rest: match[2] ?? '' };
  }

  return null;
}
