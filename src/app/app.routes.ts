import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";
import { ProjectsComponent } from "./pages/projects/projects.component";
import { BlogComponent } from "./pages/blog/blog.component";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "projects", component: ProjectsComponent },
  { path: "blog", component: BlogComponent },
  {
    path: "workout",
    loadComponent: () =>
      import("./pages/workout/workout.component").then((m) => m.WorkoutComponent),
  },
  {
    path: "blog/:url",
    loadComponent: () =>
      import("./pages/blog-post/blog-post.component").then(
        (m) => m.BlogPostComponent,
      ),
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./pages/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "home-edit",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/home-edit/home-edit.component").then(
        (m) => m.HomeEditComponent,
      ),
  },
  {
    path: "cv-editor",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/cv-editor/cv-editor.component").then(
        (m) => m.CvEditorComponent,
      ),
  },
  {
    path: "blog-edit",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/blog-edit/blog-edit.component").then(
        (m) => m.BlogEditComponent,
      ),
  },
  {
    path: "blog-edit/new",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/blog-post-edit/blog-post-edit.component").then(
        (m) => m.BlogPostEditComponent,
      ),
  },
  {
    path: "blog-edit/:slug",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/blog-post-edit/blog-post-edit.component").then(
        (m) => m.BlogPostEditComponent,
      ),
  },
  {
    path: "projects-edit",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/projects-edit/projects-edit.component").then(
        (m) => m.ProjectsEditComponent,
      ),
  },
  {
    path: "cv-agent",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/cv-agent/cv-agent.component").then(
        (m) => m.CvAgentComponent,
      ),
  },
  {
    path: "media-library",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/media-library/media-library.component").then(
        (m) => m.MediaLibraryComponent,
      ),
  },
  { path: "**", redirectTo: "/home" },
];
