import { App, Component, Directive } from "@vue/runtime-core";

// Import any components/directives that you want to globally register
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import Tooltip from 'primevue/tooltip';

/**
 * Add any components you want to be globally registered to this object:
 */
const COMPONENTS: {[key: string]: Component} = {
  'Button': Button,
  'Dropdown': Dropdown,
  'Divider': Divider,
  'Panel': Panel,
};

/**
 * Add any directives you want to be globally registered to this object:
 */
const DIRECTIVES: {[key: string]: Directive} = {
  'Tooltip': Tooltip
};

/**
 * This namespace contains methods for helping us register components and directives from third party libraries
 */
export namespace ExternalComponentsHandler
{
  export function registerAll(app: App<Element>)
  {
    app.use(PrimeVue);

    for (const name in COMPONENTS)
    {
      app.component(name, COMPONENTS[name]);
    }

    for (const name in DIRECTIVES)
    {
      app.directive(name, DIRECTIVES[name]);
    }
  }

  export function getComponents()
  {
    return COMPONENTS;
  }

  export function getDirectives()
  {
    return DIRECTIVES;
  }
}