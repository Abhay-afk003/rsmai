import Sidebar from '@/components/sidebar';
import MobileHeader from '@/components/mobile-header';
import ScraperPage from '@/components/scraper-page';

export default function Home() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <MobileHeader />
        <main className="flex flex-1 flex-col">
          <ScraperPage />
        </main>
      </div>
    </div>
  );
}
