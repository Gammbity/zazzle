import dynamic from 'next/dynamic';

const CustomizerWrapper = dynamic(
    () => import('@/components/customizer/CustomizerWrapper'),
    { ssr: false }
);

export const metadata = {
    title: "Create your Mug | Zazzle Clone",
    description: "Customize your own mug in standard 3D quality.",
};

export default function CustomizerPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <CustomizerWrapper />
        </main>
    );
}
