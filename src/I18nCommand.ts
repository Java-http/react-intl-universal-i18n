import {Position,Selection,window} from 'vscode';
import {transform} from './utils';
import {TDictionary,TConf} from './type';
import EventBus from './eventBus';

export default class {
  _Dictionary:TDictionary;
  _conf:TConf;

  constructor(Dictionary:TDictionary,conf:TConf){
    this._Dictionary = Dictionary;
    this._conf = conf;
    this.init();
    this.onWatch();
  }

  onWatch(){
    EventBus.on("I18nReload",(Dictionary:TDictionary)=>{
      this._Dictionary = Dictionary;
    });
  }

  async init(){
    const editor = window.activeTextEditor;
    if(!editor) {return;};
    let document = editor.document;
    let selection = editor.selection;

    // first Get the word within the selection
    let word = document.getText(selection);
    word = word.replace(/^['"](.*)['"]$/,"$1");
    
    let reversed = transform(word,{
      document,
      Dictionary:this._Dictionary,
      regExp:this._conf.regExp
    });
    
    editor.edit(editBuilder => {
      if(!reversed) {return;}; 
      editBuilder.replace(selection, reversed);
    });
  }
}