'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { descriptionHtml } from '@/lib/business-description';

export function DescriptionEditor({ value, onChange, onBlur, disabled, invalid }: {
  value: string; onChange: (value: string) => void; onBlur: () => void; disabled?: boolean; invalid?: boolean;
}) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, link: { openOnClick: false } })],
    content: descriptionHtml(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    editorProps: { attributes: { id: 'description', role: 'textbox', 'aria-label': 'Description', 'aria-multiline': 'true', 'aria-describedby': 'description-help description-error', class: 'business-rich-text min-h-56 max-h-[32rem] overflow-y-auto p-4 outline-none' } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
    onBlur,
  });
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(descriptionHtml(value), { emitUpdate: false });
    }
  }, [editor, value]);
  useEffect(() => { editor?.view.dom.setAttribute('aria-invalid', String(Boolean(invalid))); }, [editor, invalid]);

  if (!editor) return <p role="status" className="p-4 text-sm">Loading editor...</p>;
  const actions = [
    { label: 'Bold', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', active: editor.isActive('underline'), run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Heading', active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Subheading', active: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bullet list', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Undo', run: () => editor.chain().focus().undo().run(), unavailable: !editor.can().undo() },
    { label: 'Redo', run: () => editor.chain().focus().redo().run(), unavailable: !editor.can().redo() },
  ];
  const addLink = () => {
    try {
      const url = new URL(linkUrl.trim());
      if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error();
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.href }).run();
      setLinkError(''); setLinkUrl('');
    } catch { setLinkError('Enter a valid https://, http:// or mailto: link.'); }
  };
  return <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50 focus-within:ring-2 focus-within:ring-primary-100">
    <div role="group" aria-label="Text formatting" className="flex flex-wrap gap-1 border-b border-ink-200 bg-primary-50 p-2">
      {actions.map(action => <button key={action.label} type="button" aria-pressed={action.active} disabled={disabled || action.unavailable} onClick={action.run} className={`rounded px-2 py-1 text-sm disabled:opacity-40 ${action.active ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-ink-200'}`}>{action.label}</button>)}
    </div>
    <EditorContent editor={editor} />
    <div className="flex flex-wrap items-center gap-2 border-t border-ink-200 p-2">
      <input aria-label="Link URL" placeholder="https://example.com" value={linkUrl} disabled={disabled} onChange={event => setLinkUrl(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLink(); } }} className="min-w-0 flex-1 rounded border border-ink-200 px-2 py-1 text-sm" />
      <button type="button" onClick={addLink} disabled={disabled || !linkUrl.trim()} className="text-sm text-primary-600 disabled:opacity-40">Add link</button>
      <button type="button" onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()} disabled={disabled || !editor.isActive('link')} className="text-sm text-ink-700 disabled:opacity-40">Remove link</button>
    </div>
    {linkError ? <p role="alert" className="px-3 pb-2 text-sm text-red-600">{linkError}</p> : null}
  </div>;
}
