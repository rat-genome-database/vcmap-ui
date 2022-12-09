import { ExternalComponentsHandler } from "@/utils/ExternalComponentsHandler";
import { GlobalMountOptions } from "@vue/test-utils/dist/types";
import { createLogger } from "vue-logger-plugin";

export namespace TestUtils
{
  /**
   * Get global mounting options for use in shallowMounting or mounting a Vue component. This method allows you to globally register
   * components from our Vue components framework along with other plugins (our Vue logger, etc).
   * @param options used to dictate what you want to globally register
   * @returns a GlobalMountOptions object
   */
  export function getGlobalMountingOptions(options: { includeExternalComponents?: boolean, includeDirectives?: boolean, includeLogger?: boolean })
  {
    let globalOptions: GlobalMountOptions = {};

    if (options.includeExternalComponents || options.includeDirectives)
    {
      globalOptions.plugins = ExternalComponentsHandler.getPlugins();

      if (options.includeExternalComponents)
      {
        globalOptions.plugins = ExternalComponentsHandler.getPlugins();
        globalOptions.components = ExternalComponentsHandler.getComponents();
      }

      if (options.includeDirectives)
      {
        globalOptions.directives = ExternalComponentsHandler.getDirectives();
      }
    }

    if (options.includeLogger)
    {
      const logger = createLogger({});
      globalOptions.plugins = (globalOptions.plugins) ? globalOptions.plugins.concat(logger) : [logger];
    }

    return globalOptions;
  }
}