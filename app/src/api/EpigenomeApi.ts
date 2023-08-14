import httpInstance from './httpInstance';

enum SetIds {
    RAT = 1,
    HUMAN = 2,
}

const mapKeyToSetId: {[key: number]: number} = {
  360: SetIds.RAT,
  372: SetIds.RAT,
  70: SetIds.RAT,
  60: SetIds.RAT,
  38: SetIds.HUMAN,
  17: SetIds.HUMAN,
  13: SetIds.HUMAN,
}

const getSetId = (mapKey: number): number | undefined => {
  return mapKeyToSetId[mapKey]; 
}
export default class EpigenomeApi
{
  static async getEpigenomePositions(chr: string, start: number, stop: number, mapKey: number)
  {
    const setId = getSetId(mapKey);
    ///vcmap/signal/position/12/1000000/2000000/1
    const epigenomeStartPositions = await httpInstance.get<any>(`/vcmap/signal/position/${chr}/${start}/${stop}/${setId}`);

    return epigenomeStartPositions.data;
    
  }
}
