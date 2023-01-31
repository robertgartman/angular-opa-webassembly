import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ContractDetailsComponent } from './contract-details/contract-details.component';
import { ContractsComponent } from './contracts/contracts.component';
import { AuthzService } from './services/authz.service';


// Primers on Angular +14 routing with standalone components
// https://www.angulararchitects.io/aktuelles/routing-and-lazy-loading-with-standalone-components/
// https://blog.angular.io/angular-v15-is-now-available-df7be7f2f4c8
export const APP_ROUTES: Routes = [
  {
    path: 'welcome',
    pathMatch: 'full',
    loadChildren: () => import('./welcome/welcome.routes').then((r) => r.WELCOME_ROUTES),
  },
  {
    path: 'contracts',
    pathMatch: 'full',
    loadChildren: () => import('./contracts/contracts.routes').then((r) => r.CONTRACTS_ROUTES),
    canMatch: [() => inject(AuthzService).accessFeature(ContractsComponent.name)],
  },
  {
    path: 'contracts/:id',
    pathMatch: 'full',
    loadChildren: () => import('./contract-details/contract-details.routes').then((r) => r.CONTRACT_DETAILS_ROUTES),
    canMatch: [() => inject(AuthzService).accessFeature(ContractDetailsComponent.name)],
  },
  {
    path: '**',
    redirectTo: '/welcome'
  },
];
