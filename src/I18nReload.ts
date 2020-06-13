import {getAllLocales} from './utils';
import {TConf} from './type';
import EventBus from './eventBus';

export default class {
  _conf:TConf;

  constructor(conf:TConf){
    this._conf = conf;

    this.init();
  }

  async init(){
    // 获取多语言字典
    const Dictionary = await getAllLocales(this._conf);
    if(!Dictionary){return;}
    EventBus.emit("I18nReload",Dictionary);
  }
}