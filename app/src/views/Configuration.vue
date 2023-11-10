<template>
  <div class="configuration-header border-bottom-1 border-bottom-solid">
    <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.png">
    <Tag icon="pi pi-tag" severity="info" rounded>v{{ VERSION }}</Tag>
    <a  class="logo-link" href="https://rgd.mcw.edu/" target="_blank"><img class="rgd-logo" src="../assets/images/rgd_logo.png" alt="RGD logo"></a>
  </div>
  <div class="grid mt-0 text-center">

    <!-- Backbone Column -->
    <div class="col-5 col-offset-1">
      <div class="lg:col-10 md:col-10 sm:col-12">
        <h2>
          Backbone
        </h2>
      </div>
      <div class="lg:col-10 md:col-10 sm:col-12">
        <p class="p-float-label text-left">
          <Dropdown 
            input-id="backbone-species-dropdown"
            v-model="backboneSpecies" 
            :options="speciesOptions" 
            :loading="isLoadingSpecies"
            @change="setAssemblyOptions($event.value)"
            optionLabel="name" />
          <label for="backbone-species-dropdown">Backbone Species</label>
        </p>
      </div>
      <div class="lg:col-10 md:col-10 sm:col-12">
        <p class="p-float-label text-left">
          <Dropdown 
            input-id="backbone-assembly-dropdown"
            v-model="backboneAssembly" 
            :options="backboneAssemblies" 
            :disabled="!backboneSpecies"
            @change="setChromosomeOptions($event.value)"
            :optionLabel="getAssemblyOptionLabel" />
          <label for="backbone-assembly-dropdown">Backbone Assembly</label>
        </p>
      </div>
      <div class="p-fluid grid">
        <div class="col-12 text-left">
          <p style="font-weight: bold;">Load by:</p>
          <div class="flex flex-wrap gap-3">
            <div class="flex align-items-center">
                <RadioButton v-model="activeTab" inputId="load-by-gene" name="Gene" :value=0 />
                <label for="load-by-gene" class="ml-2">Gene</label>
            </div>
            <div class="flex align-items-center">
                <RadioButton v-model="activeTab" inputId="load-by-position" name="Position" :value=1 />
                <label for="load-by-position" class="ml-2">Position</label>
            </div>
            <div class="flex align-items-center">
                <RadioButton v-model="activeTab" inputId="load-by-flanking" name="Flanking Genes" :value=2 />
                <label for="load-by-flanking" class="ml-2">Flanking Genes</label>
            </div>
          </div>
        </div>
        <template v-if="activeTab === TABS.gene">
          <div class="lg:col-10 md:col-10 sm:col-12">
            <div v-if="isLoadingGene">
              <ProgressSpinner style="width:50px;height:50px"/>
            </div>
            <p class="p-float-label">
              <AutoComplete
                input-id="backbone-gene-autocomplete"
                v-model="backboneGene"
                :suggestions="geneSuggestions"
                :disabled="!backboneSpecies"
                @complete="searchGene($event)"
                @item-select="setGeneChromosomeAndDefaultStartAndStopPositions($event.value)"
                :option-label="(gene: Gene) => `${gene.symbol} (Chr${gene.chromosome})`"
                :minLength="3"
              />
              <label for="backbone-gene-autocomplete">Gene Symbol</label>
            </p>
          </div>
          <div class="lg:col-10 md:col-10 sm:col-12">
            <p v-if="geneChromosome" class="label-description">
              Chromosome: {{geneChromosome?.chromosome}} <span v-if="geneChromosome">(Length: {{Formatter.addCommasToBasePair(geneChromosome.seqLength)}} bp)</span>
            </p>
            <p v-if="geneOptionStartPosition" class="label-description" >
              Gene Start: <span v-if="geneOptionStartPosition">{{geneOptionStartPosition}} bp</span>
            </p>
            <p v-if="geneOptionStopPosition" class="label-description">
              Gene Stop: <span>{{geneOptionStopPosition}} bp</span>
            </p>
          </div>
        </template>
        <template v-else-if="activeTab === TABS.position">
          <div class="lg:col-10 md:col-10 sm:col-12">
            <p class="p-float-label text-left">
              <Dropdown 
                input-id="backbone-chromosome-dropdown"
                @change="setDefaultStartAndStopPositions($event.value)" 
                v-model="backboneChromosome"
                :disabled = "!chromosomeOptions.length"
                :options="chromosomeOptions"
                :loading="isLoadingChromosome"
                optionLabel="chromosome"
              />
              <label for="backbone-chromosome-dropdown">Backbone Chromosome</label>
            </p>
          </div>
          <div class="lg:col-10 md:col-10 sm:col-12">
            <p v-if="backboneChromosome" class="p-float-label">
              <InputNumber
                input-id="chromosome-start-input"
                showButtons
                v-model="startPosition"
                :disabled="!backboneChromosome"
                :step="1000"
                :max="(maxPosition != null) ? maxPosition - 1 : 1"
                :min="0"
              />
              <label for="chromosome-start-input">Start Position (Min: 0bp)</label>
            </p>
          </div>
          <div class="lg:col-10 md:col-10 sm:col-12">
            <p v-if="backboneChromosome" class="p-float-label">
              <InputNumber
                input-id="chromosome-stop-position"
                showButtons
                v-model="stopPosition"
                :disabled="!backboneChromosome"
                :step="1000"
                :max="maxPosition ?? undefined"
                :min="1"
              />
              <label for="chromosome-stop-position">Stop Position (Max: {{Formatter.addCommasToBasePair(maxPosition)}}bp)</label>
            </p>
          </div>
        </template>
        <template v-else>
          <div class="lg:col-10 md:col-10 sm:col-12">
            <div v-if="isLoadingGene">
              <ProgressSpinner style="width:50px;height:50px"/>
            </div>
            <div class="col-12">
              <p class="p-float-label">
                <AutoComplete
                  input-id="backbone-gene-1-autocomplete"
                  v-model="flankingGene1"
                  :suggestions="geneSuggestions"
                  :disabled="!backboneSpecies"
                  @complete="searchGene($event)"
                  @item-select="validateFlankingGenesAndSetChromosome"
                  :option-label="(gene: Gene) => `${gene.symbol} (Chr${gene.chromosome})`"
                  :minLength="3"
                />
                <label for="backbone-gene-1-autocomplete">Gene 1</label>
              </p>
              <small v-if="flankingGeneError.length > 0" class="warning-text">{{ flankingGeneError }}</small>
            </div>
            <div class="col-12">
              <p class="p-float-label">
                <AutoComplete
                  input-id="backbone-gene-2-autocomplete"
                  v-model="flankingGene2"
                  :suggestions="geneSuggestions"
                  :disabled="!backboneSpecies"
                  @complete="searchGene($event)"
                  @item-select="validateFlankingGenesAndSetChromosome"
                  :option-label="(gene: Gene) => `${gene.symbol} (Chr${gene.chromosome})`"
                  :minLength="3"
                />
                <label for="backbone-gene-2-autocomplete">Gene 2</label>
              </p>
              <small v-if="flankingGeneError.length > 0" class="warning-text">{{ flankingGeneError }}</small>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Comparative Species Column -->
    <div class="col-6 border-left-1 border-400 mt-2 mb-2">
      <div class="col-10 col-offset-1">
        <h2>
          Comparative Species
        </h2>
      </div>
      <div class="col-11 col-offset-1 text-left">
        <Button
          @click="addTempComparativeSpecies"
          :label="(comparativeSpeciesLimitReached) ? 'Limit Reached' : 'Add Species'"
          :disabled="comparativeSpeciesLimitReached"
          icon="pi pi-plus-circle"
          class="p-button mb-2" />
      </div>
      <p v-if="comparativeSpeciesSelections == null || comparativeSpeciesSelections.length === 0">No comparative species selected...</p>
      <div>
        <Message severity="warn" closeable v-if="comparativeSpeciesSelections.length >= 4">Selecting 4 or more species might cause display errors</Message>
      </div>
      <div class="grid" v-for="(species, index) in comparativeSpeciesSelections" :key="index">
        <div class="lg:col-offset-1 lg:col-4 md:col-5 sm:col-5 text-left">
          <Dropdown 
            v-model="comparativeSpeciesSelections[index].typeKey" 
            :loading="isLoadingSpecies"
            :options="speciesOptions"
            @change="setPrimaryAssembly(index)"
            optionValue="typeKey"
            optionLabel="name" 
            placeholder="Comparative Species"
            />
        </div>
        <div class="lg:col-4 md:col-5 sm:col-5 text-left">
          <Dropdown 
            v-model="comparativeSpeciesSelections[index].mapKey"
            :disabled="comparativeSpeciesSelections[index].typeKey === 0"
            :options="getAssemblyOptionsForSpecies(index)"
            :optionLabel="getAssemblyOptionLabel"
            @change="checkAgainstBackboneSpeciesAndAssembly(comparativeSpeciesSelections[index])"
            optionValue="key"
            placeholder="Comparative Assembly"
            :class="{'border-warning': comparativeSpeciesSelections[index].showWarning}"
            />
          <small v-if="comparativeSpeciesSelections[index].showWarning" class="warning-text">Warning: Selected same species and assembly as the backbone</small>
        </div>
        <div class="lg:col-1 md:col-1 sm:col-1">
          <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
        </div>
      </div>
    </div>

    <div class="col-12 flex flex-wrap gap-3 justify-content-center border-top-1 border-top-solid">
      <Button
        @click="clearConfigSelections"
        label="Clear All"
        class="p-button-sm p-button-secondary" />
      <Button 
        @click="saveConfigToStoreAndGoToMainScreen" 
        :disabled="!isValidConfig"
        label="Load VCMap" 
        icon="pi pi-play" 
        class="p-button-lg p-button-success" />
    </div>
  </div>

  <VCMapDialog v-model:show="showError" header="Error" :message="errorMessage" theme="error" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import GeneApi from '@/api/GeneApi';
import ChromosomeApi from '@/api/ChromosomeApi';
import Species from '@/models/Species';
import Gene from '@/models/Gene';
import SpeciesMap from '@/models/SpeciesMap';
import Chromosome from '@/models/Chromosome';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useLogger } from 'vue-logger-plugin';
import { VERSION } from '@/version';
import { Formatter } from '@/utils/Formatter';
import VCMapDialog from '@/components/VCMapDialog.vue';
import { key } from '@/store';
import { sortGeneMatches } from '@/utils/DataPanelHelpers';
import { ConfigurationMode } from '@/utils/Types';

interface ComparativeSpeciesSelection
{
  typeKey: number;
  mapKey: number;
  showWarning: boolean;
}

const router = useRouter();
const store = useStore(key);
const $log = useLogger();

// Translate from configuration mode to tabs on this page
const TABS: { [key in ConfigurationMode]: number } = {
  gene: 0,
  position: 1,
  flanking: 2,
};

const activeTab = ref(TABS.gene);

const speciesOptions = ref<Species[]>([]);
const backboneSpecies = ref<Species | null>(null);
const isLoadingSpecies = ref(false);
const backboneAssembly = ref<SpeciesMap | null>(null);
const backboneAssemblies = ref<SpeciesMap[]>([]);

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

const flankingGene1 = ref<Gene | null>(null);
const flankingGene2 = ref<Gene | null>(null);
const flankingChromosome = ref<Chromosome | null>(null);
const flankingGeneError = ref<string>('');

const comparativeSpeciesSelections = ref<ComparativeSpeciesSelection[]>([]);

const showError = ref(false);
const errorMessage = ref('');

onMounted(prepopulateConfigOptions);

watch(backboneAssembly, () => {
  comparativeSpeciesSelections.value.forEach(selection => {
    checkAgainstBackboneSpeciesAndAssembly(selection);
  }); 
});

watch(activeTab, async () => {
  await nextTick();
});

const isValidConfig = computed(() => {
  const isCommonConfigValid = backboneSpecies.value && comparativeSpeciesSelections.value.length > 0 && comparativeSpeciesSelections.value.every(s => s.typeKey !== 0 && s.mapKey !== 0);
  if (!isCommonConfigValid)
  {
    return false;
  }

  if (activeTab.value === TABS.position)
  {
    return backboneChromosome.value != null;
  }
  else if (activeTab.value === TABS.gene)
  {
    return geneChromosome.value != null;
  }
  else if (activeTab.value === TABS.flanking)
  {
    return flankingGene1.value != null && flankingGene2.value != null && flankingChromosome.value != null && flankingGeneError.value === '';
  }

  return false;
});

const comparativeSpeciesLimitReached = computed(() => {
  return (comparativeSpeciesSelections.value.length >= 5);
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
    const searchKey = event.query;
    const matches = await GeneApi.getGenesBySymbol(backboneSpecies.value.activeMap.key, backboneSpecies.value.name, searchKey);
    if (matches.length > 0)
    {
      geneSuggestions.value = sortGeneMatches(searchKey, matches);
    }
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
  flankingGene1.value = null;
  flankingGene2.value = null;
  flankingChromosome.value = null;

  if (species == null)
  {
    return;
  }

  backboneAssemblies.value = species.maps;
  backboneAssembly.value = species.activeMap;
  setChromosomeOptions(backboneAssembly.value);
}

async function setChromosomeOptions(map: SpeciesMap | null)
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
  flankingGene1.value = null;
  flankingGene2.value = null;
  flankingChromosome.value = null;

  if (map == null)
  {
    return;
  }

  isLoadingChromosome.value = true;
  try
  {
    const chromosomes = await ChromosomeApi.getChromosomes(map.key);
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
      geneChromosome.value = await ChromosomeApi.getChromosomeInfo(gene.chromosome, backboneSpecies.value.activeMap.key);
    }
    catch (err: any)
    {
      onApiError(err, 'An error occurred while getting chromosome data for the gene');
    }
  }

  geneOptionStartPosition.value = gene?.start ?? 0;
  geneOptionStopPosition.value = gene?.stop ?? 0;
}

async function validateFlankingGenesAndSetChromosome()
{
  if (flankingGene1.value == null || flankingGene2.value == null || backboneSpecies.value == null) {
    return;
  }

  if (flankingGene1.value && flankingGene2.value && flankingGene1.value.chromosome !== flankingGene2.value.chromosome) {
    flankingGeneError.value = 'Genes must belong to the same chromosome';
    return;
  }

  flankingGeneError.value = '';
  try
  {
    flankingChromosome.value = await ChromosomeApi.getChromosomeInfo(flankingGene1.value.chromosome, backboneSpecies.value.activeMap.key);
  }
  catch (err: any)
  {
    onApiError(err, 'An error occurred while getting chromosome data for the gene');
  }
}

async function prepopulateConfigOptions()
{
  store.dispatch('setConfigurationLoaded', null);

  activeTab.value = TABS[store.state.configMode];
  isLoadingSpecies.value = true;
  const backboneSelection = store.state.selectedBackboneRegion;
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

  if (speciesOptions.value.length === 0 || store.state.species == null)
  {
    return;
  }
  
  // Avoiding setting the exact object from the store to our ref variable so that it doesn't get mutated on accident
  const prevSpecies = store.state.species;
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
    chromosomeOptions.value = await ChromosomeApi.getChromosomes(backboneAssembly.value.key);
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

  if (store.state.chromosome)
  {
    // Avoiding setting the exact object from the store to our ref variable so that it doesn't get mutated on accident
    const prevChromosome = store.state.chromosome;
    backboneChromosome.value = chromosomeOptions.value.filter(c => c.chromosome === prevChromosome.chromosome)[0] ?? null;

    if (backboneChromosome.value != null)
    {
      maxPosition.value = prevChromosome.seqLength;
      startPosition.value = store.state.startPos ?? 0;
      stopPosition.value = store.state.stopPos ?? 0;
    }
  }

  if (store.state.gene)
  {
    const prevGene = store.state.gene;
    backboneGene.value = (prevGene.speciesName === backboneSpecies.value.name) ? prevGene : null;
    if (backboneSelection != null && backboneSelection.chromosome.seqLength > 0 && 0 <= prevGene.start && backboneSelection.chromosome.seqLength >= prevGene.stop)
    {
      // If user's last selection included this gene
      geneOptionStartPosition.value = store.state.startPos ?? 0;
      geneOptionStopPosition.value = store.state.stopPos ?? 0;
    }
    else
    {
      // No previous selection or user's last selected region did not encompass the gene, default to gene start/stop
      geneOptionStartPosition.value = prevGene.start;
      geneOptionStopPosition.value = prevGene.stop;
    }

    if (!store.state.chromosome && backboneSpecies.value != null)
    {
      // If chromosome not present in the store, set it based on the gene
      const chromosome = await ChromosomeApi.getChromosomeInfo(prevGene.chromosome, backboneAssembly.value.key);
      backboneChromosome.value = chromosome;
    }
    geneChromosome.value = backboneChromosome.value;
  }

  if (store.state.flankingGene1 && store.state.flankingGene2)
  {
    flankingGene1.value = store.state.flankingGene1;
    flankingGene2.value = store.state.flankingGene2;

    if (!store.state.chromosome && backboneSpecies.value != null)
    {
      // If chromosome not present in the store, set it based on the gene
      const chromosome = await ChromosomeApi.getChromosomeInfo(flankingGene1.value.chromosome, backboneAssembly.value.key);
      backboneChromosome.value = chromosome;
    }
    flankingChromosome.value = backboneChromosome.value;
  }
  
  // Pre-populate previously selected comparative species
  if (store.state.comparativeSpecies)
  {
    const prevComparativeSpecies = store.state.comparativeSpecies;
    const selections: ComparativeSpeciesSelection[] = [];
    prevComparativeSpecies.forEach(s => {
      selections.push({
        typeKey: s.typeKey, 
        mapKey: (s.activeMap) ? s.activeMap.key : s.defaultMapKey,
        showWarning: false,
      });
    });
    comparativeSpeciesSelections.value = selections;
    comparativeSpeciesSelections.value.forEach(selection => checkAgainstBackboneSpeciesAndAssembly(selection));
  }
}

function saveConfigToStoreAndGoToMainScreen()
{
  // Set the selected assembly as the active map on the species
  if (backboneSpecies.value != null && backboneAssembly.value != null)
  {
    backboneSpecies.value.activeMap = backboneAssembly.value;
  }

  clearPriorBackboneSelectionIfNecessary();

  store.dispatch('setSpecies', backboneSpecies.value);
  // Always reset loaded genes before loading VCMap
  store.dispatch('setLoadedGenes', null);
  if (activeTab.value === TABS.gene)
  {
    store.dispatch('setGene', backboneGene.value);
    store.dispatch('setChromosome', geneChromosome.value);
    // If loading by gene, set the selectedGeneIds based on search, and selected data panel
    store.dispatch('setSelectedGeneIds', [backboneGene.value?.rgdId] || []);

    // Clear out data for any other load types:
    store.dispatch('setStartPosition', null);
    store.dispatch('setStopPosition', null);
    store.dispatch('setFlankingGenes', [null, null]);
  }
  else if (activeTab.value === TABS.position)
  {
    store.dispatch('setChromosome', backboneChromosome.value);
    store.dispatch('setStartPosition', startPosition.value ?? 0);
    store.dispatch('setStopPosition', stopPosition.value ?? backboneChromosome.value?.seqLength);
    // If loading by position, make sure selectedGeneIds is empty
    store.dispatch('setSelectedGeneIds', []);

    // Clear out data for any other load types:
    store.dispatch('setGene', null);
    store.dispatch('setFlankingGenes', [null, null]);
  }
  else if (activeTab.value === TABS.flanking)
  {
    store.dispatch('setChromosome', flankingChromosome.value);
    store.dispatch('setFlankingGenes', [flankingGene1.value, flankingGene2.value]);

    // Clear out data for any other load types:
    store.dispatch('setSelectedGeneIds', [flankingGene1.value?.rgdId, flankingGene2.value?.rgdId]);
    store.dispatch('setStartPosition', null);
    store.dispatch('setStopPosition', null);
    store.dispatch('setGene', null);
  }
  else
  {
    $log.warn('Unknown active tab. State may not be set correctly.');
  }

  // Make copies of the selected comparative species/assemblies from our available options and push them onto an array before saving them to the store
  const comparativeSpecies: Species[] = [];
  comparativeSpeciesSelections.value.forEach(s => {
    if (s.typeKey === 0)
    {
      return;
    }

    for (let i = 0; i < speciesOptions.value.length; i++)
    {
      if (speciesOptions.value[i].typeKey === s.typeKey)
      {
        const selectedSpecies = speciesOptions.value[i].copy();
        for (let j = 0; j < selectedSpecies.maps.length; j++)
        {
          if (selectedSpecies.maps[j].key === s.mapKey)
          {
            selectedSpecies.activeMap = selectedSpecies.maps[j];
            break;
          }
        }
        comparativeSpecies.push(selectedSpecies);
        break;
      }
    }
  });

  store.dispatch('setComparativeSpecies', comparativeSpecies);
  store.dispatch('setConfigMode', getConfigModeFromActiveTab(activeTab.value));
  store.dispatch('setConfigurationLoaded', null);

  router.push('/main');
}

function getConfigModeFromActiveTab(tabValue: number): ConfigurationMode
{
  for (const mode in TABS)
  {
    if (TABS[mode as ConfigurationMode] === tabValue)
    {
      return mode as ConfigurationMode;
    }
  }

  return 'gene';
}

function clearPriorBackboneSelectionIfNecessary()
{
  // If species or assembly has changed, or if start and stop are not defined from a previous configuration
  if (
    store.state.species?.typeKey !== backboneSpecies.value?.typeKey
    || store.state.species?.activeMap.key !== backboneSpecies.value?.activeMap.key
    || store.state.startPos == null
    || store.state.stopPos == null
  )
  {
    store.dispatch('clearBackboneSelection');
    return;
  }

  // If loading by gene and the chromosome, start, or stop positions are different from a previous configuration
  if (activeTab.value === TABS.gene
    && (store.state.chromosome?.chromosome !== geneChromosome.value?.chromosome
      || store.state.startPos !== geneOptionStartPosition.value
      || store.state.stopPos !== geneOptionStopPosition.value))
  {
    store.dispatch('clearBackboneSelection');
    return;
  }
  
  // If loading by position and the chromosome, start, or stop positions are different from a previous configuration
  if (activeTab.value === TABS.position 
    && (store.state.chromosome?.chromosome !== backboneChromosome.value?.chromosome
      || store.state.startPos !== startPosition.value
      || store.state.stopPos !== stopPosition.value))
  {
    store.dispatch('clearBackboneSelection');
    return;
  }

  // If loading by flanking genes and the chromosome has changed, or the start/stop positions from the previous configuration
  // are not within the range of the flanking genes
  if (activeTab.value === TABS.flanking
    && (
      (flankingGene1.value == null || flankingGene2.value == null)
      || (
        (store.state.chromosome?.chromosome !== flankingChromosome.value?.chromosome
        || store.state.startPos <= Math.min(flankingGene1.value.start, flankingGene2.value.start)
        || store.state.stopPos >= Math.max(flankingGene1.value.stop, flankingGene2.value.stop))
      )
    )
  )
  {
    store.dispatch('clearBackboneSelection');
    return;
  }
}

function onApiError(err: any, userMessage: string)
{
  $log.error(err);
  errorMessage.value = userMessage;
  showError.value = true;
}

function addTempComparativeSpecies()
{
  let currLength = comparativeSpeciesSelections.value.length;
  if (currLength < 5)
  {
    comparativeSpeciesSelections.value.push({ typeKey: 0, mapKey: 0, showWarning: false });
  }
}

function removeTempComparativeSpecies(index: number)
{
  comparativeSpeciesSelections.value.splice(index, 1);
}

function getAssemblyOptionsForSpecies(index: number)
{
  if (comparativeSpeciesSelections.value.length <= index)
  {
    return [];
  }

  for (let i = 0; i < speciesOptions.value.length; i++)
  {
    if (speciesOptions.value[i].typeKey === comparativeSpeciesSelections.value[index].typeKey)
    {
      return speciesOptions.value[i].maps;
    }
  }

  return [];
}

function getAssemblyOptionLabel(assembly: SpeciesMap)
{
  return assembly.primaryRefAssembly ? `${assembly.name} (primary)` : assembly.name;
}

function setPrimaryAssembly(index: number)
{
  let selectedSpecies: Species | undefined;
  for (let i = 0; i < speciesOptions.value.length; i++)
  {
    if (speciesOptions.value[i].typeKey === comparativeSpeciesSelections.value[index].typeKey)
    {
      selectedSpecies = speciesOptions.value[i];
      break;
    }
  }

  if (selectedSpecies != null)
  {
    comparativeSpeciesSelections.value[index].mapKey = selectedSpecies.defaultMapKey;
  }

  checkAgainstBackboneSpeciesAndAssembly(comparativeSpeciesSelections.value[index]);
}

function checkAgainstBackboneSpeciesAndAssembly(selection: ComparativeSpeciesSelection)
{
  if (backboneSpecies.value != null && backboneAssembly.value != null && selection.typeKey === backboneSpecies.value.typeKey && selection.mapKey === backboneAssembly.value.key)
  {
    selection.showWarning = true;
  }
  else
  {
    selection.showWarning = false;
  }
}

function clearConfigSelections()
{
  backboneSpecies.value = null;
  backboneAssembly.value = null;
  backboneChromosome.value = null;
  backboneGene.value = null;
  geneChromosome.value = null;
  startPosition.value = null;
  stopPosition.value = null;
  maxPosition.value = null;
  geneOptionStartPosition.value = null;
  geneOptionStopPosition.value = null;
  comparativeSpeciesSelections.value = [];
  chromosomeOptions.value = [];
  flankingGene1.value = null;
  flankingGene2.value = null;

  store.dispatch('clearConfiguration');
}
</script>

<style lang="scss" scoped>
$warning-color: #a3852b;

.p-dropdown.p-component
{
  width: 100%;
  &.border-warning
  {
    border-color: $warning-color;
  }
}

.warning-text
{
  color: $warning-color
}

.configuration-header
{
  display: flex;
  align-items: center;
  .header
  {
    margin-left: 2rem;
  }
  .rgd-logo {
    margin-left: auto;
    width: 70%;
  }
  .logo-link {
    margin-left: auto;
  }
}

p.label-description
{
  margin: 0 0 0.5rem 0;
  font-style: italic;
}
</style>
