import {CompletionItemProvider,TextDocument,Position} from 'vscode';
import {getLocalesKeys,getRegExp} from './utils/utils';

import Conf from './conf';
import {Dictionary} from './Dictionary';

export default class implements CompletionItemProvider{

  provideCompletionItems(document:TextDocument, position:Position){

    // 匹配当前行内容
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substr(0, position.character+1);

    let regExpObj = getRegExp(Conf.regExp);
    if(!regExpObj) {return;};
    regExpObj=regExpObj.replace(/\(\[\\w-\]\+\)/,'');
    if(!regExpObj) {return;};
    if(!(new RegExp(regExpObj).test(linePrefix))){
      return undefined;
    }

    // 获取所有key值提示
    if(!Dictionary) {return;}; 
    const result = getLocalesKeys(document,Dictionary);
    if(!result) {return;};

    return result; 
  }

  resolveCompletionItem() {
    console.log("resolveCompletionItem");
    return null;
  }
}