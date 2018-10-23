import { getTranslate } from "./getTransform";

export function addDragToSVGElement<T extends SVGGElement = SVGGElement, F extends SVGGElement = SVGGElement>(targetEl: T, transformEl?: F, onChangeView?: (position?: { x?: number; y?: number; }) => void) {
  if (!targetEl) return;
  if (!transformEl) {
    transformEl = targetEl as any;
  }

  const mouseStatPosition: {
    x?: number;
    y?: number
  } = { x: 0, y: 0 };
  const originTransform: {
    x?: number;
    y?: number;
  } = { x: 0, y: 0 };
  const currTransform: {
    x?: number;
    y?: number;
  } = { x: 0, y: 0 };
  let screenMatrix: SVGMatrix;

  targetEl.addEventListener("mousedown", handleMouseDown as any);
  targetEl.addEventListener("mouseup", handleMouseUp as any);

  function handleMouseDown (e: React.MouseEvent<T>) {
    e.stopPropagation();
    screenMatrix = transformEl.getScreenCTM();
    mouseStatPosition.x = e.clientX / screenMatrix.a;
    mouseStatPosition.y = e.clientY / screenMatrix.d;
    const transform = transformEl.getAttributeNS(null, "transform");
    const translate = getTranslate(transform);
    if (translate) {
      Object.assign(originTransform, translate);
    }

    document.documentElement.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove (e: MouseEvent) {
    const offsetX = e.clientX / screenMatrix.a - mouseStatPosition.x;
    const offsetY = e.clientY / screenMatrix.d - mouseStatPosition.y;
    const x = originTransform.x + offsetX;
    const y = originTransform.y + offsetY;
    currTransform.x = x;
    currTransform.y = y;
    transformEl.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
    if (onChangeView) onChangeView({ x, y });
  }

  function handleMouseUp (e: MouseEvent | React.MouseEvent<SVGRectElement>) {
    if (onChangeView) onChangeView(currTransform);

    document.documentElement.removeEventListener("mousemove", handleMouseMove);
    document.documentElement.removeEventListener("mouseup", handleMouseUp);
  }
}

export default addDragToSVGElement;
