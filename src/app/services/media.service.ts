import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type MediaCategory = 'blog' | 'project' | 'general';

interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

interface CreateUploadResponse {
  assetId: string;
  key: string;
  upload: PresignedPost;
}

export interface UploadedMedia {
  assetId: string;
  /** Primary eye-catch / project image: WebP up to 1600px wide. */
  cdnUrl: string;
  /** Small WebP variant for lists and pickers. */
  thumbUrl: string;
}

export interface MediaVariant {
  key: string;
  url: string;
  width: number;
  height: number;
}

/** A stored image as returned by GET /media (one MediaAssets catalog row). */
export interface MediaAsset {
  assetId: string;
  category: MediaCategory;
  contentType: string;
  originalFilename: string;
  sizeBytes: number;
  cdnUrl: string;
  variants: Record<string, MediaVariant>;
  alt: string;
  title: string;
  uploadedAt: string;
}

/** Editable metadata fields (PATCH /media/{id}). */
export interface MediaMetadata {
  alt?: string;
  title?: string;
  category?: MediaCategory;
}

/**
 * Admin image uploads. Two steps: ask portfolio-api (Cognito-gated) for a
 * short-lived presigned POST, then upload the file straight to S3 with it. The
 * resize pipeline behind S3 emits the WebP variants asynchronously, so the
 * returned URLs are deterministic from the assetId but may take a second or two
 * to become servable.
 */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  upload(file: File, category: MediaCategory = 'general'): Observable<UploadedMedia> {
    return this.http
      .post<CreateUploadResponse>(
        `${environment.apiBaseUrl}/uploads`,
        { filename: file.name, contentType: file.type, category },
        { headers: this.authHeaders() },
      )
      .pipe(
        switchMap((res) => this.postToS3(res.upload, file).pipe(map(() => res))),
        map((res) => ({
          assetId: res.assetId,
          cdnUrl: `${environment.assetCdnBaseUrl}/${res.assetId}/w1600.webp`,
          thumbUrl: `${environment.assetCdnBaseUrl}/${res.assetId}/thumb.webp`,
        })),
      );
  }

  /** List the media catalog (admin library), newest first per the API. */
  list(): Observable<MediaAsset[]> {
    return this.http
      .get<{ assets: MediaAsset[] }>(`${environment.apiBaseUrl}/media`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => response.assets ?? []));
  }

  /** Edit an asset's alt / title / category. */
  updateMeta(assetId: string, patch: MediaMetadata): Observable<MediaAsset> {
    return this.http.patch<MediaAsset>(
      `${environment.apiBaseUrl}/media/${assetId}`,
      patch,
      { headers: this.authHeaders() },
    );
  }

  /** Delete an asset and every stored variant. */
  remove(assetId: string): Observable<void> {
    return this.http
      .delete(`${environment.apiBaseUrl}/media/${assetId}`, { headers: this.authHeaders() })
      .pipe(map(() => undefined));
  }

  private authHeaders(): HttpHeaders {
    // REST API Cognito authorizers expect the raw JWT, not a Bearer value.
    return new HttpHeaders({ Authorization: this.auth.getIdToken() });
  }

  private postToS3(presigned: PresignedPost, file: File): Observable<string> {
    const form = new FormData();
    for (const [name, value] of Object.entries(presigned.fields)) {
      form.append(name, value);
    }
    // S3 presigned POST requires the file part to come last.
    form.append('file', file);
    // No Authorization and no API key: the presigned policy is the authority for
    // this POST, and S3 replies with an empty (or XML) body, not JSON.
    return this.http.post(presigned.url, form, { responseType: 'text' });
  }
}
