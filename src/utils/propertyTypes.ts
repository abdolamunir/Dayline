import { PropertyType } from '../types';

export const PROPERTY_TYPE_OPTIONS: Array<{
  id: PropertyType;
  label: string;
  icon: string;
  desc: string;
}> = [
  { id: 'text', label: 'Text', icon: 'Text', desc: 'Plain text' },
  { id: 'number', label: 'Number', icon: 'Hash', desc: 'Numerical values' },
  { id: 'select', label: 'Select', icon: 'Layers', desc: 'Choose from options' },
  { id: 'multi-select', label: 'Multi-select', icon: 'List', desc: 'Choose multiple options' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', desc: 'Track state' },
  { id: 'date', label: 'Date', icon: 'CalendarIcon', desc: 'Calendar date' },
  { id: 'person', label: 'Person', icon: 'Users', desc: 'Assignee or owner' },
  { id: 'files', label: 'Files & media', icon: 'Attachment', desc: 'Attach files' },
  { id: 'checkbox', label: 'Checkbox', icon: 'CheckCircle', desc: 'True or false' },
  { id: 'url', label: 'URL', icon: 'Link', desc: 'Web link' },
  { id: 'email', label: 'Email', icon: 'AtSign', desc: 'Email address' },
  { id: 'phone', label: 'Phone', icon: 'Phone', desc: 'Phone number' },
  { id: 'formula', label: 'Formula', icon: 'Hash', desc: 'Calculated value' },
  { id: 'relation', label: 'Relation', icon: 'ArrowUpRight', desc: 'Link records' },
  { id: 'rollup', label: 'Rollup', icon: 'Search', desc: 'Summarize relation' },
  { id: 'created-time', label: 'Created time', icon: 'Clock', desc: 'Creation timestamp' },
  { id: 'created-by', label: 'Created by', icon: 'User', desc: 'Creator person' },
  { id: 'last-edited-time', label: 'Last edited time', icon: 'Clock', desc: 'Latest edit time' },
  { id: 'last-edited-by', label: 'Last edited by', icon: 'User', desc: 'Latest editor' },
  { id: 'button', label: 'Button', icon: 'Plus', desc: 'Trigger an action' },
  { id: 'place', label: 'Place', icon: 'MapPin', desc: 'Location' },
  { id: 'id', label: 'ID', icon: 'Hash', desc: 'Unique identifier' },
];

export const getPropertyTypeLabel = (type: PropertyType) => (
  PROPERTY_TYPE_OPTIONS.find(option => option.id === type)?.label || type
);

export const getPropertyTypeIcon = (type: PropertyType) => (
  PROPERTY_TYPE_OPTIONS.find(option => option.id === type)?.icon || 'Text'
);

export const getDefaultPropertyValue = (type: PropertyType) => {
  if (type === 'number') return 0;
  if (type === 'checkbox') return false;
  if (type === 'created-time' || type === 'last-edited-time') return new Date().toISOString();
  if (type === 'created-by' || type === 'last-edited-by' || type === 'person') return 'Abdola Munir';
  return '';
};
