import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { HeroComponent } from "./hero.component";

@Component({
  standalone: true,
  imports: [HeroComponent],
  template: `<app-hero title="Test Title" subtitle="Test Subtitle"></app-hero>`,
})
class HostComponent {}

describe("HeroComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it("should render the title and subtitle", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("h1")?.textContent).toContain("Test Title");
    expect(el.querySelector("h2")?.textContent).toContain("Test Subtitle");
  });
});
