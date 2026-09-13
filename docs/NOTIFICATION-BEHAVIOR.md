# Notification behavior

- `isRead=false` returns unread notifications, `isRead=true` returns read notifications, and omission returns both. The DTO parses the original query value because implicit Boolean conversion treats the string `"false"` as true.
- Unread rows have a tinted background and a dot. Read rows have a plain background and no dot. Both remain navigable links, including in the notification bell.
- Opening an unread notification marks it read. Repeated clicks are deduplicated while the request is pending; the server never toggles read state back to unread. Queries in flight are canceled before read mutations, then the inbox and unread count are refreshed from the server.
- New notifications store an optional internal `targetPath`. Business notifications open the related dashboard/edit page; review approvals and replies open the referenced review on its business's reviews page. Rejected reviews open My Reviews. Reports and claims open the corresponding management/list pages.
- Older notifications have no entity reference and open the related collection based on type. External URLs are not used as notification destinations.
- Migration `20260913090000_notification_target_path` adds a nullable column and preserves existing content and read states. Apply it before deploying the updated API.

Validation: API regression tests exercise the production `ValidationPipe` configuration, repeated read operations and destination persistence. Run `node scripts/test-notifications.mjs` from `apps/web` to check link targets and read/unread rendering.
