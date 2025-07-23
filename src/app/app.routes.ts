import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";
import { ProjectsComponent } from "./pages/projects/projects.component";
import { BlogComponent } from "./pages/blog/blog.component";

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
  { path: "**", redirectTo: "/home" },
];
