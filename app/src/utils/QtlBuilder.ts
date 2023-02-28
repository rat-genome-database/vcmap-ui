import BackboneSection from "@/models/BackboneSection";
import DatatrackSection from "@/models/DatatrackSection";

export function createQtlDatatracks(qtls: any[], backboneSpecies: any, chromosome: any)
{
  const qtlDatatracks = qtls.map((qtl) => {
    const backboneSection = new BackboneSection({ start: qtl.start, stop: qtl.stop, windowStart: 0, windowStop: chromosome.seqLength, renderType: 'detailed' });
    const newQtl = new DatatrackSection({start: qtl.start, stop: qtl.stop, backboneSection: backboneSection}, 'qtl', 'blue');
    newQtl.opacity = 0.01;
    newQtl.adjustYPositionsBasedOnVisibleStartAndStop(0, chromosome.seqLength);
    return newQtl;
  });
  return qtlDatatracks;
}