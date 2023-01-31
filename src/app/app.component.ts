import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ContractsComponent } from './contracts/contracts.component';
import { ImpersonateComponent } from './impersonate/impersonate.component';
import { AuthzService } from './services/authz.service';

/**
 * A simple test of integrating OPA with Angular
 *
 * Inspiration: https://github.com/open-policy-agent/npm-opa-wasm/blob/main/examples/nodejs-ts-app/app.ts
 */
@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    ImpersonateComponent,
    RouterOutlet,
    RouterLink,
    MatToolbarModule
  ],
})
export class AppComponent {
  canAccessContracts$ = this.authzService.accessFeature(ContractsComponent.name);

  constructor(
    private authzService: AuthzService
  ) { }


  /**
   * Need to iterate the KEYS from a string-based enum?
   * Usage: Utils.enumKeys(<enum>)
   * https://www.petermorlion.com/iterating-a-typescript-enum/
   * eslint-disable-next-line @typescript-eslint/ban-types
   * @param String-based enum
   * @returns Properly typed keys from a string enum
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static enumKeys<O extends object, K extends keyof O = keyof O>(
    obj: O
  ): K[] {
    return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
  }
}
