import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SeasonPickerComponent } from "./season-picker.component";
import { Season, seasonOf } from "../../models/places-data";

describe("SeasonPickerComponent", () => {
  let fixture: ComponentFixture<SeasonPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonPickerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SeasonPickerComponent);
    fixture.componentRef.setInput("season", "autumn");
    fixture.detectChanges();
  });

  const buttons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll("button[data-season]"));

  it("shows the four seasons with the current one pressed", () => {
    expect(buttons().map((b) => b.dataset["season"])).toEqual([
      "spring",
      "summer",
      "autumn",
      "winter",
    ]);
    expect(
      buttons()
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.dataset["season"]),
    ).toEqual(["autumn"]);
  });

  it("marks today's season", () => {
    const today = buttons().filter((b) => b.classList.contains("today"));
    expect(today.map((b) => b.dataset["season"])).toEqual([seasonOf()]);
  });

  it("emits the tapped season", () => {
    let picked: Season | undefined;
    fixture.componentInstance.picked.subscribe((s) => (picked = s));
    buttons()[3].click();
    expect(picked).toBe("winter");
  });

  it("shows the fill animation only while playing", () => {
    const row = (): HTMLElement =>
      fixture.nativeElement.querySelector(".seasons");
    expect(row().classList.contains("auto")).toBe(false);
    fixture.componentRef.setInput("playing", true);
    fixture.detectChanges();
    expect(row().classList.contains("auto")).toBe(true);
  });

  it("has no play button unless asked for one", () => {
    expect(fixture.nativeElement.querySelector("button.play")).toBeNull();
  });

  it("leads with a play button that turns into pause while playing", () => {
    fixture.componentRef.setInput("canPlay", true);
    fixture.detectChanges();
    const play = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector("button.play");
    expect(fixture.nativeElement.querySelector(".seasons button")).toBe(play());
    expect(play().getAttribute("aria-label")).toBe("Play the seasons");

    fixture.componentRef.setInput("playing", true);
    fixture.detectChanges();
    expect(play().getAttribute("aria-label")).toBe("Pause the seasons");

    let toggles = 0;
    fixture.componentInstance.toggled.subscribe(() => toggles++);
    play().click();
    expect(toggles).toBe(1);
  });
});
