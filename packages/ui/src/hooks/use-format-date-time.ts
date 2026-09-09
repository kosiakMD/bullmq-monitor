import type { Maybe } from '@/typings/utils';
import day from 'dayjs';
import { DateFormatsConfig } from '@/config/ui';

/**
 * Formats a timestamp with the format the host application configured
 * (`ui.dateFormats`), falling back to an ISO-like default.
 */
export const useFormatDateTime = (
  date?: Maybe<day.ConfigType>,
  format: string = DateFormatsConfig.short
): Maybe<string> => {
  if (!date) {
    return null;
  }
  return day(date).format(format);
};
