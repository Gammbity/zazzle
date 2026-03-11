import dynamic from 'next/dynamic';

const BusinessCardWrapper = dynamic(
    () => import('@/components/customizer/BusinessCardWrapper'),
    { ssr: false }
);

export const metadata = {
    title: "Create your Business Card | Zazzle Clone",
    description: "Customize your own Business Card.",
};

export default function BusinessCardPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <BusinessCardWrapper />
        </main>
    );
}
