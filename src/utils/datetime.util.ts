import { DateTime } from 'luxon';

/**
 * Function that validates if date is sent in valid Date SQL format
 * @param value string date
 */
export function validateDateTime(value: string): boolean {
    const dt = DateTime.fromSQL(value);

    console.log(dt.invalidExplanation);
    return dt.isValid;
}

/*
  Convert a COB 10-digit date-value to yyyy-MM-dd string format
*/
export function toDate(dateVal: string): string {
    const dt = DateTime.fromISO(dateVal);
    return dt.toISODate();
}