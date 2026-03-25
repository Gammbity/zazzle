import dynamic from 'next/dynamic';

const BusinessCardWrapper = dynamic(
    () => import('@/components/customizer/BusinessCardWrapper'),
    { ssr: false }
);

export const metadata = {
    title: 'Vizitka dizayni | Zazzle Uzbekistan',
    description: "Vizitkangiz uchun dizayn tayyorlang va ko'rinishini tekshiring.",
};

export default function BusinessCardPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <BusinessCardWrapper />
        </main>
    );
}
