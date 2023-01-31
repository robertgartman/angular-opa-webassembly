export enum LifecycleState {
  DRAFT = 'Draft', // when the contract is crafted
  SIGNED = 'Signed', // when contract is legally binding
  ARCHIVED = 'Archived'
};

export interface ContractDocument {
  author: string, // the user id of the creator
  lifecycleState: LifecycleState, // Contract Lifecycle state
  title: string, // A title to easily find and manage the contract
  body: string, // The contract content
  signature: string, // name of the signing party. E.g. Jane Doe
  id: string // A unique identifier. E.g. a UUID
}
