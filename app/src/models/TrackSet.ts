import Track from "./Track";
import DataTrack from "./DataTrack";
import { createGeneTrackFromGenesData, createSyntenyTrackFromSpeciesSyntenyData } from "@/utils/TrackBuilder";
import TrackSection from "./TrackSection";

//track sets are a grouping of a species track and its respective data tracks
export default class TrackSet
{
  speciesTrack: Track;
  dataTracks: DataTrack[];
  svgY: number;

  constructor(speciesTrack: Track, dataTracks: DataTrack[])
  {
    this.speciesTrack = speciesTrack;
    this.svgY = this.speciesTrack.startingSVGY;
    this.dataTracks = dataTracks;
  }

  public getVisibleRegion(start: number, stop: number, basePairToHeightRatio: number, syntenyThreshold: number)
  {
    let convertedSpeciesTrack: Track | undefined;
    const convertedDataTracks: DataTrack[] = [];
    if (this.speciesTrack.type === 'backbone')
    {
      // Recreate the singular backbone section using the new basepair start/stops
      const trackSection = new TrackSection({
        start: start,
        stop: stop,
        backboneStart: start, 
        backboneStop: stop, 
        chromosome: this.speciesTrack.sections[0]?.chromosome, 
        cutoff: stop, 
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect'
      });

      convertedSpeciesTrack = new Track({ speciesName: this.speciesTrack.name, sections: [trackSection], startingSVGY: this.svgY, mapName: this.speciesTrack.mapName, type: 'backbone' });

      if (this.dataTracks.length)
      {
        this.dataTracks.forEach(dataTrack => {
          if (dataTrack.track.rawGeneData)
          {
            const convertedSpeciesDataTrack = createGeneTrackFromGenesData(
              dataTrack.track.rawGeneData,
              dataTrack.track.name,
              start,
              stop,
              basePairToHeightRatio,
              true, // this will always be used on the detailed panel
              syntenyThreshold,
              this.svgY
            );

            convertedDataTracks.push(convertedSpeciesDataTrack);
          }
        });
      }
    }
    else if (this.speciesTrack.type === 'comparative' && this.speciesTrack.rawSyntenyData)
    {
      const speciesTracks = createSyntenyTrackFromSpeciesSyntenyData(
        this.speciesTrack.rawSyntenyData,
        start,
        stop,
        basePairToHeightRatio,
        syntenyThreshold,
        this.svgY
      );
      convertedSpeciesTrack = speciesTracks[0];

      if (this.dataTracks.length)
      {
        const geneTrack = speciesTracks[1];
        const geneDataTrack = new DataTrack('Genes', geneTrack.name + ' Detailed Genes', geneTrack, 'red');
        geneDataTrack.setIsComparativeView(true);
        geneDataTrack.isDisplayed = true;

        convertedDataTracks.push(geneDataTrack);
      }
    }
    
    if (!convertedSpeciesTrack)
    {
      // Something went wrong... species track should have raw synteny data associated with it
      return;
    }

    const visibleRegionTrackSet = new TrackSet(convertedSpeciesTrack, convertedDataTracks);
    return visibleRegionTrackSet;
  }
}
