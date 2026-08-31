import { TestBed } from "@angular/core/testing";
import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { environment } from "../../environments/environment";
import { AuthService } from "../services/auth.service";
import {
  apiKeyInterceptor,
  authTokenInterceptor,
  withApiKey,
  withAuth,
} from "./api.interceptors";

describe("api interceptors", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let idToken: string;

  beforeEach(() => {
    idToken = "test-id-token";
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiKeyInterceptor, authTokenInterceptor]),
        ),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getIdToken: () => idToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("adds the standard api key to portfolio-api requests by default", () => {
    http.get(`${environment.apiBaseUrl}/home`).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/home`);
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({});
  });

  it("selects the chat and workout usage-plan keys", () => {
    http
      .post(`${environment.apiBaseUrl}/chat`, {}, { context: withApiKey("chat") })
      .subscribe();
    const chat = httpMock.expectOne(`${environment.apiBaseUrl}/chat`);
    expect(chat.request.headers.get("X-Api-Key")).toBe(environment.chatApiKey);
    chat.flush({});

    http
      .get(`${environment.apiBaseUrl}/workout`, { context: withApiKey("workout") })
      .subscribe();
    const workout = httpMock.expectOne(`${environment.apiBaseUrl}/workout`);
    expect(workout.request.headers.get("X-Api-Key")).toBe(
      environment.workoutApiKey,
    );
    workout.flush({});
  });

  it("attaches the raw id token and no key for auth-only requests", () => {
    http
      .get(`${environment.apiBaseUrl}/media`, { context: withAuth("none") })
      .subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/media`);
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    expect(req.request.headers.has("X-Api-Key")).toBe(false);
    req.flush({});
  });

  it("sends both the standard key and the token for authenticated writes", () => {
    http
      .put(`${environment.apiBaseUrl}/home`, {}, { context: withAuth() })
      .subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/home`);
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    req.flush({});
  });

  it("leaves requests to other hosts (Cognito, S3) untouched", () => {
    const s3 = "https://media-bucket.s3.amazonaws.com/";
    http.post(s3, new FormData()).subscribe();
    const req = httpMock.expectOne(s3);
    expect(req.request.headers.has("X-Api-Key")).toBe(false);
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush("");
  });
});
