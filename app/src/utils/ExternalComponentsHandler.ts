import { App, Component, Directive } from "@vue/runtime-core";

// Import any components/directives that you want to globally register
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import Tooltip from 'primevue/tooltip';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import AutoComplete from 'primevue/autocomplete';
import Checkbox from 'primevue/checkbox';
import ColorPicker from 'primevue/colorpicker';
import Message from 'primevue/message';
import InlineMessage from 'primevue/inlinemessage';
import Dialog from 'primevue/dialog';

/**
 * Add any plugins/configs that you want to be globally registered:
 */
const PLUGINS = [
  PrimeVue
];

/**
 * Add any components you want to be globally registered:
 */
const COMPONENTS: {[key: string]: Component} = {
  'Button': Button,
  'Dropdown': Dropdown,
  'InputNumber': InputNumber,
  'Divider': Divider,
  'Panel': Panel,
  'ProgressBar': ProgressBar,
  'ProgressSpinner': ProgressSpinner,
  'TabView': TabView,
  'TabPanel': TabPanel,
  'AutoComplete': AutoComplete,
  'Checkbox': Checkbox,
  'ColorPicker': ColorPicker,
  'Message': Message,
  'InlineMessage': InlineMessage,
  'Dialog': Dialog,
};

/**
 * Add any directives you want to be globally registered:
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
    PLUGINS.forEach(plugin => {
      app.use(plugin);
    });

    for (const name in COMPONENTS)
    {
      app.component(name, COMPONENTS[name]);
    }

    for (const name in DIRECTIVES)
    {
      app.directive(name, DIRECTIVES[name]);
    }
  }

  export function getPlugins()
  {
    return PLUGINS;
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