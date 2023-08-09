import httpInstance from './httpInstance';

export default class EpigenomeApi
{
  static async getEpigenomePositions(chr: string, start: number, stop: number, mapKey: number)
  {
    ///vcmap/signal/position/12/1000000/2000000/1
   if(mapKey==360 || mapKey==372){
    const epigenomeStartPositions = await httpInstance.get<any>(`/vcmap/signal/position/${chr}/${start}/${stop}/1`);

    return epigenomeStartPositions.data;
   }else{

        const epigenomeStartPositions = await httpInstance.get<any>(`/vcmap/signal/position/${chr}/${start}/${stop}/2`);
    
        return epigenomeStartPositions.data;
       
   }
    
  }
}