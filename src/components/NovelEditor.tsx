import React from 'react';
import { EditorRoot, EditorContent } from 'novel';

export function NovelEditor({ initialContent, onUpdate }: any) {
  return (
    <EditorRoot>
      <EditorContent 
        initialContent={initialContent} 
        onUpdate={({ editor }) => onUpdate(editor.getHTML())}
        className="prose prose-invert max-w-none"
      />
    </EditorRoot>
  );
}
