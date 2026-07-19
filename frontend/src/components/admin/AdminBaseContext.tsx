import { createContext, useContext, type ReactNode } from 'react';

interface AdminBaseValue {
  base: string;
  slug: string | null;
}

const AdminBaseContext = createContext<AdminBaseValue>({
  base: '/admin',
  slug: null,
});

export function AdminBaseProvider({
  base,
  slug,
  children,
}: AdminBaseValue & { children: ReactNode }) {
  return (
    <AdminBaseContext.Provider value={{ base, slug }}>
      {children}
    </AdminBaseContext.Provider>
  );
}

export function useAdminBase() {
  return useContext(AdminBaseContext);
}

/** Builds a link under the current admin base, e.g. adminPath('/orders'). */
export function useAdminPath() {
  const { base } = useAdminBase();
  return (sub: string) => `${base}${sub}`;
}
