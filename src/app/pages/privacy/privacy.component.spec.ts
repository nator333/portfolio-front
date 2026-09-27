import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { PrivacyComponent } from "./privacy.component";

describe("PrivacyComponent", () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("should state the Limited Use commitment Google requires for its API data", () => {
    const el = render();
    const policyLink = el.querySelector<HTMLAnchorElement>(
      'a[href="https://developers.google.com/terms/api-services-user-data-policy"]',
    );
    expect(policyLink).not.toBeNull();
    expect(el.textContent).toContain("Limited Use");
  });

  it("should cover every kind of data the site handles", () => {
    const text = render().textContent ?? "";
    for (const section of ["Analytics", "Storage in your browser", "Chat assistant", "Owner sign-in", "Google Health data"]) {
      expect(text).toContain(section);
    }
  });
});
