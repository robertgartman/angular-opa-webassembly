# Proof of Concept - enforcing OPA policies in the browser

This repo was created togheter with a series of articles published [here](https://medium.com/@robertgartman/enforce-policies-in-the-browser-with-open-policy-agent-22d8e32fbfb6).

Code is demonstrating how Open Policy Agent (aka OPA) can run alongside the app and serve all the policy-related decisions.

**The tech stack**
- Angular 15
- Open Policy Agent, code developed against v0.48</li>
- OPA running in WebAssembly

**The concepts are demonstrated as a Contract Management solution**

The Angular logic can be found under `src/app`. The rego files are located under `rego` folder. The `rego/README.md` explains how to update the WebAssembly/wasm file.


**Get started**

Just run this as you would with any normal Angular app (described in the default Angular CLI further below):

`npm install`

`ng serve`

When accessing `http://localhost:4200/` you should see a welcome screen. There is verbose logging in the browser console.

If you'd like to access via mobile, do this (verified on Mac):

`ng serve --host=0.0.0.0 --disable-host-check`

In the mobile, navigate to `http://<webserverip>:4200/`

---
*Below - the default Angular CLI output...*

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
