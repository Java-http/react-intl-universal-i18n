import {DefinitionProvider,TextDocument,Position} from 'vscode';
import {getRange,getWordLocation} from './utils';
import {TDictionary,TConf} from './type';
import EventBus from './eventBus';

export default class implements DefinitionProvider{
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

  async provideDefinition(document:TextDocument, position:Position){
    const {character} = position;

    // 获取当前行内容
    let lineWord = document.lineAt(position).text;

    // 匹配intl.get("xx"
    const getRangeRe = getRange(lineWord,character);
    if(!getRangeRe) {return;}; 
    const {value} =getRangeRe;

    const location = await getWordLocation(value,document,this._Dictionary,this._conf);
    if(!location) {return;};

    return location;
  }
}