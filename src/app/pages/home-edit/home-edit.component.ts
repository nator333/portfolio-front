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
import { ImageUploadComponent } from "../../components/image-upload/image-upload.component";
import { AuthService } from "../../services/auth.service";
import { HomeService } from "../../services/home.service";
import { MediaAsset, MediaService } from "../../services/media.service";
import {
  BackgroundPhoto,
  HomeData,
  MAX_BACKGROUND_ALT_LENGTH,
  MAX_BACKGROUND_CAPTION_LENGTH,
  MAX_BACKGROUND_COUNT,
  MAX_MOTTO_COUNT,
  MAX_MOTTO_LENGTH,
} from "../../models/home-data";

type BackgroundGroup = FormGroup<{
  url: FormControl<string>;
  caption: FormControl<string>;
  alt: FormControl<string>;
}>;

@Component({
  selector: "app-home-edit",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent, ImageUploadComponent],
  templateUrl: "./home-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./home-edit.component.scss",
})
export class HomeEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private homeService = inject(HomeService);
  private mediaService = inject(MediaService);
  private router = inject(Router);

  readonly maxMottoCount = MAX_MOTTO_COUNT;
  readonly maxMottoLength = MAX_MOTTO_LENGTH;
  readonly maxBackgroundCount = MAX_BACKGROUND_COUNT;
  readonly maxCaptionLength = MAX_BACKGROUND_CAPTION_LENGTH;
  readonly maxAltLength = MAX_BACKGROUND_ALT_LENGTH;

  // Saved images offered in each background's "pick a saved image" dropdown.
  readonly mediaAssets = signal<MediaAsset[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  homeForm: FormGroup = this.fb.group({
    mottoes: this.fb.array([]),
    // Hide the mottoes on the live hero without clearing them.
    mottoesHidden: this.fb.nonNullable.control(false),
    backgrounds: this.fb.array<BackgroundGroup>([]),
  });

  ngOnInit(): void {
    this.loadHome();
    this.mediaService.list().subscribe({
      next: (assets) => this.mediaAssets.set(assets),
      error: () => {
        // The dropdown is a convenience; uploading and pasting a URL still work.
      },
    });
  }

  get backgroundGroups(): BackgroundGroup[] {
    return this.backgroundArray.controls;
  }

  get canAddBackground(): boolean {
    return this.backgroundArray.length < MAX_BACKGROUND_COUNT;
  }

  addBackground(): void {
    if (this.canAddBackground) {
      this.backgroundArray.push(this.createBackgroundGroup());
    }
  }

  removeBackground(index: number): void {
    this.backgroundArray.removeAt(index);
  }

  moveBackground(index: number, offset: -1 | 1): void {
    const target = index + offset;
    if (target < 0 || target >= this.backgroundArray.length) {
      return;
    }
    const group = this.backgroundArray.at(index);
    this.backgroundArray.removeAt(index);
    this.backgroundArray.insert(target, group);
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
      backgrounds: this.backgroundGroups.map((group) => {
        const { url, caption, alt } = group.getRawValue();
        const photo: BackgroundPhoto = { url: url.trim(), caption: caption.trim() };
        if (alt.trim()) {
          photo.alt = alt.trim();
        }
        return photo;
      }),
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

  private get backgroundArray(): FormArray<BackgroundGroup> {
    return this.homeForm.get("backgrounds") as FormArray<BackgroundGroup>;
  }

  private createBackgroundGroup(photo?: BackgroundPhoto): BackgroundGroup {
    return this.fb.nonNullable.group({
      // The hero loads it straight into <img src>; the API accepts https only.
      url: [photo?.url ?? "", [Validators.required, Validators.pattern(/^https:\/\/\S+$/)]],
      caption: [photo?.caption ?? "", Validators.maxLength(MAX_BACKGROUND_CAPTION_LENGTH)],
      alt: [photo?.alt ?? "", Validators.maxLength(MAX_BACKGROUND_ALT_LENGTH)],
    });
  }

  private setBackgrounds(backgrounds: BackgroundPhoto[]): void {
    this.backgroundArray.clear();
    backgrounds
      .slice(0, MAX_BACKGROUND_COUNT)
      .forEach((photo) => this.backgroundArray.push(this.createBackgroundGroup(photo)));
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
        this.setBackgrounds(data.backgrounds ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.setMottoes([]);
        this.setBackgrounds([]);
        this.errorMessage.set("Could not load the saved hero.");
        this.loading.set(false);
      },
    });
  }
}
