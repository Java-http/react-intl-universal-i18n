import {DefinitionProvider,TextDocument,Position} from 'vscode';
import {getRange,getWordLocation} from './utils';

import Conf from './conf';
import {Dictionary} from './Dictionary';
export default class implements DefinitionProvider{

  async provideDefinition(document:TextDocument, position:Position){
    const {character} = position;

    // 获取当前行内容
    let lineWord = document.lineAt(position).text;

    // 匹配intl.get("xx"
    const getRangeRe = getRange(lineWord,character,Conf.regExp);
    if(!getRangeRe) {return;}; 
    const {value} =getRangeRe;

    if(!Dictionary) {return;}; 
    const location = await getWordLocation(value,document,Dictionary,Conf);
    if(!location) {return;};

    return location;
  }
}