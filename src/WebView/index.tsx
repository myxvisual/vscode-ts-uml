import * as React from "react";
import * as ReactDOM from "react-dom";

import Board from "./components/Board";

const { render } = ReactDOM;
const rootEl = document.getElementById("app");

const renderToDOM = (AppContainer?: new() => React.Component<any, any>, AppComponent = Board) => {
  if (AppContainer) {
    render(
      <AppContainer>
        <AppComponent />
      </AppContainer>,
      rootEl
    );
  } else {
    render(<Board />, rootEl);
  }
};

renderToDOM();
