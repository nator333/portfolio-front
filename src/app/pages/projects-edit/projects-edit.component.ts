import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { ImageUploadComponent } from "../../components/image-upload/image-upload.component";
import { AuthService } from "../../services/auth.service";
import { ProjectsService } from "../../services/projects.service";
import { MediaAsset, MediaService } from "../../services/media.service";
import { ProjectEntry, ProjectsData } from "../../models/project-data";

@Component({
  selector: "app-projects-edit",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent, ImageUploadComponent],
  templateUrl: "./projects-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./projects-edit.component.scss",
})
export class ProjectsEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private mediaService = inject(MediaService);
  private router = inject(Router);

  /** Saved images offered in each project's image picker. */
  mediaAssets: MediaAsset[] = [];

  loading = false;
  saving = false;
  errorMessage = "";
  successMessage = "";

  projectsForm: FormGroup = this.fb.group({
    projects: this.fb.array([]),
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadMedia();
  }

  private loadMedia(): void {
    // Best-effort: the picker just has no saved options if this fails.
    this.mediaService.list().subscribe({
      next: (assets) => (this.mediaAssets = assets),
      error: () => (this.mediaAssets = []),
    });
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
