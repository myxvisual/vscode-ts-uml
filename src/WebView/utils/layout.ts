import { DocEntry } from "../components/DocEntry";
import { Config, Position } from "../components/Board";
import { type } from "os";

export interface BoardLayout {
  contentPosition?: Position;
  contentScale?: number;
  filePositions?: {
    [filename: string]: {
      position?: Position;
      memberPositions: {
        [tableName: string]: {
          position?: Position;
        }
      };
    }
  };
}

let layout: BoardLayout = {};
let cachedFiles: DocEntry[];
let cachedConfig: Config;
const STORAGE_NAME = "ts-uml-layout";
let isVSCode = true;

export { isVSCode };


export function resetDefaultLayout(files: DocEntry[], config: Config) {
  // get default layout
  if (!files && cachedFiles) files = cachedFiles;
  if (!config && cachedConfig) config = cachedConfig;
  if (!(config && files)) return;

  layout.contentPosition = {
    x: config.contentStyle.padding + config.fileStyle.widthPadding,
    y: config.contentStyle.padding + config.fileStyle.headerHeight + config.fileStyle.heightPadding
  };
  layout.contentScale = 1;

  let prevLeft = 0;
  let prevTop = 0;
  layout.filePositions = {};
  cachedFiles.forEach((file, index) => {
    const memberPositions = {};
    layout.filePositions[file.filename] = {
      position: { x: 0, y: prevTop },
      memberPositions
    };
    const layouts = config.showType === "export" ? file.exportLayouts : file.memberLayouts;
    try {
      for (const memberName in layouts.memberPositions) {
        const pisiton = layouts.memberPositions[memberName];
        memberPositions[memberName] = {};
        memberPositions[memberName].position = { x: pisiton.x, y: pisiton.y };
      }
    } catch (e) {}
    prevLeft += file.fileWidth + config.fileStyle.fileOffset;
    prevTop += file.fileHeight + config.fileStyle.fileOffset;
  });

  writeStorage();
}
export function getLayout(files: DocEntry[], config: Config) {
  cachedFiles = files;
  cachedConfig = config;
  if (isVSCode) {
    let JSONStr: string = null;
    const docEntryEl: Element = document.getElementById("doc-layout");
    JSONStr = docEntryEl.innerHTML;
    JSONStr = decodeURIComponent(JSONStr);
    if (!JSONStr) {
      layout = {};
      resetDefaultLayout(files, config);
    } else {
      try {
        layout = JSON.parse(JSONStr);
      } catch (e) {
        layout = {};
        resetDefaultLayout(files, config);
      }
      if (typeof layout !== "object") {
        layout = {};
        resetDefaultLayout(files, config);
      }
    }
    // console.log(JSON.stringify(layout))
  } else {
    const layoutStr = window.localStorage.getItem(STORAGE_NAME);
    if (layoutStr) {
      layout = JSON.parse(layoutStr) as BoardLayout;
    } else {
      layout = {};
      resetDefaultLayout(files, config);
    }
  }
  return layout;
}

function writeStorage() {
  if (isVSCode) {
    console.log("window.vscode.postMessage...")
    window.vscode.postMessage({ layout });
  } else {
    localStorage.setItem(STORAGE_NAME, JSON.stringify(layout));
  }
}

const originP = { x: 0, y: 0 };

export function getContentLayout() {
  return { position: layout.contentPosition, scale: layout.contentScale };
}

export function setContentLayout(position?: Position, scale?: number) {
  if (position !== void 0) layout.contentPosition = position;
  if (scale !== void 0) layout.contentScale = scale;
  writeStorage();
}

export function getContentPosition() {
  return layout.contentPosition;
}

export function setContentPosition(position: Position) {
  layout.contentPosition = position;
  writeStorage();
}

export function getContentScale() {
  return layout.contentScale;
}

export function setContentScale(scale: number) {
  layout.contentScale = scale;
  writeStorage();
}

export function getFilePosition(filename: string) {
  const file = layout.filePositions[filename];
  return file ? file.position : originP;
}

export function setFilePosition(filename: string, position: Position) {
  try {
    layout.filePositions[filename].position = position;
  } catch (e) {
    if (!isVSCode) localStorage.setItem(STORAGE_NAME, "");
  }
  writeStorage();
}

export function getTablePosition(filename: string, tableName: string) {
  let result = originP;
  try {
    result = layout.filePositions[filename].memberPositions[tableName].position;
  } catch (e) {
    if (!isVSCode) localStorage.setItem(STORAGE_NAME, "");
  }
  return result;
}

export function setTablePosition(filename: string, tableName: string, position: Position) {
  try {
    layout.filePositions[filename].memberPositions[tableName].position = position;
  } catch (e) {
    if (!isVSCode) localStorage.setItem(STORAGE_NAME, "");
  }
  writeStorage();
}
