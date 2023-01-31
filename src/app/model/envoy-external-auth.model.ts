// TypeScript interfaces replicating the model of ext_authz_filter
//
// Envoy's "External Authorization" HTTP filter is used when
// integrating OPA with Envoy. The documentation here...
// https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/ext_authz_filter
// ... states that the data sent to OPA is a service.auth.v3.CheckRequest object:
// https://www.envoyproxy.io/docs/envoy/latest/api-v3/service/auth/v3/external_auth.proto#envoy-v3-api-msg-service-auth-v3-checkrequest
// The interfaces below cover parts of the quite large CheckRequest model
//
// "Envoy can be configured to pass validated JWT payload data into the ext_authz filter with metadata_context_namespaces and payload_in_metadata."
// https://www.openpolicyagent.org/docs/latest/envoy-primer/#example-with-jwt-payload-passed-from-envoy

export interface EnvoyCheckRequest {
  attributes?: EnvoyAttributeContext
}

export interface EnvoyAttributeContext {
  source?: EnvoyAttributeContextPeer,
  destination?: EnvoyAttributeContextPeer,
  request?: EnvoyAttributeContextRequest,
  context_extensions?: { [id: string]: string; },
  metadata_context?: Object
}

export interface EnvoyAttributeContextPeer {
  address: Object,
  service: string,
  labels: { [id: string]: string; },
  principal: string
  certificate: string
}

export interface EnvoyAttributeContextRequest {
  time?: string,
  http: EnvoyAttributeContextHttpRequest
}

export interface EnvoyAttributeContextHttpRequest {
  id?: string,
  method?: string,
  headers?: { [id: string]: string; },
  path?: string,
  host?: string,
  scheme?: string,
  query?: string,
  fragment?: string,
  size?: number,
  protocol?: string,
  body?: string,
  raw_body?: ArrayBuffer
}

export interface EnvoyMetadata {
  filter_metadata: { [id: string]: object; },
  typed_filter_metadata: { [id: string]: object; },
}

// from https://www.openpolicyagent.org/docs/latest/envoy-primer/#input-document
// The parsed_path field in the input is generated from the path field in the HTTP request which is included in the Envoy External Authorization CheckRequest message type
// The parsed_query field in the input is also generated from the path field in the HTTP request.
// The parsed_body field in the input is generated from the body field in the HTTP request which is included in the Envoy External Authorization CheckRequest message type
// If skip-request-body-parse: true is specified in the OPA-Envoy configuration, then the parsed_body and truncated_body fields will be omitted from the input.
export interface OPAEnvoyExtras {
  parsed_body?: { [id: string]: string; },
  parsed_path?: string[],
  parsed_query?: { [id: string]: string[]; }
}
