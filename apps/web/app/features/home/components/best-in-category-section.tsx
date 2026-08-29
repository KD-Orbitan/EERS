import { TopRankedCategorySection } from '@/features/ranking/components/top-ranked-category-section';

// Home-page wrapper around the shared TopRankedCategorySection (the category
// of the #1 overall-ranked business) — adds the same px-4 py-16 / max-w-7xl
// shell every other home section uses (see CategoryGridSection,
// TopRankedBento). No extra heading here: CategoryLeaderboardRow already
// renders its own "Best in {category}" title, same as on /rankings.
export function BestInCategorySection() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <TopRankedCategorySection />
      </div>
    </div>
  );
}
