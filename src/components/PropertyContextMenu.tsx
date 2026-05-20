import React from 'react';
import { Pencil, Image, EyeOff, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface PropertyContextMenuProps {
  pos: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onChangeIcon: () => void;
  onHide?: () => void;
  onDelete?: () => void;
}

export function PropertyContextMenu({
  pos,
  onClose,
  onRename,
  onChangeIcon,
  onHide,
  onDelete
}: PropertyContextMenuProps) {
  // Adjust position to stay on screen
  const x = Math.min(pos.x, window.innerWidth - 180);
  const y = Math.min(pos.y, window.innerHeight - 200);

  return (
    <>
      <div className="fixed inset-0 z-[150]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div 
        className="fixed z-[160] w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border)] rounded-xl shadow-2xl py-1"
        style={{ top: y, left: x }}
      >
        <button
          onClick={() => { onRename(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] transition-colors text-left"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Rename Property</span>
        </button>
        <button
          onClick={() => { onChangeIcon(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] transition-colors text-left"
        >
          <Image className="w-3.5 h-3.5" />
          <span>Change Icon</span>
        </button>
        
        {(onHide || onDelete) && (
          <>
            <div className="my-1 h-px bg-[var(--tokyo-border)]" />
            {onHide && (
              <button
                onClick={() => { onHide(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] transition-colors text-left"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Property</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(224,107,138,0.1)] transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Property</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
