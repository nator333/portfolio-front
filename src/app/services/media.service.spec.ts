import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MediaService, UploadedMedia } from './media.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const presignResponse = {
  assetId: 'asset-123',
  key: 'incoming/asset-123/photo.png',
  upload: {
    url: 'https://media-bucket.s3.amazonaws.com',
    fields: {
      key: 'incoming/asset-123/photo.png',
      'Content-Type': 'image/png',
      'x-amz-meta-category': 'blog',
      Policy: 'base64policy',
      'X-Amz-Signature': 'sig',
    },
  },
};

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getIdToken: () => 'test-id-token' } },
      ],
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests a presigned POST with the raw id token, then uploads the file to S3', () => {
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    let result: UploadedMedia | undefined;
    service.upload(file, 'blog').subscribe((r) => (result = r));

    const create = httpMock.expectOne(`${environment.apiBaseUrl}/uploads`);
    expect(create.request.method).toBe('POST');
    expect(create.request.headers.get('Authorization')).toBe('test-id-token');
    expect(create.request.body).toEqual({
      filename: 'photo.png',
      contentType: 'image/png',
      category: 'blog',
    });
    create.flush(presignResponse);

    const s3 = httpMock.expectOne(presignResponse.upload.url);
    expect(s3.request.method).toBe('POST');
    // The presigned POST authorises the request; no bearer token or API key.
    expect(s3.request.headers.get('Authorization')).toBeNull();
    expect(s3.request.headers.get('X-Api-Key')).toBeNull();
    const body = s3.request.body as FormData;
    expect(body.get('key')).toBe(presignResponse.upload.fields.key);
    expect(body.get('x-amz-meta-category')).toBe('blog');
    expect(body.get('file') instanceof File).toBe(true);
    s3.flush('');
  });

  it('derives the CDN urls for both variants from the assetId', () => {
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    let result: UploadedMedia | undefined;
    service.upload(file, 'blog').subscribe((r) => (result = r));

    httpMock.expectOne(`${environment.apiBaseUrl}/uploads`).flush(presignResponse);
    httpMock.expectOne(presignResponse.upload.url).flush('');

    expect(result).toEqual({
      assetId: 'asset-123',
      cdnUrl: `${environment.assetCdnBaseUrl}/asset-123/w1600.webp`,
      thumbUrl: `${environment.assetCdnBaseUrl}/asset-123/thumb.webp`,
    });
  });

  it('defaults the category to general', () => {
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    service.upload(file).subscribe();

    const create = httpMock.expectOne(`${environment.apiBaseUrl}/uploads`);
    expect(create.request.body.category).toBe('general');
    create.flush(presignResponse);
    httpMock.expectOne(presignResponse.upload.url).flush('');
  });
});
