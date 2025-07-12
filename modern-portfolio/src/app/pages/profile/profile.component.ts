import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HeroComponent],
  template: `
    <app-hero title="Profile" subtitle="About Masahiro Nakamata">
    </app-hero>
    
    <section class="section skills-section">
      <div class="container">
        
        <!-- Languages Section -->
        <div class="skill-category">
          <h2 class="title is-3 has-text-centered has-text-white">Languages</h2>
          <div class="columns">
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Frontend</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of frontendLanguages; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Mobile & Backend</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of backendLanguages; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Frameworks Section -->
        <div class="skill-category">
          <h2 class="title is-3 has-text-centered has-text-white">Frameworks</h2>
          <div class="columns">
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Frontend</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of frontendFrameworks; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Server Side</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of backendFrameworks; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cloud Computing Section -->
        <div class="skill-category">
          <h2 class="title is-3 has-text-centered has-text-white">Cloud Computing Platform</h2>
          <div class="columns">
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">AWS</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of awsSkills; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column">
              <h3 class="subtitle is-4 has-text-centered has-text-white">GCP</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of gcpSkills; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Database Section -->
        <div class="skill-category">
          <h2 class="title is-3 has-text-centered has-text-white">Database</h2>
          <div class="skillBox has-text-centered">
            <div class="skill-list">
              @for (skill of databases; track skill) {
                <span class="skill-tag">{{ skill }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Tools Section -->
        <div class="skill-category">
          <h2 class="title is-3 has-text-centered has-text-white">Tools</h2>
          <div class="columns is-multiline">
            <div class="column is-half">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Package Manager</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of packageManagers; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column is-half">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Virtualization</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of virtualization; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column is-half">
              <h3 class="subtitle is-4 has-text-centered has-text-white">IDE</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of ides; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="column is-half">
              <h3 class="subtitle is-4 has-text-centered has-text-white">Other</h3>
              <div class="skillBox">
                <div class="skill-list">
                  @for (skill of otherTools; track skill) {
                    <span class="skill-tag">{{ skill }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  `,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  frontendLanguages = ['HTML5', 'SASS', 'TypeScript', 'JavaScript'];
  backendLanguages = ['Kotlin', 'Java', 'C', 'Objective-C', 'Swift', 'Perl', 'PHP', 'Lua', '.NET VB', '.NET VBA'];
  
  frontendFrameworks = ['Angular', 'React', 'Vue.js', 'Node.js'];
  backendFrameworks = ['Play Framework', 'Spring Boot', 'Ktor', 'Serverless Framework'];
  
  awsSkills = ['EC2', 'S3', 'Lambda', 'API Gateway', 'Kinesis', 'Redshift', 'Cloud Formation'];
  gcpSkills = ['GCE', 'Firebase'];
  
  databases = ['MySQL', 'PostgreSQL', 'SQLite', 'Neo4j'];
  
  packageManagers = ['npm', 'CocoaPods', 'Gradle', 'Maven'];
  virtualization = ['Docker', 'Docker Compose'];
  ides = ['IntelliJ Ultimate', 'WebStorm', 'Visual Studio Code'];
  otherTools = ['Git', 'CircleCI'];
}