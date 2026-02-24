import ProductGrid from '@/components/ProductGrid';
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ProductGrid />
    </main>
  );
}