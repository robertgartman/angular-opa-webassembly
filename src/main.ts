import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { ContractInMemoryDbService } from './app/services/contract-inmemorydb.service';
import { PolicyEnforcementInterceptorService } from './app/services/policy-enforcement-interceptor.service';



bootstrapApplication(AppComponent, {
  providers: [

    provideHttpClient(
      withInterceptorsFromDi(),
    ),

    provideRouter(APP_ROUTES,
      // withDebugTracing(),
    ),

    { provide: HTTP_INTERCEPTORS, useClass: PolicyEnforcementInterceptorService, multi: true },

    // https://github.com/angular/in-memory-web-api#import-the-in-memory-web-api-module
    // Always import the HttpClientInMemoryWebApiModule after the HttpClientModule
    // to ensure that the in-memory backend provider supersedes the Angular version.
    importProvidersFrom(
      BrowserAnimationsModule,
      HttpClientInMemoryWebApiModule.forRoot(
        ContractInMemoryDbService, {
        apiBase: 'api/',
        passThruUnknownUrl: true,
        delay: 0
      })),


  ]
});
