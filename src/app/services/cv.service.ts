import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CvData } from '../models/cv-data';
import { AuthService } from './auth.service';

/**
 * Service for fetching and persisting CV data through the portfolio-api backend
 */
@Injectable({
  providedIn: 'root',
})
export class CvService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getCv(): Observable<CvData> {
    return this.http.get<CvData>(`${environment.apiBaseUrl}/cv`);
  }

  updateCv(data: CvData): Observable<CvData> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getIdToken()}`,
    });
    return this.http.put<CvData>(`${environment.apiBaseUrl}/cv`, data, { headers });
  }
}
