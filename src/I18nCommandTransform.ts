import {Position, window, workspace,Selection} from 'vscode';
import * as prettier from 'prettier';

import Conf from './conf';
import {Dictionary} from './Dictionary';
import {transformBySearch,transformStringLiteral,getImportVariable} from './utils';

import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import generate from '@babel/generator';

export default class {
  constructor(){
    this.init();
  }

  async init(){
    const editor = window.activeTextEditor;
    if(!editor) {return;};
    const document = editor.document;
    
    // 寻找当前项目位置
    const fileName = document.fileName;
    if(!Dictionary) {return;}; 
    const matchFolders = Object.keys(Dictionary)
      .filter(item=>(fileName.indexOf(item+'/')>-1))
      .sort((a,b)=>(b.length-a.length));
    if(!matchFolders[0]) {return;};

    const code = document.getText();
    const ast = parser.parse(code,{
      sourceType: 'module',
      plugins:[
        'jsx',
        'typescript',
      ],
    });

    // 判断有没有引入intl多语言对象
    const importVariable = getImportVariable(Conf.import);
    let hasImportIntl = !!ast.program.body.find(item => {
      if(t.isImportDeclaration(item)){
        const re = item.specifiers.find((n:any)=>{
          return n?.imported?.name === importVariable;
        });
        return re;
      }
    });

    // 遍历ast
    traverse(ast, {
      enter(path) {
        // import定义语句
        if(path.isImportDeclaration()){
          if(!hasImportIntl && !path.getAllNextSiblings()?.[0]?.isImportDeclaration()){
            const genAst = parser.parse(Conf.import,{
              sourceType: 'module',
              plugins:[
                'jsx',
                'typescript',
              ],
            });
            path.insertAfter(genAst);
            hasImportIntl=true;
          }          

          path.skip();
        }
        // jsx文字内容
        if (path.isJSXText()) {
          const value = path.node.value;
          if(!value.replace(/\s+/g,'')) {return;}; // 提前阻止空格(包含\n)
          if(!Dictionary) {return;}; 
          const ret = transformBySearch(value,{
            folder: matchFolders[0],
            Dictionary:Dictionary,
            regExp:Conf.regExp,
            isWrap:true,
          });
          if(!ret) {return;}; 
          path.node.value = ret;          
        }
        // isStringLiteral
        if(path.isStringLiteral()) {
          const value = path.node.value;
          if(!value.replace(/\s+/g,'')) {return;}; // 提前阻止空格(包含\n)

          if(!Dictionary) {return;}; 
          const key = transformStringLiteral(value,{
            folder: matchFolders[0],
            Dictionary:Dictionary,
          });
          if(!key) {return;}; 

          const objName = Conf.regExp.split(".")[0];
          const funcName = Conf.regExp.split(".")[1].split("(")[0];
          const callExpressionNode = t.callExpression(t.memberExpression(t.identifier(objName), t.identifier(funcName)), [t.stringLiteral(key)]);
          if(t.isJSXAttribute(path.parent)){
              path.replaceWith(t.jsxExpressionContainer(callExpressionNode));
          }else{
              path.replaceWith(callExpressionNode);
          }
        }       
        // NumericLiteral  
        if(path.isNumericLiteral()) {
          const value = path.node.value;

          if(!Dictionary) {return;}; 
          const key = transformStringLiteral(value,{
            folder: matchFolders[0],
            Dictionary:Dictionary,
          });
          if(!key) {return;}; 

          const objName = Conf.regExp.split(".")[0];
          const funcName = Conf.regExp.split(".")[1].split("(")[0];
          const callExpressionNode = t.callExpression(t.memberExpression(t.identifier(objName), t.identifier(funcName)), [t.stringLiteral(key)]);
          path.replaceWith(callExpressionNode);
        }       
      },
    });

    const output = generate(ast,{},code);

    const outputPrettier = prettier.format(output.code);
    
    editor.edit(editBuilder => {
      editBuilder.replace(new Selection(new Position(0,0),new Position(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER)), outputPrettier);
    });
  }
}