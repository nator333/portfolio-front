import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { ChatWidgetComponent } from "./chat-widget.component";
import { ChatService } from "../../services/chat.service";
import { provideRouter, Router } from "@angular/router";
import { Component } from "@angular/core";

@Component({ template: "" })
class BlankPage {}

describe("ChatWidgetComponent", () => {
  let fixture: ComponentFixture<ChatWidgetComponent>;
  let component: ChatWidgetComponent;
  let chatService: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    chatService = jasmine.createSpyObj<ChatService>("ChatService", [
      "sendMessage",
    ]);
    await TestBed.configureTestingModule({
      imports: [ChatWidgetComponent],
      providers: [
        { provide: ChatService, useValue: chatService },
        provideRouter([
          { path: "workout", component: BlankPage },
          { path: "blog/:url", component: BlankPage },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should start closed with only the toggle button visible", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".chat-toggle")).toBeTruthy();
    expect(el.querySelector(".chat-panel")).toBeFalsy();
  });

  it("should open the panel when the toggle is clicked", () => {
    (fixture.nativeElement.querySelector(".chat-toggle") as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".chat-panel")).toBeTruthy();
  });

  it("should render the visitor question and the assistant reply", async () => {
    chatService.sendMessage.and.returnValue(of({ reply: "He knows AWS." }));

    component.isOpen.set(true);
    component.draft = "Does Hiro know AWS?";
    component.send();
    await fixture.whenStable();
    fixture.detectChanges();

    const bubbles = Array.from(
      fixture.nativeElement.querySelectorAll(".chat-bubble"),
    ).map((b) => (b as HTMLElement).textContent?.trim());
    expect(bubbles).toEqual(["Does Hiro know AWS?", "He knows AWS."]);
  });

  it("should show a busy message when the API is throttled", async () => {
    chatService.sendMessage.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429 })),
    );

    component.isOpen.set(true);
    component.draft = "Hello?";
    component.send();
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(".chat-error");
    expect(error?.textContent).toContain("busy");
  });

  it("should not send blank input", () => {
    component.draft = "   ";
    component.send();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it("should send the current page as context", async () => {
    chatService.sendMessage.and.returnValue(of({ reply: "Squats." }));
    await TestBed.inject(Router).navigateByUrl("/blog/my-post");
    fixture.detectChanges();

    component.draft = "What is this about?";
    component.send();

    expect(chatService.sendMessage).toHaveBeenCalledWith(
      [{ role: "user", content: "What is this about?" }],
      { page: "blog-post", slug: "my-post" },
    );
  });

  it("should adapt its title and start a fresh conversation per page", async () => {
    chatService.sendMessage.and.returnValue(of({ reply: "Hello." }));
    component.isOpen.set(true);
    component.draft = "Hi";
    component.send();
    await fixture.whenStable();
    expect(component.messages().length).toBe(2);

    await TestBed.inject(Router).navigateByUrl("/workout");
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.messages()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(".chat-title")?.textContent,
    ).toContain("training");
  });
});
