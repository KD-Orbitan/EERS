// Leaderboard card rows use flex-wrap with a fixed per-card basis (not CSS
// Grid) so cards keep a consistent, moderate width regardless of how many
// there are — a lone card (e.g. only 1 business trending right now) sits at
// its normal width instead of stretching to fill the whole row.
// Basis math matches a max of 4 columns at gap-4 (1rem): calc((100% - (n-1)*1rem) / n).
export const LEADERBOARD_ROW_CLASS = 'flex flex-wrap gap-4';
export const LEADERBOARD_CARD_CLASS = 'w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]';
