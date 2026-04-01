import React from 'react';
import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export function BlockEditor({ initialContent, onChange }: { initialContent: any, onChange: (content: string) => void }) {
  let parsedContent = undefined;
  if (initialContent) {
    try {
      parsedContent = JSON.parse(initialContent);
      if (!Array.isArray(parsedContent)) {
        parsedContent = undefined;
      }
    } catch (e) {
      // If it's not JSON, create a paragraph block with the text
      parsedContent = [
        {
          type: "paragraph",
          content: initialContent,
        }
      ];
    }
  }

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  return (
    <BlockNoteView 
      editor={editor} 
      theme="dark" 
      onChange={() => {
        onChange(JSON.stringify(editor.document));
      }} 
    />
  );
}
