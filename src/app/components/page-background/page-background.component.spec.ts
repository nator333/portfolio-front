import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { PageBackgroundComponent } from "./page-background.component";
import { environment } from "../../../environments/environment";
import { PageBackgroundService } from "../../services/page-background.service";

describe("PageBackgroundComponent", () => {
  let fixture: ComponentFixture<PageBackgroundComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PageBackgroundComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PageBackgroundComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    document.body.classList.remove("has-page-photo");
  });

  it("should keep the plain black page when no backgrounds are saved", () => {
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({ mottoes: [] });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".page-photo")).toBeNull();
    expect(document.body.classList).not.toContain("has-page-photo");
  });

  it("should render one of the saved photos and mark the body", () => {
    const backgrounds = [
      { url: "https://cdn.example.com/a/w2560.webp", caption: "", alt: "Mt. Hakkai" },
      { url: "https://cdn.example.com/b/w2560.webp", caption: "", alt: "Mt. Hakkai" },
    ];
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({ mottoes: [], backgrounds });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const img = el.querySelector<HTMLImageElement>(".page-photo");
    expect(backgrounds.map((b) => b.url)).toContain(img?.getAttribute("src") ?? "");
    expect(img?.getAttribute("alt")).toBe("Mt. Hakkai");
    expect(document.body.classList).toContain("has-page-photo");
  });

  it("should fade the photo in only once it has loaded", () => {
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({
      mottoes: [],
      backgrounds: [{ url: "https://cdn.example.com/a/w2560.webp", caption: "" }],
    });
    fixture.detectChanges();
    const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(".page-photo")!;
    expect(img.classList).not.toContain("is-loaded");
    img.dispatchEvent(new Event("load"));
    fixture.detectChanges();
    expect(img.classList).toContain("is-loaded");
  });

  it("should keep the same photo for the whole visit", () => {
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({
      mottoes: [],
      backgrounds: [{ url: "https://cdn.example.com/a/w2560.webp", caption: "" }],
    });
    // Re-creating the component (as a re-render would) must not re-fetch or
    // re-pick: the service holds the photo for the rest of the visit.
    const again = TestBed.createComponent(PageBackgroundComponent);
    again.detectChanges();
    httpMock.expectNone(`${environment.apiBaseUrl}/home`);
    expect(
      (again.nativeElement as HTMLElement).querySelector(".page-photo")?.getAttribute("src"),
    ).toBe("https://cdn.example.com/a/w2560.webp");
  });

  it("should keep the plain black page when the photos are hidden", () => {
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({
      mottoes: [],
      backgrounds: [{ url: "https://cdn.example.com/a/w2560.webp", caption: "" }],
      backgroundsHidden: true,
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector(".page-photo")).toBeNull();
    expect(document.body.classList).not.toContain("has-page-photo");
  });

  it("should apply an editor save straight away", () => {
    const a = { url: "https://cdn.example.com/a/w2560.webp", caption: "" };
    const b = { url: "https://cdn.example.com/b/w2560.webp", caption: "" };
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({ mottoes: [], backgrounds: [a] });
    fixture.detectChanges();
    const service = TestBed.inject(PageBackgroundService);
    service.loaded.set(true);

    // Hiding drops back to the plain black page.
    service.apply({ mottoes: [], backgrounds: [a, b], backgroundsHidden: true });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector(".page-photo")).toBeNull();
    expect(document.body.classList).not.toContain("has-page-photo");

    // Showing again picks a photo, which fades in afresh.
    service.apply({ mottoes: [], backgrounds: [a] });
    fixture.detectChanges();
    expect(service.photo()?.url).toBe(a.url);
    expect(service.loaded()).toBe(false);
    expect(document.body.classList).toContain("has-page-photo");

    // A save that still includes the current photo keeps it on screen.
    service.loaded.set(true);
    service.apply({ mottoes: [], backgrounds: [b, a] });
    expect(service.photo()?.url).toBe(a.url);
    expect(service.loaded()).toBe(true);
  });
});
