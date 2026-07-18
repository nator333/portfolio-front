import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  private router = inject(Router);

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  cvForm: FormGroup = this.fb.group({
    personalInfo: this.fb.group({
      fullName: [''],
      title: [''],
      email: [''],
      phone: [''],
      links: this.fb.group({
        website: [''],
        github: [''],
        linkedin: [''],
      }),
    }),
    summary: [''],
    technicalSkills: this.fb.array([]),
    experience: this.fb.array([]),
    qualifications: this.fb.array([]),
    education: this.fb.array([]),
  });

  ngOnInit(): void {
    this.loadCv();
  }

  get skillCategoryControls(): FormGroup[] {
    return (this.cvForm.get('technicalSkills') as FormArray).controls as FormGroup[];
  }

  get experienceControls(): FormGroup[] {
    return (this.cvForm.get('experience') as FormArray).controls as FormGroup[];
  }

  get qualificationControls(): FormGroup[] {
    return (this.cvForm.get('qualifications') as FormArray).controls as FormGroup[];
  }

  get educationControls(): FormGroup[] {
    return (this.cvForm.get('education') as FormArray).controls as FormGroup[];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/home');
  }

  private createSkillCategoryGroup(entry?: CvData['technicalSkills'][number]): FormGroup {
    return this.fb.group({
      category: [entry?.category ?? ''],
      skills: [entry?.skills?.join(', ') ?? ''],
    });
  }

  private createExperienceGroup(entry?: CvData['experience'][number]): FormGroup {
    return this.fb.group({
      company: [entry?.company ?? ''],
      role: [entry?.role ?? ''],
      startDate: [entry?.startDate ?? ''],
      endDate: [entry?.endDate ?? ''],
      bullets: [entry?.bullets?.join('\n') ?? ''],
      techstack: [entry?.techstack ?? ''],
    });
  }

  private createQualificationGroup(entry?: CvData['qualifications'][number]): FormGroup {
    return this.fb.group({
      label: [entry?.label ?? ''],
      text: [entry?.text ?? ''],
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

  addSkillCategory(): void {
    (this.cvForm.get('technicalSkills') as FormArray).push(this.createSkillCategoryGroup());
  }

  removeSkillCategory(index: number): void {
    (this.cvForm.get('technicalSkills') as FormArray).removeAt(index);
  }

  addExperience(): void {
    (this.cvForm.get('experience') as FormArray).push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    (this.cvForm.get('experience') as FormArray).removeAt(index);
  }

  addQualification(): void {
    (this.cvForm.get('qualifications') as FormArray).push(this.createQualificationGroup());
  }

  removeQualification(index: number): void {
    (this.cvForm.get('qualifications') as FormArray).removeAt(index);
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
    });

    const skillsArray = this.cvForm.get('technicalSkills') as FormArray;
    skillsArray.clear();
    (data.technicalSkills ?? []).forEach((entry) =>
      skillsArray.push(this.createSkillCategoryGroup(entry)),
    );

    const experienceArray = this.cvForm.get('experience') as FormArray;
    experienceArray.clear();
    (data.experience ?? []).forEach((entry) =>
      experienceArray.push(this.createExperienceGroup(entry)),
    );

    const qualificationsArray = this.cvForm.get('qualifications') as FormArray;
    qualificationsArray.clear();
    (data.qualifications ?? []).forEach((entry) =>
      qualificationsArray.push(this.createQualificationGroup(entry)),
    );

    const educationArray = this.cvForm.get('education') as FormArray;
    educationArray.clear();
    (data.education ?? []).forEach((entry) =>
      educationArray.push(this.createEducationGroup(entry)),
    );
  }

  private buildCvData(): CvData {
    const value = this.cvForm.value;
    return {
      personalInfo: value.personalInfo,
      summary: value.summary,
      technicalSkills: value.technicalSkills.map(
        (entry: { category: string; skills: string }) => ({
          category: entry.category,
          skills: entry.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      ),
      experience: value.experience.map((entry: { bullets: string; [key: string]: unknown }) => ({
        ...entry,
        bullets: entry.bullets
          .split('\n')
          .map((bullet) => bullet.trim())
          .filter(Boolean),
      })),
      qualifications: value.qualifications,
      education: value.education,
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
