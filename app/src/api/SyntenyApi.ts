import httpInstance from '@/api/httpInstance';
import Chromosome from '@/models/Chromosome';
import Species from '@/models/Species';
import Gene from '@/models/Gene';
import { AxiosResponse } from 'axios';
import logger from '@/logger';

export interface SyntenyRequestParams
{
  backboneChromosome: Chromosome; 
  start: number; 
  stop: number;
  comparativeSpecies: Species[];
  optional: {
    threshold?: number;
    includeGenes?: boolean;
    includeOrthologs?: boolean;
    thresholdStart?: number;
    thresholdEnd?: number;
  };
}

/**
 * Expected gene model returned from the RGD Rest API to represent a gene in a syntenic region. Will be converted to our own Gene model.
 */
interface SyntenyGeneDTO
{
  geneRgdId: number;
  geneSymbol: string;
  geneName: string;
  geneType: string;
  mapKey: number;
  chr: string;
  startPos: number;
  stopPos: number;
  strand: '+' | '-';
  orthologs: number[] | null;
}

/**
 * Expected model returned from the RGD Rest API to represent a single syntenic region and its genes
 */
interface SyntenyResponseDTO
{
  genes?: SyntenyGeneDTO[],
  gaps?: SyntenyComponent[],
  block: SyntenyComponent,
}

/**
 * Block or gap 
 */
export interface SyntenyComponent
{
  backboneMapKey: number;
  backboneChromosome: string;
  backboneStart: number;
  backboneStop: number;
  mapKey: number;
  chromosome: string;
  start: number;
  stop: number;
  orientation: '+' | '-';
  chainLevel: number;
  chainType: 'top' | 'nonSyn' | 'gap';
}

/**
 * Represents the combination of blocks, gaps, and genes in a synteny region
 */
export interface SyntenyRegionData
{
  block: SyntenyComponent;
  gaps: SyntenyComponent[];
  genes: Gene[];
}

/**
 * Intermediate interface to hold data from the Synteny Response and associate it with its comparative species
 */
export interface SpeciesSyntenyData
{
  speciesName: string;
  mapName: string;
  mapKey: number;
  regionData: SyntenyRegionData[];
}

function getGeneFromDTO(dto: SyntenyGeneDTO, speciesName: string)
{
  return new Gene({
    mapKey: dto.mapKey,
    speciesName: speciesName,
    symbol: dto.geneSymbol,
    name: dto.geneName,
    rgdId: dto.geneRgdId,
    chromosome: dto.chr,
    start: dto.startPos,
    stop: dto.stopPos,
    orthologs: dto.orthologs ?? [],
  });
}

function getSpeciesSyntenyDataFromDTO(dtoArray: SyntenyResponseDTO[], comparativeSpecies: Species)
{
  const regions: SyntenyRegionData[] = [];
  dtoArray.forEach(dto => {
    const genes: Gene[] = [];
    dto.genes?.forEach((geneDTO: any) => {
      genes.push(getGeneFromDTO(geneDTO, comparativeSpecies.name));
    });

    regions.push({
      block: dto.block,
      gaps: dto.gaps ?? [],
      genes: genes ?? [],
    });
  });

  const genesPerRegion = regions.length > 0 ? regions.map(r => r.genes) : [];

  return {
    speciesName: comparativeSpecies.name,
    mapName: comparativeSpecies.activeMap.name,
    mapKey: comparativeSpecies.activeMap.key,
    regionData: regions,
    allGenes: genesPerRegion.length > 0 ? genesPerRegion.reduce((prevGenes, currentGenes) => prevGenes.concat(currentGenes)) : [],
  };
}

export default class SyntenyApi
{
  static async getSyntenicRegions(params: SyntenyRequestParams)
  {
    const start = Date.now();
    try
    {
      const syntenyApiCalls: Promise<AxiosResponse<SyntenyResponseDTO[], any>>[] = [];
      const comparativeSpeciesMaps = params.comparativeSpecies.map(s => s.activeMap);
      const roundedStart = Math.round(params.start);
      const roundedStop = Math.round(params.stop);
      comparativeSpeciesMaps.forEach(map => {
        let apiRoute = `/vcmap/synteny/${params.backboneChromosome?.mapKey}/${params.backboneChromosome?.chromosome}/${roundedStart}/${roundedStop}/${map.key}`;

        // Append query params
        let optionCount = 0;
        if (Object.keys(params.optional).length > 0)
        {
          apiRoute += `?`;
          if (params.optional.threshold != null && params.optional.threshold > 0)
          {
            apiRoute += `threshold=${params.optional.threshold}`;
            optionCount++;
          }

          if (params.optional.includeGenes)
          {
            apiRoute += (optionCount > 0) ? `&includeGenes=1` : `includeGenes=1`;
            optionCount++;
          }

          if (params.optional.thresholdStart)
          {
            apiRoute += (optionCount > 0) ? `&thresholdStart=${params.optional.thresholdStart}` : `thresholdStart=${params.optional.thresholdStart}`;
            optionCount++;
          }

          if (params.optional.thresholdEnd)
          {
            apiRoute += (optionCount > 0) ? `&thresholdEnd=${params.optional.thresholdEnd}` : `thresholdEnd=${params.optional.thresholdEnd}`;
            optionCount++;
          }

          if (params.optional.includeOrthologs)
          {
            apiRoute += (optionCount > 0) ? `&includeOrthologs=1` : `includeOrthologs=1`;
            optionCount++;
          }
        }

        syntenyApiCalls.push(httpInstance.get(apiRoute));
      });

      const syntenyResults = await Promise.allSettled(syntenyApiCalls);
      const speciesSyntenyData: SpeciesSyntenyData[] = [];
      syntenyResults.forEach((result, index) => {
        if (result.status === 'fulfilled')
        {
          const singleSpeciesSyntenyData = getSpeciesSyntenyDataFromDTO(result.value.data, params.comparativeSpecies[index]);
          logger.debug(`Syntenic regions found: ${singleSpeciesSyntenyData.regionData.length} ` +
            `[mapKey: '${singleSpeciesSyntenyData.mapKey}', threshold: '${params.optional.threshold}']`);
          speciesSyntenyData.push(singleSpeciesSyntenyData);
        }
        else
        {
          logger.error(result.status, result.reason);
        }
      });
      logger.debug(`Synteny API: ${Date.now() - start} ms`,
          params.backboneChromosome.chromosome, params.start, params.stop, params.optional.threshold);
      // logger.debug(`Synteny API: ${Date.now() - start} ms`, params);

      return speciesSyntenyData;
    }
    catch (error)
    {
      logger.error(error);
    }
  }
}




