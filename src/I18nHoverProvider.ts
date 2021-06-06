import {HoverProvider,TextDocument,Position,Hover} from 'vscode';
import {getRange,getLocales} from './utils/utils';

import Conf from './conf';
import {Dictionary} from './Dictionary';

export default class implements HoverProvider{

  provideHover(document:TextDocument, position:Position){
    // 假如用户没有该配置 | 没有多语言字典 => 提前返回
    if(!Conf?.regExp || !Dictionary) {return;}; 
    console.log("implements -> provideHover -> Dictionary", Dictionary);

    // 获取当前行内容
    const {character} = position;
    let lineWord = document.lineAt(position).text;

    // 匹配intl.get("xx"
    const getRangeRe = getRange(lineWord,character,Conf.regExp);
    if(!getRangeRe) {return;}; 
    const {value} =getRangeRe;

    const tips = getLocales(value,document,Dictionary);
    if(tips){
      return new Hover(tips); 
    }
  }
}