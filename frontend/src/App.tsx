import { lazy, Suspense, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import NavigationProgress from '@/components/NavigationProgress';
import ProductGrid from '@/components/ProductGrid';
import { getProductBySlug } from '@/lib/products/catalog';
import { Link, matchPath, navigate, useLocation } from '@/lib/router';
import NotFoundPage from '@/pages/NotFoundPage';
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
      <div className='h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600' />
    </div>
  );
}

function HomePage() {
  useEffect(() => {
    document.title = 'Zazzle Uzbekistan - Custom Print on Demand';
  }, []);

  return (
    <main className='min-h-screen'>
      <HeroSection />
      <ProductGrid />
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
    <main className='mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-4 py-8'>
      <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
      <p className='max-w-2xl text-gray-500'>{description}</p>
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
  } else if (location.pathname === '/cart') {
    page = (
      <PlaceholderPage
        title='Cart'
        description='Cart page React SPA ga ko‘chirildi. Backend bilan ulash keyingi bosqichda davom ettiriladi.'
      />
    );
  } else if (location.pathname === '/checkout') {
    page = (
      <PlaceholderPage
        title='Checkout'
        description='Checkout sahifasi React router ostida ishlaydi. API integratsiyasi hozirgi backend bilan keyin ulanishi mumkin.'
      />
    );
  } else if (location.pathname === '/orders') {
    page = (
      <PlaceholderPage
        title='My Orders'
        description='Buyurtmalar sahifasi React SPA ichiga ko‘chirildi.'
      />
    );
  } else if (orderMatch?.id) {
    page = (
      <PlaceholderPage
        title={`Order ${orderMatch.id}`}
        description='Buyurtma tafsilotlari sahifasi React router orqali ochiladi.'
      />
    );
  } else if (editorMatch?.draftId) {
    page = (
      <PlaceholderPage
        title={`Editor - Draft ${editorMatch.draftId}`}
        description='Draft editor sahifasi React router ostida placeholder ko‘rinishda saqlab qolindi.'
      />
    );
  } else if (location.pathname === '/products/tshirt') {
    page = (
      <LegacyCustomizerPage title='Create your T-Shirt'>
        <TshirtCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/mug') {
    page = (
      <LegacyCustomizerPage title='Create your Mug'>
        <MugCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/business-card') {
    page = (
      <LegacyCustomizerPage title='Create your Business Card'>
        <BusinessCardCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/desk-calendar') {
    page = (
      <LegacyCustomizerPage title='Create your Desk Calendar'>
        <DeskCalendarCustomizer />
      </LegacyCustomizerPage>
    );
  } else if (location.pathname === '/products/shopper-bag') {
    page = (
      <LegacyCustomizerPage title='Create your Shopper Bag'>
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
      <footer className='border-t border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500'>
        <p>
          React SPA frontend running on the Django backend.{' '}
          <Link
            to='/'
            className='font-medium text-primary-600 hover:text-primary-700'
          >
            Home
          </Link>
        </p>
      </footer>
    </>
  );
}
