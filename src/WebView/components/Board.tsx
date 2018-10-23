import * as React from "react";
import * as PropTypes from "prop-types";
import Content, { DocEntry } from "./Content";
import ControlTool from "./ControlTool";
import { getScale, getTranslate } from "../utils/getTransform";
import { setContentLayout, isVSCode } from "../utils/layout";
import * as devDefaultFileDocEntries from "./devDefaultFileDocEntries.json";
import Grid from './Grid';
import { config, Config } from "../../config";
import { Theme, getTheme } from "react-uwp/Theme";
import Button from 'react-uwp/Button';
import CheckBox from 'react-uwp/CheckBox';
export { Config };


export interface Theme {
  accent?: string;
}
export interface Position {
  x: number;
  y: number;
}
declare var vscode;
declare var acquireVsCodeApi;
let oldState: any;
if (window["acquireVsCodeApi"]) {
  vscode = acquireVsCodeApi();
  oldState = vscode.getState()
}

const gridConfig = {
  gridWitdh: window.innerWidth,
  gridHeight: window.innerHeight,
  lineColor: "#000",
  gridSize: 100,
  griItemCount: 10,
  scale: 1
}
export interface DataProps {
  staticContext?: any;
}

export interface BoardProps extends DataProps, React.HTMLAttributes<SVGElement>, Config {}

export interface BoardState {
  config?: Config;
  fileDocEntries?: DocEntry[];
}

export class Board extends React.Component<BoardProps, BoardState> {
  context: {
    config: Config
  };
  showScaleEl: HTMLSpanElement;
  state: BoardState = {
    config,
    fileDocEntries: isVSCode ? [] : devDefaultFileDocEntries
  }
  mouseStatPosition: {
    x?: number;
    y?: number
  } = {};
  originTransform: {
    x?: number;
    y?: number;
    scale?: number;
  } = {
    x: 0,
    y: 0,
    scale: 1
  };
  screenMatrix: SVGMatrix;
  content: Content;

  static childContextTypes = {
    config: PropTypes.object
  };

  getChildContext = () => {
    return {
      config: this.state.config
    };
  }

  static defaultProps = {
    style: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  rootEl: SVGElement;
  grid: Grid;

  componentWillMount() {
    const parentEl = document.querySelector("body");
    parentEl.style.overflow = "hidden";
    parentEl.style.margin = "0";
  }

  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.rootEl.addEventListener("wheel", this.handleWheel);
    document.body.querySelectorAll("div").forEach(divEl => {
      if (divEl.className.includes("fluent-background")) {
        divEl.style.background = "none";
      }
    })

    // window.addEventListener('message', event => {
    //   const message = event.data; // The JSON data our extension sent
    //   if (message.fileDocEntries) {
    //     const newFileDocEntries = JSON.parse(message.fileDocEntries);
    //     if (newFileDocEntries.length > 0) {
    //       this.setState({
    //         fileDocEntries: newFileDocEntries
    //       })
    //     }
    //   }
    // });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
    this.rootEl.removeEventListener("wheel", this.handleWheel);
  }

  handleWheel = (e: WheelEvent) => {
    const el = this.content.rootEl;
    if (e.ctrlKey) {
      this.originTransform.scale = Number((this.originTransform.scale + e.deltaY * .001).toFixed(2));
      if (this.originTransform.scale < .01) {
        this.originTransform.scale = .01;
      }
      el.setAttributeNS(null, "transform", `translate(${this.originTransform.x}, ${this.originTransform.y}), scale(${this.originTransform.scale})`);
      this.showScaleEl.innerText = `${Math.ceil(this.originTransform.scale * 100)}%`;
      setContentLayout({ x: this.originTransform.x, y: this.originTransform.y }, this.originTransform.scale);
    } else {
      this.setOriginTransform();
      const x = this.originTransform.x - e.deltaX;
      const y = this.originTransform.y - e.deltaY;
      el.setAttributeNS(null, "transform", `translate(${x}, ${y}), scale(${this.originTransform.scale})`);
      setContentLayout({ x, y }, this.originTransform.scale);
    }
  }

  updateScale = (offsetScale: number) => {
    const el = this.content.rootEl;
    this.originTransform.scale = Number((this.originTransform.scale + offsetScale).toFixed(2));
    if (this.originTransform.scale < .01) {
      this.originTransform.scale = .01;
    }
    el.setAttributeNS(null, "transform", `translate(${this.originTransform.x}, ${this.originTransform.y}), scale(${this.originTransform.scale})`);
    this.showScaleEl.innerText = `${Math.ceil(this.originTransform.scale * 100)}%`;
    setContentLayout({ x: this.originTransform.x, y: this.originTransform.y }, this.originTransform.scale);
  }

  resize = (e: Event) => {
    const { innerHeight, innerWidth } = window;
    this.rootEl.style.height = `${innerHeight}px`;
    this.rootEl.style.width = `${innerWidth}px`;
    this.grid.setState({
      currGridWitdh: innerWidth,
      currGridHeight: innerHeight
    });
  }

  setOriginTransform = () => {
    const el = this.content.rootEl;
    this.screenMatrix = el.getScreenCTM();
    const transform = el.getAttributeNS(null, "transform");
    const translate = getTranslate(transform);
    const scale = getScale(transform);
    if (translate) {
      Object.assign(this.originTransform, translate);
    }
    if (scale !== null) {
      this.originTransform.scale = scale;
    }
  }

  handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    this.setOriginTransform();

    this.mouseStatPosition.x = e.clientX / this.screenMatrix.a;
    this.mouseStatPosition.y = e.clientY / this.screenMatrix.d;

    document.documentElement.addEventListener("mousemove", this.handleMouseMove);
    document.documentElement.addEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseMove = (e: MouseEvent) => {
    const el = this.content.rootEl;
    const offsetX = e.clientX / this.screenMatrix.a - this.mouseStatPosition.x;
    const offsetY = e.clientY / this.screenMatrix.d - this.mouseStatPosition.y;
    if (this.originTransform) {
      const x = this.originTransform.x + offsetX;
      const y = this.originTransform.y + offsetY;
      el.setAttributeNS(null, "transform", `translate(${x}, ${y}), scale(${this.originTransform.scale})`);

      setContentLayout({ x, y }, this.originTransform.scale);
    }
  }

  handleMouseUp = (e: MouseEvent | React.MouseEvent<SVGGElement>) => {
    document.documentElement.removeEventListener("mousemove", this.handleMouseMove);
    document.documentElement.removeEventListener("mouseup", this.handleMouseUp);
  }

  render() {
    const { staticContext, ...attributes } = this.props;
    const { connectPathStyle, contentStyle, theme, showType } = this.getChildContext().config as Config;
    const { arrowSize, color } = connectPathStyle;

    // const { fileDocEntries } = this.state;

    let JSONStr: string = null;
    if (isVSCode) {
      const docEntryEl: Element = document.getElementById("doc-entry");
      JSONStr = docEntryEl.innerHTML;
      JSONStr = decodeURIComponent(JSONStr);
    }
    const fileDocEntries = isVSCode ? JSON.parse(JSONStr) : devDefaultFileDocEntries;

    return (
      <div>
        <svg
          {...attributes}
          ref={rootEl => this.rootEl = rootEl}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          fill={contentStyle.background}
        >
        <defs>
          <marker
            id="arrowStart"
            orient="auto"
            markerHeight={arrowSize * 2}
            markerWidth={arrowSize}
            refY={arrowSize}
            refX="0"
          >
            <path d={`M0,0 V${arrowSize * 2} L${arrowSize},${arrowSize} Z`} fill={color} />
          </marker>
        </defs>
          <Content key={showType} ref={content => this.content = content} fileDocEntries={fileDocEntries} />
        </svg>
        {/* <Grid {...gridConfig} ref={grid => this.grid = grid} /> */}
        <div style={{ position: "fixed", right: 20, top: 20 }}>
          <Theme
            theme={getTheme({
              themeName: "dark",
              accent: theme.accent,
              useFluentDesign: false
            })}
            style={{
              background: "#111",
              border: `1px solid ${theme.accent}`,
              padding: "16px 8px",
            }}
          >
            <div>
              <CheckBox
                onCheck={checked => {
                  this.setState((prevState) => {
                    prevState.config.showType = config.showType === "member" ? "export" : "member";
                    this.showScaleEl.innerText = "100%";
                    return prevState;
                  })
                }}
                style={{ marginBottom: 16 }}
                key={config.showType}
                defaultChecked={config.showType === "export"}
                label="Just Show Export"
              />
            </div>
            <div>
              <Button style={{ background: theme.accent }} onClick={() => this.updateScale(.1)}>
                +
              </Button>
              <span
                ref={showScaleEl => this.showScaleEl = showScaleEl}
                style={{
                  margin: "0 8px",
                  display: "inline-block",
                  width: 60,
                  textAlign: "center"
                }}
              >
                {Math.ceil(this.originTransform.scale * 100)}%
              </span>
              <Button style={{ background: theme.accent }} onClick={() => this.updateScale(-.1)}>
                -
              </Button>
            </div>
          </Theme>
        </div>
      </div>
    );
  }
}

export default Board;
