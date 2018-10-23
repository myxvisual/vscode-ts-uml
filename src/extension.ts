import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import getFileDocEntries, { DocEntry } from './getFileDocEntries'
import config from './config'

const __DEV__ = process.env.NODE_ENV === "development";
const entryFileName = path.join(__dirname, "./entryFile.txt");
let title = "TypeScript UML";

let docEntries: DocEntry[];

let currFile: string = getEntryFile();

export function deactive() {
}

let globalPanel: vscode.WebviewPanel;
let globalExtensionPath: string;

export function watchFile() {
    fs.watchFile(currFile, (eventType, filename) => {
        console.log("file is changed.")
        UMLWebviewPanel.revive(globalPanel, globalExtensionPath);
    });
}

watchFile();

export function activate(context: vscode.ExtensionContext) {
    async function commandCallback(fileUri: any) {
        if (fileUri !== void 0) {
            if (typeof fileUri === "string") {
                currFile = fileUri;
            } else if (typeof fileUri === "object" && fileUri.path) {
                currFile = fileUri.path;
            }
        } else {
            currFile = "";
            const { activeTextEditor } = vscode.window;
            if (activeTextEditor) {
                if (!currFile) {
                    currFile = activeTextEditor.document.fileName;
                }
            }
        }
        saveEntryFile(currFile);
        UMLWebviewPanel.createOrShow(context.extensionPath);
    }
    context.subscriptions.push(vscode.commands.registerCommand('tsUML.showFile', commandCallback));
    context.subscriptions.push(vscode.commands.registerCommand('tsUML.showFolder', commandCallback));

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serilizer in activation event
        vscode.window.registerWebviewPanelSerializer(UMLWebviewPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`);
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
                this._update()
            }
        }, null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
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
        docEntries = getFileDocEntries(currFile, 0, config);
        const nonce = getNonce();
        
        const favicon = vscode.Uri.file(path.join(this._extensionPath, 'icons/ts.png'));
        const faviconUri = favicon.with({ scheme: 'vscode-resource' });
        const appScript = vscode.Uri.file(path.join(this._extensionPath, 'build/js/app.js'));
        const appUri = appScript.with({ scheme: 'vscode-resource' });
        const vendorScript = vscode.Uri.file(path.join(this._extensionPath, 'build/js/vendor.js'));
        const vendorUri = vendorScript.with({ scheme: 'vscode-resource' });

        let jsonStr = JSON.stringify(docEntries);
        // if (docEntries.length > 0) {
        //     globalPanel.webview.postMessage({ fileDocEntries: jsonStr });
        // }
        jsonStr = encodeURIComponent(jsonStr);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <link rel="icon" type="image/png" sizes="32x32" href="${faviconUri}">
            </head>
            <body>
                <span id="doc-entry" style="display: none;">${jsonStr}</span>
                <div id="app"></div>
                <script nonce="${nonce}" type="text/javascript" src="${__DEV__ ? "http://127.0.0.1:8092/js/vendor.js" : appUri}" charset="utf-8"></script>
                <script nonce="${nonce}" type="text/javascript" src="${__DEV__ ? "http://127.0.0.1:8092/js/app.js" : vendorUri}" charset="utf-8"></script>
            </body>
            </html>`;
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

function saveEntryFile(entryFile: string) {
    fs.writeFileSync(entryFileName, entryFile, { encoding: "utf8" });
}

function getEntryFile() {
    return fs.existsSync(entryFileName) ? fs.readFileSync(entryFileName, { encoding: "utf8" }) : ""
}
