package action

import future.keywords
import data.mapping.get_lowercase_mapping

# While the CRUD concept is easy to map to
# distinct policies, a REST api presents
# some ambiguity. A generic mapping would be:
# CRUD <=> HTTP
# CREATE <=> POST/PUT
# READ <=> GET
# UPDATE <=> PUT/POST/PATCH
# DELETE <=> DELETE
# The rules below apply a more strict convention
# following the recommendations here:
# https://restfulapi.net/rest-put-vs-post/

action_is_create if {
	get_lowercase_mapping("action") == "create"
}

action_is_create if {
	get_lowercase_mapping("httpMethod") == "post"
}

action_is_read if {
	get_lowercase_mapping("action") == "read"
}

action_is_read if {
	get_lowercase_mapping("httpMethod") == "get"
}

action_is_update if {
	get_lowercase_mapping("action") == "update"
}

action_is_update if {
	get_lowercase_mapping("httpMethod") == "put"
}

action_is_delete if {
	get_lowercase_mapping("action") == "delete"
}

action_is_delete if {
	get_lowercase_mapping("httpMethod") == "delete"
}
