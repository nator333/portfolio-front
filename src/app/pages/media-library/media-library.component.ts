import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { MediaAsset, MediaCategory, MediaService } from "../../services/media.service";

const CATEGORIES: MediaCategory[] = ["blog", "project", "general"];
// Give the async resize pipeline a moment before a freshly uploaded asset shows.
const REFRESH_AFTER_UPLOAD_MS = 2500;

/**
 * Admin media library: browse every uploaded image, edit its alt / title /
 * category, copy its CDN url for pasting into a post, delete it, or upload a
 * new one. Backed by GET/PATCH/DELETE /media and the upload flow in MediaService.
 */
@Component({
  selector: "app-media-library",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent, DatePipe],
  templateUrl: "./media-library.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./media-library.component.scss",
})
export class MediaLibraryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private media = inject(MediaService);
  private router = inject(Router);

  // These are all mutated from async callbacks (the list/save/delete/upload
  // subscriptions, the clipboard promise, and the copied-badge/refresh
  // timeouts), so signals keep the view in sync under zoneless change
  // detection. The Set and Record are updated immutably for the same reason.
  readonly loading = signal(false);
  readonly errorMessage = signal("");
  readonly uploadStatus = signal("");
  readonly copiedId = signal("");

  readonly categories = CATEGORIES;
  readonly uploadAccept = "image/jpeg,image/png,image/webp,image/gif";

  // Index-aligned with the form array below; holds the read-only display data.
  readonly assets = signal<MediaAsset[]>([]);
  form: FormGroup = this.fb.group({ items: this.fb.array([]) });

  private readonly savingIds = signal<ReadonlySet<string>>(new Set());
  private readonly rowMessages = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
  }

  get itemControls(): FormGroup[] {
    return (this.form.get("items") as FormArray).controls as FormGroup[];
  }

  private buildItem(asset: MediaAsset): FormGroup {
    return this.fb.group({
      title: [asset.title ?? ""],
      alt: [asset.alt ?? ""],
      category: [asset.category ?? "general"],
    });
  }

  /** Flip a row's saving flag, updating the backing Set immutably. */
  private setSaving(assetId: string, saving: boolean): void {
    this.savingIds.update((ids) => {
      const next = new Set(ids);
      if (saving) {
        next.add(assetId);
      } else {
        next.delete(assetId);
      }
      return next;
    });
  }

  /** Set a row's inline status message, updating the backing Record immutably. */
  private setRowMessage(assetId: string, message: string): void {
    this.rowMessages.update((messages) => ({ ...messages, [assetId]: message }));
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set("");
    this.media.list().subscribe({
      next: (assets) => {
        this.assets.set(assets);
        const items = this.form.get("items") as FormArray;
        items.clear();
        assets.forEach((asset) => items.push(this.buildItem(asset)));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set("Could not load the media library.");
        this.loading.set(false);
      },
    });
  }

  save(index: number): void {
    const asset = this.assets()[index];
    const value = this.itemControls[index].value as {
      title: string;
      alt: string;
      category: MediaCategory;
    };
    this.setSaving(asset.assetId, true);
    this.setRowMessage(asset.assetId, "");
    this.media
      .updateMeta(asset.assetId, {
        title: value.title,
        alt: value.alt,
        category: value.category,
      })
      .subscribe({
        next: (updated) => {
          this.assets.update((assets) =>
            assets.map((a, i) => (i === index ? updated : a)),
          );
          this.itemControls[index].markAsPristine();
          this.setSaving(asset.assetId, false);
          this.setRowMessage(asset.assetId, "Saved.");
        },
        error: () => {
          this.setSaving(asset.assetId, false);
          this.setRowMessage(asset.assetId, "Save failed.");
        },
      });
  }

  remove(index: number): void {
    const asset = this.assets()[index];
    if (!confirm(`Delete "${asset.title || asset.originalFilename}"? This cannot be undone.`)) {
      return;
    }
    this.setSaving(asset.assetId, true);
    this.media.remove(asset.assetId).subscribe({
      next: () => {
        this.assets.update((assets) => assets.filter((_, i) => i !== index));
        (this.form.get("items") as FormArray).removeAt(index);
      },
      error: () => {
        this.setSaving(asset.assetId, false);
        this.setRowMessage(asset.assetId, "Delete failed.");
      },
    });
  }

  copyUrl(index: number): void {
    const asset = this.assets()[index];
    navigator.clipboard.writeText(asset.cdnUrl).then(() => {
      this.copiedId.set(asset.assetId);
      setTimeout(() => this.copiedId.set(""), 1500);
    });
  }

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    this.uploadStatus.set("Uploading…");
    this.media.upload(file, "general").subscribe({
      next: () => {
        this.uploadStatus.set("Uploaded — refreshing…");
        setTimeout(() => {
          this.uploadStatus.set("");
          this.load();
        }, REFRESH_AFTER_UPLOAD_MS);
      },
      error: () => this.uploadStatus.set("Upload failed."),
    });
  }

  thumbUrl(asset: MediaAsset): string {
    return asset.variants?.["thumb"]?.url ?? asset.cdnUrl;
  }

  isSaving(asset: MediaAsset): boolean {
    return this.savingIds().has(asset.assetId);
  }

  rowMessage(asset: MediaAsset): string {
    return this.rowMessages()[asset.assetId] ?? "";
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl("/home");
  }
}
