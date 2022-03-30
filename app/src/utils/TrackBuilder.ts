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
  const trackSections = splitLevel1And2RegionsIntoSections(speciesSyntenyData, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
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
  return genes;
}

export function createGeneTrackFromGenesData(genes: Gene[], speciesName: string, startPos: number, stopPos: number,  basePairToHeightRatio: number, isComparative: boolean, syntenyThreshold: number, startingSVGYPos: number)
{
  const sections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];

  const topSvgYCutoff = 55; //SVGConstants.panelTitleHeight - SVGConstants.navigationButtonHeight;
  const bottomSvgYCutoff = SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight;
  const threshold = syntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
  for (let index = 0; index < genes.length; index++)
  {
    const gene = genes[index];

    if (gene.stop < startPos || gene.start > stopPos)
    {
      continue;
    }

    const geneSize = gene.stop - gene.start;
    const blockStartOffset = (gene.start - startPos ) / basePairToHeightRatio;
    const geneSvgY = blockStartOffset + startingSVGYPos;

    if ( geneSize < threshold)
    {
      const hiddenTrackSection = new TrackSection({
        start: gene.start,
        stop: gene.stop,
        backboneStart: gene.start, 
        backboneStop: gene.stop, 
        chromosome: gene.chromosome, 
        cutoff: stopPos, 
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
        svgY: geneSvgY, 
        basePairToHeightRatio: basePairToHeightRatio,
        color: '#00000',
        shape: 'rect',
        gene: gene,
        hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
      });

      hiddenSections =  [];

      //gene is above the top nav button, adjust to be cutoff correctly
      if (geneSvgY < topSvgYCutoff)
      {
        //bottom of gene is below nav button
        if (trackSection.svgY2 > topSvgYCutoff)
        {
          const visibleHeight = trackSection.height - (topSvgYCutoff - trackSection.svgY);
          
          trackSection.adjustedHeight = visibleHeight;
          trackSection.svgY = topSvgYCutoff;
        }
      }
      sections.push(trackSection);
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


function splitLevel1And2RegionsIntoSections(speciesSyntenyData: SpeciesSyntenyData, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  const regions: SyntenyRegionData[] = speciesSyntenyData.regionData;
  console.debug('LEVEL 1');
  const level1Sections = splitBlocksAndGapsIntoSections(
    speciesSyntenyData,
    regions.filter(r => r.block.chainLevel === 1),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );
  console.debug('LEVEL 2');
  const level2Sections = splitBlocksAndGapsIntoSections(
    speciesSyntenyData,
    regions.filter(r => r.block.chainLevel === 2),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold
  );

  const trackSections = level1Sections[0].concat(level2Sections[0]);
  const geneSections = level1Sections[1].concat(level2Sections[1]);
  const gaplessSections = level1Sections[2].concat(level2Sections[2]);
  return [trackSections, geneSections, gaplessSections];
}

function splitBlocksAndGapsIntoSections(speciesSyntenyData: SpeciesSyntenyData, regions: SyntenyRegionData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  const trackSections: TrackSection[] = [];
  const blockGenesMap = new Map<number, any>();
  const gaplessBlockSections: TrackSection[] = [];

  let previousBlockBackboneStop = backboneStart;
  let previousGaplessBlockStop = backboneStart;

  const filteredRegions = regions.filter(r => {
    // Filter out blocks that are not at least partially in the selected/zoomed-in backbone region
    return r.block.backboneStop > backboneStart && r.block.backboneStart < backboneStop;
  });

  let blockIdCounter = 1;
  filteredRegions.forEach(region => {
    const block = region.block;

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
    const currGaplessBlockSection = new TrackSection({
      start: block.start,
      stop: block.stop,
      backboneStart: block.backboneStart, 
      backboneStop: block.backboneStop, 
      chromosome: block.chromosome, 
      cutoff: backboneStop, 
      offsetCount: block.backboneStart - previousGaplessBlockStop,
      basePairToHeightRatio: basePairToHeightRatio,
      shape: 'rect',
      chainLevel: block.chainLevel,
      isInverted: block.orientation === '-',
      blockId: blockIdCounter,
    });
    previousGaplessBlockStop = block.backboneStop;

    gaplessBlockSections.push(currGaplessBlockSection);
    blockGenesMap.set(blockIdCounter, {'genes': genes,});
    blockIdCounter++;

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
        isInverted: block.orientation === '-',
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

    previousBlockBackboneStop = block.backboneStop;
  });

  const speciesTrack = new Track({ speciesName: speciesSyntenyData.speciesName, speciesMap: speciesSyntenyData.mapKey, sections: gaplessBlockSections, mapName: speciesSyntenyData.mapName, isSyntenyTrack: true, startingSVGY: SVGConstants.panelTitleHeight, rawSyntenyData: speciesSyntenyData, type: 'comparative' });

  const geneThreshold = threshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
  const geneSections = createGeneSectionsFromSyntenyBlocks(speciesTrack.sections, geneThreshold, basePairToHeightRatio, blockGenesMap, backboneStart, backboneStop);

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);
  return [trackSections, geneSections, gaplessBlockSections];
}

function createGeneSectionsFromSyntenyBlocks(syntenyBlockSections: TrackSection[], threshold: number, basePairToHeightRatio: number, blockMap: Map<number, any>, backboneStart: number, backboneStop: number)
{
  const geneSections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];

  /* if (syntenyBlockSections.length === 1)
  {
    console.log('single block', syntenyBlockSections);
  } */
  syntenyBlockSections.forEach((syntenyBlockSection) => {
    //first, check for genes in this synteny block
    if (!syntenyBlockSection?.blockId)
    {
      return; 
    }

    //begin looping through genes, calculating offset relative to their block and creating sections
    const blockGenes = blockMap.get(syntenyBlockSection?.blockId);

    if (syntenyBlockSection.chainLevel && syntenyBlockSection.chainLevel == 2)
    {
      return;
    }

    if (!blockGenes)
    {
      return;
    }
    else
    {
      const blockRatio = (syntenyBlockSection.sectionStop - syntenyBlockSection.sectionStart) / syntenyBlockSection.height;
 
      blockGenes.genes.forEach((gene: Gene) => {
        const geneSize = gene.stop - gene.start; //length of gene in bp
        const correctGeneStart = gene.start < syntenyBlockSection.sectionStart ? syntenyBlockSection.sectionStart : gene.start; //adjusted start of gene; if gene starts before block start, use block start
        const correctGeneStop = gene.stop > syntenyBlockSection.sectionStop ? syntenyBlockSection.sectionStop : gene.stop; //adjusted stop of gene; if gene stops after block stop, use block stop
        
        const blockStartOffset = (correctGeneStart - syntenyBlockSection.sectionStart ) / (blockRatio); //offset of gene from block start in svg units - should never be negative
        const geneSvgY = syntenyBlockSection.svgY + blockStartOffset;

        if (geneSize < threshold)
        {
          //gene is too small to be displayed, create hidden section 
          const hiddenTrackSection = new TrackSection({
            start: correctGeneStart,
            stop: correctGeneStop,
            backboneStart: correctGeneStart, 
            backboneStop: correctGeneStop, 
            chromosome: gene.chromosome, 
            cutoff: correctGeneStop, 
            basePairToHeightRatio: blockRatio,
            isComparativeGene: true,
            shape: 'rect',
            gene: gene,
          });

          hiddenSections.push(hiddenTrackSection);
        }
        else
        {
          const trackSection = new TrackSection({
            start: correctGeneStart,
            stop: correctGeneStop,
            backboneStart: correctGeneStart, 
            backboneStop: correctGeneStop, 
            chromosome: gene.chromosome, 
            cutoff: correctGeneStop, 
            basePairToHeightRatio: blockRatio,
            isComparativeGene: true,
            svgY: geneSvgY,
            color: '#00000',
            shape: 'rect',
            gene: gene,
            hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
          });
          
          hiddenSections = [];
          geneSections.push(trackSection);
        }
      });
    }

  });

  return geneSections;
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