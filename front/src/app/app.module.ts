import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { HomeComponent } from './home/home.component';
import { WorksComponent } from './works/works.component';
import { ContactComponent } from './contact/contact.component';
import { FooterComponent } from './footer/footer.component';
import { SkillsComponent } from './skills/skills.component';
import { BlogComponent } from './blog/blog.component';
import { HeroComponent } from './hero/hero.component';
import { ProfileComponent } from './profile/profile.component';
import { BaseContentComponent } from './base-content/base-content.component';
import { SkillBarComponent } from './skill-bar/skill-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    WorksComponent,
    ContactComponent,
    FooterComponent,
    SkillsComponent,
    BlogComponent,
    HeroComponent,
    ProfileComponent,
    BaseContentComponent,
    SkillBarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
