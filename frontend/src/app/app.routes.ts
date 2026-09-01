import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { AuthComponent } from './pages/auth/auth.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BusinessComponent } from './pages/business/business.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { CopilotComponent } from './pages/copilot/copilot.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'business',
    component: BusinessComponent,
    canActivate: [authGuard]
  },
  {
    path: 'business/:id',
    component: BusinessComponent,
    canActivate: [authGuard]
  },
  {
    path: 'analytics/:id',
    component: AnalyticsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'copilot/:id',
    component: CopilotComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/'
  }
];

