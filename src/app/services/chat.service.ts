import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
  ChatMessage,
  ChatResponse,
  CHAT_MAX_MESSAGES,
  CHAT_MAX_MESSAGE_CHARS,
} from "../models/chat-data";

/**
 * Sends visitor questions to the public portfolio-api chat endpoint.
 */
@Injectable({
  providedIn: "root",
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(history: ChatMessage[]): Observable<ChatResponse> {
    // Clamp client-side to the API's limits so long conversations keep working
    // (the server only needs recent turns for context) and never 400.
    const messages = history.slice(-CHAT_MAX_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, CHAT_MAX_MESSAGE_CHARS),
    }));
    const headers = new HttpHeaders({ "X-Api-Key": environment.chatApiKey });
    return this.http.post<ChatResponse>(
      `${environment.apiBaseUrl}/chat`,
      { messages },
      { headers },
    );
  }
}
