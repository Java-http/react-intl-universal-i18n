import {Position, window, workspace,Selection} from 'vscode';
import * as prettier from 'prettier';

import Conf from './conf';
import {Dictionary} from './Dictionary';
import {transformStringLiteral,transformFindKey,getImportVariable} from './utils/astTransform';

import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse,{NodePath} from "@babel/traverse";
import generate from '@babel/generator';

export default class {
  /** 解析ast配置项 */
  parseOption: parser.ParserOptions = {
    sourceType: 'module',
    plugins:[
      'jsx',
      'typescript',
    ],
  };
  /** 当前项目目录 */
  matchFolder:string = '';

  traverseJSXText(path:NodePath<t.JSXText>){
    const value = path.node.value;
    if(!value.replace(/[\s\n]+/g,'')) {return;}; // 提前阻止空格(包含\n)
    
    if(!Dictionary) {return;}; 
    const ret = transformStringLiteral(value,{
      folder: this.matchFolder,
      Dictionary:Dictionary,
      regExp:Conf.regExp,
      isWrap: false,
    });
    if(!ret) {return;}; 

    path.node.value = ret;
  }

  traverseStringLiteral(path:NodePath<t.StringLiteral>){
    const value = path.node.value;
    if(!value.replace(/[\s\n]+/g,'')) {return;}; // 提前阻止空格(包含\n)

    if(!Dictionary) {return;}; 
    const ret = transformStringLiteral(value,{
      folder: this.matchFolder,
      Dictionary:Dictionary,
      regExp:Conf.regExp,
      isWrap: true,
    });
    if(!ret) {return;}; 

    const genAst = parser.parse(`\`${ret}\``,this.parseOption);
    let templateElement = genAst.program.body[0] as any;
    if(templateElement?.expression?.quasis?.every((item:any)=>item.value.raw==='') && templateElement?.expression?.expressions?.length === 1){
      templateElement = templateElement.expression.expressions[0];
    }

    if(t.isJSXAttribute(path.parent)){
      path.replaceWith(t.jsxExpressionContainer(templateElement));
      path.skip(); // 防止replaceWith生成的元素再执行遍历爆栈
    }else{
      path.replaceWith(templateElement);
      path.skip(); // 防止replaceWith生成的元素再执行遍历爆栈
    }
  }

  traverseNumericLiteral(path:NodePath<t.NumericLiteral>){
    const value = path.node.value;

    if(!Dictionary) {return;}; 
    const key = transformFindKey(value,{
      folder: this.matchFolder,
      Dictionary:Dictionary,
    });
    if(!key) {return;}; 

    const objName = Conf.regExp.split(".")[0];
    const funcName = Conf.regExp.split(".")[1].split("(")[0];
    const callExpressionNode = t.callExpression(t.memberExpression(t.identifier(objName), t.identifier(funcName)), [t.stringLiteral(key)]);
    path.replaceWith(callExpressionNode);
    path.skip(); // 防止replaceWith生成的元素再执行遍历爆栈
  }

  traverseTemplateLiteral(path:NodePath<t.TemplateLiteral>){
    const value = generate(path.node)?.code;
    if(!value || !value.replace(/`[\s\n]*`/g,'')) {return;}; // 提前阻止空格(包含\n)

    if(!Dictionary) {return;}; 
    let ret = transformStringLiteral(value,{
      folder: this.matchFolder,
      Dictionary:Dictionary,
      regExp:Conf.regExp,
      isWrap: true,
    });
    if(!ret) {return;}; 

    // 特殊处理 ${'${intl.get('xx')}'} 情况
    ret = ret.replace(/(\${['"])(.*)(['"]})/g,"$2");

    const genAst = parser.parse(ret,this.parseOption);
    let templateElement = genAst.program.body[0] as any;
    if(templateElement?.expression?.quasis?.every((item:any)=>item.value.raw==='') && templateElement?.expression?.expressions?.length === 1){
      templateElement = templateElement.expression.expressions[0];
    }

    path.replaceWith(templateElement);
    path.skip(); // 防止replaceWith生成的元素再执行遍历爆栈
    
  }

  async init(){
    const _self = this;
    
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
    this.matchFolder = matchFolders[0];

    // 解析当前文档为ast
    const code = document.getText();
    const ast = parser.parse(code,this.parseOption);

    // 判断有没有引入intl多语言对象
    const importVariable = getImportVariable(Conf.import);
    const genAst = parser.parse(Conf.import,this.parseOption);

    let hasImport = false;
    let hasImportIntl = !!ast.program.body.find(item => {
      if(t.isImportDeclaration(item)){
        hasImport = true;

        const re = item.specifiers.find((n:any)=>{
          return n?.imported?.name === importVariable;
        });
        return re;
      }
    });
    if(!hasImport){
      hasImport = true;
      hasImportIntl = true;
      ast.program.body.unshift(genAst as any);
    }

    // 遍历ast
    traverse(ast, {
      enter(path) {
        // import定义语句
        if(path.isImportDeclaration()){
          if(!hasImportIntl && !path.getAllNextSiblings()?.[0]?.isImportDeclaration()){
            path.insertAfter(genAst);
            hasImportIntl=true;
          }          

          path.skip();
        }
        // jsx文字内容
        if (path.isJSXText()) {
          _self.traverseJSXText(path);
        }
        // isStringLiteral
        if(path.isStringLiteral()) {
          _self.traverseStringLiteral(path);
        }       
        // NumericLiteral  
        if(path.isNumericLiteral()) {
          _self.traverseNumericLiteral(path);
        }
        // isTemplateElement
        if(path.isTemplateLiteral()){
          _self.traverseTemplateLiteral(path);
        }  
      },
    });

    const output = generate(ast,{},code);
    const outputPrettier = prettier.format(output.code);
    
    editor.edit(editBuilder => {
      editBuilder.replace(new Selection(new Position(0,0),new Position(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER)), outputPrettier);
    });
  }

  constructor(){
    this.init();
  }
}