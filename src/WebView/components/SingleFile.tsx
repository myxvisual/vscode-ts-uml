import * as React from "react";
import * as PropTypes from "prop-types";
import { Config } from "./Board";
import Table from "./Table";
import { getTranslate } from "../utils/getTransform";
import { addDragToSVGElement } from "../utils/addDragToSVGElement";
import { getTablePosition, setTablePosition, getContentLayout } from "../utils/layout";
import { TypeOut, TypeIn } from "./Content";

const originOffsetX = -20;

import { DocEntry } from "../../getFileDocEntries";
export interface DataProps extends DocEntry {
  onChangeView?: (position?: { x: number; y: number }) => void;
}
export interface SingleFileProps extends DataProps, React.SVGAttributes<SVGGElement> {}

const reType = /(\w+)(\[\])*/i;
export class SingleFile extends React.Component<SingleFileProps> {
  static contextTypes = { config: PropTypes.object };
  context: { config: Config };
  tables: Table[] = [];
  rootEl: SVGGElement;
  wrapperEl: SVGGElement;
  tablesContainer: SVGGElement;
  backgroundEl: SVGRectElement;
  headerTextEl: SVGTextElement;
  headerEl: SVGRectElement;
  hue = Math.random() * 255;
  backgroundRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0
  };
  typeInOuts: {
    typeIn?: TypeIn;
    typeOuts?: TypeOut[];
  }[] = [];

  docEntries: DocEntry[] = [];

  componentDidMount() {
    this.originTablesRect = this.tablesContainer.getBoundingClientRect();
    this.originRootTranslate = this.getSVGRootTranslate();
    addDragToSVGElement(this.headerEl, this.rootEl, this.props.onChangeView);
    this.screenMatrix = this.tablesContainer.getCTM();
    this.redrawDOM();
  }

  componentDidUpdate() {
    this.redrawDOM();
  }

  getFileTranslate = () => {
    const transform = this.rootEl.getAttributeNS(null, "transform");
    const position = getTranslate(transform);
    return position;
  }

  getSVGRootTranslate = () => {
    if (!this.rootEl) {
      const contentLayout = getContentLayout();
      return { x: contentLayout.position.x, y: contentLayout.position.y };
    }
    const boardEl: SVGSVGElement = this.rootEl.parentElement as any;
    const boardTranslate = getTranslate(boardEl.getAttributeNS(null, "transform")) || { x: 0, y: 0 };
    return boardTranslate;
  }

  getTypeInOuts = () => {
    const { locals } = this.props;
    const {
      headerHeight,
      itemHeight
    } = this.context.config.tableStyle;

    this.screenMatrix = this.tablesContainer.getCTM();
    const boardTranslate = this.getSVGRootTranslate();
    if (!this.docEntries) return [];

    this.docEntries.forEach((docEntry, index) => {
      const { members, type, filename, name, tableWidth } = docEntry;
      const table = this.tables[index];
      const tableRect = table ?  table.rootEl.getBoundingClientRect() : { left: 0, top: 0 } as any;
      const typeOuts: TypeOut[] = [];
      let leftX = tableRect.left - boardTranslate.x + originOffsetX;
      leftX = leftX / this.screenMatrix.a;
      let rightX = leftX + tableWidth;
      let y = tableRect.top / this.screenMatrix.d + headerHeight / 2 - boardTranslate.y / this.screenMatrix.d;
      const typeInOutFile = {
        typeIn: {
          name,
          leftPosition: {
            x: leftX,
            y
          },
          rightPosition: {
            x: rightX,
            y
          },
          type,
          filename
        },
        typeOuts
      };
      this.typeInOuts[index] = typeInOutFile;

      if (members) {
        members.forEach((member, index) => {
          const escapedName = member.type.match(reType)[1];
          let localIndex = -1;
          if (escapedName) {
            for (const index in locals) {
              if (locals[index].name === escapedName) {
                localIndex = Number(index);
                break;
              }
            }
          }
          const y = tableRect.top / this.screenMatrix.d + headerHeight + itemHeight * index + itemHeight / 2 - boardTranslate.y / this.screenMatrix.d;
          typeOuts[index] = {
            leftPosition: {
              x: leftX,
              y
            },
            rightPosition: {
              x: rightX,
              y
            },
            toFileType: {
              isLocal: localIndex > -1 ? (!locals[localIndex].filename) : false,
              escapedName,
              type: member.type,
              filename: localIndex > -1 ? locals[localIndex].filename : void 0
            }
          };
        });
      }


      const memberSize = docEntry.members ? docEntry.members.length : 0;
      const setPosition = (targetIndex: number, escapedName: string, type: string) => {
        let localIndex = -1;
        if (escapedName) {
          for (const index in locals) {
            if (locals[index].name === escapedName) {
              localIndex = Number(index);
              break;
            }
          }
        }
        typeOuts[targetIndex + memberSize] = {
          leftPosition: {
            x: leftX,
            y
          },
          rightPosition: {
            x: rightX,
            y
          },
          toFileType: {
            isLocal: localIndex > -1 ? (!locals[localIndex].filename) : false,
            escapedName,
            type,
            filename: localIndex > -1 ? locals[localIndex].filename : void 0
          }
        };
      };
      if (docEntry.extends) {
        let index = 0;
        let targetIndex = 0;
        const extendsSize = docEntry.extends.length;

        while (index < extendsSize) {
          const extendsItem: DocEntry = docEntry.extends[index] as DocEntry;
          const escapedName = extendsItem.name.match(reType)[1];

          // Get ReactComponent Extends
          if (escapedName === "Component") {
            const reComponent = /(?:React\.)?(?:Component)\<?((\w+\,?\s?)+)\>?/im;
            const result = reComponent.exec(docEntry.valueDeclarationText);
            if (result[1]) {
              const escapedNames = result[1].split(",").map(str => str.trim());
              setPosition(targetIndex, escapedNames[0], extendsItem.type);
              targetIndex += 1;
              setPosition(targetIndex, escapedNames[1], extendsItem.type);
            }
          } else {
            setPosition(targetIndex, escapedName, extendsItem.type);
          }
          index += 1;
          targetIndex += 1;
        }
      }
    });
    return this.typeInOuts;
  }

  getAllExportDocEntry = (exportDocEntry: DocEntry) => {
    const { members } = this.props;
    let index = -1;
    if (members) {
      for (let i = 0; i < members.length; i++) {
        if (members[i].name === exportDocEntry.name) {
          index = i;
          break;
        }
      }
    }
    return index > -1 ? members[index] : exportDocEntry;
  }

  findMaxLetter = (docEntry: DocEntry) => {
    const headerCount = docEntry.name.length + docEntry.type.length;
    if (docEntry.members && docEntry.members.length > 0) {
     const maxCount = docEntry.members.reduce((prev, current) => {
        const letterCount = current.name ? current.name.length : 0 + current.type ? current.type.length : 0;
        return letterCount > prev ? letterCount : prev;
      }, 0);
      return headerCount > maxCount ? headerCount : maxCount;
    } else {
      return headerCount;
    }
  }

  screenMatrix: SVGMatrix;
  handleChangeTableView = (isCallback = true) => {
    const { onChangeView } = this.props;
    if (onChangeView) {
      onChangeView(this.getFileTranslate());
    }
    this.redrawDOM();
  }

  originRootTranslate: { x: number; y: number };
  originTablesRect: ClientRect;
  redrawDOM = () => {
    const { members, fileWidth, fileHeight } = this.props;
    const hadMembers = members && members.length > 0;
    const tablesRect = this.tablesContainer.getBoundingClientRect();
    const { widthPadding, headerHeight, heightPadding, headerFontSize } = this.context.config.fileStyle;
    this.wrapperEl.setAttributeNS(null, "display", "none");

    const x = -widthPadding;
    const y = -headerHeight - heightPadding;
    this.screenMatrix = this.tablesContainer.getCTM();
    const width = hadMembers ? `${tablesRect.width / this.screenMatrix.a + widthPadding * 2}` : `${fileWidth}`;
    const height = hadMembers ? `${tablesRect.height / this.screenMatrix.d + heightPadding * 2 + headerHeight}` : `${fileHeight}`;

    this.headerEl.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
    this.headerEl.setAttributeNS(null, "width", width);

    this.backgroundEl.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
    this.backgroundEl.setAttributeNS(null, "width", width);
    this.backgroundEl.setAttributeNS(null, "height", height);

    this.headerTextEl.setAttributeNS(null, "transform", `translate(${x + 4}, ${y + (headerHeight + headerFontSize) / 2})`);

    const wrapperRect = this.wrapperEl.getBoundingClientRect();
    const offsetX = (tablesRect.left - wrapperRect.left) / this.screenMatrix.a + x;
    const offsetY = (tablesRect.top - wrapperRect.top) / this.screenMatrix.d + y;
    this.wrapperEl.setAttributeNS(null, "display", "");
    this.wrapperEl.setAttributeNS(null, "transform", `translate(${offsetX}, ${offsetY})`);
  }

  render() {
    let {
      name,
      filename,
      members,
      exports,
      resolvedModules,
      onChangeView,
      rowIndex,
      fileWidth,
      fileHeight,
      valueDeclarationText,
      memberLayouts,
      exportLayouts,
      escapedName,
      exportMembers,
      ...attributes
    } = this.props;
    const { config } = this.context;
    const justShowExport = config.showType === "export";
    this.typeInOuts = [];
    const { headerFontSize, headerHeight } = this.context.config.fileStyle;

    if (exports) {
      exports = exports
      .map(exportDocEntry => this.getAllExportDocEntry(exportDocEntry))
      .filter(docEntry => docEntry.name !== "default");
    }
    const docEntries = justShowExport ? exports : members;
    this.docEntries = docEntries;

    const x = 0;
    const y = 0;

    return (
      <g ref={rootEl => this.rootEl = rootEl} {...attributes}>
        <g ref={wrapperEl => this.wrapperEl = wrapperEl} display="none">
        <rect
          width={fileWidth}
          height={fileHeight}
          fill="#e5e5e5"
          stroke={config.theme.accent}
          // strokeWidth="1"
          // strokeOpacity=".75"
          // strokeDasharray="2 4"
          pointerEvents="none"
          ref={backgroundEl => this.backgroundEl = backgroundEl}
          transform={`translate(${x}, ${y})`}
        />
        <rect
          cursor="move"
          width={fileWidth}
          height={headerHeight}
          transform={`translate(${x}, ${y})`}
          ref={headerEl => this.headerEl = headerEl}
          fill="#000"
        />
        <text
          x="0"
          y="0"
          fill="#fff"
          fontSize={headerFontSize}
          pointerEvents="none"
          transform={`translate(${x + 4}, ${y + (headerHeight + headerFontSize) / 2})`}
          ref={headerTextEl => this.headerTextEl = headerTextEl}
        >
          {filename}
          {/* {(filename && filename.length > 60) ? `${filename.slice(0, 60)}...` : filename} */}
        </text>
        </g>
        <g ref={tablesContainer => this.tablesContainer = tablesContainer}>
          {docEntries && docEntries.map((docEntry, index) => {
            const position = getTablePosition(filename, docEntry.name);
            return (
              <Table
                {...(justShowExport ? this.getAllExportDocEntry(docEntry) : docEntry)}
                onChangeView={(position) => {
                  this.handleChangeTableView();
                  setTablePosition(filename, docEntry.name, position);
                }}
                ref={table => this.tables[index] = table}
                key={index}
                transform={`translate(${position.x}, ${position.y})`}
              />
            );
          })}
        </g>
      </g>
    );
  }
}

export default SingleFile;
