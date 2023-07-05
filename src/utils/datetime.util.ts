import { DateTime } from 'luxon';

const MM_DD_YYYY = 'mm/dd/yyyy';
const YYYYMMDD = 'yyyyMMdd';
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
  Convert a MM/dd/yyyy date-value to ISO yyyy-MM-dd string format
*/
export function fromLocal_MMddyyyy(dateVal: string): string {
  const dt = DateTime.fromFormat(dateVal, 'MM/dd/yyyy');
  return dt.toISODate();
}

/*
  Convert a COB yyyyMMdd ISO date-value to ISO yyyy-MM-dd string format
*/
export function fromISO_YYYYMMDD(dateVal: string): string {
    const dt = DateTime.fromISO(dateVal);
    return dt.toISODate();
}