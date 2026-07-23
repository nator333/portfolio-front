import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { HomeComponent } from "./home.component";
import { environment } from "../../../environments/environment";

describe("HomeComponent", () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // ngOnInit also loads blog posts for the activity calendar; drain that
    // request so the /home assertions below can focus on the hero.
    httpMock.expectOne(`${environment.apiBaseUrl}/blog`).flush({ posts: [] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushHome(mottoes: string[] | null): void {
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush({ mottoes });
    fixture.detectChanges();
  }

  it("should render no motto lines when the item was never saved", () => {
    flushHome(null);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".motto-section h1")).toBeNull();
  });

  it("should render API-provided mottoes when the endpoint returns them", () => {
    flushHome(["First Line", "Second Line"]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".motto-section h1")?.textContent).toContain(
      "First Line",
    );
    expect(el.querySelector(".motto-section h2")?.textContent).toContain(
      "Second Line",
    );
    expect(el.querySelector(".motto-section h3")).toBeNull();
  });

  it("should render no motto lines when the saved list was cleared", () => {
    flushHome([]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".motto-section h1")).toBeNull();
  });

  it("should render no motto lines when the request fails", () => {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/home`)
      .flush({ message: "nope" }, { status: 500, statusText: "Server Error" });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".motto-section h1")).toBeNull();
  });

  it("should render the signature image with its alt text", () => {
    flushHome(null);
    const img = fixture.nativeElement.querySelector(
      ".signature-image",
    ) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(component.sighInfo[0]);
    expect(img.getAttribute("alt")).toBe(component.sighInfo[1]);
  });

  it("should render the profile name and title", () => {
    flushHome(null);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".profile-name")?.textContent).toContain(
      component.profile[0],
    );
    expect(el.querySelector(".profile-title")?.textContent).toContain(
      component.profile[1],
    );
  });

  it("should credit the name artist with a link", () => {
    flushHome(null);
    const link = fixture.nativeElement.querySelector(
      ".artist-link",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(component.kappiInfo[0]);
    expect(link.textContent).toContain(component.kappiInfo[1]);
  });

  it("should derive calendar contributions from entries", () => {
    flushHome(null);
    component.entries.set([
      { date: "2026-07-20", type: "blog", title: "a" },
      { date: "2026-07-20", type: "blog", title: "b" },
    ]);
    expect(component.contributions()).toEqual([
      { date: "2026-07-20", count: 2 },
    ]);
  });

  it("should toggle the selected date on repeated selection", () => {
    flushHome(null);
    expect(component.selectedDate()).toBeNull();
    component.onDaySelected("2026-07-20");
    expect(component.selectedDate()).toBe("2026-07-20");
    component.onDaySelected("2026-07-20");
    expect(component.selectedDate()).toBeNull();
  });
});
