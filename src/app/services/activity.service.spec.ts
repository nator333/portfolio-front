import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ActivityService, ActivityResponse } from "./activity.service";
import { environment } from "../../environments/environment";
import {
  apiKeyInterceptor,
  authTokenInterceptor,
} from "../interceptors/api.interceptors";

describe("ActivityService", () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  const response: ActivityResponse = {
    range: { from: "2025-07-24", to: "2026-07-24" },
    entries: [
      { date: "2026-07-24", type: "github", title: "Pushed to master in o/r" },
      { date: "2026-07-23", type: "gym", title: "Workout: 14 sets — Quads" },
      { date: "2026-07-01", type: "blog", title: "A post", url: "/blog/a" },
    ],
    counts: { github: 1, blog: 1, gym: 1, total: 3 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiKeyInterceptor, authTokenInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it("requests /activity with the API key and returns every source", () => {
    let entries: unknown;
    service.getActivity().subscribe((value) => (entries = value));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/activity`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    req.flush(response);

    expect(entries).toEqual(response.entries);
  });

  it("serves a second read from cache so repeat visits don't spend quota", () => {
    service.getActivity().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/activity`).flush(response);

    let cached: unknown;
    service.getActivity().subscribe((value) => (cached = value));
    // verify() in afterEach asserts no second request was made.
    expect(cached).toEqual(response.entries);
  });

  it("returns an empty feed rather than throwing when the API fails", () => {
    let entries: unknown = "unset";
    service.getActivity().subscribe((value) => (entries = value));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/activity`)
      .flush("rate limited", { status: 429, statusText: "Too Many Requests" });

    expect(entries).toEqual([]);
  });
});
