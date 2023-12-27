// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AIACodeCompletionProvider } from "./AIACodeCompletionProvider";
import { AIACodeWebviewViewProvider } from "./AIACodeWebviewViewProvider";
import { translate } from "./LanguageHelper";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	registerCompleteionExtension(context);
	registerWebviewViewExtension(context);
	inStroage(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }

// Function to register the WebView view extension
export function registerWebviewViewExtension(context: vscode.ExtensionContext) {

	// Create an instance of the AIACodeWebviewViewProvider with the extension's context
	const provider = new AIACodeWebviewViewProvider(context);

	// Register the provider and associated commands with the extension's context subscriptions
	context.subscriptions.push(
		// Register the WebView view provider
		vscode.window.registerWebviewViewProvider(AIACodeWebviewViewProvider.viewId, provider, {
			webviewOptions: { retainContextWhenHidden: true }
		}),

		// Register commands associated with the WebView view provider
		vscode.commands.registerCommand("aiacode.explain_this_code", () => provider.executeCommand("aiacode.explain_this_code")),
		vscode.commands.registerCommand("aiacode.improve_this_code", () => provider.executeCommand("aiacode.improve_this_code")),
		vscode.commands.registerCommand("aiacode.clean_this_code", () => provider.executeCommand("aiacode.clean_this_code")),
		vscode.commands.registerCommand("aiacode.generate_comment", () => provider.executeCommand("aiacode.generate_comment")),
		vscode.commands.registerCommand("aiacode.generate_unit_test", () => provider.executeCommand("aiacode.generate_unit_test")),
		vscode.commands.registerCommand("aiacode.check_performance", () => provider.executeCommand("aiacode.check_performance")),
		vscode.commands.registerCommand("aiacode.check_security", () => provider.executeCommand("aiacode.check_security")),
	);
}

function registerCompleteionExtension(context: vscode.ExtensionContext) {
	//Creates a status bar item.
	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	/**
	 * The text to show for the entry. You can embed icons in the text by leveraging the syntax:

		My text $(icon-name) contains icons like $(icon-name) this one.

		Where the icon-name is taken from the ThemeIcon icon set, e.g. light-bulb, thumbsup, zap etc.
	 */
	statusBar.text = "$(lightbulb)";
	//The tooltip text when you hover over this entry.
	statusBar.tooltip = `AIACode - Ready`;

	const completionStatusCallback = (enabled: boolean) => async () => {
		const configuration = vscode.workspace.getConfiguration();
		const target = vscode.ConfigurationTarget.Global;
		configuration.update("AIACode.AutoTriggerCompletion", enabled, target, false).then(console.error);
		var msg = enabled ? translate("auto_completion") : translate("disable_auto_completion");
		vscode.window.showInformationMessage(msg);
		statusBar.show();
	};

	context.subscriptions.push(
		/**
		 * Used to register completion providers. 
		 * Inline completion means that as you enter code, 
		 * the editor automatically displays code suggestions related to your input
		 */
		vscode.languages.registerInlineCompletionItemProvider(
			{ pattern: "**" }, new AIACodeCompletionProvider(statusBar)
		),

		vscode.commands.registerCommand("aiacode.auto_completion_enable", completionStatusCallback(true)),
		vscode.commands.registerCommand("aiacode.auto_completion_disable", completionStatusCallback(false)),
		statusBar
	);


	if (vscode.workspace.getConfiguration("AIACode").get("AutoTriggerCompletion")) {
		vscode.commands.executeCommand("aiacode.auto_completion_enable");
	} else {
		vscode.commands.executeCommand("aiacode.auto_completion_disable");
	}
}

export const inStroage = (context: vscode.ExtensionContext) => { 
	  // 存储键值对
	  const key = 'username';
	  const value = 'wang';
	
	  // 使用 workspaceState 或 globalState
	  const storage = context.workspaceState; // 或者 context.globalState;
	
	  // 存储
	  storage.update(key, value);
	
	  // 通过 key 获取值
	  const retrievedValue = storage.get(key);
	
	  if (retrievedValue) {
		console.log(`Value for key '${key}': ${retrievedValue}`);
	  } else {
		console.log(`No value found for key '${key}'`);
	  }
};
