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
  /**
   * When true the hero renders no motto lines even though `mottoes` is kept,
   * so they can be hidden and restored without retyping. Absent is treated as
   * false. Keep in sync with the API-side zod schema.
   */
  mottoesHidden?: boolean;
  /**
   * Hero background photos; one is picked at random per visit. Absent or
   * empty keeps the plain black hero.
   */
  backgrounds?: BackgroundPhoto[];
  /**
   * When true the site shows its plain black background even though
   * `backgrounds` is kept, so the photos can be switched off and back on
   * without re-adding them. Absent is treated as false. Keep in sync with the
   * API-side zod schema.
   */
  backgroundsHidden?: boolean;
}

/** One hero background photo. Mirrors backgroundPhotoSchema in the API. */
export interface BackgroundPhoto {
  /** https URL, normally a media asset's w2560 variant. */
  url: string;
  /** Shown in a corner of the hero, e.g. where it was taken. May be empty. */
  caption: string;
  alt?: string;
  /**
   * Overlay darkness as a whole percentage: 0 shows the photo as is, 100 is
   * solid black. Absent means DEFAULT_BACKGROUND_DIM.
   */
  dim?: number;
}

// The hero renders one heading per motto (h1..h4 by position), so the count
// is capped at 4 and each line kept short to preserve the layout. Keep in
// sync with the API-side zod schema.
export const MAX_MOTTO_COUNT = 4;
export const MAX_MOTTO_LENGTH = 40;

// Keep in sync with the API-side zod schema.
export const MAX_BACKGROUND_COUNT = 12;
export const MAX_BACKGROUND_CAPTION_LENGTH = 80;
export const MAX_BACKGROUND_ALT_LENGTH = 200;
export const MAX_BACKGROUND_DIM = 100;

/** Overlay darkness (%) for a photo saved without its own `dim`. */
export const DEFAULT_BACKGROUND_DIM = 55;

/** The overlay colour that darkens `photo` by its `dim` percentage. */
export function backgroundOverlayColor(photo: BackgroundPhoto): string {
  return `rgba(0, 0, 0, ${(photo.dim ?? DEFAULT_BACKGROUND_DIM) / 100})`;
}
