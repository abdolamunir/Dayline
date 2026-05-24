import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlockNoteEditor, getNodeById } from "@blocknote/core";
import { LinkToolbarExtension, SideMenuExtension } from "@blocknote/core/extensions";
import { en } from "@blocknote/core/locales";
import { flip, offset, safePolygon } from "@floating-ui/react";
import {
  BlockColorsItem,
  DragHandleMenu,
  GenericPopover,
  LinkToolbar,
  SideMenu,
  useBlockNoteEditor,
  useComponentsContext,
  useCreateBlockNote,
  useExtension,
  useExtensionState,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { format, addDays } from 'date-fns';
import {
  AtIcon as AtSign,
  Calendar02Icon as CalendarDays,
  Clock01Icon as Clock,
  Copy01Icon as Copy,
  Delete02Icon as Trash2,
  PaintBrush01Icon as Paintbrush,
  UserIcon as User,
  ZapIcon as Zap,
} from 'hugeicons-react';
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

const cloneBlockForInsert = (block: any): any => {
  const { id: _id, children = [], ...rest } = block;
  return {
    ...rest,
    children: children.map(cloneBlockForInsert),
  };
};

const SIDE_MENU_HEIGHT = 32;
const BLOCKS_WITH_MARKER_GUTTERS = new Set(['checkListItem', 'numberedListItem', 'bulletListItem']);

const getFirstTextClientRect = (element: Element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const text = node.textContent || '';
    const firstVisibleIndex = text.search(/\S/);

    if (firstVisibleIndex !== -1) {
      const range = document.createRange();
      range.setStart(node, firstVisibleIndex);
      range.setEnd(node, Math.min(firstVisibleIndex + 1, text.length));
      const rect = range.getBoundingClientRect();
      range.detach();

      if (rect.height > 0) {
        return rect;
      }
    }

    node = walker.nextNode();
  }

  return null;
};

const getLineAlignedSideMenuRect = (blockNode: Element) => {
  const blockContent =
    blockNode.matches('.bn-block-content[data-content-type]')
      ? blockNode
      : blockNode.querySelector('.bn-block-content[data-content-type], [data-content-type]');
  const contentType = blockContent?.getAttribute('data-content-type') || '';
  const lineElement =
    blockNode.querySelector('.bn-inline-content') ||
    blockNode.querySelector('[data-content-type]') ||
    blockNode;
  const lineRect = getFirstTextClientRect(lineElement) || lineElement.getBoundingClientRect();
  const fallbackRect = blockNode.getBoundingClientRect();
  const sourceRect = lineRect.height > 0 ? lineRect : fallbackRect;
  const top = sourceRect.top + (sourceRect.height - SIDE_MENU_HEIGHT) / 2;
  const left = BLOCKS_WITH_MARKER_GUTTERS.has(contentType)
    ? (blockContent?.getBoundingClientRect().left || fallbackRect.left)
    : sourceRect.left;

  return new DOMRect(left, top, 1, SIDE_MENU_HEIGHT);
};

function DuplicateBlockItem() {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor<any, any, any>();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!block) {
    return null;
  }

  return (
    <Components.Generic.Menu.Item
      className="bn-menu-item dayline-block-menu-item"
      onClick={() => editor.insertBlocks([cloneBlockForInsert(block)], block, "after")}
    >
      <span className="dayline-block-menu-label">
        <Copy className="h-3.5 w-3.5" />
        <span>Duplicate</span>
      </span>
    </Components.Generic.Menu.Item>
  );
}

function DeleteBlockItem() {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor<any, any, any>();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!block) {
    return null;
  }

  return (
    <Components.Generic.Menu.Item
      className="bn-menu-item dayline-block-menu-item dayline-block-menu-delete"
      onClick={() => editor.removeBlocks([block])}
    >
      <span className="dayline-block-menu-label dayline-block-menu-delete">
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </span>
    </Components.Generic.Menu.Item>
  );
}

function DaylineDragHandleMenu() {
  return (
    <DragHandleMenu>
      <BlockColorsItem>
        <span className="dayline-block-menu-label">
          <Paintbrush className="h-3.5 w-3.5" />
          <span>Colors</span>
        </span>
      </BlockColorsItem>
      <DuplicateBlockItem />
      <DeleteBlockItem />
    </DragHandleMenu>
  );
}

function DaylineSideMenu() {
  return <SideMenu dragHandleMenu={DaylineDragHandleMenu} />;
}

function DaylineSideMenuController() {
  const editor = useBlockNoteEditor<any, any, any>();
  const sideMenu = useExtension(SideMenuExtension);
  const state = useExtensionState(SideMenuExtension, {
    selector: (state) => state
      ? {
          show: state.show,
          block: state.block,
        }
      : undefined,
  });
  const { show, block } = state || {};

  const reference = useMemo(() => {
    if (!block?.id) {
      return undefined;
    }

    return editor.transact((tr) => {
      const nodePosInfo = getNodeById(block.id, tr.doc);

      if (!nodePosInfo) {
        return undefined;
      }

      const { node } = editor.prosemirrorView.domAtPos(nodePosInfo.posBeforeNode + 1);

      if (!(node instanceof Element)) {
        return undefined;
      }

      return {
        element: node,
        getBoundingClientRect: () => getLineAlignedSideMenuRect(node),
      };
    });
  }, [block?.id, editor]);

  return (
    <GenericPopover
      reference={reference}
      useFloatingOptions={{
        open: show,
        placement: 'left-start',
      }}
      useDismissProps={{ enabled: false }}
      focusManagerProps={{ disabled: true }}
      elementProps={{
        style: { zIndex: 20 },
        onMouseEnter: () => sideMenu.freezeMenu(),
        onMouseLeave: () => sideMenu.unfreezeMenu(),
      }}
    >
      {block?.id && <DaylineSideMenu />}
    </GenericPopover>
  );
}

function DaylineLinkToolbarController() {
  const editor = useBlockNoteEditor<any, any, any>();
  const linkToolbar = useExtension(LinkToolbarExtension);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [toolbarPositionFrozen, setToolbarPositionFrozen] = useState(false);
  const [link, setLink] = useState<any>();

  useEffect(() => {
    const getHoveredAnchor = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return null;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLElement)) {
        return null;
      }

      const editorElement = editor.domElement;
      return editorElement?.contains(anchor) ? anchor : null;
    };

    const getFirstTextNode = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      return walker.nextNode();
    };

    const getLinkAtAnchor = (anchor: HTMLElement) => {
      const linkAtElement = linkToolbar.getLinkAtElement(anchor);
      if (linkAtElement) {
        return linkAtElement;
      }

      const textNode = getFirstTextNode(anchor);
      if (!textNode) {
        return undefined;
      }

      try {
        const position = editor.prosemirrorView.posAtDOM(textNode, 0) + 1;
        return linkToolbar.getMarkAtPos(position, "link");
      } catch {
        return undefined;
      }
    };

    const textCursorCallback = () => {
      const textCursorLink = linkToolbar.getLinkAtSelection();

      if (!textCursorLink) {
        if (toolbarPositionFrozen) {
          return;
        }

        setLink(undefined);
        setToolbarOpen(false);
        return;
      }

      setLink({
        cursorType: "text",
        url: textCursorLink.mark.attrs.href as string,
        text: textCursorLink.text,
        range: textCursorLink.range,
        element: linkToolbar.getLinkElementAtPos(textCursorLink.range.from),
      });

      if (!toolbarPositionFrozen) {
        setToolbarOpen(true);
      }
    };

    const mouseCursorCallback = (event: PointerEvent) => {
      if (toolbarPositionFrozen || link?.cursorType === "text") {
        return;
      }

      const hoveredAnchor = getHoveredAnchor(event.target);
      if (!hoveredAnchor) return;

      const mouseCursorLink = getLinkAtAnchor(hoveredAnchor);
      if (!mouseCursorLink) {
        return;
      }

      setLink({
        cursorType: "mouse",
        url: mouseCursorLink.mark.attrs.href as string,
        text: mouseCursorLink.text,
        range: mouseCursorLink.range,
        element: linkToolbar.getLinkElementAtPos(mouseCursorLink.range.from) || hoveredAnchor,
      });
      setToolbarOpen(true);
    };

    const destroyOnChangeHandler = editor.onChange(textCursorCallback);
    const destroyOnSelectionChangeHandler = editor.onSelectionChange(textCursorCallback);

    document.addEventListener("pointerover", mouseCursorCallback, true);
    document.addEventListener("pointermove", mouseCursorCallback, true);

    return () => {
      destroyOnChangeHandler();
      destroyOnSelectionChangeHandler();
      document.removeEventListener("pointerover", mouseCursorCallback, true);
      document.removeEventListener("pointermove", mouseCursorCallback, true);
    };
  }, [editor, editor.domElement, link?.cursorType, linkToolbar, toolbarPositionFrozen]);

  const reference = useMemo(
    () => (link?.element ? { element: link.element, cacheMountedBoundingClientRect: true } : undefined),
    [link?.element],
  );

  if (!editor.isEditable) {
    return null;
  }

  return (
    <GenericPopover
      reference={reference}
      useFloatingOptions={{
        open: toolbarOpen,
        onOpenChange: (open, _event, reason) => {
          if (toolbarPositionFrozen) {
            return;
          }

          if (link?.cursorType === "text" && reason === "hover") {
            return;
          }

          if (reason === "escape-key") {
            editor.focus();
          }

          setToolbarOpen(open);
        },
        placement: "top-start",
        middleware: [offset(10), flip()],
      }}
      useHoverProps={{
        enabled: link?.cursorType === "mouse",
        delay: { open: 250, close: 250 },
        handleClose: safePolygon(),
      }}
      focusManagerProps={{ disabled: true }}
      elementProps={{
        style: { zIndex: 50 },
      }}
    >
      {link && (
        <LinkToolbar
          url={link.url}
          text={link.text}
          range={link.range}
          setToolbarOpen={setToolbarOpen}
          setToolbarPositionFrozen={setToolbarPositionFrozen}
        />
      )}
    </GenericPopover>
  );
}

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

  const isNodeInsideEditor = (node: Node | null | undefined) => {
    const editorElement = editor.domElement;
    return Boolean(node && editorElement?.contains(node));
  };

  const hasActiveEditorSelection = () => {
    const editorElement = editor.domElement;
    const selection = window.getSelection();
    const activeElement = document.activeElement;

    return Boolean(
      editorElement &&
      activeElement &&
      editorElement.contains(activeElement) &&
      selection &&
      selection.rangeCount > 0 &&
      (isNodeInsideEditor(selection.anchorNode) || isNodeInsideEditor(selection.focusNode))
    );
  };

  const updateMentionMenu = () => {
    if (!hasActiveEditorSelection()) {
      setMentionMenu(null);
      mentionRangeRef.current = null;
      return;
    }

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

  // Keep BlockNote hover checks stable when the side menu is rendered outside
  // the editor element. This makes ancestor `.contains()` checks include menus.
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

    patchAncestors();

    return () => {
      active = false;
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
    const editorElement = editor.domElement;
    if (!editorElement) return;

    const disableNativeWritingAids = () => {
      const editorNodes = [
        editorElement,
        ...Array.from(editorElement.querySelectorAll<HTMLElement>('*')),
      ];

      editorNodes.forEach((element) => {
        element.setAttribute('spellcheck', 'false');
        element.setAttribute('autocorrect', 'off');
        element.setAttribute('autocapitalize', 'off');
        element.setAttribute('data-ms-editor', 'false');
      });
    };

    disableNativeWritingAids();

    const observer = new MutationObserver(disableNativeWritingAids);
    observer.observe(editorElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [editor]);

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
      if (!isEditorEvent(event)) {
        setMentionMenu(null);
        mentionRangeRef.current = null;
        return;
      }
      updateMentionMenu();
    };

    const handleNativeInput = (event: Event) => {
      if (!isEditorEvent(event)) {
        setMentionMenu(null);
        mentionRangeRef.current = null;
        return;
      }
      updateMentionMenu();
    };

    const handleNativePointerDown = (event: PointerEvent) => {
      if (!isEditorEvent(event)) {
        setMentionMenu(null);
        mentionRangeRef.current = null;
      }
    };

    const handleNativeBlur = () => {
      window.setTimeout(() => setMentionMenu(null), 120);
    };

    document.addEventListener('keydown', handleNativeKeyDown, true);
    document.addEventListener('keyup', handleNativeKeyUp, true);
    document.addEventListener('input', handleNativeInput, true);
    document.addEventListener('pointerdown', handleNativePointerDown, true);
    document.addEventListener('blur', handleNativeBlur, true);
    const mentionWatcher = window.setInterval(updateMentionMenu, 180);

    return () => {
      document.removeEventListener('keydown', handleNativeKeyDown, true);
      document.removeEventListener('keyup', handleNativeKeyUp, true);
      document.removeEventListener('input', handleNativeInput, true);
      document.removeEventListener('pointerdown', handleNativePointerDown, true);
      document.removeEventListener('blur', handleNativeBlur, true);
      window.clearInterval(mentionWatcher);
    };
  }, [editor, filteredMentionItems, mentionMenu, selectedMentionIndex]);

  return (
    <div className="relative">
      <BlockNoteView 
        editor={editor} 
        theme="dark" 
        linkToolbar={false}
        sideMenu={false}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
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
      >
        <DaylineSideMenuController />
        <DaylineLinkToolbarController />
      </BlockNoteView>
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
