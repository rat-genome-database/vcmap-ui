import httpInstance from './httpInstance';

export default class QtlApi
{
  static async getQtls(chr: string, start: number, stop: number, mapKey: number)
  {
    const qtlRes = await httpInstance.get<any>(`/qtls/mapped/${chr}/${start}/${stop}/${mapKey}`);
    return qtlRes.data;
  }
}