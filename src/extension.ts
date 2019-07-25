import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as md5 from "md5";

import getFileDocEntries, { DocEntry } from './getFileDocEntries'
import config from './config'

const entryFileName = path.join(__dirname, "./entryFile.json");
let title = "TypeScript UML";

let docEntries: DocEntry[];

let saveData = getSaveFileData();
let globalPanel: vscode.WebviewPanel;
let globalExtensionPath: string;

let prevMd5 = null;
export function watchFile() {
    if (fs.existsSync(saveData.entryFile)) {
        if (!prevMd5) {
            prevMd5 = md5(fs.readFileSync(saveData.entryFile));
        }
        fs.watchFile(saveData.entryFile, (eventType, filename) => {
            if (filename) {
                const currMd5 = md5(fs.readFileSync(saveData.entryFile));
                if (currMd5 !== prevMd5) {
                    UMLWebviewPanel.revive(globalPanel, globalExtensionPath);
                    prevMd5 = currMd5;
                }
            }
        });
    }
}

export function activate(context: vscode.ExtensionContext) {
    let newFile = "";
    async function commandCallback(fileUri: any) {
        if (fileUri !== void 0) {
            if (typeof fileUri === "string") {
                newFile = fileUri;
            } else if (typeof fileUri === "object" && fileUri.path) {
                newFile = fileUri.path;
            }
        } else {
            newFile = "";
            const { activeTextEditor } = vscode.window;
            if (activeTextEditor) {
                if (!newFile && activeTextEditor && activeTextEditor.document) {
                    newFile = activeTextEditor.document.fileName;
                }
            }
        }
        newFile = path.normalize(newFile)
        if (process.platform === "win32" && newFile.startsWith("\\")) {
            newFile = newFile.slice(1);
        }
        if (newFile !== saveData.entryFile) {
            saveData.entryFile = newFile;
            saveData.layout = "";
        }
        fs.unwatchFile(saveData.entryFile)
        watchFile();
        
        UMLWebviewPanel.createOrShow(context.extensionPath);
    }
    context.subscriptions.push(vscode.commands.registerCommand('tsUML.showFile', commandCallback));
    context.subscriptions.push(vscode.commands.registerCommand('tsUML.showFolder', commandCallback));

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serilizer in activation event
        vscode.window.registerWebviewPanelSerializer(UMLWebviewPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                // console.log(`Got state: ${JSON.stringify(state)}`);
                globalPanel = webviewPanel;
                globalExtensionPath = context.extensionPath;
                UMLWebviewPanel.revive(webviewPanel, context.extensionPath);
            }
        });
    }
}

class UMLWebviewPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: UMLWebviewPanel | undefined;

    public static readonly viewType = "tsUML";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (UMLWebviewPanel.currentPanel) {
            UMLWebviewPanel.currentPanel._panel.reveal(column);
            UMLWebviewPanel.currentPanel._update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(UMLWebviewPanel.viewType, title, column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'media')),
                vscode.Uri.file(path.join(extensionPath, 'build')),
                vscode.Uri.file(path.join(extensionPath, 'icons'))
            ]
        });

        let saveDataTimer = null;
        panel.webview.onDidReceiveMessage(
            message => {
                // console.log("onDidReceiveMessage: ", message)
                if (message.boardWillMount) {
                    panel.webview.postMessage({ docEntries });
                }
                if (message.getLayout) {
                    panel.webview.postMessage({ layout: saveData.layout });
                }
                if (message.setLayout) {
                    saveData.layout = message.setLayout;
                    clearTimeout(saveDataTimer);
                    saveDataTimer = setTimeout(saveDataToFile, 200);
                }
            },
        );

        globalPanel = panel;
        globalExtensionPath = extensionPath;
        UMLWebviewPanel.currentPanel = new UMLWebviewPanel(panel, extensionPath);
    }

    public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
        UMLWebviewPanel.currentPanel = new UMLWebviewPanel(panel, extensionPath);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionPath: string
    ) {
        this._panel = panel;
        this._extensionPath = extensionPath;

        // Set the webview's initial html content 
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                // this._update()
            }
        }, null, this._disposables);
    }

    public dispose() {
        UMLWebviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {
        const nonce = getNonce();
        
        const favicon = vscode.Uri.file(path.join(this._extensionPath, 'icons/ts.png'));
        const faviconUri = favicon.with({ scheme: 'vscode-resource' });
        const appScript = vscode.Uri.file(path.join(this._extensionPath, 'build/js/app.js'));
        const appUri = appScript.with({ scheme: 'vscode-resource' });
        const vendorScript = vscode.Uri.file(path.join(this._extensionPath, 'build/js/vendor.js'));
        const vendorUri = vendorScript.with({ scheme: 'vscode-resource' });

        if (saveData.entryFile) {
            docEntries = getFileDocEntries(saveData.entryFile, 0, config);
        }
        let layoutStr = JSON.stringify(saveData.layout);
        // console.log("layout: ", saveData.layout);
        saveDataToFile();
        this._panel.webview.onDidReceiveMessage(
            message => {
                // console.log("onDidReceiveMessage: ", message)
                if (message.boardWillMount) {
                    this._panel.webview.postMessage({ docEntries });
                }
                if (message.getLayout) {
                    this._panel.webview.postMessage({ layout: saveData.layout });
                }
            },
        );

        const htmlStr = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <link rel="icon" type="image/png" sizes="32x32" href="${faviconUri}">
            </head>
            <body>
                <span id="doc-layout" style="display: none;">${layoutStr}</span>
                <div id="app"></div>
                <script nonce="${nonce}" type="text/javascript" src="${appUri}" charset="utf-8"></script>
                <script nonce="${nonce}" type="text/javascript" src="${vendorUri}" charset="utf-8"></script>
            </body>
            </html>`;
        return htmlStr;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function saveDataToFile() {
    // console.log("saveDataToFile: ", saveData);
    fs.writeFileSync(entryFileName, JSON.stringify(saveData, null, 2), { encoding: "utf8" });
}

function getSaveFileData() {
    let data = { entryFile: "", layout: "" };
    if (fs.existsSync(entryFileName)) {
        try {
            data = JSON.parse(fs.readFileSync(entryFileName, { encoding: "utf8" }));
        } catch (e) {}
    }
    return data;
}
