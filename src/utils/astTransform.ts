import * as vscode from 'vscode';
import { parse } from "recast";
import {TDictionary} from '../Dictionary';
import {TConf} from '../conf';

/** ast搜索转换key值 */
export function getJsonKeyBySearch(json:Object,value:string,regExpStr:string,isWrap:boolean){
  const result = {
    done: false,
    value: value,
  };
  const matchArr = regExpStr.split("\$1");

  for (const [key,val] of Object.entries(json).sort((a,b)=>b[1].length - a[1].length)) {
    if(result.value.includes(val)){   
      result.value = result.value.replace(new RegExp(val,'g'),function($0,idx){
        if(result.value.slice(idx - matchArr[0].length,idx)===matchArr[0]){
          return $0;
        }
        return isWrap ? `\${${regExpStr.replace("\$1",key)}}` : `{${regExpStr.replace("\$1",key)}}`;
      });
    }
  }

  const regObj = new RegExp(`\\\$?{${regExpStr.replace(/([()])/g,'\\$1').replace("\$1",'[\\w.]+')}\\}|\\s+`,'g');
  if(!result.value.replace(regObj,'')){
    result.done = true;
    return result; 
  }

  return result; 
}

export function transformStringLiteral(source:string,{
  folder,
  Dictionary,
  regExp,
  isWrap,
}:{
  folder: string;
  Dictionary:TDictionary;
  regExp: string;
  isWrap: boolean;
}){
  let re = source;
  
  // 寻找当前项目位置  
  const contents = Dictionary[folder];
  // 优先查找中文简体语言库
  const contentsIndex = Object.keys(contents).sort(a=>a==='zh-CN'?-1:1);
  const contentValues = contentsIndex.reduce((prev:any,cur)=>{
    prev.push(contents[cur]);
    return prev;
  },[]);
  
  for (let i = 0; i < contentValues.length; i++) {
    const getRet = getJsonKeyBySearch(contentValues[i],re,regExp,isWrap);
    re = getRet.value;
    if(getRet.done){
      break;
    }
  }
  
  if(!re) {return;}; 
  if(re === source) {return;}; // 如果没有转换过,
  
  return re;
}

export function findKey(json:Object,value:string | number){
  for (const [key,val] of Object.entries(json)) {
    if(val === value || ( typeof value === 'string' && val === value.trim())){
      return key;
    } 
  }
}

/** 寻找key值 */
export function transformFindKey(source:string | number,{
  folder,
  Dictionary,
}:{
  folder: string;
  Dictionary:TDictionary;
}){
  let re = '';

   // 寻找当前项目位置  
   const contents = Dictionary[folder];
   // 优先查找中文简体语言库
   const contentsIndex = Object.keys(contents).sort(a=>a==='zh-CN'?-1:1);
   const contentValues = contentsIndex.reduce((prev:any,cur)=>{
     prev.push(contents[cur]);
     return prev;
   },[]);

   for (let i = 0; i < contentValues.length; i++) {
    const getRet = findKey(contentValues[i],source);
    if(getRet !== undefined){
      re = getRet;
      break;
    }
  }

  return re ? re : void 0;
}

/** 获取import语句的变量,如果是 import {intl} from '@/utils/js/locales'; 则变量是 intl */
export function getImportVariable(str:string|undefined){
  if(!str) {return void 0;};
  
  const matches = str.match(/import\s+{?\s*(\w+)\s*}?\s+/);
  if(matches?.[1]){
    return matches?.[1];
  }
}