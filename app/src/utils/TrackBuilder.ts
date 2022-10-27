import SpeciesApi from "@/api/SpeciesApi";
import SyntenyApi from "@/api/SyntenyApi";
import Chromosome from "@/models/Chromosome";
import DataTrack from "@/models/DataTrack";
import Gene from "@/models/Gene";
import Species from "@/models/Species";
import SyntenicRegion, { SpeciesSyntenyData, SyntenyRegionData } from "@/models/SyntenicRegion";
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
    const speciesTrack = speciesTracks.speciesTrack;
    const geneTrack = speciesTracks.geneTrack;
    const geneMap = speciesTracks.geneMap as Map<string, any>;

    if (geneMap.size > 0)
    {
      speciesSyntenyData.allGenesMap = geneMap;
    }
    
    const geneDataTrack = new DataTrack('Genes', geneTrack.name + ' Detailed Genes', geneTrack, 'red');
    geneDataTrack.setIsComparativeView(true);
    geneDataTrack.isDisplayed = true;

    const trackSet = new TrackSet(speciesTrack, [geneDataTrack]);
    tracks.push(trackSet);
  });

  return {tracks: tracks, speciesSyntenyDataArray: speciesSyntenyDataArray};
}

export function createSyntenyTrackFromSpeciesSyntenyData(speciesSyntenyData: SpeciesSyntenyData, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos: number)
{
  console.debug(`-- Building synteny track for species: ${speciesSyntenyData.speciesName} / ${speciesSyntenyData.mapName} --`);
  const trackSections = splitLevel1And2RegionsIntoSections(speciesSyntenyData, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);
  const speciesTrack = new Track({ speciesName: speciesSyntenyData.speciesName, speciesMap: speciesSyntenyData.mapKey, sections: trackSections.tracks, mapName: speciesSyntenyData.mapName, isSyntenyTrack: true, startingSVGY: startingSVGYPos, rawSyntenyData: speciesSyntenyData, type: 'comparative' });

  const geneTrack = new Track({ speciesName: speciesSyntenyData.speciesName, sections: trackSections.genes, mapName: speciesSyntenyData.mapName, startingSVGY: startingSVGYPos, rawGeneData: [], type: 'gene' });
  const geneMap = trackSections.geneMap;

  return {'speciesTrack': speciesTrack , 'geneTrack': geneTrack, 'geneMap': geneMap};
}

/**
 * Creates the backbone data tracks (currently just genes)
 */
export async function createBackboneDataTracks(species: Species, chromosome: Chromosome, startPos: number, stopPos: number)
{
  const genes = await SpeciesApi.getGenesByRegion(chromosome.chromosome, startPos, stopPos, species.defaultMapKey, species.name);
  return genes;
}

export function createBackboneGeneTrackFromGenesData(genes: Gene[], speciesName: string, startPos: number, stopPos: number,  basePairToHeightRatio: number, isComparative: boolean, syntenyThreshold: number, startingSVGYPos: number)
{
  const sections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];
  
  const threshold = syntenyThreshold * GENES_DATA_TRACK_THRESHOLD_MULTIPLIER;
  for (let index = 0; index < genes.length; index++)
  {
    const gene = genes[index];
    let visibleFlag = true;
    if (gene.stop < startPos || gene.start > stopPos)
    {
      visibleFlag = false;
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
        gene: gene,
        isVisible: visibleFlag,
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
        isVisible: visibleFlag,
        hiddenGenes: hiddenSections.length > 0 ? hiddenSections : []
      });

      hiddenSections =  [];

      //gene is above the top nav button, adjust to be cutoff correctly
      /* if (geneSvgY < topSvgYCutoff && visibleFlag)
      {
        //bottom of gene is below nav button
        if (trackSection.svgY2 > topSvgYCutoff)
        {
          const visibleHeight = trackSection.height - (topSvgYCutoff - trackSection.svgY);
          
          trackSection.adjustedHeight = visibleHeight > 0 ? visibleHeight : .01;
          trackSection.svgY = topSvgYCutoff;
        }
      } */
      
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


function splitLevel1And2RegionsIntoSections(speciesSyntenyData: SpeciesSyntenyData, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number,)
{
  const regions: SyntenyRegionData[] = speciesSyntenyData.regionData;
  console.debug('LEVEL 1');
  const level1Sections = splitBlocksAndGapsIntoSections(
    speciesSyntenyData,
    regions.filter(r => r.block.chainLevel === 1),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold,
  );
  console.debug('LEVEL 2');
  const level2Sections = splitBlocksAndGapsIntoSections(
    speciesSyntenyData,
    regions.filter(r => r.block.chainLevel === 2),
    backboneStart,
    backboneStop,
    basePairToHeightRatio,
    threshold,
  );

  const trackSections = level1Sections.tracks.concat(level2Sections.tracks);
  const geneSections = level1Sections.geneSections.concat(level2Sections.geneSections);
  const gaplessSections = level1Sections.gapless.concat(level2Sections.gapless);
  const geneMap = level1Sections.geneMap;
  
  return {'tracks': trackSections as TrackSection[], 'genes': geneSections as TrackSection[], 'gapless': gaplessSections as TrackSection[], 'geneMap': geneMap as Map<string, any>};
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

    const visibleBlockEnds = calculateVisibleBlockEnds(block, backboneStart, backboneStop, isInverted);
    const blockStart = visibleBlockEnds[0];
    const blockStop = visibleBlockEnds[1];

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
    blockGenesMap.set(blockIdCounter, {'genes': genes, 'sections': [], 'start': blockStart, 'stop': blockStop});
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
  const geneInfo = createGeneSectionsFromSyntenyBlocks(speciesTrack.sections, geneThreshold, blockGenesMap, speciesSyntenyData );

  const geneSections = geneInfo.geneSections;
  const geneMap = geneInfo.geneMap;

  console.debug(`Regions split into ${trackSections.length} sections`, trackSections);
  warnIfNegativeHeight(trackSections);

  return { 'tracks': trackSections as TrackSection[], 'geneSections': geneSections as TrackSection[], 'gapless': gaplessBlockSections as TrackSection[], 'geneMap': geneMap as Map<string, any> };
}

function calculateVisibleBlockEnds(blockInfo: SyntenicRegion, backboneStart: number, backboneStop: number, isInverted: boolean)
{
  //calculate the percentage of the block backbone that is not visible above and below current viewport
  const blockStart = isInverted ? blockInfo.stop : blockInfo.start;
  const blockStop = isInverted ? blockInfo.start : blockInfo.stop;
  const blockBackboneStart = blockInfo.backboneStart;
  const blockBackboneStop = blockInfo.backboneStop;
  let visibleTop: number = blockStart; 
  let visibleBottom: number = blockStop;
  

  const blockBackboneLength = blockBackboneStop - blockBackboneStart;
  const blockLength = Math.abs(blockStop - blockStart);

  const topBasePairDifference = backboneStart - blockBackboneStart;
  const bottomBasePairDifference = blockBackboneStop - backboneStop;
  
  if (topBasePairDifference > 0)
  {
    const topPercentHidden = topBasePairDifference / blockBackboneLength;
    visibleTop = isInverted ? (blockStart) - (blockLength * topPercentHidden) : (blockLength * topPercentHidden) + (blockStart);
  }

  if (bottomBasePairDifference > 0)
  {
    const bottomPercentHidden = bottomBasePairDifference / blockBackboneLength;
    visibleBottom = isInverted ? blockStop + (blockLength * bottomPercentHidden) : blockStop - (blockLength * bottomPercentHidden);
  }
  
  return [visibleTop, visibleBottom];
}

function createGeneSectionsFromSyntenyBlocks(syntenyBlockSections: TrackSection[], threshold: number, blockMap: Map<number, any>, speciesSyntenyData: SpeciesSyntenyData,)
{
  const geneSections: TrackSection[] = [];
  let hiddenSections: TrackSection[] = [];

  //convert all genes to map to use for quick lookup of drawn coords during selection
  const allGenesMap = new Map<string, any>();
  const currentSpecies = speciesSyntenyData.speciesName.toLowerCase();
  const allGenesArray = speciesSyntenyData.allGenes;

  if (allGenesArray)
  {
    allGenesArray.forEach((gene: Gene) => {
      if (!gene.symbol)
      {
        return;
      }
      const geneSymbol = gene.symbol.toLowerCase();
      const geneObject = { gene: gene, drawn: [], visible: [] };
      const speciesObject = {[currentSpecies as string]: geneObject};
      allGenesMap.set(geneSymbol, speciesObject);
    });
  }

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
      const visibleBlockStart = blockInfo.start;
      const visibleBlockStop = blockInfo.stop;

      //sort the processed sections by svgy to determine currently visible sections of block
      sections.sort((a, b) => a.svgY - b.svgY);
      let blockStop: number = visibleBlockStop;
      let blockStart: number = visibleBlockStart;
      const blockStartSvgY: number = syntenyBlockSection.svgY;

      if (syntenyBlockSection.isInverted)
      {
        blockStart = visibleBlockStop;
        blockStop = visibleBlockStart;
      }

      const blockRatio = (blockStop - blockStart) / syntenyBlockSection.height;

      blockGenes.forEach((gene: Gene) => {
        const geneSize = gene.stop - gene.start; //length of gene in bp
        const correctGeneStart = gene.start; //< blockStart ? blockStart : gene.start; //adjusted start of gene; if gene starts before block start, use block start
        const correctGeneStop = gene.stop; //> blockStop ? blockStop : gene.stop; //adjusted stop of gene; if gene stops after block stop, use block stop
        
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

        //update gene object with drawn coords if found
        const geneSymbol = gene.symbol.toLowerCase();
        const geneObject = allGenesMap.get(geneSymbol);
        if (geneObject)
        {
          geneObject[currentSpecies]['drawn'].push({ svgY: geneSvgY, sectionStart: gene.start, sectionStop: gene.stop, backboneStart: correctGeneStart, backboneStop: correctGeneStop,});
        }
        else
        {
          allGenesMap.set(geneSymbol, {[currentSpecies]: {gene: gene, drawn: [{ svgY: geneSvgY, backboneStart: correctGeneStart, backboneStop: correctGeneStop,}], }});
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

  return {'geneSections': geneSections as TrackSection[], 'geneMap': allGenesMap as Map<string, any>};
}
function warnIfNegativeHeight(trackSections: TrackSection[])
{
  trackSections.forEach((section, index) => {
    if (section.svgY < 55 || section.svgY > 425)
    {
      return;
    }
    else if (section.height < 0)
    {
      console.warn('Negative height', index, section);
    }
  });
}