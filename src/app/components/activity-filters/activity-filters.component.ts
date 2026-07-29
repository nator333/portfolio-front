import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import {
  ActivityType,
  ACTIVITY_TYPE_LABELS,
} from "../../models/activity-data";

/**
 * Toggle badges that filter the contribution calendar and feed by activity
 * type. Purely presentational: the parent owns which types are active and
 * reacts to `toggled`. Every type starts active, so the caller sees the full
 * picture until it narrows down.
 */
@Component({
  selector: "app-activity-filters",
  standalone: true,
  imports: [],
  templateUrl: "./activity-filters.component.html",
  styleUrl: "./activity-filters.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFiltersComponent {
  /** Types to offer, in display order. */
  readonly types = input<readonly ActivityType[]>([]);
  /** Types currently switched on; the rest render dimmed. */
  readonly active = input<readonly ActivityType[]>([]);
  /** Emits the tapped type; the parent flips it on or off. */
  readonly toggled = output<ActivityType>();

  isActive(type: ActivityType): boolean {
    return this.active().includes(type);
  }

  label(type: ActivityType): string {
    return ACTIVITY_TYPE_LABELS[type];
  }
}
