import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { concatMap, Observable, take } from 'rxjs';
import { AuthzService } from './authz.service';
import { Entrypoints, OpaService } from './opa.service';
import { UserService } from './user.service';

/**
 * Capture outbound HTTP traffic in-flight, send to OPA and verify if
 * traffic is allowed
 */
@Injectable()
export class PolicyEnforcementInterceptorService implements HttpInterceptor {

  constructor(
    private opaService: OpaService,
    private userService: UserService,
    private authzService: AuthzService
  ) { }

  // Configure the endpoint prefixes to pass unchecked.
  // In general, this kind of logic belongs to the OPA domain.
  // However, a deadlock will arise if this interceptor is waiting for OPA
  // to do the access control, while OPA is waiting for the wasm to be loaded.
  // Therefore, provide full access to assets folder
  private passThrough = ['/assets'];

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const pass = this.passThrough.some(prefix => new URL(httpRequest.url, 'http://whatever').pathname.startsWith(prefix))
    if (pass) {
      return next.handle(httpRequest);
    }

    //return next.handle(httpRequest);
    return this.userService.getUser()
      .pipe(
        concatMap(user => {
          const input = this.authzService.mapToPolicyInput(httpRequest, user);
          return this.opaService.evaluate(input, Entrypoints.HttpAllow,'PolicyEnforcementInterceptor');
        }),
        take(1),
        concatMap(decision => {
          if (decision) {
            return next.handle(httpRequest);
          }
          throw new HttpErrorResponse(
            {
              status: 403,
              statusText: "Blocked by PolicyEnforcementInterceptorService",
              url: httpRequest.urlWithParams
            });
        })
      )
  }
}
