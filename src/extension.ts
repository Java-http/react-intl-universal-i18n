import * as vscode from 'vscode';
import * as DefaultConf from './conf';
import {getAllLocales,getConf} from './utils';
import EventBus from './eventBus';
import I18nDefinitionProvider from './I18nDefinitionProvider';
import I18nHoverProvider from './I18nHoverProvider';
import I18nCompletionProvider from './I18nCompletionProvider';
import I18nCommand from './I18nCommand';
import I18nReload from './I18nReload';

const Message = vscode.window.showInformationMessage;

export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "react-intl-universal-i18n" is now active!');

	// 获取配置
	const Conf = getConf(DefaultConf);
	// 获取多语言字典
	const Dictionary = await getAllLocales(Conf);
	
	if(!Dictionary){
		console.log("当前项目找不到多语言文件,插件停止运行");
		return;
	}
	
	// 注册语言提示
	let disposable = vscode.languages.registerHoverProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nHoverProvider(Dictionary,Conf)
	);

	// 注册语言跳转
	let registerDefinitionProvider = vscode.languages.registerDefinitionProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nDefinitionProvider(Dictionary,Conf)
	);

	// 注册i18n转换
	let registerCommand = vscode.commands.registerCommand(
		'react-intl-universal-i18n.i18nTransform',
		()=>(new I18nCommand(Dictionary,Conf))
	);

	// 注册i18n代码补全
	let registerCompletionProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "javascriptreact","typescriptreact","typescript"],
		new I18nCompletionProvider(Dictionary,Conf),
		...[`"`, `'`, `intl.get("")`,`intl.get('')`]
	);

	// 注册i18n重启操作
	let registerCommandI18nReload = vscode.commands.registerCommand(
		'react-intl-universal-i18n.i18nReload',
		()=>(new I18nReload(Conf))
	);

	context.subscriptions.push(
		disposable,
		registerDefinitionProvider,
		registerCompletionProvider,
		registerCommandI18nReload
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	EventBus.remove("I18nReload");
}