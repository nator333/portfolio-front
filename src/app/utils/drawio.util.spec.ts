import { drawioViewerConfig, runDrawio } from "./drawio.util";

describe("runDrawio", () => {
  const xml = '<mxfile><diagram id="a"></diagram></mxfile>';
  let container: HTMLElement;
  let rendered: HTMLElement[];

  beforeEach(() => {
    rendered = [];
    // Stub the viewer so the script is never fetched from viewer.diagrams.net.
    window.GraphViewer = {
      createViewerForElement: (element: HTMLElement) => {
        rendered.push(element);
      },
    };
    container = document.createElement("div");
    const pre = document.createElement("pre");
    pre.className = "drawio";
    pre.textContent = xml;
    container.appendChild(pre);
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    delete window.GraphViewer;
  });

  it("should replace a drawio pre block with a viewer host carrying the XML", async () => {
    await runDrawio(container);

    expect(container.querySelector("pre.drawio")).toBeNull();
    expect(rendered.length).toBe(1);
    const config = JSON.parse(rendered[0].getAttribute("data-mxgraph") ?? "{}");
    expect(config.xml).toBe(xml);
    expect(config.toolbar).toContain("layers");
  });

  it("should not render the same block twice when called again", async () => {
    await runDrawio(container);
    await runDrawio(container);

    expect(rendered.length).toBe(1);
  });
});

describe("drawioViewerConfig", () => {
  it("should enable navigation so links and collapsible groups work", () => {
    expect(drawioViewerConfig("<mxfile/>")["nav"]).toBeTrue();
  });
});
