package mapping

import data.inputdatamapping as input_mapping
import future.keywords

# make a union to be able to extract values from
# both input and data
input_and_mapping_preprocessing := object.union(input, data.mapping_preprocessing)

# Object structure with <key name>:<array <path to input value>>
# The key belongs to model domain within the policy
# The <path to input value> points to input data
# Example: Assume support for two different input sources
# supplying user name, and these are mapped to the internal
# data model field "username". One source provides the data under
# input.user.uid and the other under "input.attributes.user.name".
# To get hold "first found", add a row like this in the mapping data...
# "username": ["user.uid", "attributes.user.name"]
# ... and then get the value with theUserName := get_mapping("username")

mapping_set contains result if {
	key := object.keys(input_mapping)[_]
	path := input_mapping[key][_]
	path_as_array := split(path, ".")
	walk(input_and_mapping_preprocessing, [path_as_array, value])
	result := {key: value}
}

# Merge all objects into one, and resolve conflicts
# by "last applied wins"
# The union_n will solve the merge neatly. But it's not present
# in the wasm module (as of OPA v0.48):
# mapping_merge := object.union_n([x | mapping_set[x]])
# Object Comprehensions will do the work!
mapping_merge := {key: val | mapping_set[obj]; object.keys(obj)[key]; val := obj[key]}

# Accessor to object (or scalar) mapped to key in "input_mapping"
get_mapping(key) := val if {
	val := mapping_merge[key]
}

# Accessor to string value (in lower case) mapped to key in "input_mapping"
get_lowercase_mapping(key) := val if {
	val := lower(mapping_merge[key])
}
