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
  return createBackboneGeneTrackFromGenesData(genes, species.name, startPos, stopPos, basePairToHeightRatio, isComparative, syntenyThreshold, startingSVGYPos);
}

export function createBackboneGeneTrackFromGenesData(genes: Gene[], speciesName: string, startPos: number, stopPos: number,  basePairToHeightRatio: number, isComparative: boolean, syntenyThreshold: number, startingSVGYPos: number)
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
  let processedBlockSections: TrackSection[] = [];
  filteredRegions.forEach(region => {
    const lastBlockId = blockIdCounter;
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

    const isInverted = block.orientation === '-';
    const blockStart = (isInverted) ? block.stop : block.start;
    const blockStop = (isInverted) ? block.start : block.stop;

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
      isInverted: isInverted,
      blockId: blockIdCounter,
    });
    previousGaplessBlockStop = block.backboneStop;

    gaplessBlockSections.push(currGaplessBlockSection);
    blockGenesMap.set(blockIdCounter, {'genes': genes, 'sections': []});
    blockIdCounter++;

    if (gaps.length === 0)
    {
      // No gaps, create section for this synteny block like normal
      const blockSection = new TrackSection({
        start: blockStart,
        stop: blockStop,
        backboneStart: block.backboneStart, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop, 
        offsetCount: block.backboneStart - previousBlockBackboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect',
        chainLevel: block.chainLevel,
        isInverted: isInverted,
        blockId: lastBlockId,
      });
      trackSections.push(blockSection);
      processedBlockSections.push(blockSection);

      previousBlockBackboneStop = block.backboneStop;
      return;
    }

    // Split the block and its gaps into their own TrackSections
    gaps.forEach((gap, index) => {

      const gapStart = (isInverted) ? gap.stop : gap.start;
      const gapStop = (isInverted) ? gap.start : gap.stop;

      if (index === 0 && (gap.backboneStart <= backboneStart))
      {
        // Block starts off with a gap
        const gapSection = new TrackSection({
          start: gapStart,
          stop: gapStop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop, 
          offsetCount: gap.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
          isInverted: isInverted,
        });
        trackSections.push(gapSection);
        processedBlockSections.push(gapSection);
      }
      else if (index === 0)
      {
        // Starts off with part of a block and then the gap
        const blockSection = new TrackSection({
          start: blockStart,
          stop: gapStart,
          backboneStart: block.backboneStart, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop, 
          offsetCount: block.backboneStart - previousBlockBackboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          chainLevel: block.chainLevel,
          isInverted: isInverted,
        });
        trackSections.push(blockSection);
        processedBlockSections.push(blockSection);

        const gapSection = new TrackSection({
          start: gapStart,
          stop: gapStop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
          isInverted: isInverted,
        });
        trackSections.push(gapSection);
        processedBlockSections.push(gapSection);
      }
      else
      {
        // Create a section for the part of the block that comes before this gap
        const previousGap = gaps[index - 1];
        const blockSection = new TrackSection({
          start: (isInverted) ? previousGap.start : previousGap.stop,
          stop: gapStart,
          backboneStart: previousGap.backboneStop, 
          backboneStop: gap.backboneStart, 
          chromosome: block.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'rect',
          chainLevel: block.chainLevel,
          isInverted: isInverted,
        });
        trackSections.push(blockSection);
        processedBlockSections.push(blockSection);

        const gapSection = new TrackSection({
          start: gapStart,
          stop: gapStop,
          backboneStart: gap.backboneStart, 
          backboneStop: gap.backboneStop, 
          chromosome: gap.chromosome, 
          cutoff: backboneStop,
          basePairToHeightRatio: basePairToHeightRatio,
          shape: 'line',
          chainLevel: block.chainLevel,
          isInverted: isInverted,
        });
        trackSections.push(gapSection);
        processedBlockSections.push(gapSection);
      }
    });

    const lastGap = gaps[gaps.length - 1];
    if (lastGap.backboneStop < backboneStop && lastGap.stop < block.stop)
    {
      // Create a section for the last part of the block
      const blockSection = new TrackSection({
        start: (isInverted) ? lastGap.start : lastGap.stop,
        stop: blockStop,
        backboneStart: lastGap.backboneStop, 
        backboneStop: block.backboneStop, 
        chromosome: block.chromosome, 
        cutoff: backboneStop,
        basePairToHeightRatio: basePairToHeightRatio,
        shape: 'rect',
        chainLevel: block.chainLevel,
        isInverted: isInverted,
      });
      trackSections.push(blockSection);
      processedBlockSections.push(blockSection);
    }
    else
    {
      console.debug('Block section thrown out due to extending past displayed backbone region');
    }

    const currBlockMap = blockGenesMap.get(lastBlockId);
    const tempProcessedTrack = new Track({ speciesName: speciesSyntenyData.speciesName, speciesMap: speciesSyntenyData.mapKey, sections: processedBlockSections, mapName: speciesSyntenyData.mapName, isSyntenyTrack: true, startingSVGY: SVGConstants.panelTitleHeight, rawSyntenyData: speciesSyntenyData, type: 'comparative' });
    currBlockMap.sections = tempProcessedTrack.sections;
    processedBlockSections = [];

    previousBlockBackboneStop = block.backboneStop;
  });

  const speciesTrack = new Track({ speciesName: speciesSyntenyData.speciesName, speciesMap: speciesSyntenyData.mapKey, sections: gaplessBlockSections, mapName: speciesSyntenyData.mapName, isSyntenyTrack: true, startingSVGY: SVGConstants.panelTitleHeight, rawSyntenyData: speciesSyntenyData, type: 'comparative' });

  const geneThreshold = threshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
  const geneSections = createGeneSectionsFromSyntenyBlocks(speciesTrack.sections, geneThreshold, blockGenesMap,);

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);

  return [trackSections, geneSections, gaplessBlockSections];
}

function createGeneSectionsFromSyntenyBlocks(syntenyBlockSections: TrackSection[], threshold: number, blockMap: Map<number, any>,)
{
  const geneSections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];

  syntenyBlockSections.forEach((syntenyBlockSection) => {
    //first, check for genes in the block using map
    if (!syntenyBlockSection?.blockId)
    {
      return; 
    }

    const blockInfo = blockMap.get(syntenyBlockSection?.blockId);

    //currently we are skipping rendering of level 2 genes
    if (syntenyBlockSection.chainLevel && syntenyBlockSection.chainLevel == 2)
    {
      return;
    }

    if (!blockInfo)
    {
      return;
    }
    else
    {
      const blockGenes = blockInfo.genes;
      const sections = blockInfo.sections as TrackSection[];

      //sort the processed sections by svgy to determine currently visible sections of block
      sections.sort((a, b) => a.svgY - b.svgY);
      let blockStop: number = syntenyBlockSection.sectionStop;
      let blockStart: number = syntenyBlockSection.sectionStart;
      let blockStartSvgY: number = syntenyBlockSection.svgY;

      
      if (syntenyBlockSection.isInverted)
      {
        //find the relative to the viewport start and stop of the block, capture starting svgY
        for (let i = 0; i < sections.length; i++)
        {
          const section = sections[i];
          if (section.shape === 'rect' && section.chromosome == syntenyBlockSection.chromosome)
          {
            blockStop = section.sectionStop;
            blockStartSvgY = section.svgY;
            break;
          }
        }
        for (let index = sections.length -1; index > 0; index--)
        {
          const currSection = sections[index];
          if (currSection.shape === 'rect' && currSection.chromosome == syntenyBlockSection.chromosome)
          {
            blockStart = currSection.sectionStart;
            break;
          }
        }
      }
      else
      {
        for (let i = 0; i < sections.length; i++)
        {
          const section = sections[i];
          if (section.shape === 'rect' && section.chromosome == syntenyBlockSection.chromosome)
          {
            blockStart = section.sectionStart;
            blockStartSvgY = section.svgY;
            break;
          }
        }

        for (let index = sections.length -1; index > 0; index--)
        {
          const currSection = sections[index];
          if (currSection.shape === 'rect' && currSection.chromosome == syntenyBlockSection.chromosome)
          {
            blockStop = currSection.sectionStop;
            
            break;
          }
        }
      }
      

      const blockRatio = (blockStop - blockStart) / syntenyBlockSection.height;

      blockGenes.forEach((gene: Gene) => {
        const geneSize = gene.stop - gene.start; //length of gene in bp
        const correctGeneStart = gene.start < blockStart ? blockStart : gene.start; //adjusted start of gene; if gene starts before block start, use block start
        const correctGeneStop = gene.stop > blockStop ? blockStop : gene.stop; //adjusted stop of gene; if gene stops after block stop, use block stop
        
        let blockStartOffset = 0; //offset of gene from block start in svg units
        if (syntenyBlockSection.isInverted)
        {
          blockStartOffset = (blockStop - correctGeneStop) / blockRatio;
        }
        else
        {
          blockStartOffset = (correctGeneStart - blockStart) / blockRatio;
        }
        const geneSvgY = blockStartSvgY + blockStartOffset;

        //if gene ends before current block start or starts after current block stop, skip
        if (correctGeneStart > blockStop || correctGeneStop < blockStart)
        {
          return;
        }
        
        if (geneSize < threshold)
        {
          //gene is too small to be displayed, create hidden section 
          const hiddenTrackSection = new TrackSection({
            start: gene.start,
            stop: gene.stop,
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
            color: syntenyBlockSection.chainLevel == 2 ? '' : '#00000',
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