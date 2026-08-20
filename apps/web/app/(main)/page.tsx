import { HomeHero } from '@/features/home/components/home-hero';
import { CategoryGridSection } from '@/features/home/components/category-grid-section';
import { TopRankedBento } from '@/features/home/components/top-ranked-bento';
import { RecentReviewsSection } from '@/features/home/components/recent-reviews-section';
import { WriteReviewCtaSection } from '@/features/home/components/write-review-cta-section';
import { GrowBusinessCtaSection } from '@/components/grow-business-cta-section';

// Landing page mirrors Figma "Landing Page" (node 1:361): Hero, Category
// Grid ("Explore by Sector"), Ranking Highlights bento. Same page for guests
// and signed-in users — only the shared header (avatar vs. sign-in) changes,
// matching the Figma mockup which shows the full marketing hero even with a
// logged-in avatar in the nav. The mockup's "Review Carousel" section, once
// dropped for showing fabricated testimonials with no backing endpoint, is
// now replaced by RecentReviewsSection backed by the real GET /reviews/recent
// endpoint. WriteReviewCtaSection is a Trustpilot-style closing CTA.
// GrowBusinessCtaSection is an addition beyond the Figma mockup, pointing
// business owners at /for-business.
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <HomeHero />
      <CategoryGridSection />
      <TopRankedBento />
      <GrowBusinessCtaSection />
      <RecentReviewsSection />
      <WriteReviewCtaSection />
    </main>
  );
}
