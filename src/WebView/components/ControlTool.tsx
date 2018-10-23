import * as React from "react";

export interface DataProps {}

export interface ControlToolProps extends DataProps, React.HTMLAttributes<SVGGElement> {}

export class ControlTool extends React.Component<ControlToolProps> {
  render() {
    const { ...attributes } = this.props;

    return (
      <g {...attributes}>
        ControlTool
      </g>
    );
  }
}

export default ControlTool;
