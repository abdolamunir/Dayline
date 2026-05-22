import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlockNoteEditor } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { format, addDays } from 'date-fns';
import { AtIcon as AtSign, Calendar02Icon as CalendarDays, Clock01Icon as Clock, UserIcon as User, ZapIcon as Zap } from 'hugeicons-react';
import { useAppStore } from '../store';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

type MentionMenuItem = {
  title: string;
  subtext: string;
  icon: React.ReactElement;
  insertText: string;
  aliases?: string[];
};

export function BlockEditor({ initialContent, onChange }: { initialContent: any, onChange: (content: string) => void }) {
  const { user } = useAppStore();
  const [mentionMenu, setMentionMenu] = useState<{ x: number; y: number; query: string } | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const mentionRangeRef = useRef<Range | null>(null);
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
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        default: "Type / for commands",
      },
    },
  });

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Abdolamunir';
  const today = new Date();

  const mentionItems: MentionMenuItem[] = useMemo(() => [
    {
      title: displayName,
      subtext: user?.email ? 'Mention user' : 'Mention me',
      icon: <User className="w-4 h-4" />,
      insertText: `@${displayName}`,
      aliases: ['user', 'me', 'person', displayName],
    },
    {
      title: 'Today',
      subtext: format(today, 'EEE MMM d'),
      icon: <CalendarDays className="w-4 h-4" />,
      insertText: format(today, 'EEE MMM d'),
      aliases: ['date', 'today'],
    },
    {
      title: 'Tomorrow',
      subtext: format(addDays(today, 1), 'EEE MMM d'),
      icon: <CalendarDays className="w-4 h-4" />,
      insertText: format(addDays(today, 1), 'EEE MMM d'),
      aliases: ['date', 'tomorrow'],
    },
    {
      title: 'Current Time',
      subtext: format(today, 'h:mm a'),
      icon: <Clock className="w-4 h-4" />,
      insertText: format(today, 'h:mm a'),
      aliases: ['time', 'now'],
    },
    {
      title: 'Action Item',
      subtext: 'Insert a todo marker',
      icon: <Zap className="w-4 h-4" />,
      insertText: 'TODO: ',
      aliases: ['todo', 'task', 'action'],
    },
  ], [displayName, today, user?.email]);

  const filteredMentionItems = useMemo(() => {
    if (!mentionMenu?.query) {
      return mentionItems;
    }

    const normalizedQuery = mentionMenu.query.trim().toLowerCase();

    return mentionItems.filter((item) => {
      const searchable = [item.title, item.subtext, ...(item.aliases || [])].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [mentionItems, mentionMenu?.query]);

  const updateMentionMenu = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setMentionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      setMentionMenu(null);
      return;
    }

    const anchorNode = selection.anchorNode;
    const textBeforeCursor = anchorNode?.textContent?.slice(0, selection.anchorOffset) || '';
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match) {
      setMentionMenu(null);
      return;
    }

    const mentionRange = range.cloneRange();
    const triggerLength = match[0].startsWith(' ') ? match[0].length - 1 : match[0].length;

    try {
      mentionRange.setStart(anchorNode!, selection.anchorOffset - triggerLength);
    } catch {
      setMentionMenu(null);
      return;
    }

    mentionRangeRef.current = mentionRange;

    const rect = range.getBoundingClientRect();
    const editorRect = editor.domElement?.getBoundingClientRect();
    setMentionMenu({
      x: rect.left || editorRect?.left || 0,
      y: (rect.bottom || editorRect?.top || 0) + 10,
      query: match[1] || '',
    });
    setSelectedMentionIndex(0);
  };

  const insertMentionItem = (item: MentionMenuItem) => {
    const selection = window.getSelection();
    const range = mentionRangeRef.current;
    const text = `${item.insertText} `;

    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('insertText', false, text);
    }

    setMentionMenu(null);
    requestAnimationFrame(() => onChange(JSON.stringify(editor.document)));
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent) => {
    if (!mentionMenu) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setMentionMenu(null);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedMentionIndex((index) => (index + 1) % Math.max(filteredMentionItems.length, 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedMentionIndex((index) => (index - 1 + Math.max(filteredMentionItems.length, 1)) % Math.max(filteredMentionItems.length, 1));
    }

    if ((event.key === 'Enter' || event.key === 'Tab') && filteredMentionItems[selectedMentionIndex]) {
      event.preventDefault();
      insertMentionItem(filteredMentionItems[selectedMentionIndex]);
    }
  };

  // Dynamic DOM ancestor contains-method patching & capturing event interceptor to solve side-menu hover instability.
  // 1. We override `.contains` on all ancestors of .ProseMirror, ensuring parent-descendant checks in BlockNote succeed when hovering the side-menu.
  // 2. We intercept `mousemove` in the capturing phase on window, stopping it from propagating when over the side-menu, which prevents BlockNote from executing close/hide triggers.
  useEffect(() => {
    let active = true;
    const patchedElements: Map<HTMLElement, typeof HTMLElement.prototype.contains> = new Map();

    const patchAncestors = () => {
      if (!active) return;

      const proseMirrorElements = document.querySelectorAll('.ProseMirror');
      proseMirrorElements.forEach((pmEl) => {
        let current: HTMLElement | null = pmEl as HTMLElement;
        while (current && current !== document.documentElement) {
          if (!patchedElements.has(current)) {
            const originalContains = current.contains;
            current.contains = function(other) {
              if (other && other instanceof Node) {
                let checkEl: HTMLElement | null = other as HTMLElement;
                while (checkEl && checkEl !== document.documentElement) {
                  if (checkEl.classList && (
                    checkEl.classList.contains('bn-side-menu') || 
                    checkEl.classList.contains('bn-formatting-toolbar') ||
                    checkEl.classList.contains('bn-suggestion-menu')
                  )) {
                    return true;
                  }
                  checkEl = checkEl.parentElement;
                }
              }
              return originalContains.call(this, other);
            };
            patchedElements.set(current, originalContains);
          }
          current = current.parentElement;
        }
      });

      requestAnimationFrame(patchAncestors);
    };

    const handleMouseMoveCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && typeof target.closest === 'function') {
        const isOverSideMenu = target.closest('.bn-side-menu') || target.classList?.contains('bn-side-menu');
        if (isOverSideMenu) {
          event.stopPropagation();
        }
      }
    };

    patchAncestors();
    window.addEventListener('mousemove', handleMouseMoveCapture, true);

    return () => {
      active = false;
      window.removeEventListener('mousemove', handleMouseMoveCapture, true);
      patchedElements.forEach((originalContains, element) => {
        try {
          element.contains = originalContains;
        } catch (e) {
          // Ignore
        }
      });
    };
  }, []);

  useEffect(() => {
    const isEditorEvent = (event: Event) => {
      const editorElement = editor.domElement;
      if (!event.target) {
        return false;
      }

      if (editorElement?.contains(event.target as Node)) {
        return true;
      }

      return event.target instanceof Element && !!event.target.closest('.bn-editor, .ProseMirror, [contenteditable="true"]');
    };

    const handleNativeKeyDown = (event: KeyboardEvent) => {
      if (mentionMenu && isEditorEvent(event)) {
        handleEditorKeyDown(event as unknown as React.KeyboardEvent);
      }
    };

    const handleNativeKeyUp = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
        return;
      }
      updateMentionMenu();
    };

    const handleNativeBlur = () => {
      window.setTimeout(() => setMentionMenu(null), 120);
    };

    document.addEventListener('keydown', handleNativeKeyDown, true);
    document.addEventListener('keyup', handleNativeKeyUp, true);
    document.addEventListener('input', updateMentionMenu, true);
    document.addEventListener('blur', handleNativeBlur, true);
    const mentionWatcher = window.setInterval(updateMentionMenu, 180);

    return () => {
      document.removeEventListener('keydown', handleNativeKeyDown, true);
      document.removeEventListener('keyup', handleNativeKeyUp, true);
      document.removeEventListener('input', updateMentionMenu, true);
      document.removeEventListener('blur', handleNativeBlur, true);
      window.clearInterval(mentionWatcher);
    };
  }, [editor, filteredMentionItems, mentionMenu, selectedMentionIndex]);

  return (
    <div className="relative">
      <BlockNoteView 
        editor={editor} 
        theme="dark" 
        onKeyDown={handleEditorKeyDown}
        onKeyUp={(event) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
            return;
          }
          updateMentionMenu();
        }}
        onBlurCapture={() => {
          window.setTimeout(() => setMentionMenu(null), 120);
        }}
        onChange={() => {
          onChange(JSON.stringify(editor.document));
        }} 
      />
      {mentionMenu && filteredMentionItems.length > 0 && (
        <div
          className="bn-suggestion-menu dayline-mention-menu-content fixed z-[180]"
          style={{ top: mentionMenu.y, left: mentionMenu.x }}
        >
          {filteredMentionItems.map((item, index) => (
            <button
              key={`${item.title}-${item.insertText}`}
              type="button"
              className={index === selectedMentionIndex ? 'selected' : undefined}
              onMouseDown={(event) => {
                event.preventDefault();
                insertMentionItem(item);
              }}
            >
              <span className="dayline-mention-menu-icon">{item.icon || <AtSign className="w-4 h-4" />}</span>
              <span className="dayline-mention-menu-copy">
                <span>{item.title}</span>
                <small>{item.subtext}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
