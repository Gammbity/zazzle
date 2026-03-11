import dynamic from 'next/dynamic';

const TshirtWrapper = dynamic(
    () => import('@/components/customizer/TshirtWrapper'),
    { ssr: false }
);

export const metadata = {
    title: "Create your T-Shirt | Zazzle Clone",
    description: "Customize your own T-Shirt with high-quality prints.",
};

export default function TshirtPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <TshirtWrapper />
        </main>
    );
}
