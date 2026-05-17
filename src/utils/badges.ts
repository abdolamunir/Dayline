import { Priority } from '../types';

export function getPriorityBadgeClasses(priority?: Priority | string) {
  switch (priority) {
    case 'high':
      return 'bg-[rgba(112,31,45,0.54)] text-[#f0a0a8]';
    case 'low':
      return 'bg-[rgba(44,88,64,0.48)] text-[#9fddb4]';
    case 'medium':
    default:
      return 'bg-[rgba(112,88,26,0.52)] text-[#ead66c]';
  }
}

export function getPriorityDotClasses(priority?: Priority | string) {
  switch (priority) {
    case 'high':
      return 'bg-[#9b3f50]';
    case 'low':
      return 'bg-[#3f8a61]';
    case 'medium':
    default:
      return 'bg-[#8a741f]';
  }
}

export function getPriorityBorderClasses(priority?: Priority | string) {
  switch (priority) {
    case 'high':
      return 'border-[#a95464]';
    case 'low':
      return 'border-[#5aa777]';
    case 'medium':
    default:
      return 'border-[#a08a2c]';
  }
}
