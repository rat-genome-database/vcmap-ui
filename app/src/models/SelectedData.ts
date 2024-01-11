import Gene from "@/models/Gene";
import BackboneSection from "@/models/BackboneSection";
import SyntenySection from "@/models/SyntenySection";
import { VariantDensity } from "@/models/DatatrackSection";

/**
 * TODO: I think the way we use this model is a bit inefficient. Possible refactors:
 *   1. Delete this model entirely and type the selectedData in the store as "Array<GenomicSectionType>". Then
 *     in the SelectedDataPanel, we'd need to do conditional statements using "instanceof" to determine the data type
 *     and what properties to pass to the GeneInfo component
 *   -or-
 *   2. Change the class definition of this model to SelectedData<T extends GenomicSectionType> and add all properties
 *     needed for the SelectedDataPanel to it. Then when a piece of data is passed into the constructor, extract and
 *     set those properties based on what its type is (probably check using "instanceof"?). This would eliminate most of
 *     the conditionals in the SelectedDataPanel component and should clean up the template a bit, making it more readable.
 */
export type SelectedDataType = 'trackSection' | 'Gene' | 'backbone' | 'variantDensity';
type GenomicSectionType = BackboneSection | SyntenySection | Gene | VariantDensity;

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
{
  genomicSection: any;
  type: SelectedDataType;

  /**
   * This constructor takes a generic object the user can select, and sets a summary
   * of that object to genomicSection to display in the SelectedDataPanel
   *
   * TODO: I think we could improve or simplify this process, either by properly
   * cloning objects, or utilizing a more generic type. Some notes on those ideas above
   */
  constructor(section: any, type: SelectedDataType)
  {
    this.type = type;
    if (this.type === 'trackSection') {
      this.genomicSection = {
        chromosome: section.chromosome,
        start: section.speciesStart,
        stop: section.speciesStop,
        chainLevel: section.chainLevel,
        isInverted: section.isInverted,
        elementColor: section.elementColor,
        speciesName: section.speciesName,
        backboneAlignment: section.backboneAlignment,
        mapName: section.mapName,
        regionInfo: {
          geneCount: section.regionInfo.geneCount,
          blockCount: section.regionInfo.blockCount,
          gapCount: section.regionInfo.gapCount,
          variantCount: section.regionInfo.variantCount,
        },
      };
    } else if (this.type === 'backbone') {
      this.genomicSection = {
        chromosome: section.chromosome,
        start: section.windowStart,
        stop: section.windowStop,
      };
    } else if (this.type === 'variantDensity') {
      this.genomicSection = {
        mapName: section.mapName,
        speciesName: section.speciesName,
        start: section.speciesStart,
        stop: section.speciesStop,
        chromosome: section.chromosome,
        backboneAlignment: section.backboneAlignment,
        variantCount: section.variantCount,
      };
    } else if (this.type === 'Gene') {
      this.genomicSection = {
        mapKey: section.mapKey,
        speciesName: section.speciesName,
        symbol: section.symbol,
        name: section.name,
        rgdId: section.rgdId,
        chromosome: section.chromosome,
        start: section.start,
        stop: section.stop,
        orthologs: section.orthologs,
        backboneStart: section.backboneStart,
        backboneStop: section.backboneStop,
      };
    }
  }

}