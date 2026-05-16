import React from 'react';
import { Delete02Icon as Trash2, Refresh01Icon as RotateCcw, Delete01Icon as TrashIcon, File01Icon as File, Folder01Icon as Folder, Target01Icon as Target, Layers01Icon as Layers, Folder02Icon as FolderKanban, PencilEdit01Icon as Pencil } from 'hugeicons-react';
import { useAppStore } from '../store';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

export function Trash() {
  const { trash, restoreFromTrash, emptyTrash, moveToTrash } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'page': return File;
      case 'folder': return Folder;
      case 'goal': return Target;
      case 'area': return Layers;
      case 'project': return FolderKanban;
      case 'note': return Pencil;
      default: return File;
    }
  };

  const getItemName = (item: any) => {
    return item.data.title || item.data.name || 'Untitled';
  };

  const [isConfirmEmptyOpen, setIsConfirmEmptyOpen] = React.useState(false);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)]">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--tokyo-text-strong)] tracking-tight">Trash</h1>
            <p className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-base">Deleted items are stored here. You can restore them or empty the trash.</p>
          </div>
        </div>
        {trash.length > 0 && (
          <div className="relative">
            <button 
              onClick={() => setIsConfirmEmptyOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,77,125,0.12)] text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.2)] transition-colors text-sm font-medium"
            >
              <TrashIcon className="w-4 h-4" />
              Empty Trash
            </button>
            
            {isConfirmEmptyOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-sm text-[var(--tokyo-text)] mb-4">Are you sure you want to permanently delete all items in the trash?</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      emptyTrash();
                      setIsConfirmEmptyOpen(false);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--tokyo-pink)] text-white text-xs font-bold hover:bg-[var(--tokyo-pink)] transition-colors"
                  >
                    Empty
                  </button>
                  <button 
                    onClick={() => setIsConfirmEmptyOpen(false)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-muted)] text-xs font-bold hover:bg-[var(--tokyo-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {trash.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[var(--tokyo-hover)] flex items-center justify-center text-white/10">
            <Trash2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--tokyo-text-muted)]">Trash is empty</h3>
            <p className="text-sm text-[var(--tokyo-text-faint)]">Items you delete will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {trash.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <div 
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--tokyo-hover)] border border-[var(--tokyo-border)] hover:bg-white/[0.07] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)] transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[var(--tokyo-text-strong)] truncate">{getItemName(item)}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-white/20">{item.type}</span>
                    <span className="text-white/10">•</span>
                    <span className="text-xs text-[var(--tokyo-text-faint)]">Deleted {format(new Date(item.deletedAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => restoreFromTrash(item.id)}
                    className="p-2 rounded-lg hover:bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-green)] transition-colors"
                    title="Restore"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
