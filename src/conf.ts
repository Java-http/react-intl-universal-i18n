import * as vscode from 'vscode';
const Configuration = vscode.workspace.getConfiguration();

/** 配置 */
export interface TConf {
  /** 多语言文件夹位置 */
  configPath:string,
  /** 多语言定义跳转默认语言 */
  defaultDefinition:string,
  /** 匹配格式 */
  regExp:string,
  /** 是否开启监听模式 */
  watchMode:boolean,
}

const Conf:TConf = {
  configPath: Configuration.get('react-intl-universal-i18n.configPath','src/locales'),
  defaultDefinition: Configuration.get('react-intl-universal-i18n.defaultDefinition',''),
  regExp: Configuration.get('react-intl-universal-i18n.regExp',`intl.get('$1')`),
  watchMode: Configuration.get('react-intl-universal-i18n.watchMode',false),
};

export default Conf;