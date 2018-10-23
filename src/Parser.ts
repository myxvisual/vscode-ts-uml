import * as ts from "typescript";

export interface DocEntry {
  filename?: string;
  exportMembers?: string[];
  escapedName?: string;
  name?: string;
  type?: string;
  locals?: DocEntry[];
  exports?: DocEntry[];
  members?: DocEntry[];
  resolvedModules?: {
    name?: string;
    resolvedFileName: string;
    isExternalLibraryImport?: boolean;
  }[];

  comment?: string;
  constructors?: DocEntry[];
  isRequired?: boolean;
  documentation?: string;
  parameters?: DocEntry[];
  returnType?: string;
  extends?: DocEntry[] | string[];
  valueDeclarationText?: string;
  initializerText?: string;
}

const customType: any = {
  "8388608": "React",
  "16777220": "prototype"
};

export class Parser {
  constructor(options?: ts.CompilerOptions, host?: ts.CompilerHost) {
    const defaultOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES5,
      maxNodeModuleJsDepth: 1,
      module: ts.ModuleKind.CommonJS
    };
    this.options = options || defaultOptions;
    this.host = host;
  }
  
  getAllLocalMembers = false;

  private rootNames: string[];
  private options: ts.CompilerOptions;
  private host: ts.CompilerHost;

  private program: ts.Program;
  private checker: ts.TypeChecker;
  private sourceFiles: ts.SourceFile[];
  private currSourceFile: ts.SourceFile;
  private output: DocEntry = {};
  getResultCallback: (result: DocEntry) => void;

  parse = (fileName: string | string[], callback = (result?: DocEntry) => { }) => {
    const rootNames = Array.isArray(fileName) ? fileName : [fileName];
    this.rootNames = rootNames;
    this.program = ts.createProgram(rootNames, this.options, this.host);
    this.checker = this.program.getTypeChecker();
    this.sourceFiles = this.program.getSourceFiles() as ts.SourceFile[];

    for (const fileName of this.rootNames) {
      this.currSourceFile = this.program.getSourceFile(fileName);
      this.visit(this.currSourceFile);
      // ts.forEachChild(this.currSourceFile, this.visit);
    }
    if (this.output.members) {
      this.output.members = this.output.members.filter(member => member);
    }
    callback(this.output);
    return this.output;
  }

  visit = (node: ts.Node) => {
    if (!node) return;
    let symbol: ts.Symbol = null;
    switch (node.kind) {
      case ts.SyntaxKind.SourceFile: {
        symbol = this.getSymbolByType(node as ts.SourceFile);
        if (!symbol) {
          symbol = this.currSourceFile as any;
        }
        this.output.filename = (node as ts.SourceFile).fileName;
        break;
      }
      case ts.SyntaxKind.ClassDeclaration: {
        // const t  = node as ts.ClassDeclaration;
        symbol = this.getSymbolByType(node as ts.ClassDeclaration);
        break;
      }
      case ts.SyntaxKind.InterfaceDeclaration: {
        symbol = this.getSymbolByType(node as ts.InterfaceDeclaration);
        break;
      }
      case ts.SyntaxKind.FunctionDeclaration: {
        symbol = this.getSymbolByType(node as ts.FunctionDeclaration);
        break;
      }
      case ts.SyntaxKind.MethodDeclaration: {
        symbol = this.getSymbolByType(node as ts.MethodDeclaration);
        break;
      }
      case ts.SyntaxKind.PropertyDeclaration: {
        symbol = this.getSymbolByType(node as ts.PropertyDeclaration);
        break;
      }
      case ts.SyntaxKind.EnumDeclaration: {
        symbol = this.getSymbolByType(node as ts.EnumDeclaration);
        break;
      }
      case ts.SyntaxKind.ImportDeclaration: {
        symbol = this.getSymbolByType(node as ts.ImportDeclaration);
        break;
      }
      case ts.SyntaxKind.VariableDeclaration: {
        symbol = this.getSymbolByType(node as ts.VariableDeclaration);
        break;
      }
      case ts.SyntaxKind.VariableStatement: {
        symbol = this.getSymbolByType(node as ts.VariableStatement);
        break;
      }
      case ts.SyntaxKind.ExportAssignment: {
        symbol = this.getSymbolByType(node as ts.ExportAssignment);
        break;
      }
      case ts.SyntaxKind.EndOfFileToken: {
        symbol = this.getSymbolByType(node as ts.EndOfFileToken);
        break;
      }
      default: {
        // console.log(`Missing parse kind: ${node.kind}`);
        break;
      }
    }

    if (node.kind === ts.SyntaxKind.SourceFile) {
      const result = this.serializeSymbol(symbol);
      Object.assign(this.output, result);
    } else {
      const result = this.serializeSymbol(symbol);
      if (this.getResultCallback) {
        this.getResultCallback(result);
        this.getResultCallback = void 0;
      }
      if (result && !this.getAllLocalMembers) {
        this.output.members = [...(this.output.members || []), result];
      }
    }
  }

  getSymbolByType = <T>(declaration: T | ts.SourceFile) => {
    return this.checker.getSymbolAtLocation(declaration["name"]) || this.checker.getSymbolAtLocation(declaration as ts.SourceFile);
  }

  serializeSymbol = (symbol: ts.Symbol, getAllAst = true): DocEntry => {
    if (!symbol || typeof symbol !== "object") {
      return;
    }

    let name = symbol.getName ? symbol.getName() : symbol.name;
    let docEntryFilename: string;
    let escapedName: string;


    let initializerText: string;
    if (symbol.valueDeclaration) {
      const initializer = symbol.valueDeclaration["initializer"];
      if (initializer) {
        initializerText = initializer.getFullText();
      }
    }

    let valueDeclarationText: string;
    if (symbol.valueDeclaration && symbol.valueDeclaration.getFullText) {
      valueDeclarationText = symbol.valueDeclaration.getFullText();
    }

    let type: string;
    try {
      type = this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
    } catch (e) {
      // console.error(e);
      type = "unknown";
    }
    if (!type || type === "any") {
      type = ts.SymbolFlags[symbol.flags] || "any";
    }
    const isSourceFile = Boolean(
      symbol.flags === ts.SymbolFlags.ValueModule || (
        symbol["kind"] && symbol["kind"] === ts.SyntaxKind.SourceFile
      )
    );

    const isNamseSpace = symbol.flags === ts.SymbolFlags.NamespaceModule;

    let documentation: string;
    try {
      documentation = ts.displayPartsToString(symbol.getDocumentationComment(void 0));
    } catch (e) {
      // console.error(e);
    }

    let isRequired: boolean;
    const parentSymbol: ts.Symbol = (symbol as any).parent;
    if (parentSymbol && parentSymbol.flags === ts.SymbolFlags.Interface) {
      const valueDeclaration: any = symbol.valueDeclaration;
      isRequired = valueDeclaration ? !valueDeclaration.questionToken : false;
    }

    if (symbol.flags === ts.SymbolFlags.AliasExcludes ||
      symbol.flags === 2097152 // ts.SymbolFlags.Alias
    ) {
      const aliasSymbol = this.checker.getAliasedSymbol(symbol);
      escapedName = aliasSymbol.escapedName.toString();
      if (aliasSymbol["parent"]) {
        docEntryFilename = aliasSymbol["parent"].valueDeclaration.fileName;
      }
    }

    if (symbol.flags === ts.SymbolFlags.Property) {
      const docEntry: DocEntry = {
        name,
        isRequired
      };

      docEntry.type = this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
      docEntry.documentation = ts.displayPartsToString(symbol.getDocumentationComment(void 0));
      docEntry.initializerText = initializerText;
      docEntry.valueDeclarationText = valueDeclarationText;
      docEntry.documentation = docEntry.documentation ? docEntry.documentation : void 0;
      return docEntry;
    }


    let extendsDocEntry: DocEntry[] = [];
    let exportsDocEntry: DocEntry[];
    let membersDocEntry: DocEntry[];

    if (symbol.flags === ts.SymbolFlags.Class || symbol.flags === ts.SymbolFlags.Interface) {
      symbol.declarations.forEach((declaration, index) => {
        if (declaration["heritageClauses"]) {
          const firstHeritageClause = declaration["heritageClauses"]![0];
          firstHeritageClause.types.forEach((type, index) => {
            const firstHeritageClauseType = firstHeritageClause.types![index];
            const extendsSymbol = this.checker.getSymbolAtLocation(firstHeritageClauseType.expression);
            extendsDocEntry.push(this.serializeSymbol(extendsSymbol, false));
          });
        }
      });
    }

    if ("exports" in symbol && symbol.exports.size) {
      exportsDocEntry = [];
      const values = symbol.exports.values();
      for (let i = 0; i < symbol.exports.size; i++) {
        const result: any = values.next();
        exportsDocEntry.push(this.serializeSymbol(result.value, isNamseSpace));
      }
    }

    if (isSourceFile || (
      getAllAst && (symbol.flags === ts.SymbolFlags.Class || symbol.flags === ts.SymbolFlags.Interface)
    )) {
      if (isSourceFile && this.getAllLocalMembers) {
        membersDocEntry = [];
      } else if ("members" in symbol && symbol.members.size) {
        membersDocEntry = [];
        const values = symbol.members.values();
        for (let i = 0; i < symbol.members.size; i++) {
          const result = values.next();
          const docEntry = this.serializeSymbol(result.value, isSourceFile ? false : (isNamseSpace ? false : true));
          membersDocEntry.push(docEntry);
        }
      }
    }

    const docEntry: DocEntry = {
      name,
      escapedName,
      exports: isNamseSpace ? membersDocEntry : exportsDocEntry,
      members: isNamseSpace ? exportsDocEntry : membersDocEntry,
      type,
      isRequired,
      documentation: documentation ? documentation : void 0,
      extends: extendsDocEntry.length > 0 ? extendsDocEntry : void 0,
      filename: isSourceFile ? (symbol["fileName"] || symbol.valueDeclaration["resolvedPath"]) : docEntryFilename,
      initializerText,
      valueDeclarationText
    };

    if (isSourceFile) {
      if (symbol.valueDeclaration) {
        const resolvedModules = symbol.valueDeclaration["resolvedModules"];
        if (resolvedModules) {
          docEntry.resolvedModules = [];
          for (const moduleNode of resolvedModules) {
            const data = moduleNode[1];
            docEntry.resolvedModules.push({
              name: moduleNode[0],
              resolvedFileName: data ? data.resolvedFileName : void 0,
              isExternalLibraryImport: data ? data.isExternalLibraryImport : void 0
            });
          }
        }
      }
      docEntry.locals = [];
      if (this.getAllLocalMembers) {
        docEntry.members = [];
      }
      
      docEntry.exportMembers = [];
      let locals = symbol["locals"];
      if (!locals && symbol.valueDeclaration) {
        locals = symbol.valueDeclaration["locals"];
      }
      for (const local of locals) {
        const isExportMember = Boolean(local[1]["exportSymbol"]);
        const symbol: ts.Symbol = isExportMember ? local[1]["exportSymbol"] : local[1];
        if (isExportMember) {
          let name = symbol.name;
          if (!name && symbol.getName) {
            name = symbol.getName();
          }
          if (name) {
            docEntry.exportMembers.push(name);
          }
        }
        docEntry.locals.push(this.serializeSymbol(symbol, false));
        if (this.getAllLocalMembers) {
          docEntry.members.push(this.serializeSymbol(symbol, this.getAllLocalMembers));
        }
      }
    }
    return docEntry;
  }
}

export default Parser;