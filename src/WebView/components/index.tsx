import * as React from "react";

export interface DataProps {}

export interface IndexProps extends DataProps, React.HTMLAttributes<HTMLDivElement> {}

export class Index extends React.Component<IndexProps> {
  render() {
    const { ...attributes } = this.props;

    return (
      <div {...attributes}>
        Index
      </div>
    );
  }
}

export default Index;
