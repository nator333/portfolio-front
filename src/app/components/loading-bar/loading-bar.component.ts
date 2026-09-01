import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from "@angular/core";

import { LoadingService } from "../../services/loading.service";

/**
 * A thin indeterminate progress bar fixed to the top of the viewport, shown
 * whenever any HTTP request is in flight (driven by LoadingService via the
 * loading interceptor).
 */
@Component({
  selector: "app-loading-bar",
  standalone: true,
  template: `
    @if (loading()) {
      <div
        class="loading-bar"
        role="progressbar"
        aria-label="Loading"
        aria-busy="true"
      >
        <div class="loading-bar__indicator"></div>
      </div>
    }
  `,
  styles: [
    `
      .loading-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        z-index: 1000;
        overflow: hidden;
        background: rgba(255, 215, 0, 0.15);
        pointer-events: none;
      }

      .loading-bar__indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        background: #ffd700;
        border-radius: 0 3px 3px 0;
        animation: loading-bar-slide 1.1s ease-in-out infinite;
      }

      @keyframes loading-bar-slide {
        0% {
          left: -40%;
        }
        50% {
          left: 30%;
        }
        100% {
          left: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .loading-bar__indicator {
          animation-duration: 2.2s;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);
  readonly loading = this.loadingService.loading;
}
