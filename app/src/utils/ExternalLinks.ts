import DatatrackSection from "@/models/DatatrackSection";
import SyntenySection from "@/models/SyntenySection";

export function createUrl(
  section: SyntenySection | DatatrackSection,
  mapKey?: number
) {
  // Comment in to make use of actual species for link out. Currently , only rat works .
  //   const assembly =
  //     section.mapName === "GRCh38" ? "GRCh38.p14" : section.mapName;
  const assembly = "mRatBN7.2";
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
