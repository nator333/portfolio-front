import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

import {
  SEASONS,
  SEASON_LABELS,
  Season,
  seasonOf,
} from "../../models/places-data";

/**
 * The season row of the Places pages. The season is one page-wide setting —
 * it repaints every town's map and filters every town's memories — so it sits
 * above the town tabs rather than under each map.
 *
 * Today's season carries a gold dot. With `canPlay`, a play/pause button
 * leads the row: it shows pause while the map auto-advances the seasons
 * (`playing`), when the active underline also fills over each 4-second step,
 * and play once the viewer has stopped it, so they can start it again.
 */
@Component({
  selector: "app-season-picker",
  standalone: true,
  templateUrl: "./season-picker.component.html",
  styleUrl: "./season-picker.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonPickerComponent {
  readonly season = input.required<Season>();
  /** Show the play/pause button (the public page; the editor never cycles). */
  readonly canPlay = input(false);
  readonly playing = input(false);
  /** A season the viewer tapped. */
  readonly picked = output<Season>();
  /** The play/pause button was pressed. */
  readonly toggled = output<void>();

  readonly seasons = SEASONS;
  readonly labels = SEASON_LABELS;
  readonly today = seasonOf();
}
