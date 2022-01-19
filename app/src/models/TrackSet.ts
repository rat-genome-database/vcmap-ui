import Track from "./Track";
import DataTrack from "./DataTrack";

//track sets are a grouping of a species track and its respective data tracks
export default class TrackSet
{
  speciesTrack: Track;
  dataTracks: DataTrack[];

  constructor(speciesTrack: Track, dataTracks: DataTrack[])
  {
    this.speciesTrack = speciesTrack;
    this.dataTracks = dataTracks;
  }
}
