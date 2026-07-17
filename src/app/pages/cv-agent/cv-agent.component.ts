import { Component, ElementRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { Observable } from "rxjs";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { AgentService } from "../../services/agent.service";
import { CvService } from "../../services/cv.service";
import { ProjectsService } from "../../services/projects.service";
import {
  AgentMessage,
  AgentProposal,
  AGENT_MAX_MESSAGE_CHARS,
} from "../../models/agent-data";

interface AgentTurn extends AgentMessage {
  proposal?: AgentProposal;
}

@Component({
  selector: "app-cv-agent",
  standalone: true,
  imports: [CommonModule, FormsModule, HeroComponent],
  template: `
    <app-hero title="CV Agent" subtitle="Your private editing copilot"></app-hero>

    <section class="section">
      <div class="container agent-container">
        @if (!isAuthenticated) {
          <div class="box login-box has-text-centered">
            <p class="mb-4">Sign in to work on your CV with the agent.</p>
            <button
              class="button is-primary"
              type="button"
              [disabled]="signingIn"
              (click)="signInWithGoogle()"
            >
              {{ signingIn ? "Signing in…" : "Sign in with Google" }}
            </button>
            @if (errorMessage) {
              <p class="agent-error mt-3">{{ errorMessage }}</p>
            }
          </div>
        } @else {
          <div class="agent-chat" #conversation>
            @if (turns().length === 0) {
              <p class="agent-hint">
                Ask me to rewrite, tighten, or extend your CV or projects —
                e.g. "shorten my summary to two sentences".
              </p>
            }
            @for (turn of turns(); track $index) {
              <div class="agent-bubble" [class.is-user]="turn.role === 'user'">
                {{ turn.content }}
                @if (turn.proposal) {
                  <div class="agent-proposal">
                    <p class="proposal-label">
                      Proposed {{ turn.proposal.target === "cv" ? "CV" : "projects" }} update
                    </p>
                    <details>
                      <summary>Show JSON</summary>
                      <pre>{{ turn.proposal.data | json }}</pre>
                    </details>
                    <button
                      class="button is-primary is-small"
                      type="button"
                      [disabled]="applying()"
                      (click)="apply(turn.proposal)"
                    >
                      {{ applying() ? "Applying…" : "Apply" }}
                    </button>
                  </div>
                }
              </div>
            }
            @if (isLoading()) {
              <div class="agent-bubble is-typing" aria-label="Agent is thinking">
                <span></span><span></span><span></span>
              </div>
            }
            @if (errorMessage) {
              <p class="agent-error">{{ errorMessage }}</p>
            }
            @if (successMessage) {
              <p class="agent-success">{{ successMessage }}</p>
            }
          </div>

          <form class="agent-input-row" (ngSubmit)="send()">
            <input
              class="agent-input"
              type="text"
              name="agent-question"
              [(ngModel)]="draft"
              [maxlength]="maxMessageChars"
              [disabled]="isLoading()"
              placeholder="What should we improve?"
              autocomplete="off"
            />
            <button
              class="button is-primary"
              type="submit"
              [disabled]="isLoading() || !draft.trim()"
            >
              Send
            </button>
          </form>
        }
      </div>
    </section>
  `,
  styleUrl: "./cv-agent.component.scss",
})
export class CvAgentComponent implements OnInit {
  private authService = inject(AuthService);
  private agentService = inject(AgentService);
  private cvService = inject(CvService);
  private projectsService = inject(ProjectsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild("conversation") private conversation?: ElementRef<HTMLDivElement>;

  maxMessageChars = AGENT_MAX_MESSAGE_CHARS;
  isAuthenticated = false;
  signingIn = false;
  errorMessage = "";
  successMessage = "";
  draft = "";

  turns = signal<AgentTurn[]>([]);
  isLoading = signal(false);
  applying = signal(false);

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((authenticated) => {
      this.isAuthenticated = authenticated;
    });

    // Returning from the Cognito hosted domain after Google sign-in.
    const code = this.route.snapshot.queryParamMap.get("code");
    if (code && !this.authService.isAuthenticated()) {
      this.signingIn = true;
      this.authService.handleRedirectCallback(code).subscribe({
        next: () => {
          this.signingIn = false;
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
        error: () => {
          this.signingIn = false;
          this.errorMessage = "Sign-in failed. Please try again.";
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
      });
    }
  }

  signInWithGoogle(): void {
    this.signingIn = true;
    this.authService.signInWithGoogle();
  }

  send(): void {
    const question = this.draft.trim();
    if (!question || this.isLoading()) {
      return;
    }
    this.draft = "";
    this.errorMessage = "";
    this.successMessage = "";
    this.turns.update((all) => [...all, { role: "user", content: question }]);
    this.isLoading.set(true);
    this.scrollToBottom();

    const history: AgentMessage[] = this.turns().map(({ role, content }) => ({ role, content }));
    this.agentService.sendMessage(history).subscribe({
      next: (response) => {
        this.turns.update((all) => [
          ...all,
          { role: "assistant", content: response.reply, proposal: response.proposal },
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage =
          error.status === 401
            ? "Your session expired — sign in again."
            : error.status === 429
              ? "The agent is busy — try again in a minute."
              : "The agent is unavailable right now — try again later.";
        this.scrollToBottom();
      },
    });
  }

  apply(proposal: AgentProposal): void {
    this.applying.set(true);
    this.errorMessage = "";
    this.successMessage = "";
    const save$: Observable<unknown> =
      proposal.target === "cv"
        ? this.cvService.updateCv(proposal.data)
        : this.projectsService.updateProjects(proposal.data);
    save$.subscribe({
      next: () => {
        this.applying.set(false);
        this.successMessage =
          proposal.target === "cv" ? "CV updated." : "Projects updated.";
      },
      error: () => {
        this.applying.set(false);
        this.errorMessage = "Saving failed — your session may have expired.";
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.conversation?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
