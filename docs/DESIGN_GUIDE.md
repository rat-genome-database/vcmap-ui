# Project Design Guide

[VCMap Web UI](../README.md)

## Third Party Frameworks

The following list is comprised of the third party frameworks that are used in this project.

### Vue3 w/ Typescript

This is our reactive JS framework of choice. We decided on Vue3 over Vue2 because long term support for Vue2 will be coming to an end within the next few months. 

### PrimeVue

https://www.primefaces.org/primevue/showcase/#/

This is a components framework for Vue3. Follow these steps when you want to use a component from this framework that has not yet been globally registered in the app:
1. Go to `app/src/utils/ExternalComponentsHandler.ts`
2. Import the component at the top of the file
3. Add the component or directive to the `COMPONENTS` or `DIRECTIVES` object, respectively

Abstracting this registration out into its own collection of functions allows us to share these components between our app and our automated tests.

### PrimeFlex

https://www.primefaces.org/primeflex/

This is the css framework we use. It works well with PrimeVue and has a lot of useful helper utilities related to grids, flexbox, spacing, etc.

## Project Architecture

### Application Layers

* View/Presentation Layer
  * views
  * components ([see more](#writing-components))
* Data Access Layer
  * store
  * api ([see more](#api-layer))
  * models

### Data Flow

The philosophy we have taken so far in regards to data flow is the following:
1. The view or component requests some data from the API layer
2. The API layer makes an http request for that data and transforms it into a model object
3. The model object is returned to the view or component

In general, we are making use of the `store` to keep the user's current configuration settings in local storage.

### Writing Components

* When possible, write small, easily testable components. Always try to break down large components into a collection of smaller ones when it makes sense to do so.
* For the time being we are using Vue3's `Composition API` with the `script setup` syntax. This syntax lets us avoid some boilerplate code. You can read more about that here:
  * [Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html#why-composition-api)
  * [Script Setup Syntax](https://v3.vuejs.org/api/sfc-script-setup.html)

### API Layer

The API layer is grouped into modules of related API calls (e.g. `SpeciesApt.ts` contains any species-related API calls, `GeneApi.ts` contains any gene/ortholog-related API calls). This is a bit of a judgement call, but this is done for organizational purposes.

Inside each module, there should be a single class that acts as the default export. This class contains static methods for each individual API call. These static methods should handle making the API request and any post-processing of the API response (converting the response into our internal models, etc).

The post-processing is typically done using a DTO (data-transfer object) to model the expected API response and a converter method for converting the DTO to one of our internal models. See an example module file below:

```ts
// ChromosomeApi.ts

import Chromosome from '../models/Chromosome';

interface ChromosomeDTO
{
  mapKey: number;
  chromosome: string;
  refSeqId: string;
  genbankId: null,
  seqLength: number;
  gapLength: number;
  gapCount: number;
  contigCount: number;
  ordinalNumber: number;
}

function getChromosomeFromDTO(dto: ChromosomeDTO)
{
  return new Chromosome({
    mapKey: dto.mapKey,
    chromosome: dto.chromosome,
    seqLength: dto.seqLength,
  });
}

export default class ChromosomeApi
{
  static async getChromosomeInfo(chr: String, mapKey: Number):  Promise<Chromosome>
  {
    const res = await httpInstance.get<ChromosomeDTO>(`/maps/chr/${chr}/${mapKey}`);
    return getChromosomeFromDTO(res.data);
  }
}

```

## Automated Tests

### Testing libraries

Automated tests are written with `Jest` and [`Vue-Test-Utils`](https://next.vue-test-utils.vuejs.org/)

### What to test?

I've found these articles useful when deciding what should be tested or how we should write our tests:

* [Writing components that are easy to test](https://next.vue-test-utils.vuejs.org/guide/essentials/easy-to-test.html)
* [Vue Test Utils Crash Course](https://next.vue-test-utils.vuejs.org/guide/essentials/a-crash-course.html)

### Writing tests for components that contain components from our external framework

If you are writing unit tests for a component that also contains components from `PrimeVue`, you will likely run into some warnings or other issues with being able to find
and interact with those `PrimeVue` components. When mounting the component, you will need to register those external components so that `Vue-Test-Utils` knows how to render them.

Example:
```
const wrapper = mount(Overview, {
  global: {
    plugins: ExternalComponentsHandler.getPlugins(),
    components: ExternalComponentsHandler.getComponents(),
    directives: ExternalComponentsHandler.getDirectives()
  }
});
```
