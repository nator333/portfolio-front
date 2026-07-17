import { ComponentFixture, TestBed, tick, fakeAsync } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { ChatWidgetComponent } from "./chat-widget.component";
import { ChatService } from "../../services/chat.service";

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
      providers: [{ provide: ChatService, useValue: chatService }],
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

  it("should render the visitor question and the assistant reply", fakeAsync(() => {
    chatService.sendMessage.and.returnValue(of({ reply: "He knows AWS." }));

    component.isOpen.set(true);
    component.draft = "Does Hiro know AWS?";
    component.send();
    tick();
    fixture.detectChanges();

    const bubbles = Array.from(
      fixture.nativeElement.querySelectorAll(".chat-bubble"),
    ).map((b) => (b as HTMLElement).textContent?.trim());
    expect(bubbles).toEqual(["Does Hiro know AWS?", "He knows AWS."]);
  }));

  it("should show a busy message when the API is throttled", fakeAsync(() => {
    chatService.sendMessage.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429 })),
    );

    component.isOpen.set(true);
    component.draft = "Hello?";
    component.send();
    tick();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(".chat-error");
    expect(error?.textContent).toContain("busy");
  }));

  it("should not send blank input", () => {
    component.draft = "   ";
    component.send();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });
});
