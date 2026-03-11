import dynamic from 'next/dynamic';

const CalendarWrapper = dynamic(
    () => import('@/components/customizer/CalendarWrapper'),
    { ssr: false }
);

export const metadata = {
    title: "Create your Desk Calendar | Zazzle Clone",
    description: "Customize your own Desk Calendar.",
};

export default function CalendarPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <CalendarWrapper />
        </main>
    );
}
