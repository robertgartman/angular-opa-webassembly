/**
 * Data model for mapping between source domain data model (e.g. this Angular code base)
 * and target, being the internal OPA policies data model. See file mapping.rego
 */
export interface OpaPolicyDataMappingModel {
  // Resoure
  beforeResource?: [string],
  afterResource?: [string],
  // Contract
  contractAuthor?: [string],
  lifecycleState?: [string],
  contractTitle?: [string],
  contractBody?: [string],
  contractSignature?: [string],
  contractId?: [string],
  // User
  userId?: [string],
  userRoles?: [string]
  // HTTP
  httpHost?: [string],
  httpMethod?: [string],
  httpPath?: [string],
  httpParsedBody?: [string],
  httpParsedPath?: [string],
  httpParsedQuery?: [string],
  // Action
  action?: [string],
}
