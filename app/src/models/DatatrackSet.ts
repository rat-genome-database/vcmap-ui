import DatatrackSection from "./DatatrackSection"

export default class DatatrackSet
{
  datatracks: DatatrackSection[] = [];

  constructor(datatracks: DatatrackSection[])
  {
    this.datatracks = datatracks;
  }

  public addDatatrackSections(datatrackSections: DatatrackSection[])
  {
    this.datatracks = this.datatracks.concat(datatrackSections);
  }}