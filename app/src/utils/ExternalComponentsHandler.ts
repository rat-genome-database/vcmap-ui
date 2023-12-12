import { App, Component, Directive } from "@vue/runtime-core";

// Import any components/directives that you want to globally register
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
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
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import Slider from 'primevue/slider';
import Toast from 'primevue/toast';
import Tag from 'primevue/tag';
import RadioButton from 'primevue/radiobutton';
import InputSwitch from 'primevue/inputswitch';
import Accordian from 'primevue/accordion';

/**
 * Add any plugins/configs that you want to be globally registered:
 */
const PLUGINS = [
  PrimeVue, 
  ToastService,
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
  'Message': Message,
  'Dialog': Dialog,
  'Slider': Slider,
  'Toast': Toast,
  'Tag': Tag,
  'RadioButton': RadioButton,
  'InputSwitch': InputSwitch,
  'Accordian': Accordian,
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