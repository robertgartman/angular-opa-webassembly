# METADATA
# entrypoint: true
package feature

import data.mapping.get_mapping
import future.keywords # uses 'in' and 'contains' and 'if'

import data.user.user_role_is_contractadmin
import data.user.user_role_is_employee

# =======================================================
# Rule: allow
#
# Why: assert that provided user has access to feature
# =======================================================

feature_name := get_mapping("afterResource")

default allow = false

# METADATA
# entrypoint: true
allow if {
	user_role_is_employee
	feature_name == "ContractsComponent"
}

allow if {
	user_role_is_contractadmin
	feature_name == "ContractsComponent"
}

allow if {
	user_role_is_employee
	feature_name == "ContractDetailsComponent"
}

allow if {
	user_role_is_contractadmin
	feature_name == "ContractDetailsComponent"
}
