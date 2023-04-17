import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import { GeneDatatrack } from '@/models/DatatrackSection';
import { OrthologPair } from '@/models/OrthologLine';


const SEARCHED_GENE_WINDOW_FACTOR = 6;

export function getNewSelectedData(store: Store<VCMapState>, gene: Gene): { rgdIds: number[], selectedData: SelectedData[] } {
  const comparativeSpecies = store.state.comparativeSpecies;
  const compSpeciesNameMap = new Map<Number, string>();

  comparativeSpecies.forEach(species => compSpeciesNameMap.set(species.activeMap.key, species.name));
 
  //const allOrthologInfo = getGeneOrthologData(store, gene);
  return {rgdIds: [gene.rgdId], selectedData: []};
}

export function sortGeneList(geneList: Gene[]) {
  // for combined or hidden gene lists, sort LOC
  // genes to end of list, otherwise sort alphabetically
  geneList.sort((geneA, geneB) => {
    const isGeneALOC = geneA.symbol.startsWith('LOC') || false;
    const isGeneBLOC = geneB.symbol.startsWith('LOC') || false;
    if (isGeneALOC && isGeneBLOC) {
      const geneASymbol = geneA.symbol.toLowerCase() || '';
      const geneBSymbol = geneB.symbol.toLowerCase() || '';
      return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
    }
    else if (isGeneALOC) {
      return 1;
    }
    else if (isGeneBLOC) {
      return -1;
    }
    const geneASymbol = geneA.symbol.toLowerCase() || '';
    const geneBSymbol = geneB.symbol.toLowerCase() || '';
    return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
  });
}

export function adjustSelectionWindow(searchedGene: Gene, geneList: Map<number, Gene>, store: Store<VCMapState>)
{
  // const loadedGenes = store.state.loadedGenes;

  // New start and stop will be +/- some multiple of the gene's length (currently 2x)
  const geneBasePairLength = searchedGene.stop - searchedGene.start;
  // Take the max of new start position, and selected region's original start
  // to avoid jumping to outside of loaded region
  const newInnerStart = Math.max(Math.floor(searchedGene.start
    - SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), 0);
  // Take min of new stop and selected regions original stop
  const newInnerStop = Math.min(Math.floor(searchedGene.stop
    + SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), store.state.chromosome?.seqLength ?? newInnerStart);
  //get orthologs for backbone gene, and determine the relative highest and lowest positioned genes to reset the window
  const reframeGenes: Gene[] = [];

  if (searchedGene.orthologs)
  {
    searchedGene.orthologs.forEach((orthologId: number) => {
      const ortholog = geneList.get(orthologId);
      if (ortholog)
      {
        reframeGenes.push(ortholog);
      }
    });
  }

  if (reframeGenes.length > 0)
  {  
    reframeGenes.push(searchedGene);
    reframeGenes.sort((a, b) => a.backboneStart - b.backboneStart );

    const newStart = Math.max(Math.floor(reframeGenes[0].backboneStart - SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), 0);
    const newStop = Math.min(Math.floor(reframeGenes[reframeGenes.length - 1].backboneStop + SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), store.state.chromosome?.seqLength ?? newStart);

    return { start: newStart, stop: newStop };
  }
  else
  {
    return { start: newInnerStart, stop: newInnerStop };
  }
}

export function sortGeneMatches(searchKey: any, partialMatches: Gene[])
{ 
  searchKey = searchKey.toLowerCase();

  return partialMatches.sort((a, b) => {
    const distanceA = levenshteinDistance(searchKey, a.symbol.toLowerCase());
    const distanceB = levenshteinDistance(searchKey, b.symbol.toLowerCase());
    return distanceA - distanceB;
  });
}

function levenshteinDistance(str1: string, str2: string) 
{
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) 
  {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) 
  {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) 
  {
    for (let i = 1; i <= str1.length; i++) 
    {
      if (str2.charAt(j - 1) === str1.charAt(i - 1)) 
      {
        matrix[j][i] = matrix[j - 1][i - 1];
      } 
      else 
      {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
