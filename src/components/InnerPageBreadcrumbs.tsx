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

  return (
    <nav className="inner-page-breadcrumbs" aria-label="Breadcrumb">
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
