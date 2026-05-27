import React from 'react';
import { ArrowRight01Icon as ChevronRight } from 'hugeicons-react';
import { useAppStore } from '../store';

interface InnerPageBreadcrumbsProps {
  pageId: string;
  pageLabel: string;
  itemLabel: string;
  onPageClick?: () => void;
}

export function InnerPageBreadcrumbs({ pageId, pageLabel, itemLabel, onPageClick }: InnerPageBreadcrumbsProps) {
  const { sidebarItems } = useAppStore();
  const itemById = new Map(sidebarItems.map((item) => [item.id, item]));
  const pageItem = itemById.get(pageId);
  const parentLabels: string[] = [];
  let parentId = pageItem?.parentId;

  while (parentId) {
    const parentItem = itemById.get(parentId);
    if (!parentItem) break;
    parentLabels.unshift(parentItem.label);
    parentId = parentItem.parentId;
  }

  return (
    <nav className="inner-page-breadcrumbs" aria-label="Breadcrumb">
      {parentLabels.map((label) => (
        <React.Fragment key={label}>
          <span className="inner-page-breadcrumb-muted">{label}</span>
          <ChevronRight className="inner-page-breadcrumb-separator" />
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={onPageClick}
        className="inner-page-breadcrumb-link"
      >
        {pageItem?.label || pageLabel}
      </button>
      <ChevronRight className="inner-page-breadcrumb-separator" />
      <span className="inner-page-breadcrumb-current">{itemLabel || 'Untitled'}</span>
    </nav>
  );
}
