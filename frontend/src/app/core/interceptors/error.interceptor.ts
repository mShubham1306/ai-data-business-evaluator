import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 || error.status === 422) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('nova_user');
        router.navigate(['/auth']);
      }
      
      console.error('HTTP Error:', error);
      return throwError(() => error);
    })
  );
};
