import { Component, inject, OnInit } from "@angular/core";

import { Router } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { ProjectsService } from "../../services/projects.service";
import { ProjectEntry, ProjectsData } from "../../models/project-data";

@Component({
  selector: "app-projects-edit",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent],
  templateUrl: "./projects-edit.component.html",
  styleUrl: "./projects-edit.component.scss",
})
export class ProjectsEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  loading = false;
  saving = false;
  errorMessage = "";
  successMessage = "";

  projectsForm: FormGroup = this.fb.group({
    projects: this.fb.array([]),
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  get projectControls(): FormGroup[] {
    return (this.projectsForm.get("projects") as FormArray)
      .controls as FormGroup[];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/home");
  }

  private createProjectGroup(entry?: ProjectEntry): FormGroup {
    return this.fb.group({
      title: [entry?.title ?? ""],
      tech: [entry?.tech ?? ""],
      description: [entry?.description ?? ""],
      image: [entry?.image ?? ""],
      tags: [entry?.tags?.join(", ") ?? ""],
      liveUrl: [entry?.liveUrl ?? ""],
      githubUrl: [entry?.githubUrl ?? ""],
    });
  }

  addProject(): void {
    (this.projectsForm.get("projects") as FormArray).push(
      this.createProjectGroup(),
    );
  }

  removeProject(index: number): void {
    (this.projectsForm.get("projects") as FormArray).removeAt(index);
  }

  private loadProjects(): void {
    this.loading = true;
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        const projectsArray = this.projectsForm.get("projects") as FormArray;
        projectsArray.clear();
        (data.projects ?? []).forEach((entry) =>
          projectsArray.push(this.createProjectGroup(entry)),
        );
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Could not load existing projects.";
        this.loading = false;
      },
    });
  }

  private buildProjectsData(): ProjectsData {
    const value = this.projectsForm.value as {
      projects: {
        title: string;
        tech: string;
        description: string;
        image: string;
        tags: string;
        liveUrl: string;
        githubUrl: string;
      }[];
    };
    return {
      projects: value.projects.map((entry) => ({
        title: entry.title,
        tech: entry.tech,
        description: entry.description,
        image: entry.image,
        tags: entry.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        liveUrl: entry.liveUrl,
        githubUrl: entry.githubUrl,
      })),
    };
  }

  save(): void {
    this.saving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.projectsService.updateProjects(this.buildProjectsData()).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = "Projects saved.";
      },
      error: () => {
        this.saving = false;
        this.errorMessage = "Could not save projects.";
      },
    });
  }
}
