import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { PlacesComponent } from "./places.component";
import { PlacesData } from "../../models/places-data";
import { environment } from "../../../environments/environment";

const SAMPLE: PlacesData = {
  memories: [
    {
      id: "m_1",
      city: "minamiuonuma",
      x: 0.58,
      y: 0.5,
      name: "Muikamachi Station",
      kind: "play",
      period: "High school years",
      text: "Waited for the Joetsu Line here every morning.",
      seasons: [],
      photos: [],
      mapsUrl: "",
      lat: null,
      lng: null,
      createdAt: 1,
    },
    {
      id: "m_2",
      city: "minamiuonuma",
      x: 0.4,
      y: 0.9,
      name: "Ishiuchi Maruyama",
      kind: "play",
      period: "",
      text: "Night skiing.",
      seasons: ["winter"],
      photos: [],
      mapsUrl: "",
      lat: null,
      lng: null,
      createdAt: 2,
    },
  ],
  cities: {
    minamiuonuma: {
      summary: "Minamiuonuma sits in the mountain basin of southern Niigata.",
      population: "54,851 (2020 census)",
      food: ["Uonuma Koshihikari rice"],
    },
  },
};

describe("PlacesComponent", () => {
  let fixture: ComponentFixture<PlacesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.removeItem("places.city");
    await TestBed.configureTestingModule({
      imports: [PlacesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PlacesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  async function flush(data: PlacesData): Promise<void> {
    httpMock.expectOne(`${environment.apiBaseUrl}/places`).flush(data);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it("renders the hero and one tab per town", async () => {
    await flush(SAMPLE);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Places");
    const tabs = el.querySelectorAll(".cities button");
    expect(tabs.length).toBe(5);
    expect(tabs[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the town summary and the memories that belong to the season", async () => {
    fixture.componentInstance.season.set("summer");
    await flush(SAMPLE);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".intro")?.textContent).toContain(
      "southern Niigata",
    );
    const items = el.querySelectorAll(".list li");
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain("Muikamachi Station");
    expect(el.querySelector(".hidden-note")?.textContent).toContain(
      "1 memory belongs to other seasons",
    );
  });

  it("shows a winter-only memory in winter", async () => {
    fixture.componentInstance.season.set("winter");
    await flush(SAMPLE);
    const names = Array.from(
      fixture.nativeElement.querySelectorAll(".list li"),
    ).map((li) => (li as HTMLElement).textContent?.trim());
    expect(names).toEqual(["Muikamachi Station", "Ishiuchi Maruyama"]);
  });

  it("opens a memory from the list and shows its text", async () => {
    fixture.componentInstance.season.set("summer");
    await flush(SAMPLE);
    (
      fixture.nativeElement.querySelector(
        ".list li button",
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector(".panel");
    expect(panel.querySelector("h2")?.textContent).toContain(
      "Muikamachi Station",
    );
    expect(panel.querySelector(".story")?.textContent).toContain("Joetsu Line");
    expect(panel.querySelector(".meta")?.textContent).toContain(
      "High school years",
    );
  });

  it("renders the facts card from the town info", async () => {
    await flush(SAMPLE);
    const card: HTMLElement =
      fixture.nativeElement.querySelector(".facts-card");
    expect(card.textContent).toContain("54,851");
    expect(card.querySelector(".chip")?.textContent).toContain("Koshihikari");
  });

  it("switches towns from the tabs", async () => {
    await flush(SAMPLE);
    const tabs = fixture.nativeElement.querySelectorAll(".cities button");
    (tabs[3] as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.cityId()).toBe("vancouver");
    expect(
      fixture.nativeElement.querySelector(".panel h2")?.textContent,
    ).toContain("Vancouver");
    expect(fixture.nativeElement.querySelector(".facts-card")).toBeNull();
  });

  it("explains when the document cannot be loaded", async () => {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/places`)
      .flush(
        { message: "quota exceeded" },
        { status: 429, statusText: "Too Many Requests" },
      );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".empty")?.textContent,
    ).toContain("could not be loaded");
  });
});
