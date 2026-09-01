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
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'business',
    component: BusinessComponent
  },
  {
    path: 'business/:id',
    component: BusinessComponent
  },
  {
    path: 'analytics/:id',
    component: AnalyticsComponent
  },
  {
    path: 'copilot/:id',
    component: CopilotComponent
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];


