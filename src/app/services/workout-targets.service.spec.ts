import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { WorkoutTargetsService } from "./workout-targets.service";
import { environment } from "../../environments/environment";
import {
  apiKeyInterceptor,
  authTokenInterceptor,
} from "../interceptors/api.interceptors";

describe("WorkoutTargetsService", () => {
  let service: WorkoutTargetsService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiBaseUrl}/workout-plan/targets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiKeyInterceptor, authTokenInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(WorkoutTargetsService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it("reads the targets from the admin endpoint", () => {
    service.getTargets().subscribe();
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe("GET");
    req.flush({ weeklySetTargets: [] });
  });

  it("puts the whole set back when saving", () => {
    const update = {
      baseVersion: 2,
      changeNote: "chest up",
      weeklySetTargets: [
        { muscles: ["Chest"], sets: { min: 8, max: 9 }, bonusWeekSets: null },
      ],
    };
    service.saveTargets(update).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(update);
    req.flush({ version: 3 });
  });

  it("never caches, so the version it holds is the one it read", () => {
    // A save is refused if written against a stale version, which only works if
    // the version in hand came from a real read.
    service.getTargets().subscribe();
    httpMock.expectOne(url).flush({ version: 2, weeklySetTargets: [] });
    service.getTargets().subscribe();
    httpMock.expectOne(url).flush({ version: 3, weeklySetTargets: [] });
  });

  it("lets a refused save reach the caller rather than swallowing it", () => {
    // The API refuses with a reason the user needs to see; returning null here
    // would turn "targets below what the sessions prescribe" into "nothing
    // happened".
    let failed: unknown = null;
    service
      .saveTargets({ baseVersion: 2, changeNote: "x", weeklySetTargets: [] })
      .subscribe({ error: (e) => (failed = e) });

    httpMock
      .expectOne(url)
      .flush({ message: "refused", breaches: ["Chest is prescribed 9"] }, {
        status: 409,
        statusText: "Conflict",
      });

    expect(failed).toBeTruthy();
  });
});
