import { isChunkLoadError } from "./chunk-reload";

describe("isChunkLoadError", () => {
  it("matches known lazy-chunk import failures across engines", () => {
    const messages = [
      "ChunkLoadError: Loading chunk 493 failed.",
      "Loading chunk blog-post failed.",
      "Failed to fetch dynamically imported module: https://x/chunk-ABC.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
    ];
    for (const message of messages) {
      expect(isChunkLoadError(new Error(message)))
        .withContext(message)
        .toBeTrue();
    }
  });

  it("ignores unrelated errors", () => {
    expect(isChunkLoadError(new Error("Blog post not found"))).toBeFalse();
    expect(isChunkLoadError(new Error("Http failure response: 500"))).toBeFalse();
    expect(isChunkLoadError(undefined)).toBeFalse();
    expect(isChunkLoadError(null)).toBeFalse();
  });
});
