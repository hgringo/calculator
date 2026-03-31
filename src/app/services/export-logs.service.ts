import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportLogsService {

  constructor(private http: HttpClient) {}

  sendLogsByEmail(file: Blob, fileName: string, email: string, societyName: string = ""): Observable<any> {
    
    const formData = new FormData();

    formData.append('file', file, fileName);
    formData.append('email', email);
    formData.append('societyName', societyName);

    return this.http.post(environment.exportEndPoint, formData);
  }
}