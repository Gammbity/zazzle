import { lazy, Suspense, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import HomeConfidenceSection from '@/components/HomeConfidenceSection';
import NavigationProgress from '@/components/NavigationProgress';
import ProductGrid from '@/components/ProductGrid';
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
  children: React.ReactNode;
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

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = location.hash.slice(1);
    const target = document.getElementById(id);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.pathname]);

  const editorMatch = matchPath('/editor/:draftId', location.pathname);
  const orderMatch = matchPath('/orders/:id', location.pathname);
  const productMatch = matchPath('/products/:slug', location.pathname);

  let page = <NotFoundPage />;

  if (location.pathname === '/') {
    page = <HomePage />;
  } else if (location.pathname === '/products') {
    page = <Redirect to='/#products' replace />;
  } else if (
    location.pathname === '/basket' ||
    location.pathname === '/baskets'
  ) {
    page = <Redirect to='/cart' replace />;
  } else if (
    location.pathname === '/checkouts' ||
    location.pathname === '/checkouts/'
  ) {
    page = <Redirect to='/checkout' replace />;
  } else if (
    location.pathname === '/payment' ||
    location.pathname === '/payments'
  ) {
    page = <Redirect to='/orders' replace />;
  } else if (location.pathname === '/cart') {
    page = <CartPage />;
  } else if (location.pathname === '/checkout') {
    page = <CheckoutPage />;
  } else if (location.pathname === '/orders') {
    page = <OrdersPage />;
  } else if (orderMatch?.id) {
    page = <OrderDetailPage orderLookup={orderMatch.id} />;
  } else if (editorMatch?.draftId) {
    page = (
      <PlaceholderPage
        title={`Qoralama ${editorMatch.draftId}`}
        description='Alohida qoralama muharriri sahifasi uchun joy qoldirilgan. Asosiy dizayn oqimi hozir mahsulot sahifalarida qulaylashtirildi.'
      />
    );
  } else if (location.pathname === '/products/tshirt') {
    page = (
      <LegacyCustomizerPage title='Futbolka dizayni'>
        <TshirtCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/mug') {
    page = (
      <LegacyCustomizerPage title='Krujka dizayni'>
        <MugCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/business-card') {
    page = (
      <LegacyCustomizerPage title='Vizitka dizayni'>
        <BusinessCardCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/desk-calendar') {
    page = (
      <LegacyCustomizerPage title='Stol kalendari dizayni'>
        <DeskCalendarCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/shopper-bag') {
    page = (
      <LegacyCustomizerPage title='Xarid sumkasi dizayni'>
        <ShopperBagCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (productMatch?.slug) {
    const product = getProductBySlug(productMatch.slug);
    page = product ? <ProductDetailPage product={product} /> : <NotFoundPage />;
  }

  return (
    <>
      <NavigationProgress />
      {page}
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
