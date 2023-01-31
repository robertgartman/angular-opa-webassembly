# Put mapping preprocessing here. There is a special reason
# this file has a different package name.
# This rule: input_and_data := object.union(input, data.mapping_preprocessing)
# in the "mapping" package will create a recursion if with something like
# input_and_data := object.union(input, data)
package mapping_preprocessing

import future.keywords

example_demonstrating_preprocessing := result if {
# this placeholder serves as an example of
# how to pre-process input before feeding it to
# the mapping logic in the "mapping" package.
# The name of this rule will be a key in
# mapping.
 result:="hardcoded"
}
