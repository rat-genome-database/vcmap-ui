import { shallowMount } from '@vue/test-utils';
import BackboneOverview from '@/components/BackboneOverview.vue';
import Species from '@/models/Species';
import { VCMapState } from '@/store';
import { createStore } from 'vuex';
import { nextTick } from '@vue/runtime-core';
import Chromosome from '@/models/Chromosome';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species', defaultMapKey: 1 }),
    map: null,
    chromosome: new Chromosome({ chromosome: '1', mapKey: 38, seqLength: 1000000, gapCount: 5, gapLength: 10000, contigCount: 100, ordinalNumber: 1 }),
    startPos: 1,
    stopPos: 10000,
    gene: null,
    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null,
    selectedBackboneRegion: null,
    backboneZoom: 1,
    comparativeZoom: 1,
    displayStartPos: 1,
    displayStopPos: 10000,
    backboneBasePairToHeightRatio: 1000,
    backboneSyntenyThreshold: 0,
    comparativeBasePairToHeightRatio: 1000,
    comparativeSyntenyThreshold: 0,
  },
  getters: {
    getSpecies(state: VCMapState) {
      return state.species;
    },
    getChromosome(state: VCMapState) {
      return state.chromosome;
    },
    getStartPosition(state: VCMapState) {
      return state.startPos;
    },
    getStopPosition(state: VCMapState) {
      return state.stopPos;
    },
    getDisplayStartPosition(state: VCMapState) {
      return state.displayStartPos;
    },
    getDisplayStopPosition(state: VCMapState) {
      return state.displayStopPos;
    },
  }
});

describe('BackboneOverview', () => {
  it('renders backbone species name from store', async () => {
    const wrapper = shallowMount(BackboneOverview, {
      global: {
        provide: {
          store: mockStore
        }
      },
    });

    // Wait for mounted() lifecycle hook to run
    await nextTick();

    const speciesText = wrapper.get('[data-test="backbone-overview-display"]');
    expect(speciesText.text()).toBe('Test Species chr1:1-10,000');
  });
});