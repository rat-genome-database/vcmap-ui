import TrackSection from "./TrackSection";

export default class Track
{
  sections: TrackSection[] = [];
  name: string;

  constructor(speciesName: string, sections: TrackSection[])
  {
    this.name = speciesName;
    this.sections = sections;
  }

  public get height()
  {
    let totalHeight = 0;
    this.sections.forEach(section => {
      totalHeight += section.height;
    });
    return totalHeight;
  }
}