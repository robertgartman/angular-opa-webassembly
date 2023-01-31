# METADATA
# entrypoint: true
package http

import future.keywords # uses 'in' and 'contains' and 'if'

import data.user.user_id
import data.user.user_role_is_contractadmin
import data.user.user_role_is_employee

import data.contract.allow_action as contract_allow_action

import data.mapping.get_lowercase_mapping
import data.mapping.get_mapping

# =======================================================
# Start of helper rules for http rules
# =======================================================
http_parsed_path := get_mapping("httpParsedPath")

http_parsed_query := get_mapping("httpParsedQuery")

http_method_is_get if {
	get_lowercase_mapping("httpMethod") == "get"
}

http_method_is_post if {
	get_lowercase_mapping("httpMethod") == "post"
}

http_method_is_put if {
	get_lowercase_mapping("httpMethod") == "put"
}

http_method_is_delete if {
	get_lowercase_mapping("httpMethod") == "delete"
}

# =======================================================
# End of helper rules for http rules
# =======================================================

# =======================================================
# Rule: allow
#
# Why: assert access rights to http endpoints
# =======================================================
#

# METADATA
# entrypoint: true
default allow = false

# -------------------
# allow (get ALL contracts, ContractAdmin)
#
# Why: ContractAdmin can access ALL contracts
# -------------------
allow if {
	http_method_is_get
	http_parsed_path == ["api", "contracts"]
	user_role_is_contractadmin
}

# -------------------
# allow (get my contracts, Employee)
#
# Why: An employee can fetch their own contracts
# i.e query author == user.id
# -------------------
allow if {
	http_method_is_get
	http_parsed_path == ["api", "contracts"]
	user_role_is_employee
	http_parsed_query.author == [user_id]
}

# -------------------
# allow (get specific contract, Employee)
#
# Why: An employee can access their own contract
# i.e query author == user.id
#
# Warning: the ownership of the specific contract is not checked
# -------------------
allow if {
	http_method_is_get
	http_parsed_path = ["api", "contracts", _]
	user_role_is_employee
}

# -------------------
# allow (delete contract, Employee)
#
# Why: An employee can delete contract(s)
#
# Warning: the delete-rights of the specific contract is not checked
# -------------------
allow if {
	http_method_is_delete
	http_parsed_path = ["api", "contracts", _]
	user_role_is_employee
}

# -------------------
# allow (delete contract, ContractAdmin)
#
# Why: A ContractAdmin can delete contract(s)
#
# Warning: the delete-rights of the specific contract is not checked
# -------------------
allow if {
	http_method_is_delete
	http_parsed_path = ["api", "contracts", _]
	user_role_is_contractadmin
}

# -------------------
# allow (create contract, Employee)
#
# Why: allow employee creating new contract
# -------------------
allow if {
	http_method_is_post
	http_parsed_path = ["api", "contracts"]
	user_role_is_employee
	contract_allow_action
}

# -------------------
# allow (update contract, Employee)
#
# Why: Update a contract
#
# Warning: the update-rights of the specific contract is not checked
# -------------------
allow if {
	http_method_is_put
	http_parsed_path = ["api", "contracts", _]
	user_role_is_employee
}
