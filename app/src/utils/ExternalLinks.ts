import { useStore } from "vuex";
import { key } from "@/store";
import DatatrackSection from "@/models/DatatrackSection";
import SyntenySection from "@/models/SyntenySection";

const store = useStore(key);

const findMapKey = (name: string) => {
  for (const species of store.state.comparativeSpecies) {
    if (name === species.name) return species.activeMap.key;
  }
  return store.state.species?.activeMap.key;
};

export function createUrl(section: SyntenySection | DatatrackSection) {
  const assembly =
    section.mapName === "GRCh38" ? "GRCh38.p14" : section.mapName;
  const chromosome = section.chromosome;
  const mapKey = findMapKey(section.speciesName);
  let start = section.speciesStart;
  let stop = section.speciesStop;

  // Invert start/stop if needed
  if (start > stop) [start, stop] = [stop, start];

  if (section.type === "variant") {
    //Construct Variant Visualizer URL
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
