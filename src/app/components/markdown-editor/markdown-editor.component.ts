import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import EasyMDE from 'easymde';
import * as Prism from 'prismjs';
import { MediaAsset, MediaCategory, MediaService } from '../../services/media.service';
import { renderBlogMarkdown } from '../../utils/blog-markdown.util';
import { runMermaid } from '../../utils/mermaid.util';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

const MERMAID_TEMPLATE = `\n\`\`\`mermaid\ngraph TD\n  A[Start] --> B[End]\n\`\`\`\n`;

/**
 * Rich markdown editor for blog content. Wraps EasyMDE as a ControlValueAccessor
 * so it binds to a reactive control exactly like the plain <textarea> it replaces,
 * and keeps the pipeline on markdown: its preview renders through the same
 * renderBlogMarkdown used in production (Prism code blocks + Mermaid diagrams).
 *
 * The toolbar adds a custom image button (insert a saved image or upload a new
 * one via MediaService) and a Mermaid button that drops a diagram fence.
 */
@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true,
    },
  ],
  template: `
    <textarea #host></textarea>

    @if (showImagePicker) {
      <div class="image-picker box">
        <div class="level is-mobile mb-2">
          <div class="level-left"><strong>Insert image</strong></div>
          <div class="level-right">
            <button class="delete" type="button" (click)="closeImagePicker()" aria-label="close"></button>
          </div>
        </div>

        @if (selectableAssets.length) {
          <div class="field">
            <label class="label is-small">Saved image</label>
            <div class="select is-small is-fullwidth">
              <select (change)="onSelectSaved($event)">
                <option value="">Choose a saved image…</option>
                @for (asset of selectableAssets; track asset.assetId) {
                  <option [value]="asset.cdnUrl">
                    {{ asset.title || asset.originalFilename }}
                  </option>
                }
              </select>
            </div>
          </div>
        }

        <div class="field">
          <label class="label is-small">Or upload a new one</label>
          <input class="input is-small" type="file" [accept]="accept" (change)="onFileSelected($event)" />
        </div>

        @if (uploadMessage) {
          <p class="help" [class.is-danger]="uploadError">{{ uploadMessage }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .image-picker {
        margin-top: 0.75rem;
      }
    `,
  ],
})
export class MarkdownEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  private media = inject(MediaService);

  @ViewChild('host') private host!: ElementRef<HTMLTextAreaElement>;

  /** Saved images offered in the insert-image dropdown. */
  @Input() assets: MediaAsset[] = [];
  @Input() category: MediaCategory = 'general';

  readonly accept = ALLOWED_TYPES.join(',');

  showImagePicker = false;
  uploadMessage = '';
  uploadError = false;

  private editor?: EasyMDE;
  /** Value handed to writeValue before the editor exists yet. */
  private pendingValue = '';
  /** Guards the change handler while writeValue programmatically sets content. */
  private writing = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.editor = new EasyMDE({
      element: this.host.nativeElement,
      spellChecker: false,
      autoDownloadFontAwesome: false,
      status: ['lines', 'words'],
      placeholder: 'Write the post in markdown…',
      // Preview matches the published page exactly, then highlights code and
      // renders Mermaid on the freshly-set preview DOM.
      previewRender: (plainText, preview) => {
        const html = renderBlogMarkdown(plainText);
        setTimeout(() => {
          Prism.highlightAllUnder(preview);
          void runMermaid(preview);
        });
        return html;
      },
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        'horizontal-rule',
        '|',
        'link',
        'code',
        {
          name: 'image',
          action: () => this.toggleImagePicker(),
          className: 'fa fa-image',
          title: 'Insert image',
        },
        {
          name: 'mermaid',
          action: () => this.insertMermaid(),
          className: 'fa fa-project-diagram',
          title: 'Insert Mermaid diagram',
        },
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide',
      ],
    });

    this.editor.value(this.pendingValue);
    this.editor.codemirror.on('change', () => {
      if (!this.writing) {
        this.onChange(this.editor!.value());
      }
    });
    this.editor.codemirror.on('blur', () => this.onTouched());
  }

  ngOnDestroy(): void {
    // Restores the original <textarea> and detaches CodeMirror listeners.
    this.editor?.toTextArea();
    this.editor = undefined;
  }

  writeValue(value: string | null): void {
    const next = value ?? '';
    if (!this.editor) {
      this.pendingValue = next;
      return;
    }
    if (next !== this.editor.value()) {
      this.writing = true;
      this.editor.value(next);
      this.writing = false;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Saved images in this field's category plus reusable "general" ones. */
  get selectableAssets(): MediaAsset[] {
    return this.assets.filter(
      (asset) => asset.category === this.category || asset.category === 'general',
    );
  }

  private toggleImagePicker(): void {
    this.showImagePicker = !this.showImagePicker;
    this.uploadMessage = '';
    this.uploadError = false;
  }

  closeImagePicker(): void {
    this.showImagePicker = false;
  }

  onSelectSaved(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const url = select.value;
    if (!url) {
      return;
    }
    const asset = this.selectableAssets.find((item) => item.cdnUrl === url);
    this.insertImage(url, asset?.alt || asset?.title || '');
    select.value = '';
    this.closeImagePicker();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
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

    this.uploadError = false;
    this.uploadMessage = 'Uploading…';
    this.media.upload(file, this.category).subscribe({
      next: (result) => {
        this.uploadMessage = '';
        this.insertImage(result.cdnUrl, '');
        this.closeImagePicker();
      },
      error: () => this.fail('Upload failed. Please try again.'),
    });
  }

  private insertImage(url: string, alt: string): void {
    const cm = this.editor?.codemirror;
    if (!cm) {
      return;
    }
    cm.replaceSelection(`![${alt}](${url})`);
    cm.focus();
  }

  private insertMermaid(): void {
    const cm = this.editor?.codemirror;
    if (!cm) {
      return;
    }
    cm.replaceSelection(MERMAID_TEMPLATE);
    cm.focus();
  }

  private fail(message: string): void {
    this.uploadError = true;
    this.uploadMessage = message;
  }
}
