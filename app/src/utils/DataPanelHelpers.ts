import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import { GeneDatatrack } from '@/models/DatatrackSection';


export function getNewSelectedData(store: Store<VCMapState>, gene: Gene): {rgdIds: number[], selectedData: SelectedData[] } {
  const comparativeSpecies = store.state.comparativeSpecies;
  const compSpeciesNameMap = new Map<Number, string>();

  comparativeSpecies.forEach((species: any) => compSpeciesNameMap.set(species.activeMap.key, species.name));
 
  const allOrthologInfo = getGeneOrthologData(store, gene);
  return {rgdIds: allOrthologInfo.rgdIds, selectedData: allOrthologInfo.selectedData};
}

export function sortGeneList(geneList: Gene[]) {
  // for combined or hiddent gene lists, sort LOC
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