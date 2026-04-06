'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import React from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export default function TiptapEditor({
  content,
  onChange,
  editable = true,
}: TiptapEditorProps) {
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none w-full">
      <EditorContent
        editor={editor}
        className="
          outline-none
          text-base
          leading-relaxed
          max-w-3xl
          mx-auto
          px-4
          py-6
          text-[var(--text)]
          [&_.tiptap]:outline-none
          [&_.tiptap_p]:my-3
          [&_.tiptap_h1]:text-3xl
          [&_.tiptap_h1]:font-bold
          [&_.tiptap_h1]:my-4
          [&_.tiptap_h2]:text-2xl
          [&_.tiptap_h2]:font-bold
          [&_.tiptap_h2]:my-3
          [&_.tiptap_h3]:text-xl
          [&_.tiptap_h3]:font-bold
          [&_.tiptap_h3]:my-2
          [&_.tiptap_ul]:list-disc
          [&_.tiptap_ul]:ml-5
          [&_.tiptap_ol]:list-decimal
          [&_.tiptap_ol]:ml-5
          [&_.tiptap_li]:my-1
          [&_.tiptap_blockquote]:border-l-4
          [&_.tiptap_blockquote]:border-[var(--accent)]
          [&_.tiptap_blockquote]:pl-4
          [&_.tiptap_blockquote]:italic
          [&_.tiptap_blockquote]:text-[var(--text-secondary)]
          [&_.tiptap_pre]:bg-[var(--surface)]
          [&_.tiptap_pre]:rounded
          [&_.tiptap_pre]:p-3
          [&_.tiptap_pre]:overflow-x-auto
          [&_.tiptap_code]:bg-[var(--surface)]
          [&_.tiptap_code]:px-1
          [&_.tiptap_code]:rounded
          [&_.tiptap_code]:text-sm
          [&_.tiptap_a]:text-[var(--accent)]
          [&_.tiptap_a]:underline
          [&_.tiptap_a]:cursor-pointer
          [&_.tiptap_strong]:font-bold
          [&_.tiptap_em]:italic
        "
      />
    </div>
  );
}
