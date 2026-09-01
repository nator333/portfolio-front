import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";

import { Router } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { HomeService } from "../../services/home.service";
import {
  HomeData,
  MAX_MOTTO_COUNT,
  MAX_MOTTO_LENGTH,
} from "../../models/home-data";

@Component({
  selector: "app-home-edit",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent],
  templateUrl: "./home-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./home-edit.component.scss",
})
export class HomeEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private homeService = inject(HomeService);
  private router = inject(Router);

  readonly maxMottoCount = MAX_MOTTO_COUNT;
  readonly maxMottoLength = MAX_MOTTO_LENGTH;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  homeForm: FormGroup = this.fb.group({
    mottoes: this.fb.array([]),
    // Hide the mottoes on the live hero without clearing them.
    mottoesHidden: this.fb.nonNullable.control(false),
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
    this.router.navigateByUrl("/home");
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
    this.saving.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");
    const data: HomeData = {
      mottoes: this.mottoControls.map((control) => control.value.trim()),
      mottoesHidden: this.homeForm.get("mottoesHidden")?.value ?? false,
    };
    this.homeService.updateHome(data).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set("Home hero saved.");
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set("Could not save the home hero.");
      },
    });
  }

  private get mottoArray(): FormArray {
    return this.homeForm.get("mottoes") as FormArray;
  }

  private createMottoControl(value = ""): FormControl<string> {
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
    this.loading.set(true);
    this.homeService.getHome().subscribe({
      next: (data) => {
        // A never-saved document comes back null; start from an empty list.
        this.setMottoes(data.mottoes ?? []);
        this.homeForm
          .get("mottoesHidden")
          ?.setValue(data.mottoesHidden ?? false);
        this.loading.set(false);
      },
      error: () => {
        this.setMottoes([]);
        this.errorMessage.set("Could not load the saved hero.");
        this.loading.set(false);
      },
    });
  }
}
