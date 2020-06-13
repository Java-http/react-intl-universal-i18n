# react-intl-universal-i18n

## Features

这是一款`react-intl-universal`提示工具,提供以下功能:
- 代码提示: 显示所有语言提示
- 代码转换: 打开`vscode`命令行输入`i18nTransform`,可包含引号`'"`
- 语言文件定义跳转: 默认跳转所有语言文件
- 语言key值补全

### 动图演示

**代码提示**

![](./gif/1.gif)

**代码转换**

![](./gif/2.gif)

**定义跳转**

![](./gif/3.gif)

**key值提示**

![](./gif/4.gif)

## Extension Settings

-  `react-intl-universal-i18n.configPath`  
    - description: 多语言文件夹,默认为`locales`
    - type: `string`
    - default: `locales`
- `react-intl-universal-i18n.defaultDefinition`
    - description: 多语言定义跳转文件,假如你选择了`en`,则默认跳转`en`语言文件,默认提供全部语言文件定义地址
    - type: `string`|`string[]`
    - default: `""`

## Known Issues

### 1 插件未提供监听多语言文件修改功能

当修改多语言文件后,请手动打开命令行输入`i18nReload`,作用是重新收集一次多语言文件内容

**Enjoy!**
