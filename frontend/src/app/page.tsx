import type { Metadata } from 'next';
import ReferenceLandingPage from '@/components/ReferenceLandingPage';

export const metadata: Metadata = {
  title: 'Dizayn qiling va buyurtma bering',
  description:
    'Futbolka, krujka va boshqa mahsulotlarga o‘z dizayningizni joylashtiring. Jonli preview bilan buyurtma bering.',
};

export default function Page() {
  return <ReferenceLandingPage />;
}
