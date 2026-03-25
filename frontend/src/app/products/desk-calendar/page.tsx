import dynamic from 'next/dynamic';

const CalendarWrapper = dynamic(
    () => import('@/components/customizer/CalendarWrapper'),
    { ssr: false }
);

export const metadata = {
    title: 'Stol kalendari dizayni | Zazzle Uzbekistan',
    description: "Stol kalendari uchun dizayn tayyorlang va ko'rinishini tekshiring.",
};

export default function CalendarPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <CalendarWrapper />
        </main>
    );
}
