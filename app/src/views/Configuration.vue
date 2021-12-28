<template>
  <div class="configuration-header">
    <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
    <h3 class="header">VCMap</h3><span class="version-label">v{{VERSION}}</span>
  </div>
  <div>
    <TabView v-model:activeIndex="activeTab">
      <TabPanel header="Load by Position" >
        <div class="grid">
          <div class="col-12 text-center">
            <h2>Backbone Configuration</h2>
          </div>
          <div class="col-12">
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Backbone Species</h4>
                <Dropdown 
                  v-model="backboneSpecies" 
                  :options="speciesOptions" 
                  :loading="isLoadingSpecies"
                  @change="setChromosomeOptions"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Chromosome</h4>
                <Dropdown 
                  class="configuration-input"
                  @change="setDefaultStartAndStopPositions" 
                  v-model="backboneChromosome"
                  :disabled = "!chromosomeOptions.length"
                  :options="chromosomeOptions"
                  :loading="isLoadingChromosome"
                  optionLabel="chromosome"
                  />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-2 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 class="config-label">Start Position</h4>
                <p class="label-description">Min: 0bp</p>
                <InputNumber
                  class="configuration-input"
                  showButtons
                  v-model="startPosition"
                  :disabled="!backboneChromosome"
                  suffix="bp"
                  :step="500"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="0"
                />
              </div>
              <div class="lg:col-3 md:col-5 md:col-offset-1 sm:col-6 sm:col-offset-1">
                <h4 class="config-label">Stop Position</h4>
                <p v-if="maxPosition" class="label-description">Max: {{Formatter.addCommasToBasePair(maxPosition)}}bp</p>
                <InputNumber
                  class="configuration-input" 
                  showButtons
                  v-model="stopPosition"
                  :disabled="!backboneChromosome"
                  suffix="bp"
                  :step="500"
                  :max="maxPosition"
                  :min="1"
                />
              </div>
            </div>
            <div class="col-12 text-center">
              <h2>Comparative Species</h2>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 1"
                  class="configuration-input" 
                  v-model="comparativeSpeciesOne" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 2"
                  class="configuration-input"
                  v-model="comparativeSpeciesTwo" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Load by Gene">
        <div class="grid">
          <div class="col-12 text-center">
            <h2>Backbone Configuration</h2>
          </div>
          <div class="col-12">
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 ">
                <h4>Backbone Species</h4>
                <Dropdown 
                  v-model="backboneSpecies" 
                  :options="speciesOptions" 
                  :loading="isLoadingSpecies"
                  @change="setChromosomeOptions"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 p-fluid">
                <h4>Gene Symbol</h4>
                <div v-if="isLoadingGene">
                  <ProgressSpinner style="width:50px;height:50px"/>
                </div>
                <AutoComplete
                  class="configuration-input"
                  v-model="backboneGene"
                  :suggestions="geneSuggestions"
                  :disabled="!backboneSpecies"
                  @complete="searchGene($event)"
                  @item-select="setGeneChromosomeAndDefaultStartAndStopPositions"
                  field="symbol"
                  :minLength="3"
                />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 p-fluid">
                <p class="label-description">Chromosome: {{geneChromosome?.chromosome}} (Length: {{Formatter.addCommasToBasePair(maxPosition)}}bp)</p>
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-3 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 class="config-label">Upstream Length</h4>
                <p v-if="backboneGene" class="label-description">Gene Start: {{Formatter.addCommasToBasePair(backboneGene.start)}}bp</p>
                <InputNumber
                  class="configuration-input"
                  showButtons
                  v-model="geneOptionStartPosition"
                  :disabled="!geneChromosome"
                  required
                  suffix="bp"
                  :step="500"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="0"
                />
              </div>
              <div class="lg:col-3 md:col-3 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 class="config-label">Downstream Length</h4>
                <p v-if="backboneGene" class="label-description">Gene Stop: {{Formatter.addCommasToBasePair(backboneGene.stop)}}bp</p>
                <InputNumber
                  class="configuration-input" 
                  showButtons
                  v-model="geneOptionStopPosition"
                  :disabled="!geneChromosome"
                  required
                  suffix="bp"
                  :step="500"
                  :max="maxPosition"
                  :min="1"
                />
              </div>
            </div>
            <div class="col-12 text-center">
              <h2>Comparative Species</h2>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 1"
                  class="configuration-input"
                  v-model="comparativeSpeciesOne" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 2"
                  class="configuration-input"
                  v-model="comparativeSpeciesTwo" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
    <div class="grid">
      <div class="col-12 text-center">
        <Button @click="saveConfigToStoreAndGoToMainScreen" label="Load VCMap" icon="pi pi-play" class="p-button-lg" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import Gene from '@/models/Gene';
import Chromosome from '@/models/Chromosome';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { VERSION } from '@/version';
import { AxiosError } from 'axios';
import { Formatter } from '@/utils/Formatter';

const router = useRouter();
const store = useStore();

const TABS = {
  POSITION: 0,
  GENE: 1
};

const activeTab = ref(TABS.POSITION);

const speciesOptions = ref<Species[]>([]);
const backboneSpecies = ref<Species | null>(null);
const isLoadingSpecies = ref(false);

const geneSuggestions = ref<Gene[]>([]);
const backboneGene = ref<Gene | null>(null);
const geneChromosome = ref<Chromosome | null>(null);
const isLoadingGene = ref(false);
const geneOptionStartPosition = ref<number | null>(0);
const geneOptionStopPosition = ref<number | null>(0);

const chromosomeOptions = ref<Chromosome[]>([]);
const backboneChromosome = ref<Chromosome | null>(null);
const isLoadingChromosome = ref(false);

const startPosition = ref<number | null>(null);
const stopPosition = ref<number | null>(null);
const maxPosition = ref<number | null>(null);

const comparativeSpeciesOne = ref<Species | null>(null);
const comparativeSpeciesTwo = ref<Species | null>(null);

onMounted(prepopulateConfigOptions);

async function searchGene(event: {query: string})
{
  if (backboneSpecies.value == null)
  {
    return;
  }

  isLoadingGene.value = true;
  try
  {
    const matches = await SpeciesApi.getGenesBySymbol(backboneSpecies.value.defaultMapKey, event.query);
    geneSuggestions.value = matches;
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingGene.value = false;
  }
}

async function setChromosomeOptions(event: {value: Species | null})
{
  chromosomeOptions.value = [];
  backboneChromosome.value = null;
  startPosition.value = null;
  stopPosition.value = null;
  maxPosition.value = null;

  if (event.value == null)
  {
    return;
  }

  isLoadingChromosome.value = true;
  try
  {
    const chromosomes = await SpeciesApi.getChromosomes(event.value.defaultMapKey);
    chromosomeOptions.value = chromosomes;
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingChromosome.value = false;
  }
}

// Maybe there is a better way to do this? Based on the v-model this event can either be a Chromosome or null, so need to cast here
function setDefaultStartAndStopPositions(event: {value: Chromosome | null})
{
  const chromosome = event.value;
  startPosition.value = 0;
  stopPosition.value = chromosome?.seqLength ?? 0;
  maxPosition.value = backboneChromosome.value?.seqLength ?? null;
}

async function setGeneChromosomeAndDefaultStartAndStopPositions(event: {value: Gene | null})
{
  const gene = event.value;
  if (gene != null && backboneSpecies.value != null)
  {
    isLoadingChromosome.value = true;
    try
    {
      geneChromosome.value = await SpeciesApi.getChromosomeInfo(gene.chromosome, backboneSpecies.value.defaultMapKey);
    }
    catch (err: any)
    {
      onNetworkError(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }

  geneOptionStartPosition.value = gene?.start ?? 0;
  geneOptionStopPosition.value = gene?.stop ?? 0;
}

async function prepopulateConfigOptions()
{
  activeTab.value = store.getters.getConfigTab;

  isLoadingSpecies.value = true;
  try
  {
    speciesOptions.value = await SpeciesApi.getSpecies();
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingSpecies.value = false;
  }
  
  if (store.getters.getSpecies)
  {
    backboneSpecies.value = store.getters.getSpecies;
    
    isLoadingChromosome.value = true;
    try
    {
      chromosomeOptions.value = await SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey);
    }
    catch (err: any)
    {
      onNetworkError(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }

  if (store.getters.getChromosome)
  {
    backboneChromosome.value = store.getters.getChromosome;
    maxPosition.value = store.getters.getChromosome?.seqLength;
    startPosition.value = store.getters.getStartPosition ?? 0;
    stopPosition.value = store.getters.getStopPosition ?? 0;
  }

  if (store.getters.getGene)
  {
    backboneGene.value = store.getters.getGene;
    geneOptionStartPosition.value = store.getters.getStartPosition ?? 0;
    geneOptionStopPosition.value = store.getters.getStopPosition ?? 0;
    if (!store.getters.getChromosome)
    {
      // If chromosome not present in the store, set it based on the gene
      const chromosome = await SpeciesApi.getChromosomeInfo(store.getters.getGene.chromosome, store.getters.getSpecies.defaultMapKey);
      backboneChromosome.value = chromosome;
    }
    geneChromosome.value = backboneChromosome.value;
  }
  
  // Pre-populate previously selected comparative species
  comparativeSpeciesOne.value = store.getters.getComparativeSpeciesOne;
  comparativeSpeciesTwo.value = store.getters.getComparativeSpeciesTwo;
}

function saveConfigToStoreAndGoToMainScreen()
{
  store.dispatch('setSpecies', backboneSpecies.value);
  if (activeTab.value === TABS.GENE)
  {
    store.dispatch('setGene', backboneGene.value);
    store.dispatch('setChromosome', geneChromosome.value);
    store.dispatch('setStartPosition', geneOptionStartPosition.value);
    store.dispatch('setStopPosition', geneOptionStopPosition.value);
  }
  else if (activeTab.value === TABS.POSITION)
  {
    store.dispatch('setChromosome', backboneChromosome.value);
    store.dispatch('setStartPosition', startPosition.value);
    store.dispatch('setStopPosition', stopPosition.value);
  }
  else
  {
    console.warn('Unknown active tab. State may not be set correctly.');
  }
  store.dispatch('setComparativeSpeciesOne', comparativeSpeciesOne.value);
  store.dispatch('setComparativeSpeciesTwo', comparativeSpeciesTwo.value);
  store.dispatch('setConfigTab', activeTab.value);
  
  router.push('/main');
}

function onNetworkError(err: AxiosError)
{
  console.error(err.response?.data);
}
</script>

<style lang="scss" scoped>
.p-dropdown
{
  width: 100%;
}

.start-button
{
  margin-top: 1em;
}

.configuration-header
{
  display: inline-flex;
  align-items: center;
  .header
  {
    margin-left: 2rem;
  }
}

p.label-description
{
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.config-label
{
  margin-bottom: 0;
}
</style>
