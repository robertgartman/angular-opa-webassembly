import { HttpClient, HttpEventType, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { faker } from '@faker-js/faker';
import { catchError, concatMap, map, of, switchMap, take, tap, withLatestFrom } from 'rxjs';
import { AuthzAction, PolicyInput } from '../model/authz.model';
import { ContractDocument, LifecycleState } from '../model/contract.model';
import { AuthzService } from './authz.service';
import { ContractInMemoryDbService } from './contract-inmemorydb.service';
import { Entrypoints, OpaService } from './opa.service';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';

/**
 * The class implements the back-end database rest API.
 * Technically the backend is a mock based on InMemoryDbService.
 * See details within contract-inmemorydb.service.ts
 */
@Injectable({
  providedIn: 'root'
})
export class ContractService {

  static apiUrl = `/api/${ContractInMemoryDbService.contractCollection}`;  // URL to db api

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private opaService: OpaService,
    private authzService: AuthzService
  ) { }

  /**
   * Get contracts in the DB aligned with user's access rights.
   * @returns A hot observable that will re-emit if user changes
   */
  getContracts() {
    const url = ContractService.apiUrl;
    return this.userService.getNonNullUser()
      .pipe(
        concatMap(user => {
          // Select api endpoint depending on the privledges of the current user.
          // To find out if the this user is allowed to get ALL contracts,
          // create an HttpRequest to be used by getAllContracts.
          // Send it to OPA for policy eval and select the proper
          // API based on reply

          const url = ContractService.apiUrl;
          // Check if user can access the 'getAllContracts' endpoint
          const req: HttpRequest<ContractDocument[]> = new HttpRequest("GET", url);
          const input = this.authzService.mapToPolicyInput(req, user);
          return this.opaService.evaluate(input, Entrypoints.HttpAllow, 'ContractService#getContracts')
            .pipe(
              concatMap(getAllAllowed => {
                if (getAllAllowed) {
                  return this.getAllContracts(req)
                }
                return this.getContractsByAuthor();
              })
            )
        })
      )
  }

  /**
   * Get ALL contracts in the DB
   * @returns
   */
  private getAllContracts(req: HttpRequest<any>) {
    return this.http.request<ContractDocument[]>(req).pipe(
      map(httpEvent => {
        // narrow the event
        if (httpEvent.type == HttpEventType.Response) {
          return httpEvent.body ?? []
        }
        throw new Error("Failure. Did not receive HttpEventType.Response");
      }),
      UtilsService.logErrorToConsole('ContractService#getAllContracts'),
      // Survive HTTP errors
      catchError(err => of(<ContractDocument[]>[]))
    )
  }

  /**
   * Get current user's contracts. The "security trimming" is based
   * on InMemoryDbService support for filtering on arbitrary key/value
   * @returns zero or more contracts where user is the author
   */
  private getContractsByAuthor() {
    const url = ContractService.apiUrl;
    return this.userService.getNonNullUser()
      .pipe(
        take(1),
        concatMap(user => this.http.get<ContractDocument[]>(url, {
          params: new HttpParams().append("author", user.id)
        })),
        UtilsService.logErrorToConsole('ContractService#getContracts'),
        // Survive HTTP errors
        catchError(err => of(<ContractDocument[]>[]))
      )
  }

  /**
   * Get a specific contract by contract id
   * @param contractId
   * @returns the contract from an http.get (i.e. observable will complete)
   */
  getContract(contractId: string) {
    const url = `${ContractService.apiUrl}/${contractId}`;
    return this.http.get<ContractDocument>(url).pipe(
      UtilsService.logErrorToConsole('ContractService#getContract')
    )
  }

  /**
   * Delete a contract from the database
   * @param contractId
   * @returns The deleted contract, then observable completes
   */
  delete(contractId: string) {
    const url = `${ContractService.apiUrl}/${contractId}`;
    return this.http.delete<ContractDocument>(url).pipe(
      UtilsService.logErrorToConsole('ContractService#delete')
    )
  }

  /**
   * Create a new contract
   * @returns
   */
  create() {
    const url = ContractService.apiUrl;
    return this.userService.getNonNullUser()
      .pipe(
        take(1),
        concatMap(user => this.http
          .post<ContractDocument>(url, <ContractDocument>{
            id: faker.datatype.uuid(),
            author: user.id,
            lifecycleState: LifecycleState.DRAFT,
            title: 'new draft'
          })),
        UtilsService.logErrorToConsole('ContractService#create')
      )
  }

  /**
   *
   * @param contract Update a contract
   * @returns
   */
  update(contract: ContractDocument) {
    const url = `${ContractService.apiUrl}/${contract.id}`;

    // Validate first with OPA if update can be performed
    // This will trigger the same set of rules as
    // backend should do when receiving the update request
    return this.getContract(contract.id).pipe(
      withLatestFrom(this.userService.getNonNullUser()),
      // Get the latest version of the contract from the db
      map(([before, user]) => <PolicyInput<ContractDocument>>({
        action: AuthzAction.UPDATE,
        subject: user,
        resource: {
          after: contract,
          before
        }
      })),
      // Check with OPA if update is OK
      switchMap(input => this.opaService.evaluate(input, Entrypoints.ContractAllowAction, 'ContractService#update')),
      tap(result => {
        if (!result) {
          throw new Error('Update was denied by OPA policy');
        }
      }),
      switchMap(_ => this.http
        .put<ContractDocument>(url, contract)),
      map(_ => contract),
      UtilsService.logErrorToConsole('ContractService#update')
    )
  }
}
