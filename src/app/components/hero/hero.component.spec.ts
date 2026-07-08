import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HeroComponent } from "./hero.component";

describe("HeroComponent", () => {
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HeroComponent);
  });

  it("should render the title and subtitle when both are set", () => {
    fixture.componentRef.setInput("title", "Test Title");
    fixture.componentRef.setInput("subtitle", "Test Subtitle");
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("h1")?.textContent).toContain("Test Title");
    expect(el.querySelector("h2")?.textContent).toContain("Test Subtitle");
  });

  it("should omit the subtitle heading when subtitle is empty", () => {
    fixture.componentRef.setInput("title", "Only Title");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("h2")).toBeNull();
  });

  it("should apply the default hero class and accept an override", () => {
    fixture.detectChanges();
    const section: HTMLElement = fixture.nativeElement.querySelector("section");
    expect(section.classList).toContain("is-primary");

    fixture.componentRef.setInput("heroClass", "is-dark");
    fixture.detectChanges();
    expect(section.classList).toContain("is-dark");
    expect(section.classList).not.toContain("is-primary");
  });

  it("should hide the content area by default", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".content")).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [HeroComponent],
  template: `
    <app-hero title="Host Title" [showContent]="true">
      <p class="projected">Projected body</p>
    </app-hero>
  `,
})
class HostComponent {}

describe("HeroComponent (content projection)", () => {
  it("should project host content when showContent is true", async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const projected = fixture.nativeElement.querySelector(
      ".content .projected",
    );
    expect(projected?.textContent).toContain("Projected body");
  });
});
