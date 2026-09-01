import { TestBed } from "@angular/core/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";

import { LoadingService } from "../services/loading.service";
import { loadingInterceptor, withoutLoading } from "./loading.interceptor";

describe("loadingInterceptor", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => httpMock.verify());

  it("is loading while a request is in flight and settles on success", () => {
    expect(loading.loading()).toBe(false);
    http.get("/api/thing").subscribe();
    expect(loading.loading()).toBe(true);

    httpMock.expectOne("/api/thing").flush({});
    expect(loading.loading()).toBe(false);
  });

  it("settles even when the request errors", () => {
    http.get("/api/thing").subscribe({ error: () => undefined });
    expect(loading.loading()).toBe(true);

    httpMock
      .expectOne("/api/thing")
      .flush("boom", { status: 500, statusText: "Server Error" });
    expect(loading.loading()).toBe(false);
  });

  it("stays loading until concurrent requests all settle", () => {
    http.get("/api/a").subscribe();
    http.get("/api/b").subscribe();
    expect(loading.loading()).toBe(true);

    httpMock.expectOne("/api/a").flush({});
    expect(loading.loading()).toBe(true);

    httpMock.expectOne("/api/b").flush({});
    expect(loading.loading()).toBe(false);
  });

  it("ignores requests that opt out via withoutLoading()", () => {
    http.get("/api/silent", { context: withoutLoading() }).subscribe();
    expect(loading.loading()).toBe(false);

    httpMock.expectOne("/api/silent").flush({});
    expect(loading.loading()).toBe(false);
  });
});
