import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, concatMap, distinctUntilChanged, map, Observable, of, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { AuthzAction } from '../model/authz.model';
import { ContractDocument, LifecycleState } from '../model/contract.model';
import { AuthzService } from '../services/authz.service';
import { ContractValidator } from '../services/contract-validator.service';
import { ContractService } from '../services/contract.service';
import { Entrypoints, OpaService } from '../services/opa.service';
import { UserService } from '../services/user.service';
import { UtilsService } from '../services/utils.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatRadioModule,
    MatButtonToggleModule,
    MatButtonModule
  ],
  templateUrl: './contract-details.component.html',
  styleUrls: ['./contract-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractDetailsComponent {

  /**
  * Contract form
  */
  contractForm = new FormGroup({
    state: new FormControl<LifecycleState>(LifecycleState.DRAFT),
    body: new FormControl<string>(''),
    title: new FormControl<string>(''),
    signature: new FormControl<string>('')
  });

  /**
   * Track all changes in the contract form and map
   * to a contract object
   */
  public contract$: Observable<ContractDocument> =
    combineLatest([
      this.contractForm.valueChanges,
      this.contractService.getContract(this.activatedRoute.snapshot.paramMap.get("id") ?? '').pipe(
        tap(contract => this.contractForm.patchValue(contract, { emitEvent: true }))
      )
    ]).pipe(
      // Map fresh form data to contract
      // or null if contractForm.lifecycleState == null
      map(([contractForm, loadedContract]) => <ContractDocument>{ ...loadedContract, ...contractForm }),
      UtilsService.logErrorToConsole('ContractDetailsComponent#contract$'),
      shareReplay(1))


  private allowDelete$ = this.authzService.getAllowActionObservable(
    AuthzAction.DELETE,
    Entrypoints.ContractAllowAction,
    this.contract$,
    of('dummy'));
  private allowUpdate$ = this.authzService.getAllowActionObservable(
    AuthzAction.UPDATE,
    Entrypoints.ContractAllowAction,
    this.contract$,
    this.contract$);
  private allowRead$ = this.authzService.getAllowActionObservable(
    AuthzAction.READ,
    Entrypoints.ContractAllowAction,
    this.contract$,
    this.contract$);

  permissions$ = combineLatest([
    this.allowRead$, this.allowUpdate$, this.allowDelete$
  ], (read, update, del) => ({ read, update, del }))
    .pipe(
      shareReplay(1)
    )


  constructor(
    private opaService: OpaService,
    private userService: UserService,
    private contractService: ContractService,
    private activatedRoute: ActivatedRoute,
    private authzService: AuthzService,
    private router: Router
  ) {

    // Apply async validation to signature field
    this.contractForm.controls.signature.addAsyncValidators(
      ContractValidator.createValidator(
        this.contract$,
        opaService,
        Entrypoints.ContractValidSignature,
        'signature'
      )
    );

    // Apply async validation to body field
    this.contractForm.controls.body.addAsyncValidators(
      ContractValidator.createValidator(
        this.contract$,
        opaService,
        Entrypoints.ContractValidBody,
        'body'
      )
    );

    // Apply async validation to title field
    this.contractForm.controls.title.addAsyncValidators(
      ContractValidator.createValidator(
        this.contract$,
        opaService,
        Entrypoints.ContractValidTitle,
        'title'
      )
    );

  }


  // When the the contract changes
  // then recalculate the possible future states that can be selected.
  public availableStates$: Observable<Map<LifecycleState, boolean>> = combineLatest([
    this.contract$,
    this.userService.getNonNullUser()
  ], (contract, user) => ({ contract, user }))
    .pipe(
      distinctUntilChanged((prevPayload, currPayload) => {
        const sameUser: boolean = prevPayload.user == currPayload.user;
        // In this app, the permission to alter contract state has dependencies to
        // the 'signature' and the 'body' attributes. The policies check if the fields
        // are emty/non-empty. There is no logic verifying the actual content.
        // With this knowledge plenty of noice (e.g. key strokes) can be filtered out. However -
        // when doing this we introduce coupling between this component and our policies.
        // Pragmatic architectural decisions required: gain performance on the expense of coupling,
        // or keep it "pure"? The governance of your policies and how often they change might guide the decision.
        // This distinctUntilChanged serves as an example of deliberate noice reduction
        const sameState: boolean = prevPayload.contract?.lifecycleState == currPayload.contract?.lifecycleState
        // The following lines adds such coupling and serves as a heads-up.
        const isPrevSignatureEmpty: boolean = (prevPayload.contract?.signature?.length ?? 0) == 0
        const isCurrSignatureEmpty: boolean = (currPayload.contract?.signature?.length ?? 0) == 0
        // True if both empty, or both non-empty
        const sameSignature = isPrevSignatureEmpty == isCurrSignatureEmpty

        const isPrevBodyEmpty: boolean = (prevPayload.contract?.body?.length ?? 0) == 0
        const isCurrBodyEmpty: boolean = (currPayload.contract?.body?.length ?? 0) == 0
        // True if both empty, or both non-empty
        const sameBody = isPrevBodyEmpty == isCurrBodyEmpty

        return sameState && sameUser && sameSignature && sameBody;
      }),
      concatMap((payload) => this.opaService
        .evaluate(
          {
            resource: {
              before: payload.contract,
              after: {},
            },
            subject: payload.user
          },
          Entrypoints.ContractAvailableStates,
          `Available states for contract ${payload.contract.id}`
        ).pipe(
          map(opaResp => ({
            opaResp,
            ...payload
          })))
      ),
      map(payload => {
        // Map the respons to a data model that drives the UI
        // Keep the intended order of buttons and enable/disable based on OPA response
        return Object.values(LifecycleState).reduce((map, state) => {
          // enable button only if present in OPA response (payload.opaResp is an array)
          map.set(state, payload.opaResp.includes(state))
          return map;
        }, new Map<LifecycleState, boolean>());
      }),
      tap({
        error: err => console.error("Error in the availableStates$ pipe", err),
        complete: () => console.warn("The availableStates$ subscription has unexpectedly completed!",)
      })
    )

  public deleteContract() {
    this.contract$.pipe(
      concatMap(contract => this.contractService.delete(contract.id))
    ).subscribe(_ => this.router.navigateByUrl('/contracts'))
  }

  public saveContract(redirect = true) {
    this.contract$.pipe(
      concatMap(contract => this.contractService.update(contract))
    ).subscribe(_ => {
      if (redirect) {
        this.router.navigateByUrl('/contracts');
      }
    })
  }

  // Inspiration: https://www.bezkoder.com/angular-14-form-validation/
  get f(): { [key: string]: AbstractControl } {
    return this.contractForm.controls;
  }

  changedState(change: MatButtonToggleChange) {
    if (change) {
      this.contractForm.controls.state.setValue(change.value);
    }
    this.saveContract(false);
  }

  // Custom sorting for availableStates$ in the template.
  // Maintain original order
  public zeroSort() {
    return 0;
  }

}
