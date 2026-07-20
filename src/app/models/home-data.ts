/**
 * Editable content of the home page hero, stored behind the portfolio-api
 * /home endpoint. Mirrors lambda/home-schema.ts in portfolio-api.
 */
export interface HomeData {
  /**
   * null means the item was never saved; the front renders it the same as
   * an empty array (no motto lines).
   */
  mottoes: string[] | null;
}

// The hero renders one heading per motto (h1..h4 by position), so the count
// is capped at 4 and each line kept short to preserve the layout. Keep in
// sync with the API-side zod schema.
export const MAX_MOTTO_COUNT = 4;
export const MAX_MOTTO_LENGTH = 40;
