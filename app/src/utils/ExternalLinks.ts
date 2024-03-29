/**
 * Helper methods for building URLs for external pages
 */

import Gene from "@/models/Gene";
import Species from "@/models/Species";

const EXTERNAL_URL_CONSTANTS = {
  jbrowse2: 'https://rgd.mcw.edu/rgdweb/jbrowse2/find.jsp',
  variantVisualizer: 'https://rgd.mcw.edu/rgdweb/front/config.html',
  geneReport: 'https://rgd.mcw.edu/rgdweb/report/gene/main.html',
};

/**
 * Creates a JBrowse2 link for a processed GenomicSection (these are processed "sections" of data e.g. synteny section, datatrack section)
 */
export function createJBrowse2UrlForGenomicSection(assembly: string, chromosome: string, speciesStart: number, speciesStop: number) {
  const {
    start,
    stop,
  } =  extractSectionData(speciesStart, speciesStop);

  // Construct JBrowse URL
  const jbrowseUrl = `${EXTERNAL_URL_CONSTANTS.jbrowse2}?dest=jbrowse2&assembly=${assembly}&loc=chr${chromosome}:${start}-${stop}`;
  return jbrowseUrl;
}

/**
 * Creates a JBrowse2 link for a Gene
 */
export function createJBrowse2UrlForGene(gene: Gene, geneSpecies: Species) {
  const {
    assembly,
    chromosome,
    start,
    stop,
  } =  extractGeneData(gene, geneSpecies);

  // Construct JBrowse URL
  const jbrowseUrl = `${EXTERNAL_URL_CONSTANTS.jbrowse2}?dest=jbrowse2&assembly=${assembly}&loc=chr${chromosome}:${start}-${stop}`;
  return jbrowseUrl;
}

/**
 * Creates a Variant Visualizer link for a processed GenomicSection (these are processed "sections" of data e.g. synteny section, datatrack section)
 */
export function createVariantVisualizerUrl(mapKey: number, chromosome: string, speciesStart: number, speciesStop: number) {
  const {
    start,
    stop,
  } =  extractSectionData(speciesStart, speciesStop);

  // Construct Variant Visualizer URL
  const vvURL = `${EXTERNAL_URL_CONSTANTS.variantVisualizer}?mapKey=${mapKey}&chr=${chromosome}&start=${start}&stop=${stop}`;
  return vvURL;
}

/**
 * Creates a RGD Gene Report link for a specific Gene
 */
export function createGeneReportUrl(rgdId: number) {
  return `${EXTERNAL_URL_CONSTANTS.geneReport}?id=${rgdId}`;
}

function extractSectionData(speciesStart: number, speciesStop: number) {
  let start = speciesStart;
  let stop = speciesStop;

  // Invert start/stop if needed
  if (start > stop) [start, stop] = [stop, start];

  return {
    start,
    stop,
  };
}

function extractGeneData(gene: Gene, geneSpecies: Species) {
  const assembly = geneSpecies.activeMap.name;
  const chromosome = gene.chromosome;
  let start = gene.start;
  let stop = gene.stop;

  // Invert start/stop if needed
  if (start > stop) [start, stop] = [stop, start];

  return {
    assembly,
    chromosome,
    start,
    stop,
  };
}
