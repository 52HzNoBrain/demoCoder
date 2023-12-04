import { CancellationToken, InlineCompletionContext, InlineCompletionItem, InlineCompletionItemProvider, InlineCompletionList, Position, ProviderResult, Range, TextDocument, window, workspace, StatusBarItem, InlineCompletionTriggerKind } from "vscode";
import { postCompletion } from "./RequestCompletion";
import { sleep } from "./Utils";

export class CodeShellCompletionProvider implements InlineCompletionItemProvider {

    private statusBar: StatusBarItem;

    constructor(statusBar: StatusBarItem) {
        this.statusBar = statusBar;
    }

    //@ts-ignore
    // because ASYNC and PROMISE
    public async provideInlineCompletionItems(document: TextDocument, position: Position, context: InlineCompletionContext, token: CancellationToken): ProviderResult<InlineCompletionItem[] | InlineCompletionList> {
        // In this method, write the logic to generate code suggestions

        // Get the setting for automatic triggering of completion
        let autoTriggerEnabled = workspace.getConfiguration("CodeShell").get("AutoTriggerCompletion") as boolean;
        
        // If it's automatic triggering and auto-completion is disabled, return an empty array directly
        if (context.triggerKind === InlineCompletionTriggerKind.Automatic) {
            if (!autoTriggerEnabled) {
                return Promise.resolve(([] as InlineCompletionItem[]));
            }

            // Get the delay for auto-completion
            let delay = workspace.getConfiguration("CodeShell").get("AutoCompletionDelay") as number;
            
            // Simulate a delay (optional)
            await sleep(1000 * delay);

            // If the request is cancelled, return an empty array
            if (token.isCancellationRequested) {
                return Promise.resolve(([] as InlineCompletionItem[]));
            }
        }

        // Get the code snippets before and after the cursor
        const fimPrefixCode = this.getFimPrefixCode(document, position);
        const fimSuffixCode = this.getFimSuffixCode(document, position);

        // If both prefix and suffix code snippets are empty, return an empty array
        if (this.isNil(fimPrefixCode) && this.isNil(fimSuffixCode)) {
            return Promise.resolve(([] as InlineCompletionItem[]));
        }

        // Update the status bar to indicate loading
        this.statusBar.text = "$(loading~spin)";
        this.statusBar.tooltip = "CodeShell - Working";
        
        // Send a code completion request
        return postCompletion(fimPrefixCode, fimSuffixCode).then((response) => {

            // After a successful request, update the status bar to indicate readiness
            this.statusBar.text = "$(light-bulb)";
            this.statusBar.tooltip = `CodeShell - Ready`;

            // If the request is cancelled or the response is empty, return an empty array
            if (token.isCancellationRequested || !response || this.isNil(response.trim())) {
                return Promise.resolve(([] as InlineCompletionItem[]));
            }

            // Return an array containing the response as a completion item
            return [new InlineCompletionItem(response, new Range(position, position))];
        }).catch((error) => {
            // If the request fails, log the error, update the status bar to indicate an error, and show a status bar message
            console.error(error);
            this.statusBar.text = "$(alert)";
            this.statusBar.tooltip = "CodeShell - Error";
            window.setStatusBarMessage(`${error}`, 10000);
            
            // Return an empty array
            return Promise.resolve(([] as InlineCompletionItem[]));
        }).finally(() => {
        });
    }

    private getFimPrefixCode(document: TextDocument, position: Position): string {
        const beforeCursor = workspace.getConfiguration("CodeShell").get("beforeCursor") as number;
        const firstLine = Math.max(position.line - beforeCursor, 0);
        const range = new Range(firstLine, 0, position.line, position.character);
        return document.getText(range).trim();
    }

    private getFimSuffixCode(document: TextDocument, position: Position): string {
        const startLine = position.line + 1;
        const afterCursor = workspace.getConfiguration("CodeShell").get("afterCursor") as number;
        const endLine = Math.min(startLine + afterCursor, document.lineCount);
        const range = new Range(position.line, position.character, endLine, 0);
        return document.getText(range).trim();
    }

    private isNil(value: String | undefined | null): boolean {
        return value === undefined || value === null || value.length === 0;
    }
    
}
