import Link from 'next/link';

const PRODUCT_LINKS = [
  { to: '/products/t-shirt', label: 'Futbolka' },
  { to: '/products/mug', label: 'Krujka' },
  { to: '/products/business-card', label: 'Vizitka' },
  { to: '/products/desk-calendar', label: 'Stol kalendari' },
  { to: '/products/pen', label: 'Ruchka' },
];

const CONTACT_LINKS = [
  { label: 'Kontakt' },
  { label: 'Telegram' },
  { label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className='mt-auto w-full bg-brand-surface-low'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-4'>
          <span className='text-xl font-extrabold text-brand'>
            Zazzle Uzbekistan
          </span>
          <p className='text-sm leading-6 text-brand-muted'>
            © {new Date().getFullYear()} Zazzle Uzbekistan. Barcha huquqlar
            himoyalangan.
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <h3 className='mb-1 text-sm font-bold text-[#1b1c1b]'>Bog'lanish</h3>
          {CONTACT_LINKS.map(link => (
            <span
              key={link.label}
              className='cursor-pointer text-sm text-brand-muted transition-colors hover:text-brand'
            >
              {link.label}
            </span>
          ))}
        </div>

        <div className='flex flex-col gap-2'>
          <h3 className='mb-1 text-sm font-bold text-[#1b1c1b]'>Katalog</h3>
          {PRODUCT_LINKS.map(link => (
            <Link
              key={link.to}
              href={link.to}
              className='text-sm text-brand-muted transition-colors hover:text-brand'
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
