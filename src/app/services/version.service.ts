import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VersionService {
  
  constructor(private http: HttpClient) {}

  async getVersion(): Promise<string> {
  
    const result = await firstValueFrom(
      this.http.get<{ version: string }>('/assets/version.json')
    );

    return result.version;
  }
}