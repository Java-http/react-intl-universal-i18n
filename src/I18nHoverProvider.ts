import {HoverProvider,TextDocument,Position,Hover} from 'vscode';
import {getRange,getLocales} from './utils';
import {TDictionary,TConf} from './type';
import EventBus from './eventBus';

export default class implements HoverProvider{
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

  provideHover(document:TextDocument, position:Position){
    const {character} = position;

    // 获取当前行内容
    let lineWord = document.lineAt(position).text;

    // 匹配intl.get("xx"
    const getRangeRe = getRange(lineWord,character);
    if(!getRangeRe) {return;}; 
    const {value} =getRangeRe;

    const tips = getLocales(value,document,this._Dictionary);
    if(tips){
      return new Hover(tips); 
    }
  }
}