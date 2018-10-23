export function getTranslate(str: string) {
  if (!str) {
    return {
      x: 0,
      y: 0
    };
  }
  const reTranslate = /translate\s*\(([-\+\d\.\s,e]+)\)/i;
  const xyStr = str.match(reTranslate)[1];
  if (xyStr) {
    const xyArr = xyStr.split(",").map(str => Number(str));
    return {
      x: xyArr[0],
      y: xyArr[1]
    };
  } else {
    return null;
  }
}

export function getScale(str: string) {
  if (!str) return 1;
  const reScale = /scale\((\d*\.*\d*)\)/i;
  const scaleStr = str.match(reScale)[1];
  return scaleStr ? Number(scaleStr) : null;
}
