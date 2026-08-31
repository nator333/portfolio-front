import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
  AgentMessage,
  AgentResponse,
  AGENT_MAX_MESSAGES,
  AGENT_MAX_MESSAGE_CHARS,
} from "../models/agent-data";
import { withAuth } from "../interceptors/api.interceptors";

/**
 * Sends the admin's CV-editing conversation to the Cognito-protected
 * portfolio-api agent endpoint.
 */
@Injectable({
  providedIn: "root",
})
export class AgentService {
  constructor(private http: HttpClient) {}

  sendMessage(history: AgentMessage[]): Observable<AgentResponse> {
    const messages = history.slice(-AGENT_MAX_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, AGENT_MAX_MESSAGE_CHARS),
    }));
    // Cognito-gated endpoint: the ID token is the authority, no api key.
    return this.http.post<AgentResponse>(
      `${environment.apiBaseUrl}/agent`,
      { messages },
      { context: withAuth("none") },
    );
  }
}
