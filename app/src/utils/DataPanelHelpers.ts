import Gene from '@/new_models/Gene';
import SelectedData from '@/models/SelectedData';
import { Store } from "vuex";
import { VCMapState } from "@/store";
import TrackSection from '@/models/TrackSection';
import DatatrackSection from '@/new_models/DatatrackSection';
// Util methods to help process and update selection info
export function getGeneOrthologIds(store: Store<VCMapState>, gene: Gene) {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[] = [];
  if (geneOrthologs) {
    geneOrthologIds = Object.keys(geneOrthologs).map((geneKey) => geneOrthologs[geneKey][0].geneRgdId);
  }
  return geneOrthologIds;
}

export function getNewSelectedData(store: Store<VCMapState>, gene: Gene): {rgdIds: number[], selectedData: SelectedData[] } {
  const comparativeSpecies = store.state.comparativeSpecies;
  const compSpeciesNameMap = new Map<Number, string>();

  comparativeSpecies.forEach((species: any) => compSpeciesNameMap.set(species.activeMap.key, species.name));
 
  const allOrthologInfo = getGeneOrthologData(store, gene);
  return {rgdIds: allOrthologInfo.rgdIds, selectedData: allOrthologInfo.selectedData};
}

export function sortGeneList(geneList: TrackSection[]) {
  // for combined or hiddent gene lists, sort LOC
  // genes to end of list, otherwise sort alphabetically
  geneList.sort((geneA, geneB) => {
    const isGeneALOC = geneA.gene?.symbol.startsWith('LOC') || false;
    const isGeneBLOC = geneB.gene?.symbol.startsWith('LOC') || false;
    if (isGeneALOC && isGeneBLOC) {
      const geneASymbol = geneA.gene?.symbol.toLowerCase() || '';
      const geneBSymbol = geneB.gene?.symbol.toLowerCase() || '';
      return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
    }
    else if (isGeneALOC) {
      return 1;
    }
    else if (isGeneBLOC) {
      return -1;
    }
    const geneASymbol = geneA.gene?.symbol.toLowerCase() || '';
    const geneBSymbol = geneB.gene?.symbol.toLowerCase() || '';
    return (geneASymbol < geneBSymbol) ? -1 : (geneASymbol > geneBSymbol) ? 1 : 0;
  });
}

function getOrthologsFromComparativeSpecies(store: Store<VCMapState>, gene: Gene, mapKey: Number) {
  const orthologData = store.state.selectedBackboneRegion.orthologData;
  const drawnGeneData = store.state.loadedGenes;

  const currGeneInfo = drawnGeneData?.get(gene.rgdId);

  // Iterate through the entries in the orthologData map
  const backboneOrthologKey = [...orthologData.entries()]
      // Filter for an ortholog matching the selected gene's symbol
      .filter((entry: any) => {
        // Use the mapKey for this gene to only search the relevant ortholog results
        if (entry[1][mapKey.toString()]) 
        {
          const orthologGeneIdx = entry[1][mapKey.toString()]
            .find((ortholog: any) => { ortholog.geneSymbol.toLowerCase() == gene.symbol.toLowerCase(); }) || -1;
          return orthologGeneIdx !== -1;
        } 
        else 
        {
          return false;
        }
      })
      // And then map for the symbol (key) of the backbone gene
      .map((entry: any) => entry[0]);

  // return the symbol for the backbone gene and the ortholog data
  return {backboneSymbol: backboneOrthologKey[0], orthologData: orthologData.get(backboneOrthologKey[0])};
}


function getGeneOrthologData(store: Store<VCMapState>, gene: Gene) 
{
  const drawnGeneData = store.state.loadedGenes;
  const currGeneInfo = drawnGeneData?.get(gene.rgdId);
  const geneSpecies = gene.speciesName.toLowerCase();

  const selectedData: SelectedData[] = [];
  const rgdIds: number[] = [];

  if (!currGeneInfo) return {rgdIds: rgdIds, selectedData: selectedData };

  selectedData.push(new SelectedData(currGeneInfo[geneSpecies].drawn[0].gene, 'Gene'));
  rgdIds.push(gene.rgdId);
  // If the gene has orthologs, add them to the selected data
  if (gene.orthologs.length > 0)
  {
    gene.orthologs.forEach((ortholog: number) => {
      const currOrthologInfo = drawnGeneData?.get(ortholog);
      if (currOrthologInfo)
      {
        for (const species in currOrthologInfo)
        {
          if (species !== geneSpecies)
          {
            currOrthologInfo[species].drawn.forEach((orthologGene: any) => {
              selectedData.push(new SelectedData(orthologGene.gene, 'Gene'));
              rgdIds.push(orthologGene.gene.gene.rgdId);
            });
          }
        }
      }
    });
  }
  
  return {rgdIds: rgdIds, selectedData: selectedData};
}