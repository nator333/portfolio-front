import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { provideRouter, TitleStrategy } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";

import { BrandTitleStrategy, pageTitle, SITE_NAME } from "./title-strategy";

@Component({ standalone: true, template: "" })
class DummyComponent {}

describe("pageTitle", () => {
  it("brands a page name with the site name", () => {
    expect(pageTitle("Projects")).toBe(`Projects · ${SITE_NAME}`);
  });

  it("falls back to the default landing title when empty", () => {
    const fallback = pageTitle(undefined);
    expect(fallback).toContain(SITE_NAME);
    expect(fallback).not.toContain("·");
  });
});

describe("BrandTitleStrategy", () => {
  async function titleAfterNavigating(path: string): Promise<string> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "projects", title: "Projects", component: DummyComponent },
          { path: "home", component: DummyComponent },
        ]),
        { provide: TitleStrategy, useClass: BrandTitleStrategy },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(path);
    return TestBed.inject(Title).getTitle();
  }

  it("brands a route's title with the site name", async () => {
    expect(await titleAfterNavigating("/projects")).toBe(
      `Projects · ${SITE_NAME}`,
    );
  });

  it("uses the default landing title for a route without one", async () => {
    const title = await titleAfterNavigating("/home");
    expect(title).toContain(SITE_NAME);
    expect(title).not.toContain("·");
  });
});
