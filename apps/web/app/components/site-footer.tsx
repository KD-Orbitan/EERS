import Link from 'next/link';

// Trimmed-down Trustpilot-style footer: brand column + a few real link
// columns (no fabricated legal/press/social links, since those pages don't
// exist in this app — same "don't link to nothing" principle already
// applied to the admin and owner-dashboard sidebars).
const FOOTER_COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: 'Discover',
    links: [
      { label: 'Directory', href: '/businesses' },
      { label: 'Leaderboards', href: '/rankings' },
      { label: 'Bookmarks', href: '/bookmarks' },
    ],
  },
  {
    heading: 'For Businesses',
    links: [
      { label: 'List Your Business', href: '/businesses/create' },
      { label: 'My Businesses', href: '/businesses/my' },
    ],
  },
  {
    heading: 'Company',
    links: [{ label: 'About Us', href: '/about' }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="font-serif text-xl font-bold text-white">
              EERS
            </Link>
            <p className="mt-2 text-sm text-white/60">Enterprise Evaluation &amp; Ranking System</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">{column.heading}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
          &copy; {new Date().getFullYear()} EERS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
