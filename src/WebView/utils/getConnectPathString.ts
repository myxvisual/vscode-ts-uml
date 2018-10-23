const radius = 20;
const offset = 10;

export function getConnectPathString(
  startPosition: { x: number; y: number },
  endPosition: { x: number; y: number },
  useBezier = true
) {
  const ltr = endPosition.x > startPosition.x;
  let str = `M ${startPosition.x} ${startPosition.y} `;
  if (useBezier) {
    if (startPosition.x !== endPosition.x) {
      const offset = Math.abs(startPosition.x - endPosition.x) / 2;
      str += `C${startPosition.x + (ltr ? offset : -offset)},${startPosition.y} ${endPosition.x + (ltr ? -offset : offset)},${endPosition.y} ${endPosition.x},${endPosition.y}`;
    } else {
      const offset = startPosition.x - 100;
      str += `C${offset},${startPosition.y} ${offset},${endPosition.y} ${endPosition.x},${endPosition.y}`;
    }
  } else {
    const middleX = endPosition.x + (ltr ? -offset : offset);
    str += `L ${middleX} ${startPosition.y} `;
    str += `L ${middleX} ${endPosition.y} `;
    str += `L ${endPosition.x} ${endPosition.y} `;
  }
  return str;
}

export default getConnectPathString;
