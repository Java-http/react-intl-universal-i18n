import * as vscode from 'vscode';
import { parse } from "recast";
import {TDictionary} from './Dictionary';
import {TConf} from './conf';

const Uri = vscode.Uri;
const CompletionItem = vscode.CompletionItem;
const CompletionItemKind = vscode.CompletionItemKind;
const Location = vscode.Location;
const Position = vscode.Position;
const fs = vscode.workspace.fs;
const MarkdownString = vscode.MarkdownString;

/** AST解析-获取语言文件json内容 */
export function getJSON(source:string){
  const ast = parse(source);
  const props= ast.program.body[0].declaration.properties;
  const re = props.reduce((prev:any,cur:any)=>{
    const key=cur.key.name || cur.key.value;
    const value=cur.value.value;
    prev[key]=value;
    return prev;
  },{});
  return re;
}

/** Uint8Array转字符串 */
export function Uint8ArrayToString(array:Uint8Array) {
	var out, i, len, c;
	var char2, char3;

	out = "";
	len = array.length;
	i = 0;
	while(i < len) {
	c = array[i++];
	switch(c >> 4)
	{ 
		case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
			// 0xxxxxxx
			out += String.fromCharCode(c);
			break;
		case 12: case 13:
			// 110x xxxx   10xx xxxx
			char2 = array[i++];
			out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
			break;
		case 14:
			// 1110 xxxx  10xx xxxx  10xx xxxx
			char2 = array[i++];
			char3 = array[i++];
			out += String.fromCharCode(((c & 0x0F) << 12) |
										 ((char2 & 0x3F) << 6) |
										 ((char3 & 0x3F) << 0));
			break;
	}
	}

	return out;
}

/** 获取字符串在当前行位置范围 */
export function getRange(str:string,character:number,regExp:string){
  const re:{
    value:string,
    statrIndex:number,
    endIndex:number
  }[]=[];

  const regExpObj = getRegExp(regExp);
  if(!regExpObj) {return;};

  const _RegExp = new RegExp(regExpObj,"g");
	str.replace(_RegExp,($0:string,$1:string,$2:number)=>{
    re.push({
      value:$1,
      statrIndex:$2+$0.indexOf($1),
      endIndex:$2+$0.indexOf($1)+$1.length -1
    });
    return ''; 
  });

	if(!re.length){return;};
  const result = re.filter(({
    statrIndex,
    endIndex
  })=>{
    return (character>=statrIndex &&  character<=endIndex); 
  });

  if(result.length){
    return result[0];
  }
  return undefined;
}

/**
 * 获取多语言提示
 * @param value 多语言key值
 * @param document 当前文档对象
 * @param Dictionary 多语言字典
 */
export function getLocales(value:string,document:vscode.TextDocument,Dictionary:TDictionary){
  const re = new MarkdownString();

  // 寻找当前项目位置
	const fileName = document.fileName;
  const matchFolders = Object.keys(Dictionary)
  .filter(item=>(fileName.indexOf(item+'/')>-1))
  .sort((a,b)=>(b.length-a.length));
	
  if(!matchFolders[0]) {return;};
  
  const locales = Dictionary[matchFolders[0]];
  let str='';
  for (const k of Object.keys(locales)) {
    if(locales[k][value]){
      str += `
      "${k}" : "${locales[k][value]}"  `;
    }
  }
  if(str==='') {str="没有找到该key值的多语言,请检查是否正确设置了?";};

  re.appendMarkdown(str);
  return re;
};

/** 获取多语言文件内容 */
export async function getAllLocales(Conf:TConf){
  
  if(!vscode.workspace.workspaceFolders?.length) {
    console.log("当前没有项目打开");
    return;
  }; 

  console.log("获取多语言文件内容...");

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const re:TDictionary={};

  for (let i = 0; i < workspaceFolders.length; i++) {
    try {
      const item = workspaceFolders[i];
      const localesPath = item.uri.fsPath+'/'+Conf.configPath;
      const directory = await fs.readDirectory(Uri.file(localesPath));
      const directoryContent = await readDirectory(localesPath,directory);
      if(!directoryContent) {continue;};
      re[item.uri.fsPath] = directoryContent;
    } catch (error) {
    }
  }

  // 找不到多语言文件夹路径
  if(!Object.keys(re).length){
    return; 
  }

  return re;

	// return workspaceFolders.reduce(async(prev:any,item)=>{
	// 	const localesPath = item.uri.fsPath+'/'+configPath;
	// 	const directory = await fs.readDirectory(Uri.file(localesPath));
	// 	const contents:any = {};

	// 	for (let i = 0; i < directory.length; i++) {
	// 		const ele = directory[i][0];
	// 		const elePath = localesPath+'/'+ele;
	// 		const content= await fs.readFile(Uri.file(elePath));
	// 		const eleName = ele.split(".")[0];
	// 		const value = getJSON(Uint8ArrayToString(content));
	// 		contents[eleName]=value;
	// 	}

	// 	prev[item.uri.fsPath]=contents;
	// 	return prev;
	// },{});
}

/** 读取多语言文件 */
export async function readDirectory(localesPath:string,directory:[string, vscode.FileType][]){
  if(!directory.length) {return;}; 

  const contents:any={};
  for (let i = 0; i < directory.length; i++) {
    try {
      const ele = directory[i][0];
      const elePath = localesPath+'/'+ele;
      const content= await fs.readFile(Uri.file(elePath));
      const eleName = ele.split(".")[0];
      const value = getJSON(Uint8ArrayToString(content));
      contents[eleName]=value;
    } catch (error) {
      
    }
  }

  if(!Object.keys(contents).length){return;};

  return contents;
}

/** 返回多语言位置 */
export async function getWordLocation(value:string,document:vscode.TextDocument,Dictionary:TDictionary,conf:TConf){
  let re=[];

  const fileName = document.fileName;
  const matchFolders = Object.keys(Dictionary)
    .filter(item=>(fileName.indexOf(item+'/')>-1))
    .sort((a,b)=>(b.length-a.length));
  if(!matchFolders[0]) {return;};

  try {
    const localesPath = matchFolders[0]+'/'+conf.configPath;
    const directory = await fs.readDirectory(Uri.file(localesPath));
    const filePathArr = (()=>{

      let defaultDefinition:string[]=[];
      if(typeof conf.defaultDefinition === 'string' && conf.defaultDefinition!==''){
        defaultDefinition = [conf.defaultDefinition];
      }else if(Array.isArray(conf.defaultDefinition)){
        defaultDefinition = conf.defaultDefinition;
      }else{
        return directory.reduce((prev:string[],cur)=>{
          prev.push(localesPath+"/"+cur[0]);
          return prev;
        },[]);
      }
      
      return defaultDefinition.reduce((prev:string[],cur:string)=>{
        const fileMatch = directory.filter(item=>item[0].split(".")[0]===cur);
        if(fileMatch.length) {
          prev.push(localesPath+"/"+fileMatch[0][0]);
        };
        return prev;
      },[]);
      
    })();
    if(!filePathArr.length) {return;};

    for (let i = 0; i < filePathArr.length; i++) {
      const word = await wordLocation(value,filePathArr[i]);
      if(word){
        re.push(
          new Location(Uri.file(word.filePath), new Position(word.lineIndex, word.wordIndex))
        );
      }
    }

  } catch (error) {
    console.error(error);
  }

  return re;
}

export async function wordLocation(value:string,filePath:string){
  const re={
    filePath:'',
    lineIndex:0,
    wordIndex:0
  };

  try {
    const content= await fs.readFile(Uri.file(filePath));
    const contentArr = Uint8ArrayToString(content).split("\n");
    for (let i = 0; i < contentArr.length; i++) {
      const element = contentArr[i];
      const regMatch = element.match(new RegExp(`${value}['"]?\\s*:\\s*['"]?`));
      if(regMatch){
        re.lineIndex = i;
        re.wordIndex = regMatch[0].length + (regMatch.index || 0) ;
        re.filePath = filePath;
        break;
      }
    }
  } catch (error) {
    console.log(error);
  }
  
  if(re.filePath){
    return re;
  }
}

/**
 * 转换i18n
 * @param source 
 * @param conf 
 * @param conf.document  当前文档对象
 * @param conf.Dictionary 多语言词典
 */
export function transform(source:string,conf:{
  document:vscode.TextDocument
  Dictionary:TDictionary
  regExp:string
}){
  const {document,Dictionary,regExp} = conf;
  let re='';
  
  // 寻找当前项目位置
  const fileName = document.fileName;
  const matchFolders = Object.keys(Dictionary)
    .filter(item=>(fileName.indexOf(item+'/')>-1))
    .sort((a,b)=>(b.length-a.length));
  if(!matchFolders[0]) {return;};
  
  const contents = Dictionary[matchFolders[0]];
  const contentValues = Object.values(contents);
  for (let i = 0; i < contentValues.length; i++) {
    const getKey = getJsonKey(contentValues[i],source);
    if(getKey){
      re=getKey;
      break;
    }
  }
  
  if(!re) {return;}; 

  if(!regExp) {return;};

  re = regExp.replace("\$1",re);
  
  return re;
}
export function getJsonKey(json:Object,value:string){
  for (const [key,val] of Object.entries(json)) {
    if(value === val){
      return key;
    }
  }
}

/** 获取多语言key值提示 */
export function getLocalesKeys(document:vscode.TextDocument,Dictionary:TDictionary){

  // 寻找当前项目位置
  const fileName = document.fileName;
  const matchFolders = Object.keys(Dictionary)
    .filter(item=>(fileName.indexOf(item+'/')>-1))
    .sort((a,b)=>(b.length-a.length));
  if(!matchFolders[0]) {return;};
  
  const locales = Dictionary[matchFolders[0]];
  const localesFirst = Object.values(locales)[0];
  const localesFirstKeys = Object.keys(localesFirst).map(item=>{
    return new CompletionItem(item, CompletionItemKind.Variable);
  });

  if(!localesFirstKeys || !localesFirstKeys.length){
    return undefined;
  }

  return localesFirstKeys;
};

/** 解析正则表达式 */
export function getRegExp(RegExpStr:string){
  if(/\\/.test(RegExpStr)){
    vscode.window.showInformationMessage("react-intl-universal-i18n插件RegExp设置不支持\\反斜线");
    return;
  }

  if(!/\$1/.test(RegExpStr)){
    vscode.window.showInformationMessage("react-intl-universal-i18n插件RegExp设置必须存在$1");
    return;
  }

  // 转译.()$
  let str=RegExpStr.replace(/([\.\(\)\$])/g,"\\$1");
  // 转译 '" 为 ['"]
  str=str.replace(/['"]/g,"['\"]");
  // 转译$1
  str=str.replace(/\\\$1/g,"([\\w-]+)");
  // 转译)$
  str=str.replace(/(\))$/,"$1?");

  try {
    new RegExp(str);
  } catch (error) {
    return;
  }
  return str;
}