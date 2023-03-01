import DatatrackSection, { DatatrackSectionType } from "./DatatrackSection"

export default class DatatrackSet
{
  datatracks: DatatrackSection[] = [];
  type: DatatrackSectionType;

  constructor(datatracks: DatatrackSection[], type: DatatrackSectionType)
  {
    this.datatracks = datatracks;
    this.type = type;
  }

  public addDatatrackSections(datatrackSections: DatatrackSection[])
  {
    this.datatracks = this.datatracks.concat(datatrackSections);
  }}