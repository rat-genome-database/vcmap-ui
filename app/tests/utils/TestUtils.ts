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
        gene: null,
        flankingGene1: null,
        flankingGene2: null,
        comparativeSpecies: [],
        configMode: 'gene',

        configurationLoaded: null,
        selectedBackboneRegion: null,
        detailedBasePairRequest: null,
        detailedBasePairRange: { start: 0, stop: 0 },

        selectedData: null,
        selectedGeneIds: [],
        selectedVariantSections: [],
        selectedBlocks: [],
        isDataPanelCollapsed: false,

        hoveredData: {
          x: 0,
          y: 0,
          data: [],
        },

        isDetailedPanelUpdating: false,
        isOverviewPanelUpdating: false,
        isUpdatingVariants: false,

        shouldUpdateDetailedPanel: false,

        selectionToastCount: 0,
        svgPositions: {
          overviewPanelWidth: 300,
          mirroredOverivew: false,
        },
        speciesOrder: {},

        hideBackboneDensityTrack: false,
        hiddenDensityTracks: [],
        history: [],
        showOverviewPanel: true,

        // Overwrite default state with props passed in by the tester
        ...initialState,
      },
      actions: actions
    });

    return mockStore;
  }
}