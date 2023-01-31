import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { loadPolicy } from '@open-policy-agent/opa-wasm';
import { catchError, concatMap, map, Observable, ReplaySubject, shareReplay } from 'rxjs';
import { combineLatestWith, take } from 'rxjs/operators';
import { PolicyData, PolicyInput } from '../model/authz.model';

export enum Entrypoints {
  ContractValidSignature = "contract/valid_signature",
  ContractValidBody = "contract/valid_body",
  ContractValidTitle = "contract/valid_title",
  ContractValid = "contract/valid",
  ContractAllowAction = "contract/allow_action",
  ContractAvailableStates = "contract/available_states",
  FeatureAllow = "feature/allow",
  HttpAllow = "http/allow"
}

@Injectable({
  providedIn: 'root'
})
export class OpaService {

  // Load the WebAssemply
  private policyWasm$ = this.http.get("assets/policy.wasm", {
    responseType: 'arraybuffer'
  }).pipe(
    concatMap(buffer => loadPolicy(buffer)),
    catchError(err => {
      console.error("Failed to load policy", err);
      throw new Error("Failed to load policy. Check browser console log");
    }),
    // One instance is all we need
    shareReplay());

  private dataSubject = new ReplaySubject<PolicyData>(1);

  constructor(
    private http: HttpClient,
  ) { }

  /**
   * Equivalent of OPA 'setData'.
   * Hide OPA 'setData' API and expose a typed variant instead
   */
  public setData(data: PolicyData): void {
    console.log("OPA setData: " + JSON.stringify(data, null, 2));
    this.dataSubject.next(data);
  }

  /**
   * Equivalent of OPA 'evaluate'
   * @param input The input data to evaluate in OPA
   * @param entrypoint desired OPA entrypoint
   * @param auditLabel a hint of calling logic. Used for logging
   * @returns The 'result' from the policy evaluation response data
   */
  public evaluate(
    input: PolicyInput<unknown>,
    entrypoint: string | number,
    auditLabel: string
  ): Observable<any> {
    return this.policyWasm$.pipe(
      combineLatestWith(this.dataSubject),
      take(1),
      map(([policyWasm, data]) => {
        policyWasm.setData(data);
        return {
          data,
          response: policyWasm.evaluate(input, entrypoint)
        }
      }),
      map(payload => {
        // Parse result as recommended by
        // https://github.com/open-policy-agent/npm-opa-wasm#evaluate-the-policy
        const parsed = payload.response?.length > 0 ? payload.response[0].result : null;

        if (parsed == null) {
          console.warn("OPA evaluate did not generate a response. Bug?" +
            `\n\tEntrypoint ${entrypoint}\n\tInput:${JSON.stringify(input, null, 2)}`);
        } else {
          console.log(
            `OPA evaluate: Entrypoint=${entrypoint}\n` +
            `\twhy: ${auditLabel}\n` +
            `\tresult: ${parsed}\n` +
            `\tOPA input, data & result:\n`,
            input,
            payload.data,
            payload.response)
        }
        return parsed;
      })
    )
  }
}
