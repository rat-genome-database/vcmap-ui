import BackboneSelection, { SelectedRegion } from "@/models/BackboneSelection";
import { VCMapState } from "@/store";
import { ExternalComponentsHandler } from "@/utils/ExternalComponentsHandler";
import { GlobalMountOptions } from "@vue/test-utils/dist/types";
import { createLogger } from "vue-logger-plugin";
import { ActionTree, createStore, Store } from 'vuex';
import { key } from '@/store';

export namespace TestUtils
{
  interface TestUtilMountingOptions
  {
    includeExternalComponents?: boolean,
    includeDirectives?: boolean,
    includeLogger?: boolean,
    useStore?: Store<VCMapState>,
  }

  /**
   * Get global mounting options for use in shallowMounting or mounting a Vue component. This method allows you to globally register
   * components from our Vue components framework along with other plugins (our Vue logger, etc).
   * @param options used to dictate what you want to globally register
   * @returns a GlobalMountOptions object
   */
  export function getGlobalMountingOptions(options: TestUtilMountingOptions)
  {
    const globalOptions: GlobalMountOptions = {};

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

    if (options.useStore)
    {
      globalOptions.plugins = (globalOptions.plugins) ? globalOptions.plugins.concat([[options.useStore, key]]) : [[options.useStore, key]];
    }

    return globalOptions;
  }

  export function initStore(initialState: Partial<VCMapState>, actions?: ActionTree<VCMapState, VCMapState>)
  {
    const mockStore = createStore<VCMapState>({
      state: {
        species: null,
        chromosome: null,
        startPos: null,
        stopPos: null,
        loadStart: null,
        loadStop: null,
        gene: null,
        comparativeSpecies: [],

        selectedBackboneRegion: new BackboneSelection(new SelectedRegion(0,0,0,0)),
        detailedBasePairRange: { start: 0, stop: 0 },

        overviewBasePairToHeightRatio: 1000,
        overviewSyntenyThreshold: 0,
        detailedBasePairToHeightRatio: 1000,
        detailsSyntenyThreshold: 0,

        configTab: 0,

        selectedData: null,
        loadedGenes: null,
        selectedGeneIds: [],

        isDetailedPanelUpdating: false,
        isOverviewPanelUpdating: false,

        // Overwrite default state with props passed in by the tester
        ...initialState,
      },
      actions: actions
    });

    return mockStore;
  }
}