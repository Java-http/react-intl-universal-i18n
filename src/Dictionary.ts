import Conf from "./conf";
import { getAllLocales } from "./utils";
import EventBus from './eventBus';

/** 多语言类型 */
export interface TLocales {
	[key: string]: {
		[key: string]: string;
	};
}
/** 总-多语言类型 */
export interface TDictionary {
	[key: string]: TLocales;
}

/** 获取多语言字典 */
let Dictionary: TDictionary | undefined;

async function init(){
	// 获取多语言字典
	let _Dictionary = await getAllLocales(Conf);
	if(_Dictionary){
		Dictionary=_Dictionary;
		EventBus.emit("I18nInit");
	}
}
init();

EventBus.on("I18nReload",async()=>{
	// 获取多语言字典
	let _Dictionary = await getAllLocales(Conf);
	if(_Dictionary){
		Dictionary=_Dictionary;
	}
});

export {
	Dictionary
};
