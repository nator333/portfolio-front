import { drawioFence, findDrawioFences, parseDrawioMessage } from "./drawio-embed.util";

describe("findDrawioFences", () => {
  it("should find a closed drawio fence and its XML", () => {
    const lines = ["intro", "```drawio", "<mxfile>", "</mxfile>", "```", "outro"];

    expect(findDrawioFences(lines)).toEqual([
      { startLine: 1, endLine: 4, xml: "<mxfile>\n</mxfile>" },
    ]);
  });

  it("should ignore an unclosed drawio fence", () => {
    expect(findDrawioFences(["```drawio", "<mxfile/>"])).toEqual([]);
  });

  it("should ignore a drawio fence quoted inside another fence", () => {
    const lines = ["````markdown", "```drawio", "<mxfile/>", "```", "````"];

    expect(findDrawioFences(lines)).toEqual([]);
  });

  it("should find several fences separated by other code", () => {
    const lines = ["```drawio", "a", "```", "```ts", "x", "```", "```drawio", "b", "```"];

    expect(findDrawioFences(lines).map((fence) => fence.xml)).toEqual(["a", "b"]);
  });
});

describe("drawioFence", () => {
  it("should round-trip through findDrawioFences", () => {
    const fence = drawioFence("  <mxfile/>\n");

    expect(fence).toBe("```drawio\n<mxfile/>\n```");
    expect(findDrawioFences(fence.split("\n"))[0].xml).toBe("<mxfile/>");
  });
});

describe("parseDrawioMessage", () => {
  it("should parse a save event", () => {
    const message = parseDrawioMessage('{"event":"save","xml":"<mxfile/>","exit":true}');

    expect(message).toEqual({ event: "save", xml: "<mxfile/>", exit: true });
  });

  it("should ignore non-string, non-JSON and event-less payloads", () => {
    expect(parseDrawioMessage({ event: "save" })).toBeNull();
    expect(parseDrawioMessage("not json")).toBeNull();
    expect(parseDrawioMessage('{"action":"load"}')).toBeNull();
  });
});
