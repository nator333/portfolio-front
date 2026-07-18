import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of } from "rxjs";
import { CvAgentComponent } from "./cv-agent.component";
import { AgentService } from "../../services/agent.service";
import { CvService } from "../../services/cv.service";
import { ProjectsService } from "../../services/projects.service";
import { CvData } from "../../models/cv-data";

describe("CvAgentComponent", () => {
  let fixture: ComponentFixture<CvAgentComponent>;
  let component: CvAgentComponent;
  let agentService: jasmine.SpyObj<AgentService>;
  let cvService: jasmine.SpyObj<CvService>;
  let projectsService: jasmine.SpyObj<ProjectsService>;

  const proposedCv = { summary: "Shorter." } as unknown as CvData;

  beforeEach(async () => {
    agentService = jasmine.createSpyObj<AgentService>("AgentService", ["sendMessage"]);
    cvService = jasmine.createSpyObj<CvService>("CvService", ["updateCv"]);
    projectsService = jasmine.createSpyObj<ProjectsService>("ProjectsService", [
      "updateProjects",
    ]);

    await TestBed.configureTestingModule({
      imports: [CvAgentComponent],
      providers: [
        { provide: AgentService, useValue: agentService },
        { provide: CvService, useValue: cvService },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the reply for a plain conversational turn", fakeAsync(() => {
    agentService.sendMessage.and.returnValue(of({ reply: "Sure, tell me more." }));

    component.draft = "Help me improve my summary";
    component.send();
    tick();
    fixture.detectChanges();

    const bubbles = Array.from(
      fixture.nativeElement.querySelectorAll(".agent-bubble"),
    ).map((b) => (b as HTMLElement).textContent?.trim());
    expect(bubbles[0]).toBe("Help me improve my summary");
    expect(bubbles[1]).toContain("Sure, tell me more.");
    expect(fixture.nativeElement.querySelector(".agent-proposal")).toBeFalsy();
  }));

  it("should render a proposal with an Apply button", fakeAsync(() => {
    agentService.sendMessage.and.returnValue(
      of({
        reply: "Here is the shorter summary.",
        proposal: { target: "cv" as const, data: proposedCv },
      }),
    );

    component.draft = "Shorten my summary";
    component.send();
    tick();
    fixture.detectChanges();

    const proposal = fixture.nativeElement.querySelector(".agent-proposal");
    expect(proposal).toBeTruthy();
    expect(proposal.textContent).toContain("Proposed CV update");
    expect(proposal.querySelector("button")).toBeTruthy();
  }));

  it("should apply a CV proposal through CvService", fakeAsync(() => {
    cvService.updateCv.and.returnValue(of(proposedCv));

    component.apply({ target: "cv", data: proposedCv });
    tick();

    expect(cvService.updateCv).toHaveBeenCalledWith(proposedCv);
    expect(projectsService.updateProjects).not.toHaveBeenCalled();
    expect(component.successMessage).toBe("CV updated.");
  }));

  it("should apply a projects proposal through ProjectsService", fakeAsync(() => {
    const proposedProjects = { projects: [] };
    projectsService.updateProjects.and.returnValue(of(proposedProjects));

    component.apply({ target: "projects", data: proposedProjects });
    tick();

    expect(projectsService.updateProjects).toHaveBeenCalledWith(proposedProjects);
    expect(component.successMessage).toBe("Projects updated.");
  }));
});
