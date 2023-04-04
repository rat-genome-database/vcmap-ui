import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import { GeneDatatrack } from '@/models/DatatrackSection';

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

// FIXME: This method will need to be reworked once we decide how to grab orthologs for a specific gene 
function getGeneOrthologData(store: Store<VCMapState>, gene: Gene) 
{
  const masterGeneMapByRGDId = store.getters.masterGeneMapByRGDId as Map<number, GeneDatatrack[]>;
  const geneDatatracks = masterGeneMapByRGDId?.get(gene.rgdId);

  const selectedDataList: SelectedData[] = [];
  const rgdIds: number[] = [];

  if (!geneDatatracks)
  {
    return {
      rgdIds: rgdIds, 
      selectedData: selectedDataList 
    };
  }

  selectedDataList.push(new SelectedData(gene, 'Gene'));

  rgdIds.push(gene.rgdId);

  // If the gene has orthologs, add them to the selected data
  const geneOrthos = geneDatatracks[0].gene.orthologs;
  if (geneOrthos) {
    const geneValues = Object.values(geneOrthos);
    geneValues.forEach( (rgdIdx: any) => {
        const orthologGenes = masterGeneMapByRGDId?.get(rgdIdx[0]);
        orthologGenes?.forEach(geneDatatrack => {
          selectedDataList.push(new SelectedData(geneDatatrack.gene, 'Gene'));
        });
        rgdIds.push(rgdIdx[0]);
      });
    } else if (!Array.isArray(gene.orthologs)) {
      const geneValues = Object.values(gene.orthologs);
      geneValues.forEach( (rgdIdx: any) => {
          const orthologGenes = masterGeneMapByRGDId?.get(rgdIdx[0]);
          orthologGenes?.forEach(geneDatatrack => {
            selectedDataList.push(new SelectedData(geneDatatrack.gene, 'Gene'));
          });
          rgdIds.push(rgdIdx[0]);
        });
      }
  
  if (gene.orthologs.length > 0)
  {
    gene.orthologs.forEach((rgdId: number) => {
      const orthologGenes = masterGeneMapByRGDId?.get(rgdId);
      orthologGenes?.forEach(geneDatatrack => {
        const orthos = geneDatatrack.gene.orthologs;

        // Backbone gene might have multiple orthos to check
        if (orthos) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const [key, value] of Object.entries(orthos)) {
            if (Number(`${value}`) !== gene.rgdId) {
              const newOrthoData = masterGeneMapByRGDId?.get(Number(`${value}`));
              newOrthoData?.forEach(geneDatatrack => {
                selectedDataList.push(new SelectedData(geneDatatrack.gene, 'Gene'));
              });
              rgdIds.push(Number(`${value}`));
            }
          }
        }

        selectedDataList.push(new SelectedData(geneDatatrack.gene, 'Gene'));
      });
      rgdIds.push(rgdId);
    });
  }

  return {
    rgdIds: rgdIds, 
    selectedData: selectedDataList
  };
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
