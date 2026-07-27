import {
  Component,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MediaAsset, MediaCategory, MediaService } from '../../services/media.service';

type UploadStatus = 'idle' | 'uploading' | 'saved' | 'error';

/** Client-side guard mirroring the API's allowlist and 10MB cap. */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Reusable image field: keeps the editable URL text input, and adds a picker
 * that uploads the chosen file and writes the resulting CDN url back into the
 * bound control. The preview shows the locally selected file so there is instant
 * feedback without waiting on (or negatively caching) the CDN while the resize
 * pipeline runs.
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent implements OnDestroy {
  private media = inject(MediaService);

  /** The reactive control holding the image URL (or bundled asset path). */
  @Input({ required: true }) control!: FormControl<string>;
  @Input() category: MediaCategory = 'general';
  @Input() label = 'Image';
  /** Previously uploaded images, offered in the "pick a saved image" dropdown. */
  @Input() assets: MediaAsset[] = [];

  readonly accept = ALLOWED_TYPES.join(',');

  status: UploadStatus = 'idle';
  message = '';
  /** Object URL for the just-picked file; preferred over the CDN url for preview. */
  private localPreview: string | null = null;

  get previewSrc(): string | null {
    return this.localPreview || this.control.value || null;
  }

  /**
   * Saved images offered in the dropdown: those in this field's category, plus
   * uncategorised ("general") images, which are usable anywhere.
   */
  get selectableAssets(): MediaAsset[] {
    return this.assets.filter(
      (asset) => asset.category === this.category || asset.category === 'general',
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    input.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fail('Choose a JPEG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.fail('Image must be 10MB or smaller.');
      return;
    }

    this.setLocalPreview(file);
    this.status = 'uploading';
    this.message = 'Uploading…';

    this.media.upload(file, this.category).subscribe({
      next: (result) => {
        this.control.setValue(result.cdnUrl);
        this.control.markAsDirty();
        this.status = 'saved';
        this.message = 'Uploaded. The optimized image is served from the CDN.';
      },
      error: () => this.fail('Upload failed. Please try again.'),
    });
  }

  /** Pick a previously uploaded image; its CDN url becomes the field value. */
  onSelectSaved(event: Event): void {
    const url = (event.target as HTMLSelectElement).value;
    if (!url) {
      return;
    }
    // Drop any local file preview so the preview reflects the chosen saved image.
    this.revokeLocalPreview();
    this.control.setValue(url);
    this.control.markAsDirty();
    this.status = 'idle';
    this.message = '';
  }

  clear(): void {
    this.control.setValue('');
    this.control.markAsDirty();
    this.revokeLocalPreview();
    this.status = 'idle';
    this.message = '';
  }

  onPreviewError(): void {
    // Only meaningful for an existing/typed URL; a fresh local preview never fails.
    if (!this.localPreview) {
      this.message = 'Preview could not load this URL.';
    }
  }

  ngOnDestroy(): void {
    this.revokeLocalPreview();
  }

  private fail(message: string): void {
    this.status = 'error';
    this.message = message;
  }

  private setLocalPreview(file: File): void {
    this.revokeLocalPreview();
    this.localPreview = URL.createObjectURL(file);
  }

  private revokeLocalPreview(): void {
    if (this.localPreview) {
      URL.revokeObjectURL(this.localPreview);
      this.localPreview = null;
    }
  }
}
