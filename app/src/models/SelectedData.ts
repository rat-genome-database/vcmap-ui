import TrackSection from "./TrackSection";
import OrthologLine from "./OrthologLine";
import Gene from "./Gene";
import BackboneSection from "@/new_models/BackboneSection";

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
{
  genomicSection: BackboneSection | TrackSection | OrthologLine | Gene;
  type: string;

  constructor(section: BackboneSection | TrackSection | OrthologLine | Gene, type: string)
  {
    this.genomicSection = section;
    this.type = type;
  }

}