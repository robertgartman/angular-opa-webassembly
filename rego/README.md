# Prepare the WASM file

Either, go with the existing poilcy.wasm, or tinker with the rego files and then...

## 1 - Install [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/#1-download-opa)

## 2 - Build the WebAssembly from the rego files
https://www.openpolicyagent.org/docs/latest/wasm/#compiling-policies


Run from repo base folder:
```
opa check --strict -s rego/schemas -b rego && \
opa build -t wasm  -o /tmp/bundle.tar.gz rego/*.rego && \
opa inspect /tmp/bundle.tar.gz ; \
tar xzf /tmp/bundle.tar.gz --directory ./src/assets /policy.wasm && \
tar xzf /tmp/bundle.tar.gz --directory ./src/assets /.manifest
```

`opa check` is not required, but included to check Rego source files for parse and compilation errors. Note that strict mode is applied.

`opa inspect` is included in the build to capture issues with annotions (METADATA).
Lessons learned with OPA v0.48 is that at least some misplaced annotations will silently
pass `opa check` and `opa build` though `opa inspect` will flag them.

The last tar is for verifying entrypoints. See https://github.com/open-policy-agent/opa/issues/5565  \


# Edit Rego files

## VS Code
Install [Open Policy Agent](https://marketplace.visualstudio.com/items?itemName=tsandall.opa)
and note the available config settings.
This project has applied non-default workspace conf. Inspect `.vscode/settings.json`

## Type checking 
There is support for [type checking](https://www.openpolicyagent.org/docs/latest/schemas/) when editing Rego files. Types are checked against json schemas. The [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) project comes handy when you want to such schema from your Typescript model. The command below will generate input_schema.json from the PolicyInput interface.
# 
```
npx typescript-json-schema --esModuleInterop --out rego/schemas/input_schema.json tsconfig.app.json PolicyInput
```

