import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'calculator',
        loadComponent: () => import('../app/pages/calculator/calculator').then(c => c.Calculator)
    },
    {
        path: '',
        redirectTo: 'calculator',
        pathMatch: 'full'
    }
];
