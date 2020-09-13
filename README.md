# react-intl-universal-i18n

## Features

这是一款`react-intl-universal`提示工具,提供以下功能:
- **代码提示:** 显示所有语言提示
- **代码转换:** 选中要转换的字符(可包含引号`'"`),打开`vscode`命令行输入`i18nTransform`
- **语言文件定义跳转:** 默认跳转所有语言文件
- **语言key值补全**
- **格式匹配:** 默认`intl.get('$1')`

### 动图演示

**代码提示**

![1.gif](https://i.loli.net/2020/06/14/ksBrc8uFogleATD.gif)

**代码转换**

![2.gif](https://i.loli.net/2020/06/14/nFjxg2vu4KlD13G.gif)

**定义跳转**

![3.gif](https://i.loli.net/2020/06/14/5HDbklZNB73Cf1x.gif)

**key值提示**

![4.gif](https://i.loli.net/2020/06/14/G73tjRMUhyYZ4gz.gif)

**格式匹配**

![4.gif](https://i.loli.net/2020/06/16/I3A9J8VMqDbkNfZ.gif)

## Extension Settings

-  **`react-intl-universal-i18n.configPath`**  
         - description: 多语言文件夹,默认为`src/locales`  
         - type: `string`  
         - default: `src/locales`
- **`react-intl-universal-i18n.defaultDefinition`**  
        - description: 多语言定义跳转文件,假如你选择了`en`,则默认跳转`en`语言文件,默认提供全部语言文件定义地址  
        - type: `string`|`string[]`  
        - default: `""` 
- **`react-intl-universal-i18n.regExp`**    
        - description: 多语言匹配格式,如果你不是`intl.get('$1')`这种格式,可自定义配置其他格式,`$1`是匹配词,必须存在哦    
        - type: `string`     
        - default: `"intl.get('$1')"`    
- **`react-intl-universal-i18n.watchMode`**    
        - description: 多语言文件修改是否开启监听模式
        - type: `boolean`     
        - default: `false`    

## Known Issues

### 1 插件未提供监听功能

当修改多语言文件内容后,请手动打开命令行输入`i18nReload`,作用是重新收集一次多语言文件内容

### 2 多语言文件有什么格式要求吗

格式如下
```
export default {
  title: "abc",
  name:"name"
};
```
获取多语言`json`是通过`ast`解析,支持`ts`,`js`格式,但不支持多层嵌套

### 3 怎么改格式匹配

当你的项目并不是`react-intl-universal`文档规定的格式,比如是`INTL.$t("title")`,那么你可通过修改配置(注意双引号要加反斜杠转义)  
```
"react-intl-universal-i18n.regExp":"INTL.$t(\"$1\")"
```  
改完重启`Vscode`即可生效


**Enjoy!**
