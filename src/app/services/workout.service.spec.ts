import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { WorkoutService } from "./workout.service";
import { environment } from "../../environments/environment";

describe("WorkoutService", () => {
  let service: WorkoutService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkoutService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it("requests /workout with the dedicated workout key", () => {
    service.getWorkout().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/workout`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.workoutApiKey);
    req.flush({ days: [], weeks: [] });
  });

  it("serves a second read from cache", () => {
    service.getWorkout().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/workout`).flush({ days: [] });

    let cached: unknown;
    service.getWorkout().subscribe((v) => (cached = v));
    expect(cached).toEqual({ days: [] });
  });

  it("returns null rather than throwing when the API fails", () => {
    let result: unknown = "unset";
    service.getWorkout().subscribe((v) => (result = v));
    httpMock
      .expectOne(`${environment.apiBaseUrl}/workout`)
      .flush("boom", { status: 500, statusText: "Server Error" });
    expect(result).toBeNull();
  });
});
