import { Component, ElementRef, ViewChild, signal } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faComments,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { HttpErrorResponse } from "@angular/common/http";
import { ChatService } from "../../services/chat.service";
import { ChatMessage, CHAT_MAX_MESSAGE_CHARS } from "../../models/chat-data";

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
          <span class="chat-title">Ask about Hiro</span>
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
            <p class="chat-hint">
              Hi! Ask me anything about Hiro's experience, skills, or projects.
            </p>
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
      aria-label="Chat about Hiro's portfolio"
      (click)="toggle()"
    >
      <fa-icon [icon]="isOpen() ? closeIcon : chatIcon" size="lg"></fa-icon>
    </button>
  `,
  styleUrl: "./chat-widget.component.scss",
})
export class ChatWidgetComponent {
  @ViewChild("messageList") private messageList?: ElementRef<HTMLDivElement>;

  chatIcon = faComments;
  closeIcon = faXmark;
  sendIcon = faPaperPlane;
  maxMessageChars = CHAT_MAX_MESSAGE_CHARS;

  isOpen = signal(false);
  isLoading = signal(false);
  errorMessage = signal("");
  messages = signal<ChatMessage[]>([]);
  draft = "";

  constructor(private chatService: ChatService) {}

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

    this.chatService.sendMessage(this.messages()).subscribe({
      next: (response) => {
        this.messages.update((all) => [
          ...all,
          { role: "assistant", content: response.reply },
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (error: HttpErrorResponse) => {
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

  private scrollToBottom(): void {
    // After Angular renders the new bubble.
    setTimeout(() => {
      const el = this.messageList?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
