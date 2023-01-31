import { faker } from '@faker-js/faker';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import { ImpersonateComponent } from '../impersonate/impersonate.component';
import { ContractDocument, LifecycleState } from '../model/contract.model';
import { UserModel } from '../model/userModel';

/**
 * Simulate a persistant backend storage
 * using "angular/in-memory-web-api"
 * See: https://medium.com/@amcdnl/mocking-with-angular-more-than-just-unit-testing-cbb7908c9fcc
 * and more thechnical details here:
 * https://github.com/angular/in-memory-web-api/blob/master/src/in-mem/backend.service.ts
 */
export class ContractInMemoryDbService implements InMemoryDbService {

  constructor(
  ) { }

  public static contractCollection = 'contracts';

  private static NR_OF_DEMO_CONTRACTS = 15

  /**
   * Override InMemoryDbService#createDb
   * Pre-populate with some contracts
   * https://github.com/faker-js/faker to the rescue
   * @returns fake db data
   */
  createDb() {
    // An array of random numbers between 0 and ImpersonateComponent.userDirectory.length
    const rndArray = [...Array(ContractInMemoryDbService.NR_OF_DEMO_CONTRACTS)]
      .map(_ => Math.floor(Math.random() * ImpersonateComponent.userDirectory.length));
    const states = Object.values(LifecycleState);

    const contractData = rndArray.map(nr => {
      const user: UserModel = ImpersonateComponent.userDirectory[nr];

      const rndState = states[Math.floor(Math.random() * states.length)];

      const contract = <ContractDocument>{
        title: faker.company.name(),
        id: faker.datatype.uuid(),
        author: user.id,
        body: faker.lorem.paragraph(3),
        lifecycleState: rndState
      }

      if (rndState != LifecycleState.DRAFT) {
        Object.assign(contract, <ContractDocument>{
          title: contract.title + ', ' + faker.date.past(2).toLocaleDateString("en-US"),
          signature: user.name,
        })
      }
      return contract;
    })

    // The key will be a 'collection' (InMemoryDbService lingo) that
    // is processed by InMemoryDbService
    return { [ContractInMemoryDbService.contractCollection]: contractData }
  }
}
