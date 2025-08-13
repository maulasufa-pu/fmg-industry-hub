// src/lib/validators.ts

export interface ProjectSubmission {
  songTitle: string;
  artistName?: string;
  genre?: string;
  total: number;
  referenceLinks?: string;
  preferredEngineerId?: string;
  paymentPlan: 'upfront' | 'half' | 'split';
}

export function validateProjectSubmission(data: unknown): ProjectSubmission {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request data');
  }

  const submission = data as Partial<ProjectSubmission>;

  if (!submission.songTitle?.trim()) {
    throw new Error('Song title is required');
  }

  if (typeof submission.total !== 'number' || submission.total <= 0) {
    throw new Error('Valid total amount is required');
  }

  if (!['upfront', 'half', 'split'].includes(submission.paymentPlan as string)) {
    throw new Error('Invalid payment plan');
  }

  // Optional fields validation
  if (submission.referenceLinks) {
    const links = submission.referenceLinks.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const link of links) {
      try {
        new URL(link);
      } catch {
        throw new Error(`Invalid reference link: ${link}`);
      }
    }
  }

  if (submission.preferredEngineerId && !/^[0-9a-f-]{36}$/.test(submission.preferredEngineerId)) {
    throw new Error('Invalid engineer ID format');
  }

  return submission as ProjectSubmission;
}

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function sanitizeNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }
  return 0;
}
