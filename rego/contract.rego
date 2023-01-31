# METADATA
# scope: package
# entrypoint: true
# schemas:
#   - input: schema.input_schema
package contract

# Regarding "entrypoint: true" above - see:
# https://www.openpolicyagent.org/docs/latest/annotations/#entrypoint

import future.keywords

import data.user.user_id
import data.user.user_role_is_ceo
import data.user.user_role_is_contractadmin
import data.user.user_role_is_employee

import data.action.action_is_create
import data.action.action_is_delete
import data.action.action_is_read
import data.action.action_is_update

#import data.mapping.get_lowercase_mapping
import data.mapping.get_mapping

# =======================================================
# Start of helper rules for contract rules
# =======================================================

beforeContract := resource if {
	resource := get_mapping("beforeResource")

	# verify that required fields are non-blank
	get_valid_id(resource)
	get_valid_state(resource)
	get_valid_author(resource)
}

contract_id := beforeContract.id

contract_author := beforeContract.author

afterContract := resource if {
	resource := get_mapping("afterResource")

	# verify that required fields are defined
	count(trim_space(resource.lifecycleState)) > 0

	# fields not allowed to be modified
	resource.id == contract_id
	resource.author == contract_author
}

user_is_contract_author if {
	contract_author == user_id
}

get_valid_id(contract) := res if {
	# Just check 'non empty'
	res := count(trim_space(contract.id)) > 0
}

get_valid_state(contract) := res if {
	# Just check 'non empty'
	res := count(trim_space(contract.lifecycleState)) > 0
}

get_valid_author(contract) := res if {
	# Just check 'non empty'
	res := count(trim_space(contract.lifecycleState)) > 0
}

# =======================================================
# End of helper rules for contract rules
# =======================================================

# =======================================================
# Rule: valid_body
#
# Why: validate if contract body is non-empty
# =======================================================

# METADATA
# entrypoint: true
valid_body := get_valid_body(beforeContract)

get_valid_body(contract) := res if {
	# Just check 'non empty'
	res := count(trim_space(contract.body)) > 0
} else = false

# =======================================================
# Rule: valid_title
#
# Why: validate if contract title is non-empty
# =======================================================

# METADATA
# entrypoint: true
valid_title := get_valid_title(beforeContract)

get_valid_title(contract) := res if {
	# Just check 'non empty'
	res := count(trim_space(contract.title)) > 0
} else = false

# =======================================================
# Rule: valid_signature
#
# Why: validate if contract title is non-empty
# =======================================================

# METADATA
# entrypoint: true
valid_signature := get_valid_signature(beforeContract)

get_valid_signature(resource) := res if {
	# Just check 'non empty'
	res := count(trim_space(resource.signature)) > 0
} else = false

# =======================================================
# Function: is_contract_valid
#
# Why: assert that the contract is valid
# from an data integrity point-of-view
# =======================================================

is_before_contract_valid if {
	# If the fields are valid, the resource is valid
	get_valid_signature(beforeContract)
	get_valid_title(beforeContract)
	get_valid_body(beforeContract)
}

# =======================================================
# Rule: allow_action
#
# Why: assert user's right to perform action on contract
# =======================================================

# METADATA
# entrypoint: true
default allow_action = false

# -------------------
# allow_action - (contract author, DELETE)
#
# Why: the Contract author can delete the contract only
# in draft mode
# -------------------
allow_action if {
	action_is_delete
	user_is_contract_author
	beforeContract.lifecycleState == "Draft"
}

# -------------------
# allow_action - (ContractAdmin, DELETE)
#
# Why: the ContractAdmin can delete the contract when
# state is draft or archived
# -------------------
allow_action if {
	action_is_delete
	user_role_is_contractadmin
	beforeContract.lifecycleState == "Draft"
}

allow_action if {
	action_is_delete
	user_role_is_contractadmin
	beforeContract.lifecycleState == "Archived"
}

# -------------------
# allow_action - (role Employee, CREATE)
#
# Why: anyone with role Employee can create a contract
# -------------------
allow_action if {
	action_is_create
	user_role_is_employee

	# Prevent create if contract is present
	not beforeContract
}

# -------------------
# allow_action - (ContractAdmin, READ)
#
# Why: the ContractAdmin can read contracts
# -------------------
allow_action if {
	action_is_read
	user_role_is_contractadmin
}

# -------------------
# allow_action - (Employee, READ)
#
# Why: the Employee can read own contract
# -------------------
allow_action if {
	action_is_read
	user_role_is_employee
	user_is_contract_author
}

# -------------------
# allow_action - (Employee, UPDATE)
#
# Why: the contract owner can update their own drafts
# -------------------
allow_action if {
	action_is_update
	user_role_is_employee
	user_is_contract_author
	beforeContract.lifecycleState == "Draft"
	available_states[_] == afterContract.lifecycleState
}

# -------------------
# allow_action - (ContractAdmin, UPDATE)
#
# Why: the contract owner can update contract
# in all states but archived
# -------------------
allow_action if {
	action_is_update
	user_role_is_contractadmin
	not beforeContract.lifecycleState == "Archived"
	available_states[_] == afterContract.lifecycleState
}

# =======================================================
# Rule: available_states
#
# Why: Identify available future contract states given
# given user and before-contract
#
# Use of Incremental Definitions
# https://www.openpolicyagent.org/docs/latest/policy-language/#incremental-definitions
# =======================================================

# -------------------
# Draft -> Signed
# -------------------
available_states contains "Signed" if {
	beforeContract.lifecycleState == "Draft"
	some i
	[user_role_is_ceo, user_role_is_contractadmin][i]
	is_before_contract_valid
}

# -------------------
# Draft -> Archived
# -------------------
available_states contains "Archived" if {
	beforeContract.lifecycleState == "Draft"
	some i
	[user_role_is_ceo, user_role_is_contractadmin][i]
}

available_states contains "Archived" if {
	beforeContract.lifecycleState == "Draft"
	user_is_contract_author
	user_role_is_employee
}

# -------------------
# Signed -> Archived
# -------------------
available_states contains "Archived" if {
	beforeContract.lifecycleState == "Signed"
	user_role_is_contractadmin
}

# -------------------
# No change of contract State
# -------------------
available_states contains current if {
	current := beforeContract.lifecycleState
}
