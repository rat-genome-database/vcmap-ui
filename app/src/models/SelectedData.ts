import TrackSection from "./TrackSection";
import OrthologLine from "./OrthologLine";
import Gene from "./Gene";

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
{
  genomicSection: TrackSection | OrthologLine | Gene;
  type: string;
  geneSet: Set<Gene>;

  constructor(section: TrackSection | OrthologLine | Gene, type: string)
  {
    this.genomicSection = section;
    this.type = type;
    this.geneSet = this.generateGeneSet(this.genomicSection);
  }

  private generateGeneSet(section: any): Set<Gene> {
    const geneSet: Set<Gene> = new Set();
    if (section.gene) geneSet.add(section.gene);
    if (section.combinedGenes) {
      section.combinedGenes.forEach((geneSection: TrackSection) => {
        if (geneSection.gene) geneSet.add(geneSection.gene);
      });
    }
    if (section.hiddenGenes) {
      section.hiddenGenes.forEach((geneSection: TrackSection) => {
        if (geneSection.gene) geneSet.add(geneSection.gene);
      });
    }
    return geneSet;
  }
}