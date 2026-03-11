import dynamic from 'next/dynamic';

const ShopperBagWrapper = dynamic(
    () => import('@/components/customizer/ShopperBagWrapper'),
    { ssr: false }
);

export const metadata = {
    title: "Create your Shopper Bag | Zazzle Clone",
    description: "Customize your own Shopper Bag.",
};

export default function ShopperBagPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <ShopperBagWrapper />
        </main>
    );
}
