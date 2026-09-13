# Admin demo data

`apps/api/prisma/seed-admin-demo.ts` adds a separate demo batch without resetting the database. Entries are marked `[Demo]`; user/business emails use the reserved `example.invalid` domain and prefix `admin-demo-20260913`. Demo passwords are random and undisclosed.

Run from `apps/api` with an explicit environment file:

```powershell
# Preview only (no writes)
node --env-file=.env -r ts-node/register prisma/seed-admin-demo.ts
# Insert missing demo records
node --env-file=.env -r ts-node/register prisma/seed-admin-demo.ts --apply
```

Use the appropriate environment file for the intended database. Base roles and an active administrator must already exist. The seed runs in a transaction with an advisory lock. Re-running skips existing records and preserves moderation changes.

| Collection | Planned records | States |
| --- | ---: | --- |
| Users | 90 | 70 active, 10 inactive, 10 banned |
| Businesses | 210 | 60 pending, 110 approved, 20 rejected, 20 hidden |
| Ownership claims | 90 | 60 pending, 15 approved, 15 rejected |
| Reviews | 160 | 80 pending, 40 approved, 20 rejected, 20 hidden |
| Reports | 100 | 60 pending, 15 reviewing, 15 resolved, 10 rejected |
| Notifications | 60 per active admin | 45 unread, 15 read |
| Categories / criteria | Up to 12 each | Existing names are reused |

Only newly created categories receive demo criterion assignments/weights. Reviews use the selected category's actual criteria. Business average ratings are refreshed for newly inserted reviews; ranking snapshots update on the regular recalculation cycle.

## List behavior

- Businesses and users retain server-side search and pagination.
- Claims search business name, claimant name/email and message.
- Reviews search business name, author name/email and content.
- Reports search reporter name/email, reason, description, review content and business name.
- Notifications search title/content, always scoped to the signed-in user.
- These APIs accept `search` (up to 200 characters), `page` and `limit`; search is case-insensitive and combines with the status/read filter. Counts are computed after filtering, before pagination. Ordering includes the record ID to break timestamp ties.
- Categories, criteria, assignments and criterion weights search their complete reference collection and display 10 results per page in the browser. Weights retain drafts across pages; the sum includes all criteria.
- Scoring and ranking-trend configuration are forms rather than record lists.

Try searching `[Demo]`, `Sen`, a claimant name or a phrase in a review. Check page 2 in the Pending queues, switch filters, and mark a notification as read. Search/filter changes reset the page; if moderation removes the last result on the last page, pagination returns to the last available page automatically.
