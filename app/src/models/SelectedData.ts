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

  constructor(section: TrackSection | OrthologLine, type: string)
  {
    this.genomicSection = section;
    this.type = type;
  }
}