import dynamic from 'next/dynamic';

const ShopperBagWrapper = dynamic(
    () => import('@/components/customizer/ShopperBagWrapper'),
    { ssr: false }
);

export const metadata = {
    title: 'Xarid sumkasi dizayni | Zazzle Uzbekistan',
    description: "Xarid sumkasi uchun dizayn tayyorlang va ko'rinishini tekshiring.",
};

export default function ShopperBagPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <ShopperBagWrapper />
        </main>
    );
}
