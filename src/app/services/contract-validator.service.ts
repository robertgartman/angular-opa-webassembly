import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { PolicyInput } from '../model/authz.model';
import { ContractDocument } from '../model/contract.model';
import { OpaService } from './opa.service';

export class ContractValidator {

  /**
   * Generic async validator using OPA to evaluate the input
   * @param contract$ Hot observable emitting contract
   * @param opaService
   * @param entrypoint
   * @param contractFieldName Name of FormControl
   * @returns null if valid, and a warning string if not valid
   */
  static createValidator(
    contract$: Observable<ContractDocument>,
    opaService: OpaService,
    entrypoint: string,
    contractFieldName: keyof ContractDocument
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {

      // Pass a contract with just the relevant field populated.
      // this assumes that the supplied entrypoint is hitting
      // policy rule(s) without coupling to other contract fields.
      const input = <PolicyInput<ContractDocument>>{
        resource: {
          after: {
            [contractFieldName]: control.value
          }
        }
      };

      return contract$.pipe(
        map(contract => <PolicyInput<ContractDocument>>{
          resource: {
            before: contract,
            after: { ...contract, [contractFieldName]: control.value }
          }
        }),
        concatMap(policyInput => opaService.evaluate(policyInput, entrypoint, `Form field validation (${contractFieldName})`)),
        map(opaRes => opaRes ? null : ['not valid']),
      )
    };
  }
}
