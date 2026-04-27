import { lazy, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import HeroSection from '@/components/HeroSection';
import HomeConfidenceSection from '@/components/HomeConfidenceSection';
import NavigationProgress from '@/components/NavigationProgress';
import ProductGrid from '@/components/ProductGrid';
import SkipToContent from '@/components/SkipToContent';
import { getProductBySlug } from '@/lib/products/catalog';
import { Link, matchPath, navigate, useLocation } from '@/lib/router';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import NotFoundPage from '@/pages/NotFoundPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import OrdersPage from '@/pages/OrdersPage';
import ProductDetailPage from '@/pages/ProductDetailPage';

const MugCustomizer = lazy(
  () => import('@/components/customizer/CustomizerWrapper')
);
const TshirtCustomizer = lazy(
  () => import('@/components/customizer/TshirtWrapper')
);
const BusinessCardCustomizer = lazy(
  () => import('@/components/customizer/BusinessCardWrapper')
);
const DeskCalendarCustomizer = lazy(
  () => import('@/components/customizer/CalendarWrapper')
);
const ShopperBagCustomizer = lazy(
  () => import('@/components/customizer/ShopperBagWrapper')
);

function PageLoading() {
  return (
    <div className='flex min-h-[40vh] items-center justify-center'>
      <div className='h-10 w-10 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600' />
    </div>
  );
}

function HomePage() {
  useEffect(() => {
    document.title = 'Zazzle Uzbekistan - Dizayn va bosma platformasi';
  }, []);

  return (
    <main className='min-h-screen'>
      <HeroSection />
      <ProductGrid />
      <HomeConfidenceSection />
    </main>
  );
}

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  useEffect(() => {
    document.title = `${title} | Zazzle Uzbekistan`;
  }, [title]);

  return (
    <main className='mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12'>
      <div className='rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60'>
        <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
          Tez orada
        </p>
        <h1 className='mt-4 text-3xl font-semibold text-slate-900'>{title}</h1>
        <p className='mt-3 max-w-2xl text-base leading-7 text-slate-600'>
          {description}
        </p>
        <div className='mt-6'>
          <Link
            to='/'
            className='inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
          >
            Mahsulotlarga qaytish
          </Link>
        </div>
      </div>
    </main>
  );
}

function LegacyCustomizerPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} | Zazzle Uzbekistan`;
  }, [title]);

  return (
    <main className='flex min-h-screen flex-col bg-slate-50'>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </main>
  );
}

function Redirect({ to, replace = false }: { to: string; replace?: boolean }) {
  useEffect(() => {
    navigate(to, { replace });
  }, [replace, to]);

  return <PageLoading />;
}

const LEGACY_CUSTOMIZERS: Record<
  string,
  { title: string; element: ReactNode }
> = {
  '/products/tshirt': {
    title: 'Futbolka dizayni',
    element: <TshirtCustomizer />,
  },
  '/products/mug': { title: 'Krujka dizayni', element: <MugCustomizer /> },
  '/products/business-card': {
    title: 'Vizitka dizayni',
    element: <BusinessCardCustomizer />,
  },
  '/products/desk-calendar': {
    title: 'Stol kalendari dizayni',
    element: <DeskCalendarCustomizer />,
  },
  '/products/shopper-bag': {
    title: 'Xarid sumkasi dizayni',
    element: <ShopperBagCustomizer />,
  },
};

const STATIC_ROUTES: Record<string, () => ReactNode> = {
  '/': () => <HomePage />,
  '/cart': () => <CartPage />,
  '/checkout': () => <CheckoutPage />,
  '/orders': () => <OrdersPage />,
};

const REDIRECTS: Record<string, { to: string; replace?: boolean }> = {
  '/products': { to: '/#products', replace: true },
  '/basket': { to: '/cart', replace: true },
  '/baskets': { to: '/cart', replace: true },
  '/checkouts': { to: '/checkout', replace: true },
  '/checkouts/': { to: '/checkout', replace: true },
  '/payment': { to: '/orders', replace: true },
  '/payments': { to: '/orders', replace: true },
};

function resolvePage(pathname: string): ReactNode {
  const redirect = REDIRECTS[pathname];
  if (redirect) return <Redirect to={redirect.to} replace={redirect.replace} />;

  const staticPage = STATIC_ROUTES[pathname];
  if (staticPage) return staticPage();

  const legacy = LEGACY_CUSTOMIZERS[pathname];
  if (legacy) {
    return (
      <LegacyCustomizerPage title={legacy.title}>
        {legacy.element}
      </LegacyCustomizerPage>
    );
  }

  const orderMatch = matchPath('/orders/:id', pathname);
  if (orderMatch?.id) return <OrderDetailPage orderLookup={orderMatch.id} />;

  const editorMatch = matchPath('/editor/:draftId', pathname);
  if (editorMatch?.draftId) {
    return (
      <PlaceholderPage
        title={`Qoralama ${editorMatch.draftId}`}
        description='Alohida qoralama muharriri sahifasi uchun joy qoldirilgan. Asosiy dizayn oqimi hozir mahsulot sahifalarida qulaylashtirildi.'
      />
    );
  }

  const productMatch = matchPath('/products/:slug', pathname);
  if (productMatch?.slug) {
    const product = getProductBySlug(productMatch.slug);
    if (product) return <ProductDetailPage product={product} />;
  }

  return <NotFoundPage />;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, location.pathname]);

  const page = useMemo(
    () => resolvePage(location.pathname),
    [location.pathname]
  );

  return (
    <>
      <SkipToContent />
      <NavigationProgress />
      <div id='main-content'>
        <ErrorBoundary>{page}</ErrorBoundary>
      </div>
      <footer className='border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500'>
        <p className='font-medium text-slate-700'>Zazzle Uzbekistan</p>
        <p className='mt-2'>
          Mahsulot tanlash, dizayn qilish va ko'rinishni tekshirish uchun
          soddalashtirilgan sayt.
        </p>
        <p className='mt-3'>
          <Link
            to='/'
            className='font-medium text-sky-700 transition-colors hover:text-sky-800'
          >
            Bosh sahifa
          </Link>
        </p>
      </footer>
    </>
  );
}
