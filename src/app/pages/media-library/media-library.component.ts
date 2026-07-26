import {
  Component,
  inject,
  OnInit,
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

  loading = false;
  errorMessage = "";
  uploadStatus = "";
  copiedId = "";

  readonly categories = CATEGORIES;
  readonly uploadAccept = "image/jpeg,image/png,image/webp,image/gif";

  // Index-aligned with the form array below; holds the read-only display data.
  assets: MediaAsset[] = [];
  form: FormGroup = this.fb.group({ items: this.fb.array([]) });

  private savingIds = new Set<string>();
  private rowMessages: Record<string, string> = {};

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

  load(): void {
    this.loading = true;
    this.errorMessage = "";
    this.media.list().subscribe({
      next: (assets) => {
        this.assets = assets;
        const items = this.form.get("items") as FormArray;
        items.clear();
        assets.forEach((asset) => items.push(this.buildItem(asset)));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Could not load the media library.";
        this.loading = false;
      },
    });
  }

  save(index: number): void {
    const asset = this.assets[index];
    const value = this.itemControls[index].value as {
      title: string;
      alt: string;
      category: MediaCategory;
    };
    this.savingIds.add(asset.assetId);
    this.rowMessages[asset.assetId] = "";
    this.media
      .updateMeta(asset.assetId, {
        title: value.title,
        alt: value.alt,
        category: value.category,
      })
      .subscribe({
        next: (updated) => {
          this.assets[index] = updated;
          this.itemControls[index].markAsPristine();
          this.savingIds.delete(asset.assetId);
          this.rowMessages[asset.assetId] = "Saved.";
        },
        error: () => {
          this.savingIds.delete(asset.assetId);
          this.rowMessages[asset.assetId] = "Save failed.";
        },
      });
  }

  remove(index: number): void {
    const asset = this.assets[index];
    if (!confirm(`Delete "${asset.title || asset.originalFilename}"? This cannot be undone.`)) {
      return;
    }
    this.savingIds.add(asset.assetId);
    this.media.remove(asset.assetId).subscribe({
      next: () => {
        this.assets.splice(index, 1);
        (this.form.get("items") as FormArray).removeAt(index);
      },
      error: () => {
        this.savingIds.delete(asset.assetId);
        this.rowMessages[asset.assetId] = "Delete failed.";
      },
    });
  }

  copyUrl(index: number): void {
    const asset = this.assets[index];
    navigator.clipboard.writeText(asset.cdnUrl).then(() => {
      this.copiedId = asset.assetId;
      setTimeout(() => (this.copiedId = ""), 1500);
    });
  }

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    this.uploadStatus = "Uploading…";
    this.media.upload(file, "general").subscribe({
      next: () => {
        this.uploadStatus = "Uploaded — refreshing…";
        setTimeout(() => {
          this.uploadStatus = "";
          this.load();
        }, REFRESH_AFTER_UPLOAD_MS);
      },
      error: () => (this.uploadStatus = "Upload failed."),
    });
  }

  thumbUrl(asset: MediaAsset): string {
    return asset.variants?.["thumb"]?.url ?? asset.cdnUrl;
  }

  isSaving(asset: MediaAsset): boolean {
    return this.savingIds.has(asset.assetId);
  }

  rowMessage(asset: MediaAsset): string {
    return this.rowMessages[asset.assetId] ?? "";
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl("/home");
  }
}
