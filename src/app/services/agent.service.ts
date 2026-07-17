import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";
import {
  AgentMessage,
  AgentResponse,
  AGENT_MAX_MESSAGES,
  AGENT_MAX_MESSAGE_CHARS,
} from "../models/agent-data";

/**
 * Sends the admin's CV-editing conversation to the Cognito-protected
 * portfolio-api agent endpoint.
 */
@Injectable({
  providedIn: "root",
})
export class AgentService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  sendMessage(history: AgentMessage[]): Observable<AgentResponse> {
    const messages = history.slice(-AGENT_MAX_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, AGENT_MAX_MESSAGE_CHARS),
    }));
    const headers = new HttpHeaders({
      // REST API Cognito authorizers expect the raw JWT, not a Bearer-prefixed value.
      Authorization: this.authService.getIdToken(),
    });
    return this.http.post<AgentResponse>(
      `${environment.apiBaseUrl}/agent`,
      { messages },
      { headers },
    );
  }
}
