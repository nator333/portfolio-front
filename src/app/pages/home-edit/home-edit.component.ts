import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HeroComponent } from '../../components/hero/hero.component';
import { AuthService } from '../../services/auth.service';
import { HomeService } from '../../services/home.service';
import {
  DEFAULT_MOTTOES,
  HomeData,
  MAX_MOTTO_COUNT,
  MAX_MOTTO_LENGTH,
} from '../../models/home-data';

@Component({
  selector: 'app-home-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroComponent],
  templateUrl: './home-edit.component.html',
  styleUrl: './home-edit.component.scss',
})
export class HomeEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private homeService = inject(HomeService);
  private router = inject(Router);

  readonly maxMottoCount = MAX_MOTTO_COUNT;
  readonly maxMottoLength = MAX_MOTTO_LENGTH;

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  homeForm: FormGroup = this.fb.group({
    mottoes: this.fb.array([]),
  });

  ngOnInit(): void {
    this.loadHome();
  }

  get mottoControls(): FormControl<string>[] {
    return this.mottoArray.controls as FormControl<string>[];
  }

  get canAddMotto(): boolean {
    return this.mottoArray.length < MAX_MOTTO_COUNT;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/home');
  }

  addMotto(): void {
    if (this.canAddMotto) {
      this.mottoArray.push(this.createMottoControl());
    }
  }

  removeMotto(index: number): void {
    this.mottoArray.removeAt(index);
  }

  save(): void {
    if (this.homeForm.invalid) {
      this.homeForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const data: HomeData = {
      mottoes: this.mottoControls.map((control) => control.value.trim()),
    };
    this.homeService.updateHome(data).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Home hero saved.';
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Could not save the home hero.';
      },
    });
  }

  private get mottoArray(): FormArray {
    return this.homeForm.get('mottoes') as FormArray;
  }

  private createMottoControl(value = ''): FormControl<string> {
    return this.fb.nonNullable.control(value, [
      Validators.required,
      Validators.maxLength(MAX_MOTTO_LENGTH),
    ]);
  }

  private setMottoes(mottoes: string[]): void {
    this.mottoArray.clear();
    mottoes
      .slice(0, MAX_MOTTO_COUNT)
      .forEach((motto) => this.mottoArray.push(this.createMottoControl(motto)));
  }

  private loadHome(): void {
    this.loading = true;
    this.homeService.getHome().subscribe({
      next: (data) => {
        // A never-saved document comes back null; edit from the bundled
        // defaults. A saved empty list stays empty — it was cleared on purpose.
        this.setMottoes(data.mottoes ?? DEFAULT_MOTTOES);
        this.loading = false;
      },
      error: () => {
        this.setMottoes(DEFAULT_MOTTOES);
        this.errorMessage = 'Could not load the saved hero; showing defaults.';
        this.loading = false;
      },
    });
  }
}
