import * as React from "react";

export interface DataProps {}

export interface SingleFileProps extends DataProps, React.HTMLAttributes<SVGGElement> {}

export class SingleFile extends React.Component<SingleFileProps> {
  render() {
    const { ...attributes } = this.props;

    return (
      <g {...attributes}>
        SingleFile
      </g>
    );
  }
}

export default SingleFile;
