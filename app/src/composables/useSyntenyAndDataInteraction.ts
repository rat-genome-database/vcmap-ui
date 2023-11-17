import { GeneDatatrack } from "@/models/DatatrackSection";
import Gene from "@/models/Gene";
import { GeneLabel } from "@/models/Label";
import OrthologLine from "@/models/OrthologLine";
import SelectedData from "@/models/SelectedData";
import { VCMapState } from "@/store";
import { sortGeneList } from "@/utils/DataPanelHelpers";
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import { getSelectedDataAndGeneIdsFromOrthologLine } from "@/utils/OrthologHandler";
import { Store } from "vuex";
import GenomicSection from "@/models/GenomicSection";

export default function useSyntenyAndDataInteraction(store: Store<VCMapState>) {
  const setHoverOnGeneLinesAndDatatrackSections = (lines: OrthologLine[], isHovered: boolean) => {
    if (lines.length > 0) {
      const line = lines[0];
      const dataPanelSelected = [line, ...line.chainedOrthologLines].some(l => {
        return store.state.selectedGeneIds.includes(l.startGene.rgdId) || store.state.selectedGeneIds.includes(l.endGene.rgdId);
      });
      const isLineHovered = (isHovered && !dataPanelSelected);
      [line, ...line.chainedOrthologLines].forEach(l => {
        l.isHovered = isLineHovered;
        if (l.startGeneDatatrack) l.startGeneDatatrack.isHovered = isLineHovered;
        if (l.endGeneDatatrack) l.endGeneDatatrack.isHovered = isLineHovered;
      });
    }
  };

  const changeHoverElementSize = (element: VCMapSVGElement, isHovered: boolean) => {
    //make our element bigger when hovered
    element.width = isHovered ? element.width + 6 : element.width - 6;
    //make sure the element is centered
    element.posX1 = isHovered ? element.posX1 - 3 : element.posX1 + 3;
    element.posX2 = isHovered ? element.posX2 + 3 : element.posX2 - 3;
  };

  const onDatatrackSectionClick = (event: any, section: GeneDatatrack, geneList: Map<number, Gene>) => {
    // NOTE: ignore variant datatrack sections for now
    if (!section.gene?.rgdId || section.type === 'variant' || section.type === 'qtl') return;

    section.isHovered = false;

    // If clicked section already selected, just reset the selectedGeneId state
    if (store.state.selectedGeneIds.includes(section.gene?.rgdId || -1)) {
      store.dispatch('setSelectedGeneIds', []);
      store.dispatch('setSelectedData', null);
      return;
    }

    // If shift key is held, we'll just add to the selections, otherwise, reset first
    const geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

    const newSelectedData: SelectedData[] = [];

    if (section.gene) {
      // Reset hover status of all ortholog lines and datatrack sections
      if (section.lines.length > 0) {
        setHoverOnGeneLinesAndDatatrackSections(section.lines, false);
      }

      // Keep the main gene of the label at the top of the list
      const geneLabel = section.label ? section.label as GeneLabel : undefined;
      const mainGene = geneLabel ? geneLabel.mainGene : section.gene;
      const otherLabelGenes = geneLabel ? geneLabel.genes.filter(g => g.rgdId !== geneLabel.mainGene.rgdId) : [];
      sortGeneList(otherLabelGenes);

      //
      // Add orthologs of all genes belonging to the datatrack's gene label to SelectedData
      [mainGene, ...otherLabelGenes].forEach((gene: Gene) => {
        newSelectedData.push(new SelectedData(gene.clone(), 'Gene'));
        geneIds.push(gene.rgdId);

        const geneData = geneList.get(gene.rgdId);

        // Get orthologs from selected gene
        if (geneData?.orthologs && geneData.orthologs?.length > 0) {
          const orthoIds = geneData.orthologs;
          geneIds.push(...orthoIds);

          const orthoData = orthoIds.map((id: number) => {
            return geneList.get(id);
          });
          orthoData.forEach(data => {
            if (data != null)
              newSelectedData.push(new SelectedData(data.clone(), 'Gene'));
          });
        }

        // Get orthologs from chained ortholog lines
        if (section.lines.length > 0) {
          const {
            selectedData: selectedOrthologs,
          } = getSelectedDataAndGeneIdsFromOrthologLine(section.lines[0]);

          selectedOrthologs.forEach(ortho => {
            const gene = ortho.genomicSection as Gene;
            if (!geneIds.includes(gene.rgdId)) {
              geneIds.push(gene.rgdId);
              newSelectedData.push(ortho);
            }
          });
        }
      });
    }

    store.dispatch('setSelectedGeneIds', geneIds || []);
    if (event.shiftKey) {
      const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
      store.dispatch('setSelectedData', selectedDataArray);
    }
    else {
      store.dispatch('setSelectedData', newSelectedData);
    }
  };

  const onGeneLabelClick = (event: any, label: GeneLabel, geneList: Map<number, Gene>, orthologLines: OrthologLine[]) => {
    if (store.state.selectedGeneIds.includes(label.mainGene.rgdId)) {
      store.dispatch('setSelectedGeneIds', []);
      store.dispatch('setSelectedData', null);
    }
    const geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

    // Keep the main gene of the label at the top of the list
    const mainGene = label.mainGene;
    const otherLabelGenes = label.genes.filter(g => g.rgdId !== label.mainGene.rgdId);

    const newSelectedData: SelectedData[] = [];
    sortGeneList(otherLabelGenes);
    [mainGene, ...otherLabelGenes].forEach((gene: Gene) => {
      newSelectedData.push(new SelectedData(gene.clone(), 'Gene'));
      geneIds.push(gene.rgdId);

      // Retrieve ortholog data
      const geneData = geneList.get(gene.rgdId);

      if (geneData == null)
      {
        return;
      }

      // Get orthologs from selected gene
      if (geneData.orthologs && geneData.orthologs.length > 0)
      {
        const orthoIds = geneData.orthologs;
        geneIds.push(...orthoIds);

        const orthoData = orthoIds.map((id: number) => {
          return geneList.get(id);
        });

        orthoData.forEach(data => {
          if (data != null)
            newSelectedData.push(new SelectedData(data.clone(), 'Gene'));
        });
      }

      // Find ortholog line that (if any that belongs to this gene)
      const lines = orthologLines.filter(l => l.startGene.rgdId === geneData.rgdId || l.endGene.rgdId === geneData.rgdId);
      // Get orthologs from chained ortholog lines (this will let us pick up non-backbone orthologs of this gene)
      if (lines != null && lines.length > 0)
      {
        const {
          selectedData: selectedOrthologs,
        } = getSelectedDataAndGeneIdsFromOrthologLine(lines[0]);

        selectedOrthologs.forEach(ortho => {
          const gene = ortho.genomicSection as Gene;
          if (!geneIds.includes(gene.rgdId)) {
            geneIds.push(gene.rgdId);
            newSelectedData.push(ortho);
          }
        });
      }
    });

    store.dispatch('setSelectedGeneIds', geneIds || []);
    if (event.shiftKey) {
      const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
      store.dispatch('setSelectedData', selectedDataArray);
    } else {
      store.dispatch('setSelectedData', newSelectedData);
    }
  };

  const showHoveredData = (section: GenomicSection, mouse: MouseEvent) => {
    store.dispatch('setHoveredData', {
      x: mouse.pageX,
      y: mouse.pageY,
      data: section?.toHoveredData() ?? [],
    });
  };

  const hideHoveredData = () => {
    store.dispatch('setHoveredData', {
      x: 0,
      y: 0,
      data: [],
    });
  };

  return {
    setHoverOnGeneLinesAndDatatrackSections,
    onDatatrackSectionClick,
    onGeneLabelClick,
    changeHoverElementSize,
    showHoveredData,
    hideHoveredData,
  };
}