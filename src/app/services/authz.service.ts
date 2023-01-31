import { HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { combineLatest, Observable } from "rxjs";
import { concatMap, debounceTime, map, switchMap } from 'rxjs/operators';
import { AuthzAction, PolicyInput } from "../model/authz.model";
import { ContractDocument } from "../model/contract.model";
import { UserModel } from "../model/userModel";
import { DataService } from "./data.service";
import { Entrypoints, OpaService } from './opa.service';
import { UserService } from './user.service';
import { UtilsService } from "./utils.service";

/**
 * Logic related to authorization
 */
@Injectable({
  providedIn: 'root'
})
export class AuthzService {

  constructor(
    private opaService: OpaService,
    private userService: UserService,
    dataService: DataService
  ) {
    // In this example app the OPA 'data' remains constant.
    // Load once, here. Then let it be.
    opaService.setData({
      rolesHierachy: DataService.rolesHierarchy,
      inputdatamapping: dataService.opaPolicyDataMapping
    })
  }

  /**
   * Is current user allowed to delete the provided contract
   * @param contract
   * @returns true if allowed to delete.
   */
  canDeleteContract(contract: ContractDocument): Observable<boolean> {
    return this.userService.getNonNullUser().pipe(
      map(user => <PolicyInput<ContractDocument>>{
        subject: user,
        action: AuthzAction.DELETE,
        resource: { before: contract }
      }),
      concatMap(input => this.opaService.evaluate(
        input,
        Entrypoints.ContractAllowAction,
        `Can user ${input.subject?.id} ${input.action} contract ${input.resource?.before?.id}`
      )),
    )
  }

  /**
   * Verify if current user has access to a given feature
   * @param name ComponentName (e.g. ContractComponent)
   * @returns true means access allowed
   */
  accessFeature(componentName: string): Observable<boolean> {
    if (!componentName) {
      throw new Error("Component name is not provided");
    }
    return this.userService.getUser().pipe(
      concatMap(user => {
        const input = <PolicyInput<string>>{
          subject: user,
          resource: {
            after: componentName
          }
        };
        return this.opaService.evaluate(
          input,
          Entrypoints.FeatureAllow,
          `Can user ${user?.id} access feature ${componentName}`);
      })
    );
  }

  /**
   * Map from an Angular HttpRequest object model to the OPA input data model
   * @param httpRequest
   * @returns The request data as PolicyInput
   */
  mapToPolicyInput(httpRequest: HttpRequest<unknown>, user: UserModel | null): PolicyInput<void> {

    const url = new URL(httpRequest.urlWithParams, window.location.origin);

    const headers = httpRequest.headers.keys().reduce<{ [id: string]: string; }>(
      (acc, header) => ({ ...acc, [header]: httpRequest.headers.get(header) ?? '' }),
      {}
    );

    const parsedQuery = httpRequest.params.keys().reduce<{ [id: string]: string[]; }>(
      (acc, query) => ({ ...acc, [query]: httpRequest.params.getAll(query) ?? [] }),
      {}
    );

    var isJsonBody = false;
    if (httpRequest.body) {
      isJsonBody = (httpRequest.headers.getAll('content-type') ?? []).some(val => val.toLowerCase().indexOf('application/json'));
      if (!isJsonBody) {
        isJsonBody = httpRequest.detectContentTypeHeader() == 'application/json';
      }
    }

    const input: PolicyInput<void> = {
      subject: user ?? undefined,
      // for an example of expected data - see:
      // https://www.openpolicyagent.org/docs/latest/envoy-primer/#example-input
      attributes: {
        request: {
          http: {
            host: url.host,
            method: httpRequest.method,
            headers,
            path: url.pathname,
            protocol: url.protocol
          }
        }
      },
      parsed_path: url.pathname.split('/').filter(s => s != ''),
      parsed_query: parsedQuery,
      parsed_body: isJsonBody ? <{ [id: string]: string }>httpRequest.body : undefined
    }

    return input;
  }

  /**
   * Factory function creating an observable that queries OPA for any
   * change in provided stream of resource or User, and returns true
   * or false based on the provided action
   *
   * @param action A desired action to perform with regards to Contract object
   * @returns a observable re-emitting when either change of user or new values in provided resource stream. True=action allowed
   */
  getAllowActionObservable(
    action: AuthzAction,
    entrypoint: Entrypoints,
    before$: Observable<ContractDocument | string>,
    after$: Observable<ContractDocument | string>
  ): Observable<boolean> {
    return combineLatest(
      [before$,
        after$,
        this.userService.getUser()]
      , (before, after, user) => ({ before, after, user }))
      .pipe(
        // Minor debounce to let both before$ and after$ emit
        debounceTime(50),
        switchMap(payload => {
          const input = <PolicyInput<ContractDocument>>{
            resource: {
              before: payload.before,
              after: payload.after
            },
            subject: payload.user,
            action
          };
          return this.opaService.evaluate(input, entrypoint, `Allow action=${action} ?`);
        }),
        UtilsService.logErrorAndCompleteToConsole('getAllowActionObservable')
      )
  }
}
