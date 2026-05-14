import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description: "Print-on-demand, dizayn, brending bo'yicha maqolalar.",
};

const POSTS = [
  {
    slug: 'krujkaga-rasm-chop-etish',
    title: 'Krujkaga rasm chop etish — eng yaxshi 10 g‘oya',
    excerpt:
      "Sevimli odamingiz uchun esdalik sovg'a, korporativ buyurtma yoki shaxsiy ijodingiz uchun krujka dizayni.",
    readMin: 5,
  },
  {
    slug: 'korporativ-sovgalar-uzbekiston',
    title: "O'zbekistonda korporativ sovg'a tanlash",
    excerpt: "Hodimlar, mijozlar va sheriklar uchun esda qoladigan sovg'alar — to'g'ri tanlov qilish bo'yicha qo'llanma.",
    readMin: 7,
  },
  {
    slug: 'futbolka-dizayn-trendlari-2026',
    title: 'Futbolka dizayn trendlari 2026',
    excerpt: "Yil davomida nimalar mashhur bo'ladi: minimalizm, retro grafika, lokal madaniyat motivlari.",
    readMin: 6,
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-brand-700">Blog</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Maqolalar va g‘oyalar
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            Dizayn, brending, korporativ sovg‘alar bo‘yicha foydali ma‘lumotlar.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <ul className="space-y-4">
            {POSTS.map(p => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex gap-5 rounded-[var(--radius-card)] border border-ink-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <BookOpen className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h2 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700">
                      {p.title}
                    </h2>
                    <p className="mt-1 text-sm text-ink-600">{p.excerpt}</p>
                    <span className="mt-3 text-xs font-medium text-ink-500">
                      {p.readMin} daqiqada o‘qiladi
                    </span>
                  </div>
                  <ArrowRight className="mt-2 hidden h-5 w-5 shrink-0 text-ink-400 transition group-hover:translate-x-1 group-hover:text-brand-600 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
