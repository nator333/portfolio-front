import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { HomeComponent } from "./home.component";
import { DEFAULT_MOTTOES } from "../../models/home-data";
import { environment } from "../../../environments/environment";

describe("HomeComponent", () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushHome(mottoes: string[]): void {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/home`)
      .flush({ mottoes });
    fixture.detectChanges();
  }

  it("should render the default motto lines with descending heading levels", () => {
    flushHome([]);
    const el: HTMLElement = fixture.nativeElement;
    DEFAULT_MOTTOES.forEach((motto, i) => {
      const heading = el.querySelector(`.motto-section h${i + 1}`);
      expect(heading?.textContent)
        .withContext(`motto ${i} should be an h${i + 1}`)
        .toContain(motto);
    });
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

  it("should keep the default mottoes when the request fails", () => {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/home`)
      .flush({ message: "nope" }, { status: 500, statusText: "Server Error" });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".motto-section h1")?.textContent).toContain(
      DEFAULT_MOTTOES[0],
    );
  });

  it("should render the signature image with its alt text", () => {
    flushHome([]);
    const img = fixture.nativeElement.querySelector(
      ".signature-image",
    ) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(component.sighInfo[0]);
    expect(img.getAttribute("alt")).toBe(component.sighInfo[1]);
  });

  it("should render the profile name and title", () => {
    flushHome([]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".profile-name")?.textContent).toContain(
      component.profile[0],
    );
    expect(el.querySelector(".profile-title")?.textContent).toContain(
      component.profile[1],
    );
  });

  it("should credit the name artist with a link", () => {
    flushHome([]);
    const link = fixture.nativeElement.querySelector(
      ".artist-link",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(component.kappiInfo[0]);
    expect(link.textContent).toContain(component.kappiInfo[1]);
  });
});
