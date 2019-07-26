import * as React from "react";
import * as PropTypes from "prop-types";
import { addDragToSVGElement } from "../utils/addDragToSVGElement";

import { Config } from "./Board";

import { DocEntry } from "../../getFileDocEntries";

export interface DataProps extends DocEntry {
  onChangeView?: (tablePosition?: { x: number; y: number }) => void;
}
export interface TableProps extends DataProps, React.SVGAttributes<SVGGElement> {}

export class Table extends React.Component<TableProps> {
  static contextTypes = { config: PropTypes.object };
  context: { config: Config };
  rootEl: SVGGElement;
  dragEl: SVGGElement;

  componentDidMount() {
    addDragToSVGElement(this.dragEl, this.rootEl, this.props.onChangeView);
  }

  render() {
    const {
      name,
      type,
      members,
      tableWidth,
      onChangeView,
      columnIndex,
      tableHeight,
      valueDeclarationText,
      escapedName,
      initializerText,
      ...attributes
    } = this.props;
    const { config } = this.context;
    const {
      theme,
      tableStyle
    } = config;
    const {
      itemHeight,
      itemPadding,
      headerFontSize,
      itemFontSize,
      headerHeight
    } = tableStyle;

    return (
      <g
        {...attributes}
        ref={rootEl => this.rootEl = rootEl}
        >
        <rect
          ref={dragEl => this.dragEl = dragEl}
          fill={theme.accent}
          fillOpacity={1}
          width={tableWidth}
          height={headerHeight}
          style={{ cursor: "move" }}
        />
        <text
          fill="#fff"
          fontSize={headerFontSize}
          pointerEvents="none"
        >
          <tspan
            x={itemPadding}
            y={itemPadding + itemFontSize}
          >
            {name}
          </tspan>
          <tspan
            fill="rgba(255, 255, 255, .75)"
            textAnchor="end"
            x={tableWidth - itemPadding}
            y={itemPadding + itemFontSize}
          >
            {type.slice(0, config.maxShowTypeLength)}
          </tspan>
        </text>
        <g fontSize={itemFontSize}>
          {members && members.map((item, index) => {
            const { name, type, isRequired } = item;
            const middleY = (itemHeight - itemFontSize) / 2 + itemFontSize;
            return (
              <g transform={`translate(0, ${itemHeight * (1 + index) + headerHeight - itemHeight})`} key={index}>
                <rect
                  fill="#fff"
                  width={tableWidth}
                  height={itemHeight}
                />
                <text fill="#000" fontSize={itemFontSize}>
                  <tspan
                    x={itemPadding}
                    y={middleY}
                  >
                    {name}
                  </tspan>
                  <tspan
                    fill="#666"
                    textAnchor="end"
                    x={tableWidth - itemPadding}
                    y={middleY}
                  >
                    {`${isRequired ? ":" : "?:" }${type.length > config.maxShowTypeLength  ? type.slice(0, config.maxShowTypeLength) : type}`}
                  </tspan>
                </text>
              </g>
            );
          })}
        </g>
      </g>
    );
  }
}

export default Table;
