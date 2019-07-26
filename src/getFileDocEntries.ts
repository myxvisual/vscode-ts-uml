import Parser, { DocEntry as DefaultDocEntry } from "./Parser";
import { Config } from "./config";
export { Config };

export interface DocEntry extends DefaultDocEntry {
  rowIndex?: number;
  columnIndex?: number;
  isRef?: boolean;
  fileWidth?: number;
  fileHeight?: number;
  tableWidth?: number;
  tableHeight?: number;

  memberLayouts?: any;
  exportLayouts?: any;
} 

const reType = /(\w+)(\[\])*/i;
const findMaxLetter = (docEntry: DocEntry, config: Config) => {
  const headerCount = docEntry.name.length + (docEntry.type.length > config.maxShowTypeLength ? config.maxShowTypeLength : docEntry.type.length);
  if (docEntry.members && docEntry.members.length > 0) {
   const maxCount = docEntry.members.reduce((prev, current) => {
      const letterCount = current.name ? current.name.length : 0 + (
        current.type ? (current.type.length > config.maxShowTypeLength ? config.maxShowTypeLength : current.type.length) : 0
      );
      return letterCount > prev ? letterCount : prev;
    }, 0);
    return headerCount > maxCount ? headerCount : maxCount;
  } else {
    return headerCount;
  }
};

const getTableWidth = (docEntry: DocEntry, config: Config) => {
  const { textPadding, itemPadding } = config.tableStyle;
  return findMaxLetter(docEntry, config) * 12; // + textPadding + itemPadding * 2;
};
const getTableHeight = (docEntry: DocEntry, config: Config) => {
  const { headerHeight, itemHeight } = config.tableStyle;
  return headerHeight + itemHeight * (docEntry.members ? docEntry.members.length : 0);
};

let allDocEntry: DocEntry[] = [];

export function getFileDocEntries(currFileName: string, startRowIndex: number = 0, config: Config, isInit = true) {
  if (isInit) {
    allDocEntry = [];
  }

  const alreadyHadFile = allDocEntry.some(fileDocEntry => fileDocEntry.filename && fileDocEntry.filename.toLowerCase() === currFileName.toLowerCase());
  if (alreadyHadFile) return;
  const _p = new Parser();
  _p.getAllLocalMembers = Boolean(config.getAllLocalMembers);
  const fileDocEntry: DocEntry = _p.parse(currFileName);

  setLayouts(currFileName, startRowIndex, config, fileDocEntry);
  setLayouts(currFileName, startRowIndex, config, fileDocEntry, true);

  if (fileDocEntry.filename) {
    allDocEntry.push(fileDocEntry);
  }

  return allDocEntry;
}

export function setLayouts(currFileName: string, startRowIndex: number = 0, config: Config, fileDocEntry: DocEntry, setExportLayouts = false) {
  let currMembers = fileDocEntry.members ? [...fileDocEntry.members] : [];
  if (setExportLayouts) {
    currMembers = currMembers.filter(member => {
      return fileDocEntry.exportMembers.includes(member.name)
    });
  }
  let prevFileTop = 0;
  const alreadyHadFile = allDocEntry.some(fileDocEntry => fileDocEntry.filename && fileDocEntry.filename.toLowerCase() === currFileName.toLowerCase());
  if (alreadyHadFile && !setExportLayouts) return;

  const memberRowDepth = {
    maxDepth: 0,
    depths: {} as any
  };
  function setDefaultMember(name: string) {
    if (!currMembers.some(member => member.name === name)) return;
    if (memberRowDepth.depths[name] === void 0) {
      memberRowDepth.depths[name] = 0;
    }
  }
  function setMemberRef(name: string, refKey: string) {
    if (!currMembers.some(member => member.name === refKey)) return;

    setDefaultMember(refKey);
    refKey = refKey; //`${refKey} + 1`
    if (memberRowDepth.depths[name] === void 0 || typeof memberRowDepth.depths[name] === "number") {
      memberRowDepth.depths[name] = refKey;
    } else if (typeof memberRowDepth.depths[name] === "string") {
      memberRowDepth.depths[name] = [memberRowDepth.depths[name], refKey];
    } else if (Array.isArray(memberRowDepth.depths[name])) {
      memberRowDepth.depths[name].push(refKey);
    }
  }

  const { fileMaxDepth } = config;
  const getNewFileDocEntry = (newFileName: string) => {
    if (!newFileName) return;
    if ((typeof fileMaxDepth === "number" && startRowIndex < fileMaxDepth) || typeof fileMaxDepth !== "number") {
      if (!alreadyHadFile) {
        getFileDocEntries(newFileName, startRowIndex + 1, config, false);
      }
    }
  }
  
  fileDocEntry.rowIndex = startRowIndex;
  fileDocEntry.fileWidth = 0;
  fileDocEntry.fileHeight = 0;

  if (fileDocEntry.resolvedModules) {
    fileDocEntry.resolvedModules.forEach(({ resolvedFileName, isExternalLibraryImport }) => {
      if (resolvedFileName && !isExternalLibraryImport) {
        getNewFileDocEntry(resolvedFileName);
      }
    })
  }

  if (currMembers) {
    currMembers.forEach((memberDocEntry: DocEntry, index) => {
      const { members, type } = memberDocEntry;

      setDefaultMember(memberDocEntry.name);
      // set columnIndex
      memberDocEntry.columnIndex = index;
      // set tableWidth
      memberDocEntry.tableWidth = getTableWidth(memberDocEntry, config);
      memberDocEntry.tableHeight = getTableHeight(memberDocEntry, config);

      if (memberDocEntry.extends) {
        (memberDocEntry.extends as DefaultDocEntry[]).forEach(member => {
          const { escapedName, name } = member;
          const typeName = escapedName || name;

          // Get ReactComponent Extends
          if (typeName === "Component") {
            const reComponent = /(?:React\.)?(?:Component)\<?((\w+\,?\s?)+)\>?/im;
            const result = reComponent.exec(memberDocEntry.valueDeclarationText);
            if (result[1]) {
              const statePropsTypes = result[1].split(",").map(str => str.trim());
              statePropsTypes.forEach(statePropsType => {
                setDefaultMember(statePropsType);
                setMemberRef(memberDocEntry.name, statePropsType);
              });
            }
          } else {
            setMemberRef(memberDocEntry.name, typeName);
          }
        });
      }

      // set local ref
      if (type === "Interface" || type === "Class") {
        if (!members) return;
        members.forEach((member: DocEntry, index) => {
          const escapedName = reType.test(member.type) ? member.type.match(reType)[1] : member.name;
          let localIndex = -1;
          if (escapedName) {
            for (const index in fileDocEntry.locals) {
              if (fileDocEntry.locals[index].name === escapedName) {
                localIndex = Number(index);
        
                setDefaultMember(escapedName);
                setMemberRef(memberDocEntry.name, escapedName);
                break;
              }
            }
          }
          if (localIndex > -1) {
            const { filename } = fileDocEntry.locals[localIndex];
            member.filename = filename;
            member.isRef = true;
            getNewFileDocEntry(filename);
          }
        });
      }
    });

    const memberNames = Object.keys(memberRowDepth.depths);

    while(memberNames.some(key => typeof memberRowDepth.depths[key] !== "number")) {
      memberNames.forEach(key => {
        const refKey = memberRowDepth.depths[key];
        if (refKey === 0) {
        }
        else if (typeof refKey === "string") {
          if (typeof memberRowDepth.depths[refKey] === "number") {
            memberRowDepth.depths[key] = memberRowDepth.depths[refKey] + 1;
          }
        }
        else if (Array.isArray(refKey)) {
          if (refKey.some(key => typeof key === "string")) {
            refKey.forEach((newKey, index) => {
              if (typeof newKey === "string") {
                if (typeof memberRowDepth.depths[newKey] === "number") {
                  memberRowDepth.depths[key][index] = memberRowDepth.depths[newKey] + 1;
                }
              }
            });
          } else {
            memberRowDepth.depths[key] = refKey.reduce((prev, current) => current > prev ? current : prev, 0)
          }
        }
      });
    }
    // find row maxDepth
    memberRowDepth.maxDepth = memberNames.map(key => memberRowDepth[key]).reduce((prev, current) => current > prev ? current: prev, 0);

    // get layout
    function getTableRect(memberName: string) {
      let result = { tableWidth: 0, tableHeight: 0 };
      if (fileDocEntry && currMembers) {
        for (const member of (currMembers as DocEntry[])) {
          if (member.name === memberName) {
            result = { tableWidth: member.tableWidth, tableHeight: member.tableHeight };
            break;
          }
        }
      }
      return result;
    }
    const memberLayouts: {
      memberPositions?: {
        [key: string]: { x: number; y: number, rowIndex: number };
      },
      rows?: {
        heihgt?: number;
        maxWidth?: number;
        maxCloumn?: number;
      }[]
    } = {
      memberPositions: {},
      rows: []
    };
    memberNames.forEach((memberName, index) => {
      const memberRowIndex = memberRowDepth.depths[memberName];
      if (memberLayouts.rows[memberRowIndex] === void 0) {
        memberLayouts.rows[memberRowIndex] = {
          heihgt: -config.fileStyle.tableOffset,
          maxWidth: 0,
          maxCloumn: -1
        }
      }
      
      const rect = getTableRect(memberName);
      
      memberLayouts.memberPositions[memberName] = { x: 0, y: (prevFileTop + config.fileStyle.headerHeight + config.fileStyle.heightPadding) + (memberLayouts.rows[memberRowIndex].heihgt + config.fileStyle.tableOffset), rowIndex: memberRowIndex };
      memberLayouts.rows[memberRowIndex].heihgt += rect.tableHeight + config.fileStyle.tableOffset;
      memberLayouts.rows[memberRowIndex].maxCloumn += 1;
      if (rect.tableWidth > memberLayouts.rows[memberRowIndex].maxWidth) {
        memberLayouts.rows[memberRowIndex].maxWidth = rect.tableWidth;
      }
    });
    
    // set x position
    for (const memberName in memberLayouts.memberPositions) {
      const position = memberLayouts.memberPositions[memberName];
      position.x = (
        position.rowIndex === 0 ? 0 : (
          memberLayouts.rows.slice(0, position.rowIndex).reduce((prev, current) => prev + current.maxWidth, 0)
        )
      ) + position.rowIndex * config.fileStyle.tableOffset;
    }
    
    // calculator file padding
    fileDocEntry.fileHeight += memberLayouts.rows.reduce((prev, current) => prev < current.heihgt ? current.heihgt : prev, 0) + (
      config.fileStyle.headerHeight + config.fileStyle.heightPadding * 2
    );
    fileDocEntry.fileWidth += memberLayouts.rows.reduce((prev, current) => prev + current.maxWidth, 0) + (
      config.fileStyle.tableOffset * (memberRowDepth.maxDepth) + config.fileStyle.widthPadding * 2
    );

    
    if (setExportLayouts) {
      fileDocEntry.exportLayouts = memberLayouts;
    } else {
      fileDocEntry.memberLayouts = memberLayouts;
    }
    // fileDocEntry["memberTreeDepth"] = memberRowDepth;

    prevFileTop = fileDocEntry.fileHeight + config.fileStyle.fileOffset;
  } else {
    fileDocEntry.fileHeight = config.fileStyle.headerHeight;
    fileDocEntry.fileWidth = 500;
  }
}

export default getFileDocEntries;
