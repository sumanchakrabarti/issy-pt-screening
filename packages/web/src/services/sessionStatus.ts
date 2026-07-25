import type { ScreeningSession } from '../types';

type Status = ScreeningSession['status'];

const STATUS_LABELS: Record<Status, string> = {
  in_progress: 'In Progress',
  needs_review: 'Needs Review',
  completed: 'Completed',
  consultation_requested: 'Consultation Requested',
  archived: 'Archived',
};

const STATUS_BADGE_CLASS: Record<Status, string> = {
  in_progress: 'badge-gray',
  needs_review: 'badge-amber',
  completed: 'badge-green',
  consultation_requested: 'badge-blue',
  archived: 'badge-gray',
};

/** Human-friendly label for a screening status (falls back to the raw value). */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

/** Badge CSS class for a screening status. */
export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASS[status as Status] ?? 'badge-gray';
}
