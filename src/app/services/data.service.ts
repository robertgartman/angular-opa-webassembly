import { Injectable } from '@angular/core';
import * as DotObject from 'dot-object';
import { PolicyInput } from '../model/authz.model';
import { EnvoyAttributeContext, OPAEnvoyExtras } from '../model/envoy-external-auth.model';
import { OpaPolicyDataMappingModel } from '../model/opa-policy-data-mapping.model';
import { Role, RoleHierachy, UserModel } from '../model/userModel';

/**
 * Main purpose of this class is to provide
 * a typesafe bridge between this app domain
 * and the policy code domain (see mapping.rego).
 * Pros: anything beyond "Day 1" gets easier
 * Cons: getting past "Day 1" requires more investment
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {

  /**
   * RBAC (Role Based Access Control) comes in a variant called ReBAC.
   * The hierachy can be structured in several ways. Look on page 33 here for a primer...
   * https://csrc.nist.gov/CSRC/media/Presentations/Role-based-Access-Control-an-Overview/images-media/alvarez.pdf
   * This structure is coupled with the resolving of graph within the user.rego file. In order for OPA's graph.reachable(...)
   * to work, all roles must be present, alos when they do not inherit other role(s).
   */

  // Start with a 'base' contaning all roles
  static allRolesHierarchy: RoleHierachy = Object.values(Role).reduce<RoleHierachy>((acc, role) => ({ ...acc, [role]: [] }), {});

  // Add the relevant inheritance
  static rolesHierarchy: RoleHierachy = {
    ...DataService.allRolesHierarchy,

    // Role CEO inherits the EMPLOYEE role
    [Role.CEO]: [Role.EMPLOYEE]
  }

  opaPolicyDataMapping: OpaPolicyDataMappingModel;

  constructor() {


    const user: Partial<UserModel> = {
      id: <any>new Object(),
      roles: <any>new Object()
    }

    const envoyAttributeContext: EnvoyAttributeContext = {
      request: {
        http: {
          method: <any>new Object(),
          host: <any>new Object(),
          path: <any>new Object(),
        }
      }
    }

    const oPAEnvoyExtras: OPAEnvoyExtras = {
      parsed_body: <any>new Object(),
      parsed_path: <any>new Object(),
      parsed_query: <any>new Object(),
    }

    /**
     * Create an object with all the fields to be mapped
     * between this (browser) domain and the the Opa Policy domain.
     * Instead of assigning values such as string, boolean etc to match the
     * Typescript interfaces, each value gets new Object (btw, it does not have
     * to be an new "object" - any object will do but not a primitive). To keep it robust, make sure
     * the value is unique.
     *
     * Raison d'être: only serves as input when creating the opaPolicyDataMapping variable
     */
    const policyInput: PolicyInput<object> = {
      subject: <UserModel>user,
      resource: {
        before: new Object(),
        after: new Object(),
      },
      action: <any>new Object(),
      attributes: envoyAttributeContext,
      parsed_body: oPAEnvoyExtras.parsed_body,
      parsed_path: oPAEnvoyExtras.parsed_path,
      parsed_query: oPAEnvoyExtras.parsed_query,
    }


    /**
     * This data structure is the "glue" between this domain and OPA domain. The data structure
     * keys represent pieces of data that are needed during Policy evaluation.
     * The value of type array contains "dotted" adress references to the objects holding
     * the value. Assume a key "userName" then value could be something like
     * ["subject.id", "some.other.deeply.nested.inputdatapath.from.your.apigateway"]
     * The first mapping matters here in the browser domain, the second mapping has
     * matters in your api gateway. The data model supports an array if you would like to
     * take a snapshot and bundle that with the policies deployed with the gateway.
     */
    this.opaPolicyDataMapping = {
      // Resource mapping
      beforeResource: [this.getDotted(policyInput, policyInput.resource?.before)],
      afterResource: [this.getDotted(policyInput, policyInput.resource?.after)],
      // User attributes mapping
      userId: [this.getDotted(policyInput, user.id)],
      userRoles: [this.getDotted(policyInput, user.roles)],
      // HTTP mapping
      httpHost: [this.getDotted(policyInput, envoyAttributeContext.request?.http.host)],
      httpMethod: [this.getDotted(policyInput, envoyAttributeContext.request?.http.method)],
      httpPath: [this.getDotted(policyInput, envoyAttributeContext.request?.http.path)],
      httpParsedBody: [this.getDotted(policyInput, oPAEnvoyExtras.parsed_body)],
      httpParsedPath: [this.getDotted(policyInput, oPAEnvoyExtras.parsed_path)],
      httpParsedQuery: [this.getDotted(policyInput, oPAEnvoyExtras.parsed_query)],
      // Action mapping
      action: [this.getDotted(policyInput, policyInput.action)],
    }
  }

  /**
   * Translate field within a given object to a string based dot-notation.
   * @param baseObj Object from where the dot-notion will be derived
   * @param targetFieldValue the unique value within baseObj attached to the wanted field
   * @returns The dot.notation of the field within the base object. E.g. "person.head.eye.left"
   */
  private getDotted(baseObj: Object, targetFieldValue: any): string {
    const dottedObj = DotObject.dot(baseObj);
    const dottedStr = Object.keys(dottedObj).find(key => dottedObj[key] == targetFieldValue);
    if (!dottedStr) {
      throw new Error("Failure resolving dotted representation. Found no match.")
    }
    return <string>dottedStr;
  }
}
