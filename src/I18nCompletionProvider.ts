import {CompletionItemProvider,TextDocument,Position} from 'vscode';
import {getLocalesKeys} from './utils';
import {TDictionary,TConf} from './type';
import EventBus from './eventBus';

export default class implements CompletionItemProvider{
  _Dictionary:TDictionary;
  _conf:TConf;

  constructor(Dictionary:TDictionary,conf:TConf){
    this._Dictionary = Dictionary;
    this._conf = conf;
    
    this.onWatch();
  }

  onWatch(){
    EventBus.on("I18nReload",(Dictionary:TDictionary)=>{
      this._Dictionary = Dictionary;
    });
  }

  provideCompletionItems(document:TextDocument, position:Position){

    // 匹配当前行内容
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substr(0, position.character+1);
    if(!(/.*intl\.get\(['"]['"]$/.test(linePrefix))){
      return undefined;
    }

    // 获取所有key值提示
    const result = getLocalesKeys(document,this._Dictionary);
    if(!result) {return;};

    return result; 
  }

  resolveCompletionItem() {
    console.log("resolveCompletionItem");
    return null;
  }
}