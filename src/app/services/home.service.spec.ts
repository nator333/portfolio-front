import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { HomeService } from "./home.service";
import { AuthService } from "./auth.service";
import { HomeData } from "../models/home-data";
import { environment } from "../../environments/environment";

const apiDocument: HomeData = {
  mottoes: ["Line One", "Line Two", "Line Three"],
};

describe("HomeService", () => {
  let service: HomeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getIdToken: () => "test-id-token" },
        },
      ],
    });
    service = TestBed.inject(HomeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should fetch home data with the api key header", () => {
    let received: HomeData | undefined;
    service.getHome().subscribe((data) => (received = data));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/home`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    req.flush(apiDocument);

    expect(received).toEqual(apiDocument);
  });

  it("should serve a second read from the session cache without a request", () => {
    service.getHome().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/home`).flush(apiDocument);

    let received: HomeData | undefined;
    service.getHome().subscribe((data) => (received = data));

    httpMock.expectNone(`${environment.apiBaseUrl}/home`);
    expect(received).toEqual(apiDocument);
  });

  it("should send updates with the raw id token and refresh the cache", () => {
    const updated: HomeData = { mottoes: ["New Motto"] };
    service.updateHome(updated).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/home`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    expect(req.request.body).toEqual(updated);
    req.flush(updated);

    let received: HomeData | undefined;
    service.getHome().subscribe((data) => (received = data));
    httpMock.expectNone(`${environment.apiBaseUrl}/home`);
    expect(received).toEqual(updated);
  });
});
