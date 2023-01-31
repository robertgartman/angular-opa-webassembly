package user

import data.mapping.get_lowercase_mapping
import data.mapping.get_mapping
import data.rolesHierachy as roles_hierachy
import future.keywords # uses 'in' and 'contains' and 'if'

#
# Resolve the inheritence of the hierachical Roles
#
# Use OPA's support for Graphs
# https://www.openpolicyagent.org/docs/latest/policy-reference/#graph
#

# extract all reachable nodes, keyed by each node
# That is - given a role, extract an array of all inherited roles
all_reachable_nodes[root] := paths if {
	roles_hierachy[root]
	paths := graph.reachable(roles_hierachy, {root})
}

# Function resolving if the requiredRole
# is either part of the users array of Roles
# or inherited as per the Role inheritence structure
#
# Usage example: hasRole("employee", ["sales", "external"] )
#
hasRole(requiredRole, userRoles) := x if {
	eachRole := userRoles[_]
	x := all_reachable_nodes[eachRole][requiredRole]
}

else = false

# Helper rules resolving some roles
user_role_is_employee := x if x := hasRole("Employee", user_all_roles)

user_role_is_contractadmin := x if x := hasRole("ContractAdmin", user_all_roles)

user_role_is_ceo := x if x := hasRole("CEO", user_all_roles)

user_role_is_external := x if x := hasRole("External", user_all_roles)

user_department_is_legal if {
	get_lowercase_mapping("userDepartment") == "legal"
}

user_department_is_sales if {
	get_lowercase_mapping("userDepartment") == "sales"
}

# produce a "set"
# https://www.openpolicyagent.org/docs/latest/policy-language/#generating-sets
user_all_roles contains role if {
	role := get_mapping("userRoles")[_]
}

user_id := id if {
	id := get_mapping("userId")
}
