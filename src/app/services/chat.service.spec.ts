import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ChatService } from "./chat.service";
import { ChatMessage, CHAT_MAX_MESSAGES } from "../models/chat-data";
import { environment } from "../../environments/environment";

describe("ChatService", () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("should post the conversation with the chat API key", () => {
    const history: ChatMessage[] = [{ role: "user", content: "Hello" }];

    let reply = "";
    service.sendMessage(history).subscribe((r) => (reply = r.reply));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/chat`);
    expect(req.request.method).toBe("POST");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.chatApiKey);
    expect(req.request.body).toEqual({ messages: history });
    req.flush({ reply: "Hi there" });

    expect(reply).toBe("Hi there");
  });

  it("should clamp long histories to the API message limit", () => {
    const history: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${i}`,
    }));

    service.sendMessage(history).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/chat`);
    expect(req.request.body.messages.length).toBe(CHAT_MAX_MESSAGES);
    expect(req.request.body.messages[CHAT_MAX_MESSAGES - 1].content).toBe(
      "message 19",
    );
    req.flush({ reply: "ok" });
  });
});
