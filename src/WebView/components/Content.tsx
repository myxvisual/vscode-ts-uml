import * as React from "react";
import * as PropTypes from "prop-types";
import { DocEntry } from "../../getFileDocEntries";
import SingleFile from "./SingleFile";
import { Config } from "./Board";
import { getConnectPathString } from "../utils/getConnectPathString";
import { getLayout, getFilePosition, setFilePosition, BoardLayout } from "../utils/layout";
export interface Position {
  x: number;
  y: number;
}
export interface Line {
  outputPosition: Position;
  toMember: {
    filename: string;
    memberName: string;
  };
}
export interface DocEntryDetail {
  lines?: Line[];
  inputPosition: Position;
}

export { DocEntry };

export interface ContentProps extends DataProps, React.SVGAttributes<SVGGElement> {}

export interface DataProps {
  fileDocEntries?: DocEntry[];
}
export interface ContentState {
  layout?: BoardLayout;
}

export interface Position {
  x: number;
  y: number;
}
export interface TypeOut {
  leftPosition?: Position;
  rightPosition?: Position;
  toFileType: {
    isLocal?: boolean;
    type?: string;
    escapedName?: string;
    filename?: string;
  };
}
export interface TypeIn {
  name?: string;
  leftPosition?: Position;
  rightPosition?: Position;
  type: string;
  filename: string;
}

export class Content extends React.Component<ContentProps, ContentState> {
  static contextTypes = { config: PropTypes.object };
  context: { config: Config };
  rootEl: SVGGElement;
  singleFiles: SingleFile[] = [];
  pathGroupEl: SVGGElement;

  componentWillMount() {
    this.readAllFilesByDepth();
  }

  readAllFilesByDepth = () => {

  }

  componentDidMount() {
    this.drawLines(false);
  }

  componentDidUpdate() {
    this.drawLines(false);
  }

  _isMounted = false;
  drawLines = (isCallback: any = true) => {
    if (isCallback) {
      if (!this._isMounted) return;
    }
    const { fileDocEntries } = this.props;

    while (this.pathGroupEl.firstChild) {
      this.pathGroupEl.removeChild(this.pathGroupEl.firstChild);
    }
    const allTypeInOuts = this.singleFiles.map((singleFile, index) => {
      const typeInOuts = singleFile.getTypeInOuts();
      return typeInOuts;
    });
    allTypeInOuts.forEach((typeInOuts, index) => {
      typeInOuts.forEach((typeInOut, x) => {
        const { typeOuts } = typeInOut;
        typeOuts.forEach((typeOut, y) => {
          const { leftPosition, rightPosition, toFileType } = typeOut;
          const { isLocal, filename, escapedName } = toFileType;
          if (isLocal) {
            const typeInOutSize = typeInOuts.length;
            for (let z = 0; z < typeInOutSize; z++) {
              const { typeIn } = typeInOuts[z];
              if (escapedName === typeInOut.typeIn.name) {
                this.insertPath(leftPosition,  typeInOut.typeIn.leftPosition);
              } else if (typeIn.name === escapedName) {
                // const isLtr = leftPosition.x < typeIn.leftPosition.x;
                // this.insertPath(isLtr ? rightPosition : leftPosition, isLtr ? typeIn.leftPosition : typeIn.rightPosition);
                this.insertPath(leftPosition, typeIn.rightPosition);
                break;
              }
            }
          } else if (filename) {
            const allFileSize = fileDocEntries.length;
            for (let fileIndex = 0; fileIndex < allFileSize; fileIndex ++) {
              if (fileDocEntries[fileIndex].filename === filename) {
                const typeInOuts = allTypeInOuts[fileIndex];
                const typeInOutSize = typeInOuts.length;
                for (let z = 0; z < typeInOutSize; z++) {
                  const { typeIn } = typeInOuts[z];
                  if (typeIn.name === escapedName) {
                    // const isLtr = leftPosition.x < typeIn.leftPosition.x;
                    // const isMiddle = (rightPosition.x < typeIn.rightPosition.x && rightPosition.x > typeIn.leftPosition.x) || (
                    //   typeIn.rightPosition.x < rightPosition.x && typeIn.rightPosition.x > leftPosition.x
                    // );
                    // if (isMiddle) {
                    //   this.insertPath(rightPosition, typeIn.rightPosition);
                    // } else {
                    //   this.insertPath(isLtr ? rightPosition : leftPosition, isLtr ? typeIn.leftPosition : typeIn.rightPosition);
                    // }

                    this.insertPath(leftPosition, typeIn.rightPosition);
                    break;
                  }
                }
                break;
              }
            }
          }
        });
      });
    });
    this._isMounted = true;
  }

  insertPath = (startPosition: Position, endPosition: Position) => {
    const { color, strokeDasharray } = this.context.config.connectPathStyle;
    const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgPath.setAttributeNS(null, "d", getConnectPathString(startPosition, endPosition));
    svgPath.setAttributeNS(null, "stroke", color);
    svgPath.setAttributeNS(null, "stroke-opacity", ".5");
    svgPath.setAttributeNS(null, "stroke-dasharray", strokeDasharray);
    svgPath.setAttributeNS(null, "marker-start", "url(#arrowStart)");
    // svgPath.setAttributeNS(null, "marker-end", "url(#arrowStart)");
    svgPath.setAttributeNS(null, "fill", "none");
    this.pathGroupEl.appendChild(svgPath);
  }

  originDocEntrie: DocEntry[] = [...this.props.fileDocEntries];

  render() {
    const { fileDocEntries, children, ...attributes } = this.props;
    
    for (const docEntry of fileDocEntries) {
      if (this.context.config.showType === "export") {
        docEntry["originMembers"] = docEntry.members;
        docEntry.members = docEntry.members.filter(member => docEntry.exportMembers.includes(member.name));
      } else {
        if (docEntry["originMembers"]) {
          docEntry.members = docEntry["originMembers"];
        }
      }
    }
    this.singleFiles = [];
    const layout = getLayout(fileDocEntries, this.context.config);
    const contentLayout = { position: layout.contentPosition, scale: layout.contentScale };

    return (
      <g
        {...attributes}
        transform={`translate(${contentLayout.position.x}, ${contentLayout.position.y}) scale(${layout.contentScale})`}
        scale={contentLayout.scale}
        ref={rootEl => this.rootEl = rootEl}
      >
        {fileDocEntries && fileDocEntries.map((fileDocEntry, index) => {
          const position = getFilePosition(fileDocEntry.filename);
            return (
              <SingleFile
                {...fileDocEntry}
                ref={singleFile => this.singleFiles[index] = singleFile}
                key={index}
                fileWidth={fileDocEntry.fileWidth}
                transform={`translate(${position.x}, ${position.y})`}
                onChangeView={position => {
                  this.drawLines(true);
                  setFilePosition(fileDocEntry.filename, position);
                }}
              />
            );
          })}
        <g ref={pathGroupEl => this.pathGroupEl = pathGroupEl} />
      </g>
    );
  }
}

export default Content;
