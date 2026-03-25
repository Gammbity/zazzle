import dynamic from 'next/dynamic';

const CustomizerWrapper = dynamic(
    () => import('@/components/customizer/CustomizerWrapper'),
    { ssr: false }
);

export const metadata = {
    title: 'Krujka dizayni | Zazzle Uzbekistan',
    description: "Krujkangiz uchun dizayn tayyorlang va ko'rinishini tekshiring.",
};

export default function CustomizerPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <CustomizerWrapper />
        </main>
    );
}
