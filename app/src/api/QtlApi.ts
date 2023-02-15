import httpInstance from './httpInstance';

export default class QtlApi
{
  static async getQtls(chr: number, start: number, stop: number, mapKey: number)
  {
    const qtlRes = await httpInstance.get<any>(`/vcmap/qtls/${chr}/${start}/${stop}/${mapKey}`);
    console.log(qtlRes);
  }
}