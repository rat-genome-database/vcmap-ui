import SyntenyApi from "@/api/SyntenyApi";
import Chromosome from "@/models/Chromosome";
import Species from "@/models/Species";
import { SyntenyRegionData } from "@/models/SyntenicRegion";
import Track from "@/models/Track";
import TrackSection from "@/models/TrackSection";
import SVGConstants from "./SVGConstants";

const GAPS_THRESHOLD_MULTIPLIER = 10;

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
 export function createBackboneTrack(species: Species, chromosome: Chromosome, startPos: number, stopPos: number, basePairToHeightRatio: number, startingSVGYPos = SVGConstants.panelTitleHeight)
 {
  const speciesName = species.name;
  const backboneChromosomeString = chromosome.chromosome;
  const trackSection = new TrackSection({
    start: startPos,
    stop: stopPos,
    backboneStart: startPos, 
    backboneStop: stopPos, 
    chromosome: backboneChromosomeString, 
    cutoff: stopPos, 
    basePairToHeightRatio: basePairToHeightRatio,
    shape: 'rect'
  });
  return new Track({ speciesName: speciesName, sections: [trackSection], startingSVGY: startingSVGYPos, mapName: species.activeMap.name });
}


/**
 * Creates the synteny tracks for a particular set of comparative species
 */
export async function createSyntenyTracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos: number)
{
  const speciesSyntenyData = await SyntenyApi.getSyntenicRegions({
    backboneChromosome: backboneChr,
    start: backboneStart,
    stop: backboneStop,
    threshold: syntenyThreshold
  }, comparativeSpecies);

  const tracks: Track[] = [];
  speciesSyntenyData.forEach(speciesSyntenyValue => {
    // Build synteny tracks for successful API calls
    console.debug(`-- Building synteny track for species: ${speciesSyntenyValue.speciesName} / ${speciesSyntenyValue.mapName} --`);
    const trackSections = splitLevel1And2RegionsIntoSections(speciesSyntenyValue.regionData, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
    const track = new Track({ speciesName: speciesSyntenyValue.speciesName, sections: trackSections, mapName: speciesSyntenyValue.mapName, isSyntenyTrack: true, startingSVGY: startingSVGYPos });
    tracks.push(track);
  });

  console.log(tracks);
  return tracks;
}

function splitLevel1And2RegionsIntoSections(regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  console.debug('LEVEL 1');
  const level1Sections = splitBlocksAndGapsIntoSections(
    regions.filter(r => r.block.chainLevel === 1),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );
  console.debug('LEVEL 2');
  const level2Sections = splitBlocksAndGapsIntoSections(
    regions.filter(r => r.block.chainLevel === 2),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );

  return level1Sections.concat(level2Sections);
}

function splitBlocksAndGapsIntoSections(regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  const trackSections: TrackSection[] = [];
  let previousBlockBackboneStop = backboneStart;

  console.debug(`Filtering out gaps with threshold: ${threshold * GAPS_THRESHOLD_MULTIPLIER}`);
  regions.forEach(region => {
    const block = region.block;
    const gaps = region.gaps.filter(g => { return g.length >= threshold * GAPS_THRESHOLD_MULTIPLIER && g.chainLevel === block.chainLevel; });

    if (gaps.length === 0)
    {
      // No gaps, create section for this synteny block like normal
      trackSections.push(new TrackSection({
        start: block.start,
        stop: block.stop,
        backboneStart: block.backboneStart, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop, 
        offsetCount: block.backboneStart - previousBlockBackboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect',
        chainLevel: block.chainLevel,
      }));
      previousBlockBackboneStop = block.backboneStop;
      return;
    }

    // Split the block and its gaps into their own TrackSections
    gaps.forEach((gap, index) => {

      if (index === 0 && (gap.backboneStart <= backboneStart))
      {
        // Block starts off with a gap
        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop, 
          offsetCount: gap.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
        }));
      }
      else if (index === 0)
      {
        // Starts off with part of a block and then the gap
        trackSections.push(new TrackSection({
          start: block.start,
          stop: gap.start,
          backboneStart: block.backboneStart, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop, 
          offsetCount: block.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          chainLevel: block.chainLevel,
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
        }));
      }
      else
      {
        // Create a section for the part of the block that comes before this gap
        const previousGap = gaps[index - 1];
        trackSections.push(new TrackSection({
          start: previousGap.stop,
          stop: gap.start,
          backboneStart: previousGap.backboneStop, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          chainLevel: block.chainLevel,
        }));

        trackSections.push(new TrackSection({
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
        }));
      }
    });

    const lastGap = gaps[gaps.length - 1];
    if (lastGap.backboneStop < backboneStop && lastGap.stop < block.stop)
    {
      // Create a section for the last part of the block
      trackSections.push(new TrackSection({
        start: lastGap.stop,
        stop: block.stop,
        backboneStart: lastGap.backboneStop, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect',
        chainLevel: block.chainLevel,
      }));
    }
    else
    {
      console.debug('Block section thrown out due to extending past displayed backbone region');
    }

    previousBlockBackboneStop = block.backboneStop;
  });

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);
  return trackSections;
}

function warnIfNegativeHeight(trackSections: TrackSection[])
{
  trackSections.forEach((section, index) => {
    if (section.height < 0)
    {
      console.warn('Negative height', index, section);
    }
  });
}