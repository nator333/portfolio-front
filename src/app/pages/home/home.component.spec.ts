import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";

describe("HomeComponent", () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the motto lines with descending heading levels", () => {
    const el: HTMLElement = fixture.nativeElement;
    component.mottoes.forEach((motto, i) => {
      const heading = el.querySelector(`.motto-section h${i + 1}`);
      expect(heading?.textContent)
        .withContext(`motto ${i} should be an h${i + 1}`)
        .toContain(motto);
    });
  });

  it("should render the signature image with its alt text", () => {
    const img = fixture.nativeElement.querySelector(
      ".signature-image",
    ) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(component.sighInfo[0]);
    expect(img.getAttribute("alt")).toBe(component.sighInfo[1]);
  });

  it("should render the profile name and title", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".profile-name")?.textContent).toContain(
      component.profile[0],
    );
    expect(el.querySelector(".profile-title")?.textContent).toContain(
      component.profile[1],
    );
  });

  it("should credit the name artist with a link", () => {
    const link = fixture.nativeElement.querySelector(
      ".artist-link",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(component.kappiInfo[0]);
    expect(link.textContent).toContain(component.kappiInfo[1]);
  });
});
