import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, of, switchMap, tap } from 'rxjs';
import { AuthzAction } from '../model/authz.model';
import { ContractDocument } from '../model/contract.model';
import { AuthzService } from '../services/authz.service';
import { ContractService } from '../services/contract.service';
import { Entrypoints } from '../services/opa.service';
import { UtilsService } from '../services/utils.service';


@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsComponent {

  private reloadSubject = new BehaviorSubject<void>(undefined);

  allowCreate$ = this.authzService.getAllowActionObservable(AuthzAction.CREATE, Entrypoints.ContractAllowAction, of('not important'), of('not important'));

  constructor(
    private contractService: ContractService,
    private authzService: AuthzService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  public contracts$ = this.reloadSubject.pipe(
    switchMap(_ => this.contractService.getContracts()),
    UtilsService.logErrorAndCompleteToConsole('ContractService#delete')
  )

  delete(contractId: string) {
    this.contractService.delete(contractId).pipe(
      tap(_ => this.reloadSubject.next())
    ).subscribe();
  }

  canDelete(contract: ContractDocument) {
    return this.authzService.canDeleteContract(contract);
  }

  public newContract() {
    this.contractService.create().pipe(
      tap(contract => this.router.navigateByUrl(`/contracts/${contract.id}`)),
    ).subscribe();
  }

  public contractDetails(contract: ContractDocument) {
    this.router.navigate([contract.id], { relativeTo: this.activatedRoute });
  }
}
