import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Business {
  id: string;
  name: string;
  industry?: string;
  country?: string;
  currency: string;
  size?: string;
  founded_year?: number;
  description?: string;
  goals?: any;
  created_at?: string;
}

export interface WorldModel {
  id: string;
  business_id: string;
  revenue?: any;
  profit?: any;
  costs?: any;
  customers?: any;
  leads?: any;
  products?: any[];
  health_score?: number;
  data_completeness?: number;
  data_quality_score?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private apiUrl = `${environment.apiUrl}/business`;
  
  constructor(private http: HttpClient) {}
  
  getBusinesses(): Observable<{ businesses: Business[] }> {
    return this.http.get<{ businesses: Business[] }>(this.apiUrl);
  }
  
  createBusiness(data: Partial<Business>): Observable<{ message: string; business: Business }> {
    return this.http.post<{ message: string; business: Business }>(this.apiUrl, data);
  }
  
  getBusiness(id: string): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/${id}`);
  }
  
  updateBusiness(id: string, data: Partial<Business>): Observable<{ message: string; business: Business }> {
    return this.http.put<{ message: string; business: Business }>(`${this.apiUrl}/${id}`, data);
  }
  
  deleteBusiness(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
  
  getWorldModel(id: string): Observable<WorldModel> {
    return this.http.get<WorldModel>(`${this.apiUrl}/${id}/world-model`);
  }

  updateWorldModelData(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/world-model`, data);
  }
}
