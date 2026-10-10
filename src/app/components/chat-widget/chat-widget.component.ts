import {
  afterNextRender,
  computed,
  Component,
  effect,
  ElementRef,
  Injector,
  ViewChild,
  inject,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map } from "rxjs";

import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faComments,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { HttpErrorResponse } from "@angular/common/http";
import { ChatService } from "../../services/chat.service";
import {
  ChatMessage,
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_PAGE_COPY,
  chatContextForUrl,
} from "../../models/chat-data";

@Component({
  selector: "app-chat-widget",
  standalone: true,
  imports: [FormsModule, FaIconComponent],
  template: `
    @if (isOpen()) {
      <div
        class="chat-panel"
        role="dialog"
        aria-label="Portfolio assistant chat"
      >
        <header class="chat-header">
          <span class="chat-title">{{ copy().title }}</span>
          <button
            class="chat-close"
            type="button"
            aria-label="Close chat"
            (click)="toggle()"
          >
            <fa-icon [icon]="closeIcon"></fa-icon>
          </button>
        </header>

        <div class="chat-messages" #messageList>
          @if (messages().length === 0) {
            <p class="chat-hint">{{ copy().hint }}</p>
          }
          @for (message of messages(); track $index) {
            <div class="chat-bubble" [class.is-user]="message.role === 'user'">
              {{ message.content }}
            </div>
          }
          @if (isLoading()) {
            <div class="chat-bubble is-typing" aria-label="Assistant is typing">
              <span></span><span></span><span></span>
            </div>
          }
          @if (errorMessage()) {
            <p class="chat-error">{{ errorMessage() }}</p>
          }
        </div>

        <form class="chat-input-row" (ngSubmit)="send()">
          <input
            class="chat-input"
            type="text"
            name="chat-question"
            [(ngModel)]="draft"
            [maxlength]="maxMessageChars"
            [disabled]="isLoading()"
            placeholder="Type a question…"
            autocomplete="off"
          />
          <button
            class="chat-send"
            type="submit"
            aria-label="Send message"
            [disabled]="isLoading() || !draft.trim()"
          >
            <fa-icon [icon]="sendIcon"></fa-icon>
          </button>
        </form>
      </div>
    }

    <button
      class="chat-toggle"
      type="button"
      [attr.aria-label]="copy().title"
      (click)="toggle()"
    >
      <fa-icon [icon]="isOpen() ? closeIcon : chatIcon" size="lg"></fa-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./chat-widget.component.scss",
})
export class ChatWidgetComponent {
  @ViewChild("messageList") private messageList?: ElementRef<HTMLDivElement>;

  private injector = inject(Injector);
  private router = inject(Router);

  // The page the visitor is on decides what the assistant knows and talks
  // about, so it follows navigation while the widget stays mounted.
  private url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  context = computed(() => chatContextForUrl(this.url()), {
    equal: (a, b) => a.page === b.page && a.slug === b.slug,
  });
  copy = computed(() => CHAT_PAGE_COPY[this.context().page]);

  chatIcon = faComments;
  closeIcon = faXmark;
  sendIcon = faPaperPlane;
  maxMessageChars = CHAT_MAX_MESSAGE_CHARS;

  isOpen = signal(false);
  isLoading = signal(false);
  errorMessage = signal("");
  messages = signal<ChatMessage[]>([]);
  draft = "";
  // Bumped whenever the page context changes, so a late reply from the
  // previous page's conversation is discarded.
  private conversation = 0;

  constructor(private chatService: ChatService) {
    // A conversation belongs to the page it started on: moving to another
    // page starts a fresh one grounded in that page's data. A reply still in
    // flight is dropped by the generation check in send().
    effect(() => {
      this.context();
      untracked(() => {
        this.conversation++;
        this.messages.set([]);
        this.errorMessage.set("");
        this.isLoading.set(false);
      });
    });
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  send(): void {
    const question = this.draft.trim();
    if (!question || this.isLoading()) {
      return;
    }
    this.draft = "";
    this.errorMessage.set("");
    this.messages.update((all) => [
      ...all,
      { role: "user", content: question },
    ]);
    this.isLoading.set(true);
    this.scrollToBottom();

    const conversation = this.conversation;
    this.chatService.sendMessage(this.messages(), this.context()).subscribe({
      next: (response) => {
        if (conversation !== this.conversation) {
          return;
        }
        this.messages.update((all) => [
          ...all,
          { role: "assistant", content: response.reply },
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (error: HttpErrorResponse) => {
        if (conversation !== this.conversation) {
          return;
        }
        this.isLoading.set(false);
        this.errorMessage.set(
          error.status === 429
            ? "The assistant is busy right now — please try again in a minute."
            : "The assistant is unavailable right now — please try again later.",
        );
        this.scrollToBottom();
      },
    });
  }

  // Pin the panel to the newest bubble once it has been painted. A one-shot
  // after-next-render hook (rather than a setTimeout) so it doesn't depend on
  // the zoneless scheduler's timing.
  private scrollToBottom(): void {
    afterNextRender(
      () => {
        const el = this.messageList?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      },
      { injector: this.injector },
    );
  }
}
