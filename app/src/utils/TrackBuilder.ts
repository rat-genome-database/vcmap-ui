import SpeciesApi from "@/api/SpeciesApi";
import SyntenyApi from "@/api/SyntenyApi";
import Chromosome from "@/models/Chromosome";
import DataTrack from "@/models/DataTrack";
import Gene from "@/models/Gene";
import Species from "@/models/Species";
import { SpeciesSyntenyData, SyntenyRegionData } from "@/models/SyntenicRegion";
import Track from "@/models/Track";
import TrackSet from "@/models/TrackSet";
import TrackSection from "@/models/TrackSection";
import SVGConstants from "./SVGConstants";

const GENES_DATA_TRACK_THRESHOLD_MULTIPLIER = 5;
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
  return new Track({ speciesName: speciesName, sections: [trackSection], startingSVGY: startingSVGYPos, mapName: species.activeMap.name, type: 'backbone' });
}


/**
 * Creates the synteny tracks for a particular set of comparative species
 */
export async function createSyntenyTracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos: number, isComparative: boolean)
{
  const speciesSyntenyDataArray =  isComparative ? await SyntenyApi.getSyntenicRegions({
    backboneChromosome: backboneChr,
    start: backboneStart,
    stop: backboneStop,
    threshold: syntenyThreshold,
    includeGenes: 1,
  }, comparativeSpecies)

  :await SyntenyApi.getSyntenicRegions({
    backboneChromosome: backboneChr,
    start: backboneStart,
    stop: backboneStop,
    threshold: syntenyThreshold
  }, comparativeSpecies);

  const tracks: TrackSet[] = [];
  speciesSyntenyDataArray?.forEach(speciesSyntenyData => {
    const speciesTracks = createSyntenyTrackFromSpeciesSyntenyData(speciesSyntenyData, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold, startingSVGYPos);
    const speciesTrack = speciesTracks[0];
    const geneTrack = speciesTracks[1];

    const geneDataTrack = new DataTrack('Genes', geneTrack.name + ' Detailed Genes', geneTrack, 'red');
    geneDataTrack.setIsComparativeView(true);
    geneDataTrack.isDisplayed = true;

    const trackSet = new TrackSet(speciesTrack, [geneDataTrack]);
    tracks.push(trackSet);
  });

  return tracks;
}

export function createSyntenyTrackFromSpeciesSyntenyData(speciesSyntenyData: SpeciesSyntenyData, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos: number)
{
  console.debug(`-- Building synteny track for species: ${speciesSyntenyData.speciesName} / ${speciesSyntenyData.mapName} --`);
  const trackSections = splitLevel1And2RegionsIntoSections(speciesSyntenyData.regionData, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
  const speciesTrack = new Track({ speciesName: speciesSyntenyData.speciesName, speciesMap: speciesSyntenyData.mapKey, sections: trackSections[0], mapName: speciesSyntenyData.mapName, isSyntenyTrack: true, startingSVGY: startingSVGYPos, rawSyntenyData: speciesSyntenyData, type: 'comparative' });

  const geneTrack = new Track({ speciesName: speciesSyntenyData.speciesName, sections: trackSections[1], mapName: speciesSyntenyData.mapName, startingSVGY: startingSVGYPos, rawGeneData: [], type: 'gene' });

  return [speciesTrack, geneTrack];
}

/**
 * Creates the backbone data tracks (currently just genes)
 */
export async function createBackboneDataTracks(species: Species, chromosome: Chromosome, startPos: number, stopPos: number, basePairToHeightRatio: number, isComparative: boolean, syntenyThreshold: number, startingSVGYPos: number)
{
  const genes = await SpeciesApi.getGenesByRegion(chromosome.chromosome, startPos, stopPos, species.defaultMapKey);
  return createGeneTrackFromGenesData(genes, species.name, startPos, stopPos, basePairToHeightRatio, isComparative, syntenyThreshold, startingSVGYPos);
}

export function createGeneTrackFromGenesData(genes: Gene[], speciesName: string, startPos: number, stopPos: number,  basePairToHeightRatio: number, isComparative: boolean, syntenyThreshold: number, startingSVGYPos: number)
{
  const sections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];


  let previousBlockBackboneStop = startPos;
  const threshold = syntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
  for (let index = 0; index < genes.length; index++)
  {
    const gene = genes[index];
    
    if (gene.stop <= startPos || gene.start >= stopPos)
    {
      continue;
    }
    
    const geneSize = gene.stop - gene.start;
    if ( geneSize < threshold)
    {
      const hiddenTrackSection = new TrackSection({
        start: gene.start,
        stop: gene.stop,
        backboneStart: gene.start, 
        backboneStop: gene.stop, 
        chromosome: gene.chromosome, 
        cutoff: stopPos, 
        offsetCount: gene.start - previousBlockBackboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect',
        gene: gene
      });

      hiddenSections.push(hiddenTrackSection);
    }
    
    else
    {
      const trackSection = new TrackSection({
        start: gene.start,
        stop: gene.stop,
        backboneStart: gene.start, 
        backboneStop: gene.stop,
        chromosome: gene.chromosome, 
        cutoff: stopPos, 
        offsetCount: gene.start - previousBlockBackboneStop > 0 ? gene.start - previousBlockBackboneStop : 0,
        basePairToHeightRatio: basePairToHeightRatio,
        color: '#00000',
        shape: 'rect',
        gene: gene,
        hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
      });

      hiddenSections =  [];
      sections.push(trackSection);
      previousBlockBackboneStop = gene.stop;
    }
  }


  let geneDataTrack;
  const geneTrack = new Track({ speciesName: speciesName, sections: sections, startingSVGY: startingSVGYPos, rawGeneData: genes, type: 'gene' });

  if (isComparative)
  { 
    geneDataTrack = new DataTrack('Genes', speciesName + ' Detailed Genes', geneTrack, 'red');
    geneDataTrack.setIsComparativeView(true);
    geneDataTrack.isDisplayed = true;
  }
  else
  {
    geneDataTrack = new DataTrack('Genes', speciesName + ' Overview Genes', geneTrack, 'red');
    geneDataTrack.isDisplayed = true;
  }

  return geneDataTrack;
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

  const trackSections = level1Sections[0].concat(level2Sections[0]);
  const geneSections = level1Sections[1].concat(level2Sections[1]);
  return [trackSections, geneSections];
}

function splitBlocksAndGapsIntoSections(regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  const trackSections: TrackSection[] = [];
  const geneSections: TrackSection[] = [];
  let previousBlockBackboneStop = backboneStart;
  let previousGeneBackboneStop = backboneStart;

  const filteredRegions = regions.filter(r => {
    // Filter out blocks that are not at least partially in the selected/zoomed-in backbone region
    return r.block.backboneStop > backboneStart && r.block.backboneStart < backboneStop;
  });
  filteredRegions.forEach(region => {
    const block = region.block;
    //const blockLength = block.stop - block.start;
    //const blockBackboneLength = block.backboneStop - block.backboneStart;

    if (block.backboneStop <= backboneStart || block.backboneStart >= backboneStop)
    {
      return;
    }

    console.debug(`Filtering out gaps with threshold: ${threshold * GAPS_THRESHOLD_MULTIPLIER}`);
    const gaps = region.gaps.filter(g => { 
      // Filter out:
      // + gaps that are too small
      // + gaps that are a different chain level than the block
      // + gaps that are not at least partially in the selected/zoomed-in backbone region
      return g.length >= threshold * GAPS_THRESHOLD_MULTIPLIER && g.chainLevel === block.chainLevel && g.backboneStop > backboneStart && g.backboneStart < backboneStop; 
    });

    const genes = region.genes;
    let currBlockSection: TrackSection;
    if (gaps.length === 0)
    {
      // No gaps, create section for this synteny block like normal
      currBlockSection = new TrackSection({
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
        isInverted: block.orientation === '-',
      });

      trackSections.push(currBlockSection);
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
          isInverted: block.orientation === '-',
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
          isInverted: block.orientation === '-',
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
          isInverted: block.orientation === '-',
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
          isInverted: block.orientation === '-',
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
          isInverted: block.orientation === '-',
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
        isInverted: block.orientation === '-',
      }));
    }
    else
    {
      console.debug('Block section thrown out due to extending past displayed backbone region');
    }

    const geneThreshold = threshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
    let hiddenSections: TrackSection[] = [];
     //blocks not at least partially in selection range are filtered out, meaning all genes should also partially be in the selection range

     //verify last backbone stop was before current gene start
     //if overlapping, set previousGenebackboneStop to current gene backbone start
     //if current gene stop is before last gene stop, keep previousGenebackboneStop the same
     //if not overlapping, set previousGenebackboneStop to current gene backbone stop
    genes.forEach((gene) => {
      const geneSize = gene.stop - gene.start;
      const correctGeneStart = gene.start < block.start ? block.start : gene.start;
      const correctGeneStop = gene.stop > block.stop ? block.stop : gene.stop;
      
      const geneBackboneStart = (correctGeneStart - block.start) + block.backboneStart;
      let geneBackboneStop = block.backboneStop - (block.stop - correctGeneStop);

      //FIXME: this is a temporary fix for when genes are on a block that is larger than the block backbone region, causing inverted start/stop values
      if (geneBackboneStart > geneBackboneStop)
      {
        //const sizeRatio = blockBackboneLength / blockLength;
        geneBackboneStop = geneBackboneStart;
      }
      
      if(block.backboneStop - (block.stop - correctGeneStop) < previousGeneBackboneStop)
      {
        return;
      }
      
      if (!geneSize)
      {
        return;
      }

      const offsetValue = geneBackboneStart - previousGeneBackboneStop;
      if (geneSize < geneThreshold)
      {
        //gene is too small to be displayed, create hidden section 
        const hiddenTrackSection = new TrackSection({
          start: correctGeneStart,
          stop: correctGeneStop,
          backboneStart: geneBackboneStart, 
          backboneStop: geneBackboneStop, 
          chromosome: gene.chromosome, 
          cutoff: block.backboneStop, 
          offsetCount: offsetValue,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          gene: gene,
        });
  
        hiddenSections.push(hiddenTrackSection);
      }
      else
      {
        //gene is large enough to be displayed
        const trackSection = new TrackSection({
          start: correctGeneStart,
          stop: correctGeneStop,
          backboneStart: geneBackboneStart, 
          backboneStop: geneBackboneStop, 
          chromosome: gene.chromosome, 
          cutoff: block.backboneStop, 
          offsetCount: offsetValue,
          basePairToHeightRatio: basePairToHeightRatio,
          color: '#00000',
          shape: 'rect',
          gene: gene,
          hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
        });
        
        hiddenSections =  [];
        geneSections.push(trackSection);
        previousGeneBackboneStop = geneBackboneStop;
      }
    });

    previousBlockBackboneStop = block.backboneStop;
  });

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);
  return [trackSections, geneSections];
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