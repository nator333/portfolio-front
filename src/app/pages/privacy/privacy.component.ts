import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";

import { HeroComponent } from "../../components/hero/hero.component";

/**
 * Privacy policy.
 *
 * Exists because Google requires a privacy policy URL before the OAuth app
 * behind the admin sign-in and the Google Health connection can be moved to
 * production. It describes what this site actually does, so it has to change
 * whenever the site starts collecting something new: analytics
 * (analytics.service.ts), the activity cache (activity.service.ts), the chat
 * widget (chat.service.ts → the API's /chat), and the owner-only Google Health
 * read (portfolio-api lambda/get-readiness.ts).
 */
@Component({
  selector: "app-privacy",
  standalone: true,
  imports: [HeroComponent, RouterLink],
  template: `
    <app-hero title="Privacy Policy" subtitle="Last updated 27 September 2026"></app-hero>

    <section class="section">
      <div class="container content privacy has-text-white-bis">
        <p>
          This is the personal portfolio site of Hiro Nakamata, based in Montreal, Canada.
          This page explains what information the site handles and why.
        </p>

        <h2>Visitors</h2>
        <h3>Analytics</h3>
        <p>
          The site uses Google Analytics to count page views. Google Analytics sets cookies and
          receives information such as the pages you visit, your browser and an approximate
          location derived from your IP address. It is used only to see how the site is used. See
          <a href="https://policies.google.com/privacy" rel="noopener" target="_blank"
            >Google's privacy policy</a
          >
          for how Google handles this data. You can block it with a browser extension or your
          browser's tracking protection without affecting the site.
        </p>

        <h3>Storage in your browser</h3>
        <p>
          To load the activity calendar faster, the site keeps a short-lived copy of it in your
          browser's session storage. It stays on your device and is cleared when you close the
          tab.
        </p>

        <h3>Chat assistant</h3>
        <p>
          If you use the chat assistant, your messages are sent to the site's server and to an AI
          model (Anthropic's Claude, through Amazon Bedrock) to generate a reply about the
          portfolio. The site does not store your messages. Please don't enter personal or
          sensitive information in the chat.
        </p>

        <h2>Owner sign-in</h2>
        <p>
          Signing in with Google is only for the site owner, to edit the site's content. Only the
          owner's account is admitted. For that sign-in, the site uses the Google account's email
          address and basic profile only to confirm it is the owner.
        </p>

        <h2>Google Health data</h2>
        <p>
          The site owner has connected their own Google Health account to the site's private,
          owner-only tools. With read-only access, those tools read the owner's sleep, heart rate
          variability and resting heart rate at the moment the owner asks, to suggest how hard to
          train that day. Specifically:
        </p>
        <ul>
          <li>Only the owner's own data is accessed, and only the owner can see the results.</li>
          <li>
            The health data is not stored. It is read when requested, and only the authorization
            token that allows the read is kept, encrypted in the site's cloud account.
          </li>
          <li>
            It is never shown on the public site, sold, shared with third parties, or used for
            advertising. Results are shown to the owner in the site's tools, including the owner's
            own AI assistant.
          </li>
          <li>
            The use of information received from Google APIs adheres to the
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              rel="noopener"
              target="_blank"
              >Google API Services User Data Policy</a
            >, including the Limited Use requirements.
          </li>
        </ul>
        <p>
          Access can be revoked at any time from
          <a href="https://myaccount.google.com/permissions" rel="noopener" target="_blank"
            >Google account permissions</a
          >.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about this policy, get in touch through the links on the
          <a routerLink="/profile">Profile</a> page.
        </p>
      </div>
    </section>
  `,
  styles: `
    .privacy {
      max-width: 48rem;
    }
    .privacy h2,
    .privacy h3,
    .privacy a {
      color: #ffd700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PrivacyComponent {}
