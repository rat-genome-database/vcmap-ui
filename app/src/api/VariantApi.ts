import httpInstance from './httpInstance';

export default class VariantApi
{
  static async getVariants(chr: string, start: number, stop: number, mapKey: number)
  {
    const variantRes = await httpInstance.get<any>(`/vcmap/variants/${chr}/${start}/${stop}/${mapKey}`);
    return variantRes.data;
  }
}