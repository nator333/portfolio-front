import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { AgentService } from "./agent.service";
import { AuthService } from "./auth.service";
import { AgentMessage, AGENT_MAX_MESSAGES } from "../models/agent-data";
import { environment } from "../../environments/environment";

describe("AgentService", () => {
  let service: AgentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getIdToken: () => "test-id-token" },
        },
      ],
    });
    service = TestBed.inject(AgentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("should post the conversation with the raw Cognito id token", () => {
    const history: AgentMessage[] = [
      { role: "user", content: "Shorten my summary" },
    ];

    let reply = "";
    service.sendMessage(history).subscribe((r) => (reply = r.reply));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/agent`);
    expect(req.request.method).toBe("POST");
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    expect(req.request.headers.has("X-Api-Key")).toBe(false);
    expect(req.request.body).toEqual({ messages: history });
    req.flush({ reply: "Here is a shorter draft." });

    expect(reply).toBe("Here is a shorter draft.");
  });

  it("should clamp long histories to the agent message limit", () => {
    const history: AgentMessage[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${i}`,
    }));

    service.sendMessage(history).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/agent`);
    expect(req.request.body.messages.length).toBe(AGENT_MAX_MESSAGES);
    expect(req.request.body.messages[AGENT_MAX_MESSAGES - 1].content).toBe(
      "message 29",
    );
    req.flush({ reply: "ok" });
  });
});
