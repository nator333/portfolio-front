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
  { path: "**", redirectTo: "/home" },
];
