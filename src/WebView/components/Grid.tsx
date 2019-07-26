import * as React from "react";

export interface DataProps {
  gridWidth: number;
  gridHeight: number;
  lineColor: string;
  gridSize: number;
  griItemCount?: number;
  scale: number;
}

export interface GridProps extends DataProps, React.HTMLAttributes<SVGGElement> {}

export interface GridState {
  offsetX: number;
  offsetY: number;
  scale?: number;
  currGridWidth: number;
  currGridHeight: number;
}

export class Grid extends React.Component<GridProps, GridState> {
  state: GridState = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    currGridWidth: this.props.gridWidth,
    currGridHeight: this.props.gridHeight
  }
  render() {
    const {
      gridWidth: gridWitdh,
      gridHeight,
      lineColor,
      gridSize,
      griItemCount,
      ...attributes
    } = this.props;
    const {
      offsetX,
      offsetY,
      scale,
      currGridWidth: currGridWidth,
      currGridHeight
    } = this.state
    const rootStyle = {
      position: "fixed",
      left: 0,
      right: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    } as React.CSSProperties;

    let rowMaxCount = currGridWidth / scale / gridSize;
    rowMaxCount = Number.isInteger(rowMaxCount) ? rowMaxCount + 1 : Math.ceil(rowMaxCount);

    return (
      <svg transform={`translate(${offsetX % (gridSize * scale)}, ${offsetY % (gridSize * scale)})`} {...attributes} style={rootStyle}>
        {Array(rowMaxCount * 10).fill(0).map((zero, index) => {
          const x = index * (gridSize / griItemCount);
          const strokeWidth = .2 / scale;
          return [
            <line
              x1={x}
              y1="0"
              x2={x}
              y2={currGridHeight}
              stroke={lineColor}
              strokeOpacity={.5}
              strokeWidth={strokeWidth}
            />,
            <line
              x1="0"
              y1={x}
              x2={currGridWidth}
              y2={x}
              stroke={lineColor}
              strokeOpacity={.5}
              strokeWidth={strokeWidth}
            />
          ]
        })}
        {Array(rowMaxCount).fill(0).map((zero, index) => {
          const x = index * gridSize;
          const strokeWidth = .4 / scale;
          return [
            <line
              x1={x}
              y1="0"
              x2={x}
              y2={currGridHeight}
              stroke={lineColor}
              strokeWidth={strokeWidth}
            />,
            <line
              x1="0"
              y1={x}
              x2={currGridWidth}
              y2={x}
              stroke={lineColor}
              strokeWidth={strokeWidth}
            />
          ]
        })}
      </svg>
    );
  }
}

export default Grid;
