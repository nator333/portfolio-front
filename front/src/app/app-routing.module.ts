import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ContactComponent} from './contact/contact.component';
import {WorksComponent} from './works/works.component';
import {SkillsComponent} from './skills/skills.component';
import {BlogComponent} from './blog/blog.component';
import {ProfileComponent} from './profile/profile.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'projects', component: WorksComponent},
  {path: 'blog', component: BlogComponent},
  {path: 'skills', component: SkillsComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'contact', component: ContactComponent}
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
