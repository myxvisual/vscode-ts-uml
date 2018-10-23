import * as React from "react";

export interface DataProps {
  gridWitdh: number;
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
  currGridWitdh: number;
  currGridHeight: number;
}

export class Grid extends React.Component<GridProps, GridState> {
  state: GridState = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    currGridWitdh: this.props.gridWitdh,
    currGridHeight: this.props.gridHeight
  }
  render() {
    const {
      gridWitdh,
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
      currGridWitdh,
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

    let rowMaxCount = currGridWitdh / scale / gridSize;
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
              x2={currGridWitdh}
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
              x2={currGridWitdh}
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
