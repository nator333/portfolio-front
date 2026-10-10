/**
 * The home hero's name art plays one entrance effect per page load, rotating
 * through them in order so repeat visitors see each in turn:
 * - wipe:  a soft-edged brush stroke sweeps the art in, left to right
 * - shine: the art is shown at once and a band of light glints across the gold
 * - ink:   the art settles from a soft blur into focus, like ink on paper
 */
export const NAME_ART_EFFECTS = ["wipe", "shine", "ink"] as const;

export type NameArtEffect = (typeof NAME_ART_EFFECTS)[number];

// Index of the next effect to play; per browser, so each visitor gets the
// full rotation regardless of anyone else.
export const NAME_ART_EFFECT_KEY = "name-art-effect-next";

/**
 * Returns this load's effect and advances the rotation. Storage is
 * best-effort: when it is unavailable (private mode, blocked site data) or
 * holds junk, a random effect is picked so the art still animates.
 */
export function nextNameArtEffect(
  storage: Pick<Storage, "getItem" | "setItem"> | null,
  random: () => number = Math.random,
): NameArtEffect {
  const count = NAME_ART_EFFECTS.length;
  try {
    if (storage) {
      const stored = Number.parseInt(storage.getItem(NAME_ART_EFFECT_KEY) ?? "", 10);
      const index = Number.isInteger(stored) && stored >= 0 ? stored % count : 0;
      storage.setItem(NAME_ART_EFFECT_KEY, String((index + 1) % count));
      return NAME_ART_EFFECTS[index];
    }
  } catch {
    // Fall through to a random pick.
  }
  return NAME_ART_EFFECTS[Math.floor(random() * count) % count];
}
