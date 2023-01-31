export enum Role {
  EMPLOYEE = 'Employee',
  EXTERNAL = 'External',
  CONTRACT_ADMIN = 'ContractAdmin',
  CEO = "CEO"
};

export type RoleHierachy = { [role: string]: Role[] };

export enum Department {
  IT = 'IT',
  SALES = 'Sales'
};


export interface UserModel {
  id: string,
  name: string,
  department?: Department,
  roles: Role[]
}
