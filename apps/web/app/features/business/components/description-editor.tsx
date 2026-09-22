'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { descriptionHtml } from '@/lib/business-description';

export function DescriptionEditor({ value, onChange, onBlur, disabled, invalid }: {
  value: string; onChange: (value: string) => void; onBlur: () => void; disabled?: boolean; invalid?: boolean;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkRange, setLinkRange] = useState({ from: 1, to: 1 });
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
  const openLink = () => {
    if (editor.isActive('link')) editor.commands.extendMarkRange('link');
    const { from, to } = editor.state.selection;
    setLinkRange({ from, to });
    setLinkText(editor.state.doc.textBetween(from, to, ' '));
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setLinkError('');
    setLinkOpen(true);
  };
  const addLink = () => {
    try {
      const input = linkUrl.trim();
      const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`);
      if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error();
      editor.chain().focus().insertContentAt(linkRange, {
        type: 'text', text: linkText.trim() || url.href,
        marks: [{ type: 'link', attrs: { href: url.href } }],
      }).unsetLink().run();
      setLinkOpen(false);
      setLinkError(''); setLinkUrl('');
    } catch { setLinkError('Enter a valid https://, http:// or mailto: link.'); }
  };
  return <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50 focus-within:ring-2 focus-within:ring-primary-100">
    <div role="group" aria-label="Text formatting" className="flex flex-wrap gap-1 border-b border-ink-200 bg-primary-50 p-2">
      {actions.map(action => <button key={action.label} type="button" aria-pressed={action.active} disabled={disabled || action.unavailable} onClick={action.run} className={`rounded px-2 py-1 text-sm disabled:opacity-40 ${action.active ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-ink-200'}`}>{action.label}</button>)}
    </div>
    <EditorContent editor={editor} />
    <div className="border-t border-ink-200 p-3">
      <button type="button" disabled={disabled} onClick={openLink} className="rounded border border-ink-200 px-3 py-2 text-sm text-primary-600">{editor.isActive('link') ? 'Edit link' : 'Insert link'}</button>
      <p className="mt-2 text-xs text-ink-500">Select words to turn them into a link, or insert a new link with its own display text.</p>
    </div>
    <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
      <DialogContent aria-describedby="link-instructions">
        <DialogTitle className="text-lg font-semibold">Insert or edit link</DialogTitle>
        <p id="link-instructions" className="my-3 text-sm text-ink-700">Enter the words readers will see and the page they should open.</p>
        <label className="block text-sm">Display text<input autoFocus value={linkText} onChange={event => setLinkText(event.target.value)} placeholder="View our menu" className="mb-3 mt-1 w-full rounded border border-ink-200 p-2" /></label>
        <label className="block text-sm">Website address<input value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://example.com/menu" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLink(); } }} className="mt-1 w-full rounded border border-ink-200 p-2" /></label>
        <p className="mt-2 text-xs text-ink-500">Example: ?View our menu? opens example.com/menu. Leave display text empty to show the address.</p>
        {linkError ? <p role="alert" className="mt-2 text-sm text-red-600">{linkError}</p> : null}
        <div className="mt-4 flex justify-end gap-3">
          {editor.isActive('link') ? <button type="button" onClick={() => { editor.chain().focus().setTextSelection(linkRange).unsetLink().run(); setLinkOpen(false); }} className="text-sm text-red-600">Remove link</button> : null}
          <button type="button" onClick={() => setLinkOpen(false)} className="text-sm">Cancel</button>
          <button type="button" disabled={disabled || !linkUrl.trim()} onClick={addLink} className="rounded bg-primary-600 px-3 py-2 text-sm text-white disabled:opacity-40">Save link</button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
