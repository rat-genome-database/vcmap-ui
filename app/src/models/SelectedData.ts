import OrthologLine from "./OrthologLine";
import Gene from "@/models/Gene";
import BackboneSection from "@/models/BackboneSection";
import SyntenySection from "@/models/SyntenySection";
import DatatrackSection from "@/models/DatatrackSection";

// TODO: These types could probably use some refactoring
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