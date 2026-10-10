import {
  NAME_ART_EFFECT_KEY,
  NAME_ART_EFFECTS,
  nextNameArtEffect,
} from "./name-art-effect.util";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("nextNameArtEffect", () => {
  it("should cycle through every effect in order, then wrap around", () => {
    const storage = memoryStorage();
    const seen = Array.from({ length: NAME_ART_EFFECTS.length + 1 }, () =>
      nextNameArtEffect(storage),
    );
    expect(seen).toEqual([...NAME_ART_EFFECTS, NAME_ART_EFFECTS[0]]);
  });

  it("should resume the rotation from what the last visit stored", () => {
    const storage = memoryStorage({ [NAME_ART_EFFECT_KEY]: "2" });
    expect(nextNameArtEffect(storage)).toBe(NAME_ART_EFFECTS[2]);
    expect(storage.data[NAME_ART_EFFECT_KEY]).toBe("0");
  });

  it("should restart the rotation when the stored value is junk", () => {
    for (const junk of ["abc", "-1", ""]) {
      const storage = memoryStorage({ [NAME_ART_EFFECT_KEY]: junk });
      expect(nextNameArtEffect(storage)).toBe(NAME_ART_EFFECTS[0]);
    }
  });

  it("should pick at random when storage is missing or throws", () => {
    expect(nextNameArtEffect(null, () => 0.99)).toBe(NAME_ART_EFFECTS[2]);
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };
    expect(nextNameArtEffect(throwing, () => 0)).toBe(NAME_ART_EFFECTS[0]);
  });
});
