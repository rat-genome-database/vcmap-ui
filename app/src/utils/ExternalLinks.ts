import GenomicSection from "@/models/GenomicSection";

export function createUrl(
  section: GenomicSection,
  mapKey?: number
) {
  const assembly = section.mapName;
  const chromosome = section.chromosome;
  let start = section.speciesStart;
  let stop = section.speciesStop;

  // Invert start/stop if needed
  if (start > stop) [start, stop] = [stop, start];

  if (section.type === "variant") {
    // Construct Variant Visualizer URL
    const vvURL = `https://rgd.mcw.edu/rgdweb/front/config.html?mapKey=${mapKey}&chr=${chromosome}&start=${start}&stop=${stop}`;
    return vvURL;
  } else {
    // Construct JBrowse URL
    const jbrowseBaseUrl =
      "https://rgd.mcw.edu/rgdweb/jbrowse2/find.jsp?dest=jbrowse2";

    const jbrowseUrl = `${jbrowseBaseUrl}?&assembly=${assembly}&loc=chr${chromosome}:${start}-${stop}`;
    return jbrowseUrl;
  }
}
