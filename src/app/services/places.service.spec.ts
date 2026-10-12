import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptors,
  withXhr,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { PlacesService } from "./places.service";
import { AuthService } from "./auth.service";
import { PlacesData } from "../models/places-data";
import { environment } from "../../environments/environment";
import {
  apiKeyInterceptor,
  authTokenInterceptor,
} from "../interceptors/api.interceptors";

const apiDocument: PlacesData = {
  memories: [
    {
      id: "m_1",
      city: "hachioji",
      x: 0.58,
      y: 0.53,
      name: "JR Hachioji Station",
      kind: "play",
      period: "",
      text: "Waited here every morning.",
      seasons: [],
      photos: [],
      mapsUrl: "",
      lat: null,
      lng: null,
      createdAt: 1,
    },
  ],
  cities: { hachioji: { summary: "Forty km west of central Tokyo." } },
};

describe("PlacesService", () => {
  let service: PlacesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiKeyInterceptor, authTokenInterceptor]),
          withXhr(),
        ),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getIdToken: () => "test-id-token" },
        },
      ],
    });
    service = TestBed.inject(PlacesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("fetches the places document with the api key header", () => {
    let received: PlacesData | undefined;
    service.getPlaces().subscribe((data) => (received = data));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/places`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    req.flush(apiDocument);

    expect(received).toEqual(apiDocument);
  });

  it("serves a second read from the session cache", () => {
    service.getPlaces().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/places`).flush(apiDocument);

    let received: PlacesData | undefined;
    service.getPlaces().subscribe((data) => (received = data));
    httpMock.expectNone(`${environment.apiBaseUrl}/places`);
    expect(received).toEqual(apiDocument);
  });

  it("saves with the Cognito token and refreshes the cache", () => {
    let saved: PlacesData | undefined;
    service.updatePlaces(apiDocument).subscribe((data) => (saved = data));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/places`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    expect(req.request.body).toEqual(apiDocument);
    req.flush(apiDocument);

    expect(saved).toEqual(apiDocument);
    let cached: PlacesData | undefined;
    service.getPlaces().subscribe((data) => (cached = data));
    httpMock.expectNone(`${environment.apiBaseUrl}/places`);
    expect(cached).toEqual(apiDocument);
  });
});
