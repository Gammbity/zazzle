import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkipToContent from '@/components/SkipToContent';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen flex-col'>
      <SkipToContent />
      <Navbar />
      <div id='main-content' className='flex-1'>
        {children}
      </div>
      <Footer />
    </div>
  );
}
