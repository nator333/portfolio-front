import { TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";

describe("HomeComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it("should create", () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the motto lines", () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    for (const motto of fixture.componentInstance.mottoes) {
      expect(text).toContain(motto);
    }
  });
});
