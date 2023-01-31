
import { EnvoyCheckRequest, OPAEnvoyExtras } from "./envoy-external-auth.model";
import { OpaPolicyDataMappingModel } from "./opa-policy-data-mapping.model";
import { RoleHierachy, UserModel } from "./userModel";

export enum AuthzAction {
  CREATE = "Create",
  READ = "Read",
  UPDATE = "Update",
  DELETE = "Delete"
}

export interface PolicyData {
  rolesHierachy: RoleHierachy,
  inputdatamapping: OpaPolicyDataMappingModel
}

export interface PolicyInput<T> extends EnvoyCheckRequest, OPAEnvoyExtras {
  subject?: UserModel,
  action?: AuthzAction,
  resource?: {
    // The resource before requested action
    before: T,
    // The desired resource after requested action
    after: T
  }
}
