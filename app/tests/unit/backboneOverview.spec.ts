import { shallowMount } from '@vue/test-utils';
import BackboneOverview from '@/components/BackboneOverview.vue';
import Species from '@/models/Species';
import { VCMapState } from '@/store';
import { createStore } from 'vuex';
import { nextTick } from '@vue/runtime-core';

const mockStore = createStore({
  state: {
    species: new Species({ typeKey: 1, name: 'Test Species'}),
    map: null,
    chromosomeNum: null,
    chromosome: null,
    startPos: null,
    stopPos: null,
    comparativeSpeciesOne: null,
    comparativeSpeciesTwo: null
  },
  getters: {
    getSpecies(state: VCMapState) {
      return state.species;
    }
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

    const speciesText = wrapper.get('[data-test="backbone-overview-species"]');
    expect(speciesText.text()).toBe('Species: Test Species');
  });
});