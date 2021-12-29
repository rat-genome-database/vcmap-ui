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
                <h4>Species</h4>
                <Dropdown 
                  v-model="backboneSpecies" 
                  :options="speciesOptions" 
                  :loading="isLoadingSpecies"
                  @change="setAssemblyOptions($event.value)"
                  optionLabel="name"
                  placeholder="Backbone Species" />
              </div>
            </div>

            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Assembly</h4>
                <Dropdown 
                  v-model="backboneAssembly" 
                  :options="backboneAssemblies" 
                  :disabled="!backboneSpecies"
                  @change="setChromosomeOptions($event.value)"
                  :optionLabel="(assembly: Map) => assembly.primaryRefAssembly ? `${assembly.name} (primary)` : assembly.name" 
                  placeholder="Backbone Assembly" />
              </div>
            </div>
            
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Chromosome</h4>
                <Dropdown 
                  @change="setDefaultStartAndStopPositions($event.value)" 
                  v-model="backboneChromosome"
                  :disabled = "!chromosomeOptions.length"
                  :options="chromosomeOptions"
                  :loading="isLoadingChromosome"
                  optionLabel="chromosome"
                  />
              </div>
            </div>
            <div class="p-fluid grid">
              <div class="lg:col-3 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 :class="{'config-label': backboneChromosome}">Start Position</h4>
                <p v-if="backboneChromosome" class="label-description">Min: 0bp</p>
                <InputNumber
                  showButtons
                  v-model="startPosition"
                  :disabled="!backboneChromosome"
                  suffix="bp"
                  :step="500"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="0"
                />
              </div>
              <div class="lg:col-3 md:col-3 sm:col-5">
                <div>
                  <h4 :class="{'config-label': backboneChromosome}">Stop Position</h4>
                  <p v-if="maxPosition" class="label-description">Max: {{Formatter.addCommasToBasePair(maxPosition)}}bp</p>
                  <InputNumber
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
            </div>
            <div class="col-12 text-center">
              <h2>Comparative Species</h2>
            </div>
            <div class="col-12 text-center">
              <Button @click="addTempComparativeSpecies" label="Add Species" icon="pi pi-plus-circle" class="p-button" style="margin-right: .5em"/>
            </div>
            <div class="col-6 col-offset-3 text-center">
              <Message severity="warn" closeable v-if="comparativeSpecies.length >= 3">Selecting 3 or more species might cause display errors</Message>
            </div>
            <div class="grid" v-for="(species, index) in comparativeSpecies" :key="index">
              <div class="lg:col-5 lg:col-offset-3 md:col-6 md:col-offset-2 sm:col-8 sm:col-offset-1">
                <Dropdown 
                  v-model="comparativeSpecies[index]" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
              <div class="lg:col-1 md:col-2 sm:col-2">
                <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
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
                  @change="setAssemblyOptions($event.value)"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Backbone Assembly</h4>
                <Dropdown 
                  v-model="backboneAssembly" 
                  :options="backboneAssemblies" 
                  :disabled="!backboneSpecies"
                  @change="setChromosomeOptions($event.value)"
                  :optionLabel="(assembly: Map) => assembly.primaryRefAssembly ? `${assembly.name} (primary)` : assembly.name" 
                  placeholder="Backbone Assembly" />
              </div>
            </div>
            <div class="p-fluid grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Gene Symbol</h4>
                <div v-if="isLoadingGene">
                  <ProgressSpinner style="width:50px;height:50px"/>
                </div>
                <AutoComplete
                  v-model="backboneGene"
                  :suggestions="geneSuggestions"
                  :disabled="!backboneSpecies"
                  @complete="searchGene($event)"
                  @item-select="setGeneChromosomeAndDefaultStartAndStopPositions($event.value)"
                  field="symbol"
                  :minLength="3"
                />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <p class="label-description">Chromosome: {{geneChromosome?.chromosome}} <span v-if="geneChromosome">(Length: {{Formatter.addCommasToBasePair(maxPosition)}}bp)</span></p>
              </div>
            </div>
            <div class="p-fluid grid">
              <div class="lg:col-3 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 :class="{'config-label': backboneGene}">Upstream Length</h4>
                <p v-if="backboneGene" class="label-description">Gene Start: {{Formatter.addCommasToBasePair(backboneGene.start)}}bp</p>
                <InputNumber
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
              <div class="lg:col-3 md:col-3 sm:col-5">
                <h4 :class="{'config-label': backboneGene}">Downstream Length</h4>
                <p v-if="backboneGene" class="label-description">Gene Stop: {{Formatter.addCommasToBasePair(backboneGene.stop)}}bp</p>
                <InputNumber
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
            <div class="col-12 text-center">
              <Button @click="addTempComparativeSpecies" label="Add Species" icon="pi pi-plus-circle" class="p-button" style="margin-right: .5em"/>
            </div>
            <div class="grid" v-for="(species, index) in comparativeSpecies" :key="index">
              <div class="lg:col-5 lg:col-offset-3 md:col-6 md:col-offset-2 sm:col-8 sm:col-offset-1">
                <Dropdown
                  v-model="comparativeSpecies[index]" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
              <div class="lg:col-1 md:col-2 sm:col-2">
                <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
    <div class="grid">
      <div class="col-12 text-center">
        <Button 
          @click="saveConfigToStoreAndGoToMainScreen" 
          :disabled="!isValidConfig"
          label="Load VCMap" 
          icon="pi pi-play" 
          class="p-button-lg" />
      </div>
    </div>
  </div>
  <VCMapDialog v-model:show="showError" header="Error" :message="errorMessage" theme="error" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import Gene from '@/models/Gene';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { VERSION } from '@/version';
import { Formatter } from '@/utils/Formatter';
import VCMapDialog from '@/components/VCMapDialog.vue';

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
const backboneAssembly = ref<Map | null>(null);
const backboneAssemblies = ref<Map[]>([]);

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
//numbers represent placeholder values until a species is selected.  On submit all nonSpecies values are removed
let comparativeSpecies = ref<Species[] | Number[]>([]);

const showError = ref(false);
const errorMessage = ref('');

onMounted(prepopulateConfigOptions);

const isValidConfig = computed(() => {
  const isCommonConfigValid = backboneSpecies.value && comparativeSpecies.value.length > 0;
  if (!isCommonConfigValid)
  {
    return false;
  }

  if (activeTab.value === TABS.POSITION)
  {
    return backboneChromosome.value;
  }
  else if (activeTab.value === TABS.GENE)
  {
    return geneChromosome.value;
  }

  return false;
});

async function searchGene(event: {query: string})
{
  if (backboneSpecies.value == null)
  {
    return;
  }

  isLoadingGene.value = true;
  try
  {
    const matches = await SpeciesApi.getGenesBySymbol(backboneSpecies.value.activeMap.key, event.query);
    geneSuggestions.value = matches;
  }
  catch (err: any)
  {
    onApiError(err, 'An error occurred while looking up genes');
  }
  finally
  {
    isLoadingGene.value = false;
  }
}

function setAssemblyOptions(species: Species | null)
{
  // Clear out all fields that rely on backbone assembly
  backboneAssembly.value = null;
  backboneAssemblies.value = [];
  chromosomeOptions.value = [];
  backboneChromosome.value = null;
  startPosition.value = null;
  stopPosition.value = null;
  maxPosition.value = null;
  backboneGene.value = null;
  geneChromosome.value = null;
  geneOptionStartPosition.value = null;
  geneOptionStopPosition.value = null;

  if (species == null)
  {
    return;
  }

  backboneAssemblies.value = species.maps;
  backboneAssembly.value = species.activeMap;
}

async function setChromosomeOptions(map: Map | null)
{
  // Clear out all fields that rely on chromosome selection
  chromosomeOptions.value = [];
  backboneChromosome.value = null;
  startPosition.value = null;
  stopPosition.value = null;
  maxPosition.value = null;
  backboneGene.value = null;
  geneChromosome.value = null;
  geneOptionStartPosition.value = null;
  geneOptionStopPosition.value = null;

  if (map == null)
  {
    return;
  }

  isLoadingChromosome.value = true;
  try
  {
    const chromosomes = await SpeciesApi.getChromosomes(map.key);
    chromosomeOptions.value = chromosomes;
  }
  catch (err: any)
  {
    onApiError(err, 'An error occurred while looking up chromosomes for the selected backbone species');
  }
  finally
  {
    isLoadingChromosome.value = false;
  }

  if (chromosomeOptions.value.length > 0)
  {
    backboneChromosome.value = chromosomeOptions.value[0];
    setDefaultStartAndStopPositions(backboneChromosome.value);
  }
}

function setDefaultStartAndStopPositions(chromosome: Chromosome | null)
{
  startPosition.value = 0;
  stopPosition.value = chromosome?.seqLength ?? 0;
  maxPosition.value = backboneChromosome.value?.seqLength ?? null;
}

async function setGeneChromosomeAndDefaultStartAndStopPositions(gene: Gene | null)
{
  if (gene != null && backboneSpecies.value != null)
  {
    try
    {
      geneChromosome.value = await SpeciesApi.getChromosomeInfo(gene.chromosome, backboneSpecies.value.activeMap.key);
    }
    catch (err: any)
    {
      onApiError(err, 'An error occurred while getting chromosome data for the gene');
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
    onApiError(err, 'An error occurred while looking up the available species');
  }
  finally
  {
    isLoadingSpecies.value = false;
  }

  if (speciesOptions.value.length === 0 || store.getters.getSpecies == null)
  {
    return;
  }
  
  // Avoiding setting the exact object from the store to our ref variable so that it doesn't get mutated on accident
  const prevSpecies = (store.getters.getSpecies as Species);
  backboneSpecies.value = speciesOptions.value.filter(s => s.typeKey === prevSpecies.typeKey)[0] ?? null;
  
  // If no species selected by default, keep all other fields blank and bail
  if (backboneSpecies.value == null)
  {
    return;
  }

  // Prefill backbone maps (assemblies)
  backboneAssemblies.value = backboneSpecies.value.maps;
  if (backboneAssemblies.value.length === 0)
  {
    return;
  }
  const prevMapKey = prevSpecies.activeMap ? prevSpecies.activeMap.key : prevSpecies.defaultMapKey;
  backboneAssembly.value = backboneAssemblies.value.filter(a => a.key === prevMapKey)[0] ?? null;

  // A backbone species is selected by default, so look up their chromosomes using the active map (assembly)
  if (backboneAssembly.value == null)
  {
    return;
  }

  isLoadingChromosome.value = true;
  try
  {
    chromosomeOptions.value = await SpeciesApi.getChromosomes(backboneAssembly.value.key);
  }
  catch (err: any)
  {
    onApiError(err, 'An error occurred while looking up chromosomes for the selected backbone species');
  }
  finally
  {
    isLoadingChromosome.value = false;
  }

  if (chromosomeOptions.value.length === 0)
  {
    return;
  }

  if (store.getters.getChromosome)
  {
    // Avoiding setting the exact object from the store to our ref variable so that it doesn't get mutated on accident
    const prevChromosome = store.getters.getChromosome as Chromosome;
    backboneChromosome.value = chromosomeOptions.value.filter(c => c.chromosome === prevChromosome.chromosome)[0] ?? null;

    if (backboneChromosome.value != null)
    {
      maxPosition.value = prevChromosome.seqLength;
      startPosition.value = store.getters.getStartPosition ?? 0;
      stopPosition.value = store.getters.getStopPosition ?? 0;
    }
  }

  if (store.getters.getGene)
  {
    const prevGene = store.getters.getGene as Gene;
    backboneGene.value = prevGene;
    geneOptionStartPosition.value = store.getters.getStartPosition ?? 0;
    geneOptionStopPosition.value = store.getters.getStopPosition ?? 0;
    if (!store.getters.getChromosome && backboneSpecies.value != null)
    {
      // If chromosome not present in the store, set it based on the gene
      const chromosome = await SpeciesApi.getChromosomeInfo(prevGene.chromosome, backboneAssembly.value.key);
      backboneChromosome.value = chromosome;
    }
    geneChromosome.value = backboneChromosome.value;
  }
  
  // Pre-populate previously selected comparative species
  if (store.getters.getComparativeSpecies)
  {
    // Avoiding setting the exact object from the store to our ref variable so that it doesn't get mutated on accident
    const prevComparativeSpecies = store.getters.getComparativeSpecies as Species[];
    const tempSpecies: Species[] = [];
    for (let i = 0; i < prevComparativeSpecies.length; i++)
    {
      for (let j = 0; j < speciesOptions.value.length; j++)
      {
        if (prevComparativeSpecies[i].typeKey === speciesOptions.value[j].typeKey)
        {
          tempSpecies.push(speciesOptions.value[j]);
        }
      }
    }
    comparativeSpecies.value = tempSpecies;
  }
}

function saveConfigToStoreAndGoToMainScreen()
{
  // Set the selected assembly as the active map on the species
  if (backboneSpecies.value != null && backboneAssembly.value != null)
  {
    backboneSpecies.value.activeMap = backboneAssembly.value;
  }
  store.dispatch('setSpecies', backboneSpecies.value);
  if (activeTab.value === TABS.GENE)
  {
    store.dispatch('setGene', backboneGene.value);
    store.dispatch('setChromosome', geneChromosome.value);
    store.dispatch('setStartPosition', geneOptionStartPosition.value ?? backboneGene.value?.start);
    store.dispatch('setStopPosition', geneOptionStopPosition.value ?? backboneGene.value?.stop);
  }
  else if (activeTab.value === TABS.POSITION)
  {
    store.dispatch('setChromosome', backboneChromosome.value);
    store.dispatch('setStartPosition', startPosition.value ?? 0);
    store.dispatch('setStopPosition', stopPosition.value ?? backboneChromosome.value?.seqLength);
    store.dispatch('setGene', null);
  }
  else
  {
    console.warn('Unknown active tab. State may not be set correctly.');
  }

  for (let index = 0; index < comparativeSpecies.value.length; index++)
  {
    if (typeof comparativeSpecies.value[index] === 'number')
    {
      comparativeSpecies.value.splice(index, 1);
      index--;
    }
  }
  store.commit('comparativeSpecies', comparativeSpecies.value);
  store.dispatch('setConfigTab', activeTab.value);

  router.push('/main');
}

function onApiError(err: any, userMessage: string)
{
  console.error(err);
  errorMessage.value = userMessage;
  showError.value = true;
}

function addTempComparativeSpecies()
{
  let currLength = comparativeSpecies.value.length;
  if (currLength < 5)
  {
    comparativeSpecies.value.push(currLength + 1);
  }
}

function removeTempComparativeSpecies(index: number)
{
  comparativeSpecies.value.splice(index, 1);
}


/* function resetStore() {
  store.dispatch('setSpecies', null);
  store.dispatch('setMap', null);
  store.dispatch('setChromosomeNum', null);
  store.dispatch('setChromosome', null);
} */
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
