import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import EasyMDE from 'easymde';
import * as Prism from 'prismjs';
import { MediaAsset, MediaCategory, MediaService } from '../../services/media.service';
import { renderBlogMarkdown } from '../../utils/blog-markdown.util';
import { runMermaid } from '../../utils/mermaid.util';
import { runDrawio } from '../../utils/drawio.util';
import {
  DRAWIO_EMBED_CONFIG,
  DRAWIO_EMBED_ORIGIN,
  DRAWIO_EMBED_URL,
  drawioFence,
  findDrawioFences,
  parseDrawioMessage,
} from '../../utils/drawio-embed.util';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

const MERMAID_TEMPLATE = `\n\`\`\`mermaid\ngraph TD\n  A[Start] --> B[End]\n\`\`\`\n`;


/**
 * Rich markdown editor for blog content. Wraps EasyMDE as a ControlValueAccessor
 * so it binds to a reactive control exactly like the plain <textarea> it replaces,
 * and keeps the pipeline on markdown: its preview renders through the same
 * renderBlogMarkdown used in production (Prism code blocks + Mermaid and
 * draw.io diagrams).
 *
 * The toolbar adds a custom image button (insert a saved image or upload a new
 * one via MediaService), a Mermaid button that drops a diagram fence, and a
 * draw.io button that opens the draw.io editor in a full-screen iframe. Saved
 * draw.io diagrams live in the markdown as ```drawio fences, but the editor
 * collapses each one into a "click to edit" chip so the XML stays out of sight.
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

    @if (drawioOpen()) {
      <div class="drawio-overlay">
        <iframe #drawioFrame [src]="drawioUrl" title="draw.io editor"></iframe>
      </div>
    }

    @if (showImagePicker()) {
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

        @if (uploadMessage()) {
          <p class="help" [class.is-danger]="uploadError()">{{ uploadMessage() }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .image-picker {
        margin-top: 0.75rem;
      }
      /* Above the navbar (30) and EasyMDE fullscreen layers (40). */
      .drawio-overlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: #ffffff;
      }
      .drawio-overlay iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }
    `,
  ],
})
export class MarkdownEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  private media = inject(MediaService);
  // EasyMDE fires its toolbar/editor callbacks outside Angular's change
  // detection. This view's own bound state (the image picker, upload status) is
  // held in signals, so writing it from those callbacks schedules a refresh on
  // its own. The CVA value/blur emissions feed the *parent* form, which isn't
  // signal-driven, so they mark this view for check — that notifies the zoneless
  // scheduler to run change detection so the parent's form-derived bindings
  // (validity messages, disabled states) stay in sync.
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('host') private host!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('drawioFrame') private drawioFrame?: ElementRef<HTMLIFrameElement>;

  /** Saved images offered in the insert-image dropdown. */
  readonly assets = input<MediaAsset[]>([]);
  readonly category = input<MediaCategory>('general');

  readonly accept = ALLOWED_TYPES.join(',');

  readonly showImagePicker = signal(false);
  readonly uploadMessage = signal('');
  readonly uploadError = signal(false);

  readonly drawioOpen = signal(false);
  // Constant, trusted URL of the draw.io embed editor.
  readonly drawioUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(DRAWIO_EMBED_URL);
  /** XML loaded into the draw.io editor when it reports ready ('' = blank). */
  private drawioXml = '';
  /** Collapsed fence being edited, or null when drawing a new diagram. */
  private drawioTarget: CodeMirror.TextMarker | null = null;
  /** Chips currently collapsing ```drawio fences, and where they were built. */
  private drawioMarks: CodeMirror.TextMarker[] = [];
  private drawioMarksKey = '';

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
      // renders diagrams on the freshly-set preview DOM.
      previewRender: (plainText, preview) => {
        const html = renderBlogMarkdown(plainText);
        setTimeout(() => {
          Prism.highlightAllUnder(preview);
          void runMermaid(preview);
          void runDrawio(preview);
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
        {
          name: 'line-break',
          action: () => this.insertBreak(),
          className: 'fa fa-turn-down',
          title: 'Insert line break (<br>)',
        },
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
        {
          name: 'drawio',
          action: () => this.openDrawio(null),
          className: 'fa fa-sitemap',
          title: 'Draw a diagram with draw.io',
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
    this.collapseDrawioFences();
    this.editor.codemirror.on('change', () => {
      this.collapseDrawioFences();
      if (!this.writing) {
        this.onChange(this.editor!.value());
        this.cdr.markForCheck();
      }
    });
    window.addEventListener('message', this.onDrawioMessage);
    this.editor.codemirror.on('blur', () => {
      this.onTouched();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onDrawioMessage);
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
    return this.assets().filter(
      (asset) => asset.category === this.category() || asset.category === 'general',
    );
  }

  private toggleImagePicker(): void {
    this.showImagePicker.update((open) => !open);
    this.uploadMessage.set('');
    this.uploadError.set(false);
  }

  closeImagePicker(): void {
    this.showImagePicker.set(false);
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

    this.uploadError.set(false);
    this.uploadMessage.set('Uploading…');
    this.media.upload(file, this.category()).subscribe({
      next: (result) => {
        this.uploadMessage.set('');
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

  /**
   * Collapse every ```drawio fence into an atomic chip that opens the draw.io
   * editor on click. Rebuilt only when the set of fences moves, so ordinary
   * typing elsewhere in a line leaves the chips alone.
   */
  private collapseDrawioFences(): void {
    const cm = this.editor?.codemirror;
    if (!cm) {
      return;
    }
    const lines: string[] = [];
    cm.eachLine((line) => {
      lines.push(line.text);
    });
    const fences = findDrawioFences(lines);
    const key = fences.map((fence) => `${fence.startLine}:${fence.endLine}`).join(',');
    if (key === this.drawioMarksKey && this.drawioMarks.every((mark) => mark.find())) {
      return;
    }
    this.drawioMarksKey = key;
    this.drawioMarks.forEach((mark) => mark.clear());
    this.drawioMarks = fences.map((fence) => {
      const chip = document.createElement('span');
      chip.className = 'drawio-chip';
      chip.textContent = 'draw.io diagram — click to edit';
      chip.title = 'Open in draw.io';
      const mark = cm.markText(
        { line: fence.startLine, ch: 0 },
        { line: fence.endLine, ch: lines[fence.endLine].length },
        { replacedWith: chip, atomic: true },
      );
      chip.addEventListener('click', () => this.openDrawio(mark));
      return mark;
    });
  }

  /** Open the draw.io editor on a collapsed fence, or blank for a new diagram. */
  private openDrawio(target: CodeMirror.TextMarker | null): void {
    const cm = this.editor?.codemirror;
    const range = target?.find() as CodeMirror.MarkerRange | undefined;
    if (!cm) {
      return;
    }
    this.drawioTarget = range ? target : null;
    this.drawioXml = range
      ? (findDrawioFences(cm.getRange(range.from, range.to).split('\n'))[0]?.xml ?? '')
      : '';
    this.drawioOpen.set(true);
  }

  private closeDrawio(): void {
    this.drawioOpen.set(false);
    this.drawioTarget = null;
    this.editor?.codemirror.focus();
  }

  /** Write a saved diagram back over the fence being edited, or insert it. */
  private saveDrawio(xml: string): void {
    const cm = this.editor?.codemirror;
    if (!cm) {
      return;
    }
    const fence = drawioFence(xml);
    const range = this.drawioTarget?.find() as CodeMirror.MarkerRange | undefined;
    let startLine: number;
    if (range) {
      startLine = range.from.line;
      cm.replaceRange(fence, range.from, range.to);
    } else {
      startLine = cm.getCursor('from').line + 1;
      cm.replaceSelection(`\n${fence}\n`);
    }
    // The edit re-collapsed the fences; keep pointing at this diagram so a
    // mid-session save (Ctrl+S) followed by Save & Exit updates it, not a copy.
    this.drawioTarget =
      this.drawioMarks.find((mark) => (mark.find() as CodeMirror.MarkerRange)?.from.line === startLine) ??
      null;
    this.drawioXml = xml;
  }

  /** postMessage handler for the draw.io iframe (JSON embed protocol). */
  private readonly onDrawioMessage = (event: MessageEvent): void => {
    const frame = this.drawioFrame?.nativeElement.contentWindow;
    if (event.origin !== DRAWIO_EMBED_ORIGIN || !frame || event.source !== frame) {
      return;
    }
    const message = parseDrawioMessage(event.data);
    const reply = (data: object) => frame.postMessage(JSON.stringify(data), DRAWIO_EMBED_ORIGIN);
    switch (message?.event) {
      case 'configure':
        reply({ action: 'configure', config: DRAWIO_EMBED_CONFIG });
        break;
      case 'init':
        reply({ action: 'load', xml: this.drawioXml });
        break;
      case 'save':
        if (message.xml) {
          this.saveDrawio(message.xml);
        }
        if (message.exit) {
          this.closeDrawio();
        }
        break;
      case 'exit':
        this.closeDrawio();
        break;
    }
  };

  /**
   * Inserts an explicit <br>. Markdown collapses blank lines, so this is the way
   * to force a single line break; marked passes the raw tag straight through.
   */
  private insertBreak(): void {
    const cm = this.editor?.codemirror;
    if (!cm) {
      return;
    }
    cm.replaceSelection('<br>\n');
    cm.focus();
  }

  private fail(message: string): void {
    this.uploadError.set(true);
    this.uploadMessage.set(message);
  }
}
