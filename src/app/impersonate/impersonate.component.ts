import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { filter } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Department, Role, UserModel } from '../model/userModel';
import { UserService } from '../services/user.service';
import { UtilsService } from '../services/utils.service';


@Component({
  selector: 'app-impersonate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonToggleModule
  ],
  templateUrl: './impersonate.component.html',
  styleUrls: ['./impersonate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpersonateComponent {

  /**
  * Our motley crew
  */
  static userDirectory: UserModel[] = [
    { id: "1", name: 'Devine Boss', roles: [Role.CEO, Role.CONTRACT_ADMIN] },
    { id: "2", name: 'Senior Sales', roles: [Role.EMPLOYEE], department: Department.SALES },
    { id: "3", name: 'Junior Sales', roles: [Role.EMPLOYEE], department: Department.SALES },
    { id: "4", name: 'Madame Legal', roles: [Role.CONTRACT_ADMIN, Role.EXTERNAL] },
    { id: "5", name: 'Mista Developer', roles: [Role.EMPLOYEE], department: Department.IT },
    { id: "6", name: 'Ms Contractor', roles: [Role.EXTERNAL], department: Department.IT }
  ];

  userDirectory = ImpersonateComponent.userDirectory;

  /**
  * For impersonating different users
  */
  public userForm = new FormGroup({
    user: new FormControl<UserModel | null>(null)
  });

  constructor(
    private userService: UserService
  ) { }

  /**
  * Emit the selected user.
  */
  impersonatedUser$ = this.userForm.controls.user.valueChanges.pipe(
    filter(UtilsService.notEmpty),
    tap(user => this.userService.setUser(user))
  )
}
