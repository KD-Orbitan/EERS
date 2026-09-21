import sanitizeHtml from 'sanitize-html';

const isHtml = (value: string) => /<\/?[a-z][^>]*>/i.test(value);
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Existing descriptions are plain text. Escape them before importing into the editor.
export function descriptionHtml(value: string): string {
  const html = isHtml(value) ? value : `<p>${escapeText(value).replace(/\r?\n/g, '<br>')}</p>`;
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }) },
  });
}

// The result is escaped text HTML: safe to insert, without nested links inside cards.
export function descriptionExcerpt(value: string): string {
  return sanitizeHtml(descriptionHtml(value).replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, ' '), {
    allowedTags: [], allowedAttributes: {},
  }).trim();
}
