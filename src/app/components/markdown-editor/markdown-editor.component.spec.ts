import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MarkdownEditorComponent } from "./markdown-editor.component";
import { MediaService } from "../../services/media.service";
import { DRAWIO_EMBED_ORIGIN } from "../../utils/drawio-embed.util";

describe("MarkdownEditorComponent draw.io editing", () => {
  let fixture: ComponentFixture<MarkdownEditorComponent>;
  let values: string[];

  const fence = "```drawio\n<mxfile>old</mxfile>\n```";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownEditorComponent],
      providers: [{ provide: MediaService, useValue: {} }],
    }).compileComponents();
    fixture = TestBed.createComponent(MarkdownEditorComponent);
    values = [];
    fixture.componentInstance.registerOnChange((value) => values.push(value));
    fixture.componentInstance.writeValue(`Intro\n\n${fence}\n\nOutro`);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const chips = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(".drawio-chip"));

  const iframe = (): HTMLIFrameElement | null =>
    fixture.nativeElement.querySelector(".drawio-overlay iframe");

  function sendFromEditor(data: object, origin = DRAWIO_EMBED_ORIGIN): void {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify(data),
        origin,
        source: iframe()!.contentWindow,
      }),
    );
    fixture.detectChanges();
  }

  it("should collapse a drawio fence into a click-to-edit chip", () => {
    expect(chips().length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain("<mxfile>");
  });

  it("should open the draw.io iframe when a chip is clicked", () => {
    chips()[0].click();
    fixture.detectChanges();

    expect(iframe()?.src).toContain("embed.diagrams.net");
  });

  it("should load the chip's XML when the draw.io editor is ready", () => {
    chips()[0].click();
    fixture.detectChanges();
    const posted = spyOn(iframe()!.contentWindow!, "postMessage");

    sendFromEditor({ event: "init" });

    const [data, origin] = posted.calls.mostRecent().args as unknown as [string, string];
    expect(JSON.parse(data)).toEqual({ action: "load", xml: "<mxfile>old</mxfile>" });
    expect(origin).toBe(DRAWIO_EMBED_ORIGIN);
  });

  it("should replace the edited fence and close on save and exit", () => {
    chips()[0].click();
    fixture.detectChanges();

    sendFromEditor({ event: "save", xml: "<mxfile>new</mxfile>", exit: true });

    const value = values[values.length - 1];
    expect(value).toBe("Intro\n\n```drawio\n<mxfile>new</mxfile>\n```\n\nOutro");
    expect(iframe()).toBeNull();
    expect(chips().length).toBe(1);
  });

  it("should update, not duplicate, a new diagram saved twice in one session", () => {
    fixture.componentInstance["editor"]!.codemirror.setCursor({ line: 0, ch: 5 });
    fixture.componentInstance["openDrawio"](null);
    fixture.detectChanges();

    sendFromEditor({ event: "save", xml: "<mxfile>v1</mxfile>", exit: false });
    sendFromEditor({ event: "save", xml: "<mxfile>v2</mxfile>", exit: true });

    const value = values[values.length - 1];
    expect(value).toContain("<mxfile>v2</mxfile>");
    expect(value).not.toContain("v1");
    expect(chips().length).toBe(2);
  });

  it("should ignore messages from any other origin", () => {
    chips()[0].click();
    fixture.detectChanges();

    sendFromEditor({ event: "save", xml: "<mxfile>evil</mxfile>", exit: true }, "https://evil.example");

    expect(values.length).toBe(0);
    expect(iframe()).not.toBeNull();
  });
});
