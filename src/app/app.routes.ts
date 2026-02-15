import { Routes } from '@angular/router';
import { DeviceConfigGuard } from './guards/deviceConfig.guard';

export const routes: Routes = [
    {
        path: 'calculator',
        loadComponent: () => import('../app/pages/calculator/calculator').then(c => c.Calculator)
    },
    {
        path: 'employee',
        loadComponent: () => import('../app/pages/admin/admin').then(c => c.Admin),
        canActivate: [DeviceConfigGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('../app/pages/superadmin/superadmin').then(c => c.Superadmin),
        canActivate: [DeviceConfigGuard]
    },
    {
        path: 'superadmin',
        loadComponent: () => import('../app/pages/superadmin/superadmin').then(c => c.Superadmin),
        canActivate: [DeviceConfigGuard]
    },
    {
        path: '',
        redirectTo: 'calculator',
        pathMatch: 'full'
    }
];
