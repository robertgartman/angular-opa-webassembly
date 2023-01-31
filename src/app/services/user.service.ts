import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { UserModel } from '../model/userModel';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // Emit null from start. This will simply the logic
  // when trimming the UI based on user identity
  private user$ = new BehaviorSubject<UserModel | null>(null)

  constructor() { }

  getUser() {
    return this.user$;
  }

  getNonNullUser() {
    return this.user$.pipe(filter(UtilsService.notEmpty))
  }

  setUser(user: UserModel) {
    this.user$.next(user);
  }
}
