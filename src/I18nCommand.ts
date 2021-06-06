import {window} from 'vscode';
import {transform} from './utils/utils';

import Conf from './conf';
import {Dictionary} from './Dictionary';

export default class {
  constructor(){
    this.init();
  }

  async init(){
    const editor = window.activeTextEditor;
    if(!editor) {return;};
    let document = editor.document;
    let selection = editor.selection;

    // first Get the word within the selection
    let word = document.getText(selection);
    word = word.replace(/^['"](.*)['"]$/,"$1");
    
    if(!Dictionary) {return;}; 
    let reversed = transform(word,{
      document,
      Dictionary:Dictionary,
      regExp:Conf.regExp
    });
    
    editor.edit(editBuilder => {
      if(!reversed) {return;}; 
      editBuilder.replace(selection, reversed);
    });
  }
}