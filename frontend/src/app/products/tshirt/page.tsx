import dynamic from 'next/dynamic';

const TshirtWrapper = dynamic(
    () => import('@/components/customizer/TshirtWrapper'),
    { ssr: false }
);

export const metadata = {
    title: 'Futbolka dizayni | Zazzle Uzbekistan',
    description: "Futbolkangiz uchun dizayn tayyorlang va bosmaga mos holatda tekshiring.",
};

export default function TshirtPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <TshirtWrapper />
        </main>
    );
}
