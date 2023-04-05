import OrthologLine from "./OrthologLine";
import Gene from "@/models/Gene";
import BackboneSection from "@/models/BackboneSection";
import SyntenySection from "@/models/SyntenySection";
import DatatrackSection from "@/models/DatatrackSection";

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
export type SelectedDataType = 'trackSection' | 'Gene' | 'geneLabel' | 'backbone';
type GenomicSectionType = BackboneSection | SyntenySection | OrthologLine | Gene | DatatrackSection;

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
{
  genomicSection: GenomicSectionType;
  type: SelectedDataType;

  constructor(section: GenomicSectionType, type: SelectedDataType)
  {
    this.genomicSection = section;
    this.type = type;
  }

}