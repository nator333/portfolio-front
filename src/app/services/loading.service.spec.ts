import { TestBed } from "@angular/core/testing";

import { LoadingService } from "./loading.service";

describe("LoadingService", () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it("is not loading initially", () => {
    expect(service.loading()).toBe(false);
  });

  it("stays loading until every started request has stopped", () => {
    service.start();
    expect(service.loading()).toBe(true);

    service.start();
    service.stop();
    // One request is still outstanding.
    expect(service.loading()).toBe(true);

    service.stop();
    expect(service.loading()).toBe(false);
  });

  it("never goes loading from an unbalanced stop", () => {
    service.stop();
    expect(service.loading()).toBe(false);

    service.start();
    expect(service.loading()).toBe(true);
  });
});
