import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeroComponent } from '../../components/hero/hero.component';
import { AuthService } from '../../services/auth.service';
import { CvService } from '../../services/cv.service';
import { CvData } from '../../models/cv-data';
import { downloadCvPdf } from '../../utils/cv-pdf.util';

@Component({
  selector: 'app-cv-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroComponent],
  templateUrl: './cv-editor.component.html',
  styleUrl: './cv-editor.component.scss',
})
export class CvEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cvService = inject(CvService);

  isAuthenticated = false;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  cvForm: FormGroup = this.fb.group({
    personalInfo: this.fb.group({
      fullName: [''],
      title: [''],
      email: [''],
      phone: [''],
      location: [''],
      links: this.fb.group({
        website: [''],
        github: [''],
        linkedin: [''],
      }),
    }),
    summary: [''],
    experience: this.fb.array([]),
    education: this.fb.array([]),
    skills: [''],
  });

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((authenticated) => {
      this.isAuthenticated = authenticated;
      if (authenticated) {
        this.loadCv();
      }
    });
  }

  get experienceControls(): FormGroup[] {
    return (this.cvForm.get('experience') as FormArray).controls as FormGroup[];
  }

  get educationControls(): FormGroup[] {
    return (this.cvForm.get('education') as FormArray).controls as FormGroup[];
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      error: () => {
        this.errorMessage = 'Login failed. Check your username and password.';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private createExperienceGroup(entry?: CvData['experience'][number]): FormGroup {
    return this.fb.group({
      company: [entry?.company ?? ''],
      role: [entry?.role ?? ''],
      startDate: [entry?.startDate ?? ''],
      endDate: [entry?.endDate ?? ''],
      location: [entry?.location ?? ''],
      bullets: [entry?.bullets?.join('\n') ?? ''],
    });
  }

  private createEducationGroup(entry?: CvData['education'][number]): FormGroup {
    return this.fb.group({
      institution: [entry?.institution ?? ''],
      degree: [entry?.degree ?? ''],
      startDate: [entry?.startDate ?? ''],
      endDate: [entry?.endDate ?? ''],
    });
  }

  addExperience(): void {
    (this.cvForm.get('experience') as FormArray).push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    (this.cvForm.get('experience') as FormArray).removeAt(index);
  }

  addEducation(): void {
    (this.cvForm.get('education') as FormArray).push(this.createEducationGroup());
  }

  removeEducation(index: number): void {
    (this.cvForm.get('education') as FormArray).removeAt(index);
  }

  private loadCv(): void {
    this.loading = true;
    this.cvService.getCv().subscribe({
      next: (data) => {
        this.patchForm(data);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load existing CV data.';
        this.loading = false;
      },
    });
  }

  private patchForm(data: CvData): void {
    this.cvForm.patchValue({
      personalInfo: data.personalInfo,
      summary: data.summary,
      skills: data.skills.join(', '),
    });

    const experienceArray = this.cvForm.get('experience') as FormArray;
    experienceArray.clear();
    data.experience.forEach((entry) => experienceArray.push(this.createExperienceGroup(entry)));

    const educationArray = this.cvForm.get('education') as FormArray;
    educationArray.clear();
    data.education.forEach((entry) => educationArray.push(this.createEducationGroup(entry)));
  }

  private buildCvData(): CvData {
    const value = this.cvForm.value;
    return {
      personalInfo: value.personalInfo,
      summary: value.summary,
      experience: value.experience.map((entry: { bullets: string; [key: string]: unknown }) => ({
        ...entry,
        bullets: entry.bullets
          .split('\n')
          .map((bullet) => bullet.trim())
          .filter(Boolean),
      })),
      education: value.education,
      skills: (value.skills as string)
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };
  }

  save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cvService.updateCv(this.buildCvData()).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'CV saved.';
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Could not save CV data.';
      },
    });
  }

  downloadPdf(): void {
    downloadCvPdf(this.buildCvData());
  }
}
