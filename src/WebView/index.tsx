import * as React from "react";
import * as ReactDOM from "react-dom";

declare var acquireVsCodeApi;
if (!window.vscode) {
  window.vscode = acquireVsCodeApi();
}
import Board from "./components/Board";

const { render } = ReactDOM;
const rootEl = document.getElementById("app");

const renderToDOM = (AppContainer?: new() => React.Component<any, any>, AppComponent = Board) => {
  if (AppContainer) {
    render(
      <div>
        <AppComponent />
      </div>,
      rootEl
    );
  } else {
    render(<Board />, rootEl);
  }
};

renderToDOM();
