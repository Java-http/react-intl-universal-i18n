/** 多语言类型 */
export interface TLocales {
  [key:string]:{
    [key:string]:string
  }
}

/** 总-多语言类型 */
export interface TDictionary {
  [key:string]:TLocales
}

/** 配置 */
export interface TConf {
  /** 多语言文件夹位置 */
  configPath:string,
  /** 多语言定义跳转默认语言 */
  defaultDefinition:string,
  [key:string]:string
}
