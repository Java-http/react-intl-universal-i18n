import * as vscode from 'vscode';
import Conf from './conf';
import EventBus from './eventBus';
import I18nDefinitionProvider from './I18nDefinitionProvider';
import I18nHoverProvider from './I18nHoverProvider';
import I18nCompletionProvider from './I18nCompletionProvider';
import I18nCommand from './I18nCommand';
import {Dictionary} from  './Dictionary';

/** 注册语言提示 */
let registerHoverProvider:vscode.Disposable|undefined;
/** 注册语言跳转 */
let registerDefinitionProvider:vscode.Disposable|undefined;
/** 注册i18n转换 */
let registerCommand:vscode.Disposable|undefined;
/** 注册i18n代码补全 */
let registerCompletionProvider:vscode.Disposable|undefined;
/** 注册i18n重启操作 */
let registerCommandI18nReload:vscode.Disposable|undefined;

/** 注册 */
let register = ()=>{
	// 注册语言提示
	registerHoverProvider = vscode.languages.registerHoverProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nHoverProvider()
	);

	// 注册语言跳转
	registerDefinitionProvider = vscode.languages.registerDefinitionProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nDefinitionProvider()
	);

	// 注册i18n转换
	registerCommand = vscode.commands.registerCommand(
		'react-intl-universal-i18n.i18nTransform',
		()=>(new I18nCommand())
	);

	// 注册i18n代码补全
	registerCompletionProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nCompletionProvider(),
		...[`"`, `'`, `intl.get("")`,`intl.get('')`]
	);

	// 注册i18n重启操作
	registerCommandI18nReload = vscode.commands.registerCommand(
		'react-intl-universal-i18n.i18nReload',
		()=>{
			EventBus.emit("I18nReload");
		}
	);

};

/** 释放 */
let dispose = ()=>{
	registerHoverProvider?.dispose();
	registerDefinitionProvider?.dispose();
	registerCommand?.dispose();
	registerCompletionProvider?.dispose();
	registerCommandI18nReload?.dispose();
};

/** 监听文件变化函数 */
let watch = ()=>{
	// 是否开启监听模式
	if(Conf.watchMode){
		const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(`**/${Conf.configPath}/*.{ts,js}`);
    // console.log("activate -> fileSystemWatcher", fileSystemWatcher);
		fileSystemWatcher.onDidChange(()=>{
			EventBus.emit("I18nReload");
		});
	}
};

export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "react-intl-universal-i18n" is now active!');
	
	if(Dictionary){
		register();
	}

	EventBus.on("I18nInit",()=>{
		dispose();
		setTimeout(() => {
			register();
			watch();
		}, 0);
	});

}

// this method is called when your extension is deactivated
export function deactivate() {
	dispose();
	EventBus.remove("I18nInit");
	EventBus.remove("I18nReload");
}