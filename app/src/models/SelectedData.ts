import TrackSection from "./TrackSection";
import OrthologLine from "./OrthologLine";

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
{
  genomicSection: TrackSection | OrthologLine;
  type: string;

  constructor(section: TrackSection | OrthologLine, type: string)
  {
    this.genomicSection = section;
    this.type = type;
  }
}