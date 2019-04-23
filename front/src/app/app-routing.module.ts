import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ContactComponent} from './contact/contact.component';
import {WorksComponent} from './works/works.component';
import {SkillsComponent} from './skills/skills.component';
import {BlogComponent} from './blog/blog.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'works', component: WorksComponent},
  {path: 'blog', component: BlogComponent},
  {path: 'skills', component: SkillsComponent},
  {path: 'contact', component: ContactComponent}
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
