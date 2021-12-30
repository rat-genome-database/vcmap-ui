import TrackSection from "./TrackSection";

export default class Track
{
  sections: TrackSection[] = [];
  name: string;
  mapName?: string;

  constructor(speciesName: string, sections: TrackSection[], mapName?: string)
  {
    this.name = speciesName;
    this.sections = sections;
    this.mapName = mapName;
  }

  public get height()
  {
    let totalHeight = 0;
    this.sections.forEach(section => {
      totalHeight += section.height + section.offsetHeight;
    });
    return totalHeight;
  }
}