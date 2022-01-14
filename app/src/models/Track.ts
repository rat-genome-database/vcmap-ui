import TrackSection from "./TrackSection";

interface TrackParams
{
  speciesName: string;
  sections: TrackSection[];
  mapName?: string;
}

export default class Track
{
  sections: TrackSection[] = [];
  name: string;
  mapName?: string;

  constructor(params: TrackParams)
  {
    this.name = params.speciesName;
    this.sections = params.sections;
    this.mapName = params.mapName;
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