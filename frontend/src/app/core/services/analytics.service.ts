import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  getHealthScore(businessId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/${businessId}/health-score`);
  }
  
  getDrivers(businessId: string): Observable<{ drivers: any[] }> {
    return this.http.get<{ drivers: any[] }>(`${this.apiUrl}/analytics/${businessId}/drivers`);
  }
  
  getAnomalies(businessId: string): Observable<{ anomalies: any[] }> {
    return this.http.get<{ anomalies: any[] }>(`${this.apiUrl}/analytics/${businessId}/anomalies`);
  }
  
  forecastRevenue(businessId: string, periods: number = 12): Observable<{ forecasts: any[] }> {
    return this.http.get<{ forecasts: any[] }>(
      `${this.apiUrl}/ml/${businessId}/forecast/revenue?periods=${periods}`
    );
  }
  
  getPredictions(businessId: string): Observable<{ predictions: any[] }> {
    return this.http.get<{ predictions: any[] }>(`${this.apiUrl}/ml/${businessId}/predictions`);
  }
  
  createPrediction(businessId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ml/${businessId}/predictions`, data);
  }
  
  getSegments(businessId: string): Observable<{ segments: any[] }> {
    return this.http.get<{ segments: any[] }>(`${this.apiUrl}/ml/${businessId}/segments`);
  }
  
  getDataQuality(businessId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verification/${businessId}/data-quality`);
  }
  
  uploadData(businessId: string, file: File, dataType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', dataType);
    
    return this.http.post(`${this.apiUrl}/verification/${businessId}/upload`, formData);
  }
  
  getOpportunities(businessId: string): Observable<{ opportunities: any[] }> {
    return this.http.get<{ opportunities: any[] }>(`${this.apiUrl}/copilot/${businessId}/opportunities`);
  }
  
  scanOpportunities(businessId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/copilot/${businessId}/opportunities/scan`, {});
  }
  
  getScenarios(businessId: string): Observable<{ scenarios: any[] }> {
    return this.http.get<{ scenarios: any[] }>(`${this.apiUrl}/copilot/${businessId}/scenarios`);
  }
  
  createScenario(businessId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/copilot/${businessId}/scenarios`, data);
  }
  
  getActions(businessId: string): Observable<{ actions: any[] }> {
    return this.http.get<{ actions: any[] }>(`${this.apiUrl}/copilot/${businessId}/actions`);
  }
  
  generateAction(businessId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/copilot/${businessId}/actions`, data);
  }
  
  approveAction(businessId: string, actionId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/copilot/${businessId}/actions/${actionId}/approve`, {});
  }
  
  executeAction(businessId: string, actionId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/copilot/${businessId}/actions/${actionId}/execute`, {});
  }
  
  getSystemHealth(businessId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verification/${businessId}/system-health`);
  }
}
