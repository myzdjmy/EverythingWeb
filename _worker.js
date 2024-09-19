addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  thisProxyServerUrlHttps = `${url.protocol}//${url.hostname}/`;
  thisProxyServerUrl_hostOnly = url.host;
  //console.log(thisProxyServerUrlHttps);
  //console.log(thisProxyServerUrl_hostOnly);

  event.respondWith(handleRequest(event.request))
})

const str = "/";
const lastVisitProxyCookie = "__PROXY_VISITEDSITE__";
const passwordCookieName = "__PROXY_PWD__";
const proxyHintCookieName = "__PROXY_HINT__";
const password = "";
const replaceUrlObj = "__location____"
var thisProxyServerUrlHttps;
var thisProxyServerUrl_hostOnly;
// const CSSReplace = ["https://", "http://"];
const proxyHintInjection = `
//---***========================================***---提示使用代理---***========================================***---

setTimeout(() => {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    var hint = \`Warning: You are currently using a web proxy, the original link is \${window.location.pathname}. Please note that you are using a proxy, and do not log in to any website. Click to close this hint. 警告：您当前正在使用网络代理，原始链接为\${window.location.pathname}。请注意您正在使用代理，请勿登录任何网站。单击关闭此提示。\`;
    console.log(1);
    document.body.insertAdjacentHTML(
      'afterbegin', 
      \`<div style="position:fixed;left:0px;top:0px;width:100%;margin:0px;padding:0px;z-index:9999999999999999999;user-select:none;cursor:pointer;" id="__PROXY_HINT_DIV__" onclick="document.getElementById('__PROXY_HINT_DIV__').remove();">
        <span style="position:absolute;width:100%;min-height:30px;font-size:20px;color:yellow;background:red;text-align:center;border-radius:5px;">
          \${hint}
        </span>
      </div>\`    
    );
  }else{
    alert(\`Warning: You are currently using a web proxy, the original link is \${window.location.pathname}. Please note that you are using a proxy, and do not log in to any website.\`);
  }
}, 3000);

`;
const httpRequestInjection = `

//---***========================================***---information---***========================================***---
var now = new URL(window.location.href);
var base = now.host;
var protocol = now.protocol;
var nowlink = protocol + "//" + base + "/";
var oriUrlStr = window.location.href.substring(nowlink.length);
var oriUrl = new URL(oriUrlStr);

var path = now.pathname.substring(1);
console.log("***************************----" + path);
if(!path.startsWith("http")) path = "https://" + path;

var original_host = path.substring(path.indexOf("://") + "://".length);
original_host = original_host.split('/')[0];
var mainOnly = path.substring(0, path.indexOf("://")) + "://" + original_host + "/";


//---***========================================***---通用func---***========================================***---
function changeURL(relativePath){
  if(relativePath.startsWith("data:") || relativePath.startsWith("mailto:") || relativePath.startsWith("javascript:") || relativePath.startsWith("chrome") || relativePath.startsWith("edge")) return relativePath;
  try{
    if(relativePath && relativePath.startsWith(nowlink)) relativePath = relativePath.substring(nowlink.length);
    if(relativePath && relativePath.startsWith(base + "/")) relativePath = relativePath.substring(base.length + 1);
    if(relativePath && relativePath.startsWith(base)) relativePath = relativePath.substring(base.length);
  }catch{
    //ignore
  }
  try {
    var absolutePath = new URL(relativePath, path).href;
    absolutePath = absolutePath.replace(window.location.href, path);
    absolutePath = absolutePath.replace(encodeURI(window.location.href), path);
    absolutePath = absolutePath.replace(encodeURIComponent(window.location.href), path);

    absolutePath = absolutePath.replace(nowlink, mainOnly);
    absolutePath = absolutePath.replace(nowlink, encodeURI(mainOnly));
    absolutePath = absolutePath.replace(nowlink, encodeURIComponent(mainOnly));


      absolutePath = absolutePath.replace(nowlink, mainOnly.substring(0,mainOnly.length - 1));
      absolutePath = absolutePath.replace(nowlink, encodeURI(mainOnly.substring(0,mainOnly.length - 1)));
      absolutePath = absolutePath.replace(nowlink, encodeURIComponent(mainOnly.substring(0,mainOnly.length - 1)));

      absolutePath = absolutePath.replace(base, original_host);

    absolutePath = nowlink + absolutePath;
    return absolutePath;
  } catch (e) {
    console.log(path + "   " + relativePath);
    return "";
  }
}




//---***========================================***---注入网络---***========================================***---
function networkInject(){
  //inject network request
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalFetch = window.fetch;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {

    url = changeURL(url);
    
    console.log("R:" + url);
    return originalOpen.apply(this, arguments);
  };

  window.fetch = function(input, init) {
    var url;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = input;
    }



    url = changeURL(url);



    console.log("R:" + url);
    if (typeof input === 'string') {
      return originalFetch(url, init);
    } else {
      const newRequest = new Request(url, input);
      return originalFetch(newRequest, init);
    }
  };
  
  console.log("NETWORK REQUEST METHOD INJECTED");
}


//---***========================================***---注入window.open---***========================================***---
function windowOpenInject(){
  const originalOpen = window.open;

  // Override window.open function
  window.open = function (url, name, specs) {
      let modifiedUrl = changeURL(url);
      return originalOpen.call(window, modifiedUrl, name, specs);
  };

  console.log("WINDOW OPEN INJECTED");
}


//---***========================================***---注入append元素---***========================================***---
function appendChildInject(){
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    try{
      if(child.src){
        child.src = changeURL(child.src);
      }
      if(child.href){
        child.href = changeURL(child.href);
      }
    }catch{
      //ignore
    }
    return originalAppendChild.call(this, child);
};
console.log("APPEND CHILD INJECTED");
}


//---***========================================***---注入location---***========================================***---
class ProxyLocation {
  constructor(originalLocation) {
      this.originalLocation = originalLocation;
  }

  // 方法：重新加载页面
  reload(forcedReload) {
      this.originalLocation.reload(forcedReload);
  }

  // 方法：替换当前页面
  replace(url) {
      this.originalLocation.replace(changeURL(url));
  }

  // 方法：分配一个新的 URL
  assign(url) {
      this.originalLocation.assign(changeURL(url));
  }

  // 属性：获取和设置 href
  get href() {
      return oriUrlStr;
  }

  set href(url) {
      this.originalLocation.href = changeURL(url);
  }

  // 属性：获取和设置 protocol
  get protocol() {
      return this.originalLocation.protocol;
  }

  set protocol(value) {
      this.originalLocation.protocol = changeURL(value);
  }

  // 属性：获取和设置 host
  get host() {
    console.log("*host");
      return original_host;
  }

  set host(value) {
    console.log("*host");
      this.originalLocation.host = changeURL(value);
  }

  // 属性：获取和设置 hostname
  get hostname() {
    console.log("*hostname");
      return oriUrl.hostname;
  }

  set hostname(value) {
    console.log("s hostname");
      this.originalLocation.hostname = changeURL(value);
  }

  // 属性：获取和设置 port
  get port() {
    return oriUrl.port;
  }

  set port(value) {
      this.originalLocation.port = value;
  }

  // 属性：获取和设置 pathname
  get pathname() {
    console.log("*pathname");
    return oriUrl.pathname;
  }

  set pathname(value) {
    console.log("*pathname");
      this.originalLocation.pathname = value;
  }

  // 属性：获取和设置 search
  get search() {
    console.log("*search");
    console.log(oriUrl.search);
     return oriUrl.search;
  }

  set search(value) {
    console.log("*search");
      this.originalLocation.search = value;
  }

  // 属性：获取和设置 hash
  get hash() {
      return oriUrl.hash;
  }

  set hash(value) {
      this.originalLocation.hash = value;
  }

  // 属性：获取 origin
  get origin() {
      return oriUrl.origin;
  }
}



function documentLocationInject(){
  Object.defineProperty(document, 'URL', {
    get: function () {
        return oriUrlStr;
    },
    set: function (url) {
        document.URL = changeURL(url);
    }
});

Object.defineProperty(document, '${replaceUrlObj}', {
      get: function () {
          return new ProxyLocation(window.location);
      },
      set: function (url) {
          window.location.href = changeURL(url);
      }
});
console.log("LOCATION INJECTED");
}



function windowLocationInject() {

  Object.defineProperty(window, '${replaceUrlObj}', {
      get: function () {
          return new ProxyLocation(window.location);
      },
      set: function (url) {
          window.location.href = changeURL(url);
      }
  });

  console.log("WINDOW LOCATION INJECTED");
}









//---***========================================***---注入历史---***========================================***---
function historyInject(){
  const originalPushState = History.prototype.pushState;
  const originalReplaceState = History.prototype.replaceState;

  History.prototype.pushState = function (state, title, url) {
    var u = new URL(url, now.href).href;
    return originalPushState.apply(this, [state, title, u]);
  };
  History.prototype.replaceState = function (state, title, url) {
    console.log(nowlink);
    console.log(url);
    console.log(now.href);
    var u = new URL(url, now.href).href;
    console.log(u);
    return originalReplaceState.apply(this, [state, title, u]);
  };
  console.log("HISTORY INJECTED");
}






//---***========================================***---Hook观察界面---***========================================***---
function obsPage() {
  var yProxyObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      traverseAndConvert(mutation);
    });
  });
  var config = { attributes: true, childList: true, subtree: true };
  yProxyObserver.observe(document.body, config);

  console.log("OBSERVING THE WEBPAGE...");
}

function traverseAndConvert(node) {
  if (node instanceof HTMLElement) {
    removeIntegrityAttributesFromElement(node);
    covToAbs(node);
    node.querySelectorAll('*').forEach(function(child) {
      removeIntegrityAttributesFromElement(child);
      covToAbs(child);
    });
  }
}


function covToAbs(element) {
  var relativePath = "";
  var setAttr = "";
  if (element instanceof HTMLElement && element.hasAttribute("href")) {
    relativePath = element.getAttribute("href");
    setAttr = "href";
  }
  if (element instanceof HTMLElement && element.hasAttribute("src")) {
    relativePath = element.getAttribute("src");
    setAttr = "src";
  }

  // Check and update the attribute if necessary
  if (setAttr !== "" && relativePath.indexOf(nowlink) != 0) { 
    if (!relativePath.includes("*")) {
        try {
          var absolutePath = changeURL(relativePath);
          console.log(absolutePath);
          element.setAttribute(setAttr, absolutePath);
        } catch (e) {
          console.log(path + "   " + relativePath);
        }
    }
  }
}
function removeIntegrityAttributesFromElement(element){
  if (element.hasAttribute('integrity')) {
    element.removeAttribute('integrity');
  }
}
//---***========================================***---Hook观察界面里面要用到的func---***========================================***---
function loopAndConvertToAbs(){
  for(var ele of document.querySelectorAll('*')){
    removeIntegrityAttributesFromElement(ele);
    covToAbs(ele);
  }
  console.log("LOOPED EVERY ELEMENT");
}

function covScript(){ //由于observer经过测试不会hook添加的script标签，也可能是我测试有问题？
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    covToAbs(scripts[i]);
  }
    setTimeout(covScript, 3000);
}




























//---***========================================***---操作---***========================================***---
networkInject();
windowOpenInject();
appendChildInject();
documentLocationInject();
windowLocationInject();
// historyInject();
// 这里实在无能为力不想改，可以pr一个




//---***========================================***---在window.load之后的操作---***========================================***---
window.addEventListener('load', () => {
  loopAndConvertToAbs();
  console.log("CONVERTING SCRIPT PATH");
  obsPage();
  covScript();
});
console.log("WINDOW ONLOAD EVENT ADDED");





//---***========================================***---在window.error的时候---***========================================***---

window.addEventListener('error', event => {
  var element = event.target || event.srcElement;
  if (element.tagName === 'SCRIPT') {
    console.log("Found problematic script:", element);
    if(element.alreadyChanged){
      console.log("this script has already been injected, ignoring this problematic script...");
      return;
    }
    // 调用 covToAbs 函数
    removeIntegrityAttributesFromElement(element);
    covToAbs(element);

    // 创建新的 script 元素
    var newScript = document.createElement("script");
    newScript.src = element.src;
    newScript.async = element.async; // 保留原有的 async 属性
    newScript.defer = element.defer; // 保留原有的 defer 属性
    newScript.alreadyChanged = true;

    // 添加新的 script 元素到 document
    document.head.appendChild(newScript);

    console.log("New script added:", newScript);
  }
}, true);
console.log("WINDOW CORS ERROR EVENT ADDED");




`;
const mainPage = `

<!DOCTYPE html>
<html lang="zh-cn">
<head>
<!--头部信息-->
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<!--title keywords description 请改为自己的-->
<title>绿墙|可百年|墙.顶.地.门.柜.整家定制|集成墙板厂家|最适合</title>
<meta name="keywords" content="绿墙,导航,网址"/>
<meta name="description" content="简单但实用的导航"/>

<!--网站favicon可以没有或者改为自己的-->
<link rel="shortcut icon" type="image/x-icon" href="https://img203.yun300.cn/img/lo.jpeg?tenantId=281241&viewType=1&k=1726628808000"/>

<!--CSS 若不需要变动样式不用改-->
<link href="https://cdnjs.cloudflare.com/ajax/libs/zui/1.8.1/css/zui.min.css" rel="stylesheet" type="text/css"/>
<style type="text/css">
ul {
    padding: 0;
}
li {
    list-style: none;
}
a:hover,a:active,a:focus {
    text-decoration: none;
}
body {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAIAAAAP3aGbAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjE3N0NCNjU1N0I3MTFFOUJCQ0FBNEMzRDU0NzhDNUMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjE3N0NCNjY1N0I3MTFFOUJCQ0FBNEMzRDU0NzhDNUMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyMTc3Q0I2MzU3QjcxMUU5QkJDQUE0QzNENTQ3OEM1QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyMTc3Q0I2NDU3QjcxMUU5QkJDQUE0QzNENTQ3OEM1QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlAkwtsAAMvPSURBVHja7L0Ns+U6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);
    background-repeat:repeat;
    background-attachment:fixed;
    overflow-x: hidden;
    overflow-y: auto;
}
i.icon,i.fa {
    margin-right: 6px
}
.col, .col-xs-1, .col-xs-2, .col-xs-3, .col-xs-4, .col-xs-5, .col-xs-6, .col-xs-7, .col-xs-8, .col-xs-9, .col-xs-10, .col-xs-11, .col-xs-12, .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12, .col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-md-7, .col-md-8, .col-md-9, .col-md-10, .col-md-11, .col-md-12, .col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11, .col-lg-12 {
    padding: 0px 5px;
}
header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    height: 50px;
    background: #FFF;
}
header .logo {
    font-size: 20px;
    height: 50px;
    margin: 0;
    font-weight: 400;
    position: relative;
    z-index: 99;
    border-bottom: 1px solid #e8e8e8;
    background: #FFF;
    text-align:center;
}
header .main {
    position: relative;
}
header .nav {
    width: 100%;
    margin-left: 25px;
    background: #FFF;
    margin: 0;
    overflow: hidden;
    transition: all 0.4s ease;
    -moz-transition: all 0.4s ease;
 /* Firefox 4 */
    -webkit-transition: all 0.4s ease;
 /* Safari  Chrome */
    -o-transition: all 0.4s ease;
 /* Opera */
    position: absolute;
    top: -300px;
    left: 0;
}
header .showNav {
    top: 50px;
    box-shadow: 0 5px 5px rgba(204,204,204,.15);
    -moz-box-shadow: 0 5px 5px rgba(204,204,204,.15);
}
header .nav li {
    font-size: 16px;
}
header .nav a {
    display: block;
    line-height: 40px;
    font-size: 16px;
    color: #959595;
    padding: 0 25px;
    border-bottom: 1px solid #f5f5f5;
}
header .nav a:hover {
    border-color: #459df5;
    color: #459df5;
}
header .head-btn {
    float: right;
    line-height: 60px;
}
header .head-btn a {
    margin-left: 5px;
    display: inline-block;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background: #f5f5f5;
    color: #03b8cf;
    border: 1px solid #e5e5e5;
    transition: all .2s;
    -moz-transition: all .2s;
 /* Firefox 4 */
    -webkit-transition: all .2s;
 /* Safari Chrome */
    -o-transition: all .2s;
 /* Opera */
}
header .head-btn a:hover {
    background: #03b8cf;
    color: #FFF;
    border: 1px solid #03b8cf;
}
header .head-btn a>i {
    margin-right: 0px;
    font-size: 15px;
}
header .nav-btn {
    position: fixed;
    border: none;
    background: transparent;
    top: 0;
    left: 10px;
    outline: 0;
    margin-top: 10px;
    z-index: 100
}
header .nav-btn {
    left: inherit;
    right: 10px;
}
header .nav-btn .icon-line {
    display: block;
    margin: 6px 0;
    width: 25px;
    height: 2px;
    background: #999;
    cursor: pointer;
    transition: all .4s ease;
    -moz-transition: all .4s ease;
 /* Firefox 4 */
    -webkit-transition: all .4s ease;
 /* Safari  Chrome */
    -o-transition: all .4s ease;
 /* Opera */
}
header .nav-btn .middle {
    margin: 0 auto;
}
header .animated2 .top {
    transform: translateY(8px) rotateZ(45deg);
    -ms-transform: translateY(8px) rotateZ(45deg);
   /* IE 9 */
    -moz-transform: translateY(8px) rotateZ(45deg);
   /* Firefox */
    -webkit-transform: translateY(8px) rotateZ(45deg);
 /* Safari 鍜� Chrome */
    -o-transform: translateY(8px) rotateZ(45deg);
   /* Opera */
}
header .animated2 .middle {
    width: 0;
}
header .animated2 .bottom {
    transform: translateY(-8px) rotateZ(-45deg);
    -ms-transform: translateY(-8px) rotateZ(-45deg);
   /* IE 9 */
    -moz-transform: translateY(-8px) rotateZ(-45deg);
   /* Firefox */
    -webkit-transform: translateY(-8px) rotateZ(-45deg);
 /* Safari Chrome */
    -o-transform: translateY(-8px) rotateZ(-45deg);
   /* Opera */
}
.left-bar {
    position: fixed;
    top: 50px;
    left: -240px;
    width: 200px;
    max-width: 100%;
    height: 100%;
    background: #353535;
    z-index: 12;
    transition: all 0.4s ease;
    -moz-transition: all 0.4s ease;
 /* Firefox 4 */
    -webkit-transition: all 0.4s ease;
 /* Safari 鍜� Chrome */
    -o-transition: all 0.4s ease;
 /* Opera */
    transform: translateZ(0);
    -ms-transform: translateZ(0);
   /* IE 9 */
    -moz-transform: translateZ(0);
   /* Firefox */
    -webkit-transform: translateZ(0);
 /* Safari 鍜� Chrome */
    -o-transform: translateZ(0);
   /* Opera */
}
.left-bar .header {
    padding: 0px 15px;
    border-bottom: 1px solid #464646;
}
.left-bar .header h2 {
    font-size: 17px;
    line-height: 40px;
    max-width: 100%;
    overflow: hidden;
    margin: 0;
    font-weight: 400;
    display: block;
    color: #ccc;
}
.left-bar .menu {
    height: 450px;
    margin-bottom: 15px;
    border-bottom: 1px solid #424242
}
.left-bar .menu ul li a {
    display: block;
    height: 35px;
    line-height: 35px;
    font-size: 14px;
    color: #777;
    padding-left: 38px;
}
.scrollcontent {
    width: 100%;
    top: 0;
    left: 0;
    padding-right: 4px;
    padding-top: 5px
}
.left-bar .menu ul li a:hover {
    background: #f5f5f5
}
.left-bar .menu ul li i.fa {
    width: 15px;
    text-align: center;
    margin-right: 20px
}
.left-bar .tree li.open > ul::-webkit-scrollbar {
    width: 3px;
    margin-right: 2px
}
.menu-about p {
    font-size: 12px;
    color: #ccc;
    text-align: center;
}
#content {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
}
#content > .Off-left-menu {
    display: none;
}
#content > div.center-main {
    margin: 0 auto;
}
.sousuo {
    padding: 35px 0;
}
.search {
    position: relative;
    width: 100%;
    margin: 0 auto;
}
.search-box {
    height: 50px;
  /*box-shadow: 0px 0px 2px 0px #ccc;*/
    border-radius: 10px;
    overflow: hidden;
    display: -webkit-flex;
 /* Safari */
    display: flex;
    flex-wrap: wrap;
    border: 1px solid #e6e6e6
}
.search-engine-name {
    width: 69px;
    height: 50px;
    background: #16C0F8;
    border: none;
    color: #fff;
    font-weight: bold;
    outline: none;
}
.search-input {
    box-sizing: border-box;
    flex: 1;
    height: 50px;
    line-height: 50px;
    font-size: 16px;
    color: #999;
    border: none;
    outline: none;
    padding-left: 6px;
}
input::-webkit-input-placeholder {
    font-size: 12px;
    letter-spacing: 1px;
    color: #ccc;
}
.search-btn {
    width: 80px;
    height: 50px;
    background: #16C0F8;
    border: none;
    color: #fff;
    font-weight: bold;
    outline: none;
}
.search-engine {
    position: absolute;
    top: 60px;
    left: 0;
    width: 100%;
    background: #FFF;
    padding: 15px 0 0 15px;
    border-radius: 5px;
    box-shadow: 0px 5px 20px 0px #d8d7d7;
    transition: all 0.3s;
    display: none;
    z-index: 999
}
.search-engine-head {
    overflow: hidden;
    margin-bottom: 10px;
    padding-right: 15px;
}
.search-engine-tit {
    float: left;
    margin: 0;
    font-size: 14px;
    color: #999;
}
.search-engine ul::before {
    content: '';
    width: 0px;
    height: 0px;
    position: absolute;
    top: -15px;
    border-top: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #fff;
    border-left: 8px solid transparent;
}
.search-engine-list::after {
    content: '';
    width: 70px;
    height: 18px;
    position: absolute;
    top: -17px;
    left: 1px;
}
.search-engine-list li {
    float: left;
    width: 30%;
    line-height: 30px;
    font-size: 14px;
    padding: 5px 10px 5px 10px;
    margin: 0 10px 10px 0;
    background: #f9f9f9;
    color: #999;
    cursor: pointer
}
.search-engine-list li img {
    width: 25px;
    height: 25px;
    border-radius: 15px;
    float: left;
    margin-right: 5px;
    margin-top: 2.5px;
}
#content .content-box {
    padding-top: 51px
}
.content-box {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 10px;
}
.item {
    width: 100%;
}
.item > .container-fluid {
    padding-top: 0;
    margin-top: 0;
}
.item > .container-fluid .row {
    padding: 10px 5px;
}
.item-tit > strong {
    color: #999;
    font-size: 18px;
    font-weight: 400;
    display: block;
    margin-bottom: 10px;
    padding-left: 5px;
}
.item-tit > strong > i {
    margin-right: 5px;
    font-size: 18px;
}
.card-link {
    display: block;
    padding: 10px 10px;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 10px;
    background: #fff;
    transition: all 0.2s ease-out;
    -moz-transition: all 0.2s ease-out;
 /* Firefox 4 */
    -webkit-transition: all 0.2s ease-out;
 /* Safari Chrome */
    -o-transition: all 0.2s ease-out;
 /* Opera */
}
.card-link:hover {
    transform: translateY(-5px);
    -ms-transform: translateY(-5px);
   /* IE 9 */
    -moz-transform: translateY(-5px);
   /* Firefox */
    -webkit-transform: translateY(-5px);
 /* Safari  Chrome */
    -o-transform: translateY(-5px);
   /* Opera */
    box-shadow: 4px 4px 10px rgba(204, 204, 204, 0.5);
    -moz-box-shadow: 4px 4px 10px rgba(204, 204, 204, 0.5);
 /* Firefox */
}
.card-tit {
    height: 20px;
    font-size: 14px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
}
.card-tit img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 5px;
}
.card-desc {
    color: gray;
    font-size: 12px;
    padding-top: 10px;
    height: 45px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.content-box .list-box {
    background: #FFF;
    padding: 20px 10px 0px 10px;
    margin: 0;
}
#get-top {
    width: 40px;
    height: 40px;
    background: #03b8cf;
    color: #FFF;
    position: fixed;
    right: 15px;
    bottom: 55px;
    line-height: 30px;
    text-align: center;
    font-size: 30px;
    cursor: pointer;
    display: none;
    z-index: 100;
}
#get-top i {
    margin: 0;
    font-size: 20px;
}
.footer {
    padding: 15px 20px 10px 20px;
    border-top: 1px solid #d0d0d0;
    background-color: #e8e8e8;
    text-align: center;
    font-size: 14px;
    color: #5d5d5d;
}
@media (min-width: 768px) {
    .col, .col-xs-1, .col-xs-2, .col-xs-3, .col-xs-4, .col-xs-5, .col-xs-6, .col-xs-7, .col-xs-8, .col-xs-9, .col-xs-10, .col-xs-11, .col-xs-12, .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12, .col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-md-7, .col-md-8, .col-md-9, .col-md-10, .col-md-11, .col-md-12, .col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11, .col-lg-12 {
        padding: 0 10px
    }
    #content .main {
        padding-top: 51px;
    }
    .sousuo {
        padding: 10px 0 50px 0;
        margin-top: 0;
    }
    .sousuo-form {
        width: 100%;
        margin: 0 auto;
    }
    #input {
        outline: none;
        padding: 0 10px;
        height: 46px;
        line-height: 46px;
        border: 1px solid #ccc;
        border-left: none;
        display: block;
        padding-left: 90px;
    }
    .link-box {
        width: 12.5%;
        float: left
    }
    .item-tit > strong {
        padding: 5px 0 0 10px;
        margin-bottom: 10px;
    }
    .get-home {
        margin: 0;
        margin-top: 20px;
    }
    .footer {
        margin-top: 20px;
    }
}
@media (min-width: 992px) {
    header {
        height: 60px;
        border-bottom: 1px solid #e8e8e8;
    }
    header .main {
        padding: 0 22px;
    }
    header .logo {
        float: left;
        font-size: 22px;
        margin: 0;
        font-weight: 400;
        border: none;
    }
    header .logo a {
        display: block;
        line-height: 50px;
        color: #484848;
        font-weight: 400;
    }
    header .logo img {
        width: 30px;
        vertical-align: -10px;
    }
    header .nav {
        float: left;
        margin-left: 25px;
        padding-top: 0px;
        height: 100%;
        display: block;
        overflow: hidden;
        position: static;
        width: auto;
        box-shadow: none;
    }
    header .nav li {
        float: left;
        font-size: 16px;
    }
    header .nav a {
        display: block;
        line-height: 59px;
        color: #959595;
        padding: 0 18px;
        border-bottom: 1px solid #e8e8e8;
    }
    header .nav a:hover {
        border-color: #459df5;
        color: #459df5;
    }
    .left-bar {
        height: 100%;
        background: #FFF;
        top: 60px;
        left: 0;
        z-index: 1;
    }
    .left-bar .header {
        padding: 11px 0px;
        border-bottom: none;
        margin: 0 25px;
        padding-top: 15px;
    }
    .left-bar .header h2 {
        color: #28b779;
        font-size: 16px;
        font-weight: bold;
        line-height: inherit;
        border-left: 3px solid #28b779;
        padding-left: 10px;
    }
    .left-bar .menu {
        height: 600px;
        border-top: 1px solid #f2f2f2;
        border-bottom: 1px solid #f2f2f2
    }
    .left-bar .tree-menu {
        border-bottom: 1px solid #e8e8e8;
    }
    .left-bar .tree li.open > ul {
        height: 281px;
        background: #f5f5f5;
    }
    .tree-menu li li a {
        color: #797979;
        font-size: 14px;
    }
    .search {
        width: 650px;
    }
    .search-engine {
        width: 650px;
    }
    .search-engine-list li {
        width: 112px;
        margin: 0 15px 15px 0;
    }
    #content .main {
        margin-left: 200px;
        padding-top: 70px
    }
    .content-box {
        padding: 0 10px;
        padding-top: 61px
    }
    .nav-item .container-fluid {
        padding: 20px 20px 10px 20px;
    }
    .item > .container-fluid .row {
        padding: 0;
    }
    .card-box .col-md-3 {
        padding: 0 7.5px;
    }
    .card-link {
        margin-bottom: 15px;
    }
    .main .list-box .menu-list {
        margin: 0px 10px 20px 10px;
    }
    .nav-tabs > li > a {
        padding: 4px 15px;
    }
    .footer {
        margin-top: 30px;
    }
}
@media (min-width: 1200px) {
    header .nav a {
        padding: 0 25px;
    }
    .content-box {
        padding: 0 20px;
    }
    .sousuo-form {
        width: 60%
    }
    .item > .container-fluid {
        padding: 0;
        padding-top: 91px;
        margin-top: -65px;
    }
}
@media (min-width: 1700px) {
    .content-box {
        max-width: 1400px;
    }
    .col-md-3 {
        width: 20%;
    }
}
</style>
</head>
<body id="nav_body">
<!--[if lt IE 10]>
<div class="alert alert-danger">
    您正在使用 
    <strong>过时的</strong> 浏览器. 请更换一个更好的浏览器来提升用户体验.
</div>
<![endif]--><!--头部导航条-->
<header>
<div class="main">
    <h1 class="logo">
    <a href="index.html">
    <img src="https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-i-0813_oMAAhFEQIBAM4effrKFa8UD8MHQYPBAQDEh7A2~c5_300x300.jpeg?from=2956013662">
    <span></span>
    </a>
    </h1>
    <!--顶部导航条-->
    <nav class="nav">
    <ul>
        <li><a href="http://lqjcq.com/" target="_blank">绿墙官网</a></li>
        <li><a href="https://shop178677191.taobao.com/" target="_blank">我们的淘宝</a></li>
        <li><a href="https://v.douyin.com/ik58WFb5/" target="_blank">我们的抖音</a></li>
        <li><a href="http://www.lqjcq.com/intro/17.html" target="_blank">联系方式</a></li>
    </ul>
    </nav>
    <!--便携设备右上角菜单-->
    <button class="nav-btn visible-xs visible-sm"><span class="icon-line top"></span><span class="icon-line middle"></span><span class="icon-line bottom"></span>
    </button>
</div>
</header>
<div id="content">
    <!--左侧目录，导航跳转-->
    <div class="left-bar">
        <div class="header">
            <h2>目录</h2>
        </div>
        <div class="menu" id="menu">
            <ul class="scrollcontent">
                <!--左侧目录，按照需要修改和添加，参考已有的修改名称和href-->
                <li><a href="#row-1">视频教程</a></li>
                <li><a href="#row-2">在线学习</a></li>
                <li><a href="#row-3">备用网址</a></li>                                      
            </ul>
        </div>
    </div>
    <!--内容-->
    <div class="main">
        <div class="container content-box">
            <!--搜索栏-->
            <section class="sousuo">
            <div class="search">
                <div class="search-box">
                    <button class="search-engine-name" id="search-engine-name">百度搜索</button>
                    <input type="text" id="txt" class="search-input" placeholder="输入关键字，例如：绿墙可百年，回车/Enter搜索"/>
                    <button class="search-btn" id="search-btn">搜索</button>
                </div>
                <!-- 搜索引擎 -->
                <div class="search-engine">
                    <div class="search-engine-head">
                        <strong class="search-engine-tit">选择您的默认搜索引擎：</strong>
                    </div>
                    <ul class="search-engine-list">
                    </ul>
                </div>
            </div>
            </section>
            <!--导航分类范例1，请根据自己的需求进行修改-->
            <section class="item card-box" id="row-1">
            <div class="container-fluid">
                <div class="row">
                    <div class="item-tit">
                        <strong>视频教程</strong>
                    </div>
                    <!--获取内容列表-->
                    <div class="clearfix two-list-box">
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="https://www.imooc.com/" class="card-link" target="_blank">
                            <div class="card-tit">慕课网</div>
                            <div class="card-desc">程序员的梦工厂，慕课网是垂直的互联网IT技能免费学习网站</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.jikexueyuan.com/" class="card-link" target="_blank">
                            <div class="card-tit">极客学院</div>
                            <div class="card-desc">一家很不错的IT职业在线教育平台，入门教程视频通俗易懂，很适合新手学习</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.zhaikexueyuan.com/" class="card-link" target="_blank">
                            <div class="card-tit">宅客学院</div>
                            <div class="card-desc">IT职业教育线上品牌，课程涵盖大数据、前端开发、后端开发等，免费课程挺多的</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://jirengu.com/app/album/index" class="card-link" target="_blank">
                            <div class="card-tit">饥人谷</div>
                            <div class="card-desc">一家收费的前端开发线上培训机构，虽然课程收费，但是官网还是有挺多免费教程视频的</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://study.163.com/category/it" class="card-link" target="_blank">
                            <div class="card-tit">网易云课程 - 编程开发</div>
                            <div class="card-desc">网易旗下实用技能学习平台，内容非常丰富，免费教程也挺多的</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="https://ke.qq.com/course/list?mt=1001" class="card-link" target="_blank">
                            <div class="card-tit">腾讯课程 - IT&middot;互联网</div>
                            <div class="card-desc">腾讯推出的专业在线教育平台，采用直播教学方式，适合有充裕时间学习的同学</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </section>
			<!--范例二 导航内容参考修改，如果需要更多的分类，拷贝整个section标签进行修改-->
            <section class="item card-box" id="row-2">
            <div class="container-fluid">
                <div class="row">
                    <div class="item-tit">
                        <strong>在线学习</strong>
                    </div>
                    <!--获取内容列表-->
                    <div class="clearfix ">
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.w3school.com.cn" class="card-link" target="_blank">
                            <div class="card-tit">w3school</div>
                            <div class="card-desc">领先的免费 Web 技术教程，在 w3school，你可以找到你所需要的所有的网站建设教程</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.runoob.com/" class="card-link" target="_blank">
                            <div class="card-tit">菜鸟教程</div>
                            <div class="card-desc">学的不仅是技术，更是梦想！该站提供了很全的编程技术基础教程，适合入门学习</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.hubwiz.com/" class="card-link" target="_blank">
                            <div class="card-tit">汇智网</div>
                            <div class="card-desc">汇智网是一个学习最前沿编程技术的平台，提供了node.js、js、jq等相关的课程</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.w3cways.com/" class="card-link" target="_blank">
                            <div class="card-tit">W3Cways</div>
                            <div class="card-desc">Web前端学习之路，网站提供很丰富的相关技术中文文档</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.css88.com/" class="card-link" target="_blank">
                            <div class="card-tit">WEB前端开发</div>
                            <div class="card-desc">一个前端开发技术和前端开发资讯的专业博客，专注前端开发，关注用户体验</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="https://developer.mozilla.org/zh-CN/docs/Learn" class="card-link" target="_blank">
                            <div class="card-tit">Mozilla 开发者网络</div>
                            <div class="card-desc">一个完整的学习平台，你可以在这里深入学习网络技术以及能够驱动网络的软件</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </section>
 			<!--范例二 导航内容参考修改，如果需要更多的分类，拷贝整个section标签进行修改-->
            <section class="item card-box" id="row-3">
            <div class="container-fluid">
                <div class="row">
                    <div class="item-tit">
                        <strong>备用网址</strong>
                    </div>
                    <!--获取内容列表-->
                    <div class="clearfix ">
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.w3school.com.cn" class="card-link" target="_blank">
                            <div class="card-tit">w3school</div>
                            <div class="card-desc">领先的免费 Web 技术教程，在 w3school，你可以找到你所需要的所有的网站建设教程</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.runoob.com/" class="card-link" target="_blank">
                            <div class="card-tit">菜鸟教程</div>
                            <div class="card-desc">学的不仅是技术，更是梦想！该站提供了很全的编程技术基础教程，适合入门学习</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.hubwiz.com/" class="card-link" target="_blank">
                            <div class="card-tit">汇智网</div>
                            <div class="card-desc">汇智网是一个学习最前沿编程技术的平台，提供了node.js、js、jq等相关的课程</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.w3cways.com/" class="card-link" target="_blank">
                            <div class="card-tit">W3Cways</div>
                            <div class="card-desc">Web前端学习之路，网站提供很丰富的相关技术中文文档</div>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-4 col-xs-6">
                            <a href="http://www.css88.com/" class="card-link" target="_blank">
                            <div class="card-tit">WEB前端开发</div>
                            <div class="card-desc">一个前端开发技术和前端开发资讯的专业博客，专注前端开发，关注用户体验</div>
                            </a>
                        </div>
                        <div class="col-md-2 col-sm-3 col-xs-6">
                            <a href="https://developer.mozilla.org/zh-CN/docs/Learn" class="card-link" target="_blank">
                            <div class="card-tit">Mozilla 开发者网络</div>
                            <div class="card-desc">一个完整的学习平台，你可以在这里深入学习网络技术以及能够驱动网络的软件</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </section>           
            <!--页脚-->
            <footer class="footer">
            <div class="container">
                <div class="rwo">
                    <div class="col-md-12">
                        <p>
                            本站内容源自互联网，如有内容侵犯了你的权益，请联系删除相关内容，联系邮箱：xxx
                        </p>
                        <!--代码源自小呆导航的开源代码，遵循MIT协议，此处保留源代码的声明-->
                        <p>
                            Copyright © 2024-2028 绿墙导航（lqjcq.com）All Rights Reserved
                        </p>
                    </div>
                </div>
            </div>
            </footer>
        </div>
        <!--内容区域-->
    </div>
    <div id="get-top" title="回到顶部">
        <i class="icon icon-arrow-up"></i>
    </div>
    
    <!-- jQuery (ZUI中的Javascript组件依赖于jQuery) -->
    <script src="http://code.jquery.com/jquery-1.11.0.min.js"></script>
    
<script>
window.onscroll = function(){
//回到顶部
var sllTop = document.documentElement.scrollTop||document.body.scrollTop;
if(sllTop>240){
  $('#get-top').css('display','block')
}else{
  $('#get-top').css('display','none')
}
}
$('#get-top').click(function(){ 
  $('body,html').animate({
    scrollTop: 0
  }, 800);//点击回到顶部按钮，数字越小越快
})
//判断用户使用的设备
var deviceVal  = browserRedirect();
function browserRedirect() {
  var sUserAgent = navigator.userAgent.toLowerCase();
  var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
  var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
  var bIsMidp = sUserAgent.match(/midp/i) == "midp";
  var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
  var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
  var bIsAndroid = sUserAgent.match(/android/i) == "android";
  var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
  var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
  if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
    return 'phone';
  } else {
    return 'pc';
  }
}
  $('.nav-btn').on('click', function () {
    $('.nav').toggleClass('showNav');
    $(this).toggleClass('animated2');
  });
 
// 默认搜索引擎的内容，如果界面修改了需要同步修改
var thisSearch = 'https://www.baidu.com/s?wd=';

$('#txt').keydown(function(ev){
    // 回车键的处理
    if(ev.keyCode==13){
        window.open(thisSearch + $('#txt').val())
        // $('#txt').val('');
        $('#box ul').html('')
    }
})
$(function(){
  // 搜索引擎列表，样式一行五个内容，自动换行
  var search = {
    data: [{
      name: '小众搜索',
      url: 'http://www.caup.cn/search?q='
    }, {
      name: '百度',
      url: 'https://www.baidu.com/s?wd='
    }, {
      name: '谷歌',
      url: 'https://www.google.com/search?q='
    }, {
      name: '必应',
      url: 'https://cn.bing.com/search?q='
    }, {
      name: '好搜',
      url: 'https://www.so.com/s?q='
    }, {
      name: '搜狗',
      url: 'https://www.sogou.com/web?query='
    }, {
      name: '淘宝',
      url: 'https://s.taobao.com/search?q='
    }, {
      name: '京东',
      url: 'http://search.jd.com/Search?keyword='
    }, {
      name: '天猫',
      url: 'https://list.tmall.com/search_product.htm?q='
    }, {
      name: '1688',
      url: 'https://s.1688.com/selloffer/offer_search.htm?keywords='
    }, {
      name: '知乎',
      url: 'https://www.zhihu.com/search?type=content&q='
    }, {
      name: '微博',
      url: 'https://s.weibo.com/weibo/'
    }, {
      name: 'Bilibili',
      url: 'http://search.bilibili.com/all?keyword='
    }, {
      name: '豆瓣',
      url: 'https://www.douban.com/search?source=suggest&q='
    }, {
      name: '优酷',
      url: 'https://so.youku.com/search_video/q_'
    }, {
      name: 'GitHub',
      url: 'https://github.com/search?q='
    }]
  }
  for(var i = 0; i < search.data.length; i++){
    var addList = '<li>' + search.data[i].name + '</li>'
    $('.search-engine-list').append(addList);
  }
  $('.search-engine-name, .search-engine').hover(function() {
    $('.search-engine').css('display', 'block')
  }, function() {
    $('.search-engine').css('display', 'none')
  });
  $('.search-engine-list li').click(function() {
    var _index = $(this).index();
    var searchNameBtn = document.getElementById("search-engine-name");
    searchNameBtn.innerHTML = search.data[_index].name;
    thisSearch = search.data[_index].url;
    $('.search-engine').css('display', 'none')
  })
})
$("#search-btn").click(function(){
  var textValue = $('#txt').val();
  if(textValue != ''){
    window.open(thisSearch + textValue)
  }
});
</script>
</div>
</body>
</html>

`;
const redirectError = `
<html><head></head><body><h2>Error while redirecting: the website you want to access to may contain wrong redirect information, and we can not parse the info</h2></body></html>
`;

//new URL(请求路径, base路径).href;

async function handleRequest(request) {
  //获取所有cookie
  var siteCookie = request.headers.get('Cookie');

  
  if (password != "") {
    if(siteCookie != null && siteCookie != ""){
      var pwd = getCook(passwordCookieName, siteCookie);
      console.log(pwd);
      if (pwd != null && pwd != "") {
        if(pwd != password){
          return getHTMLResponse("<h1>403 Forbidden</h1><br>You do not have access to view this webpage.");
        }
      }else{
        return getHTMLResponse("<h1>403 Forbidden</h1><br>You do not have access to view this webpage.");
      }
    }else{
      return getHTMLResponse("<h1>403 Forbidden</h1><br>You do not have access to view this webpage.");
    }

  }

  const url = new URL(request.url);
  if(request.url.endsWith("favicon.ico")){
    return Response.redirect("https://www.baidu.com/favicon.ico", 301);
  }
  //var siteOnly = url.pathname.substring(url.pathname.indexOf(str) + str.length);

  var actualUrlStr = url.pathname.substring(url.pathname.indexOf(str) + str.length) + url.search + url.hash;
  if (actualUrlStr == "") { //先返回引导界面
    return getHTMLResponse(mainPage);
  }


  try {
    var test = actualUrlStr;
    if (!test.startsWith("http")) {
      test = "https://" + test;
    }
    var u = new URL(test);
    if (!u.host.includes(".")) {
      throw new Error();
    }
  }
  catch { //可能是搜素引擎，比如proxy.com/https://www.duckduckgo.com/ 转到 proxy.com/?q=key
    var lastVisit;
    if (siteCookie != null && siteCookie != "") {
      lastVisit = getCook(lastVisitProxyCookie, siteCookie);
      console.log(lastVisit);
      if (lastVisit != null && lastVisit != "") {
        //(!lastVisit.startsWith("http"))?"https://":"" + 
        //现在的actualUrlStr如果本来不带https:// 的话那么现在也不带，因为判断是否带protocol在后面
        return Response.redirect(thisProxyServerUrlHttps + lastVisit + "/" + actualUrlStr, 301);
      }
    }
    return getHTMLResponse("Something is wrong while trying to get your cookie: <br> siteCookie: " + siteCookie + "<br>" + "lastSite: " + lastVisit);
  }



  if (!actualUrlStr.startsWith("http") && !actualUrlStr.includes("://")) { //从www.xxx.com转到https://www.xxx.com
    //actualUrlStr = "https://" + actualUrlStr;
    return Response.redirect(thisProxyServerUrlHttps + "https://" + actualUrlStr, 301);
  }
  //if(!actualUrlStr.endsWith("/")) actualUrlStr += "/";
  const actualUrl = new URL(actualUrlStr);

  let clientHeaderWithChange = new Headers();
  //***代理发送数据的Header：修改部分header防止403 forbidden，要先修改，   因为添加Request之后header是只读的（***ChatGPT，未测试）
  for (var pair of request.headers.entries()) {
    //console.log(pair[0]+ ': '+ pair[1]);
    clientHeaderWithChange.set(pair[0], pair[1].replaceAll(thisProxyServerUrlHttps, actualUrlStr).replaceAll(thisProxyServerUrl_hostOnly, actualUrl.host));
  }

  let clientRequestBodyWithChange
  if (request.body) {
    clientRequestBodyWithChange = await request.text();
    clientRequestBodyWithChange = clientRequestBodyWithChange
      .replaceAll(thisProxyServerUrlHttps, actualUrlStr)
      .replaceAll(thisProxyServerUrl_hostOnly, actualUrl.host);
  }

  const modifiedRequest = new Request(actualUrl, {
    headers: clientHeaderWithChange,
    method: request.method,
    body: (request.body) ? clientRequestBodyWithChange : request.body,
    //redirect: 'follow'
    redirect: "manual"
    //因为有时候会
    //https://www.jyshare.com/front-end/61   重定向到
    //https://www.jyshare.com/front-end/61/
    //但是相对目录就变了
  });

  //console.log(actualUrl);

  const response = await fetch(modifiedRequest);
  if (response.status.toString().startsWith("3") && response.headers.get("Location") != null) {
    //console.log(base_url + response.headers.get("Location"))
    try {
      return Response.redirect(thisProxyServerUrlHttps + new URL(response.headers.get("Location"), actualUrlStr).href, 301);
    } catch {
      getHTMLResponse(redirectError + "<br>the redirect url:" + response.headers.get("Location") + ";the url you are now at:" + actualUrlStr);
    }
  }

  var modifiedResponse;
  var bd;
  var hasProxyHintCook = (getCook(proxyHintCookieName, siteCookie) != "");

  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.startsWith("text/")) {
    bd = await response.text();

    //ChatGPT
    let regex = new RegExp(`(?<!src="|href=")(https?:\\/\\/[^\s'"]+)`, 'g');
    bd = bd.replace(regex, (match) => {
      if (match.includes("http")) {
        return thisProxyServerUrlHttps + match;
      } else {
        return thisProxyServerUrl_hostOnly + "/" + match;
      }
    });

    console.log(bd); // 输出替换后的文本

    if (contentType && (contentType.includes("text/html") || contentType.includes("text/javascript"))){
      bd = bd.replace("window.location", "window." + replaceUrlObj);
      bd = bd.replace("document.location", "document." + replaceUrlObj);
    }
    //bd.includes("<html")  //不加>因为html标签上可能加属性         这个方法不好用因为一些JS中竟然也会出现这个字符串
    //也需要加上这个方法因为有时候server返回json也是html
    if (contentType && contentType.includes("text/html") && bd.includes("<html")) {
      //console.log("STR" + actualUrlStr)
      bd = covToAbs(bd, actualUrlStr);
      bd = removeIntegrityAttributes(bd);
      bd = 
      "<script>" + 
      ((!hasProxyHintCook)?proxyHintInjection:"") + 
      httpRequestInjection + 
      "</script>" + 
      bd;
    }

    //else{
    //   //const type = response.headers.get('Content-Type');type == null || (type.indexOf("image/") == -1 && type.indexOf("application/") == -1)
    //   if(actualUrlStr.includes(".css")){ //js不用，因为我已经把网络消息给注入了
    //     for(var r of CSSReplace){
    //       bd = bd.replace(r, thisProxyServerUrlHttps + r);
    //     }
    //   }
    //   //问题:在设置css background image 的时候可以使用相对目录  
    // }
    //console.log(bd);

    modifiedResponse = new Response(bd, response);
  } else {
    var blob = await response.blob();
    modifiedResponse = new Response(blob, response);
  }




  let headers = modifiedResponse.headers;
  let cookieHeaders = [];

  // Collect all 'Set-Cookie' headers regardless of case
  for (let [key, value] of headers.entries()) {
    if (key.toLowerCase() == 'set-cookie') {
      cookieHeaders.push({ headerName: key, headerValue: value });
    }
  }


  if (cookieHeaders.length > 0) {
    cookieHeaders.forEach(cookieHeader => {
      let cookies = cookieHeader.headerValue.split(',').map(cookie => cookie.trim());

      for (let i = 0; i < cookies.length; i++) {
        let parts = cookies[i].split(';').map(part => part.trim());
        //console.log(parts);

        // Modify Path
        let pathIndex = parts.findIndex(part => part.toLowerCase().startsWith('path='));
        let originalPath;
        if (pathIndex !== -1) {
          originalPath = parts[pathIndex].substring("path=".length);
        }
        let absolutePath = "/" + new URL(originalPath, actualUrlStr).href;;

        if (pathIndex !== -1) {
          parts[pathIndex] = `Path=${absolutePath}`;
        } else {
          parts.push(`Path=${absolutePath}`);
        }

        // Modify Domain
        let domainIndex = parts.findIndex(part => part.toLowerCase().startsWith('domain='));

        if (domainIndex !== -1) {
          parts[domainIndex] = `domain=${thisProxyServerUrl_hostOnly}`;
        } else {
          parts.push(`domain=${thisProxyServerUrl_hostOnly}`);
        }

        cookies[i] = parts.join('; ');
      }

      // Re-join cookies and set the header
      headers.set(cookieHeader.headerName, cookies.join(', '));
    });
  }
  //bd != null && bd.includes("<html")
  if (contentType && contentType.includes("text/html") && response.status == 200 && bd.includes("<html")) { //如果是HTML再加cookie，因为有些网址会通过不同的链接添加CSS等文件
    let cookieValue = lastVisitProxyCookie + "=" + actualUrl.origin + "; Path=/; Domain=" + thisProxyServerUrl_hostOnly;
    //origin末尾不带/
    //例如：console.log(new URL("https://www.baidu.com/w/s?q=2#e"));
    //origin: "https://www.baidu.com"
    headers.append("Set-Cookie", cookieValue);
    
    if(!hasProxyHintCook){
      //添加代理提示
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000); // 24小时
      var hintCookie = `${proxyHintCookieName}=1; expires=${expiryDate.toUTCString()}; path=/`;
      headers.append("Set-Cookie", hintCookie);
    }
    
  }

  // 添加允许跨域访问的响应头
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  //modifiedResponse.headers.set("Content-Security-Policy", "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; media-src *; frame-src *; font-src *; connect-src *; base-uri *; form-action *;");
  if (modifiedResponse.headers.has("Content-Security-Policy")) {
    modifiedResponse.headers.delete("Content-Security-Policy");
  }
  if (modifiedResponse.headers.has("Permissions-Policy")) {
    modifiedResponse.headers.delete("Permissions-Policy");
  }
  modifiedResponse.headers.set("X-Frame-Options", "ALLOWALL");
  if(!hasProxyHintCook){
    //设置content立刻过期，防止多次弹代理警告（但是如果是Content-no-change还是会弹出）
    modifiedResponse.headers.set("Cache-Control", "max-age=0");
  }


  return modifiedResponse;
}
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& 表示匹配的字符
}

//https://stackoverflow.com/questions/5142337/read-a-javascript-cookie-by-name
function getCook(cookiename, cookies) {
  // Get name followed by anything except a semicolon
  var cookiestring = RegExp(cookiename + "=[^;]+").exec(cookies);
  // Return everything after the equal sign, or an empty string if the cookie name not found
  return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./, "") : "");
}

const matchList = [[/href=("|')([^"']*)("|')/g, `href="`], [/src=("|')([^"']*)("|')/g, `src="`]];
function covToAbs(body, requestPathNow) {
  var original = [];
  var target = [];

  for (var match of matchList) {
    var setAttr = body.matchAll(match[0]);
    if (setAttr != null) {
      for (var replace of setAttr) {
        if (replace.length == 0) continue;
        var strReplace = replace[0];
        if (!strReplace.includes(thisProxyServerUrl_hostOnly)) {
          if (!isPosEmbed(body, replace.index)) {
            var relativePath = strReplace.substring(match[1].toString().length, strReplace.length - 1);
            if (!relativePath.startsWith("data:") && !relativePath.startsWith("mailto:") && !relativePath.startsWith("javascript:") && !relativePath.startsWith("chrome") && !relativePath.startsWith("edge")) {
              try {
                var absolutePath = thisProxyServerUrlHttps + new URL(relativePath, requestPathNow).href;
                //body = body.replace(strReplace, match[1].toString() + absolutePath + `"`);
                original.push(strReplace);
                target.push(match[1].toString() + absolutePath + `"`);
              } catch {
                // 无视
              }
            }
          }
        }
      }
    }
  }
  for (var i = 0; i < original.length; i++) {
    body = body.replace(original[i], target[i]);
  }
  return body;
}
function removeIntegrityAttributes(body) {
  return body.replace(/integrity=("|')([^"']*)("|')/g, '');
}

// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",2));
// VM195:1 false
// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",10));
// VM207:1 false
// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",50));
// VM222:1 true
function isPosEmbed(html, pos) {
  if (pos > html.length || pos < 0) return false;
  //取从前面`<`开始后面`>`结束，如果中间有任何`<`或者`>`的话，就是content
  //<xx></xx><script>XXXXX[T]XXXXXXX</script><tt>XXXXX</tt>
  //         |-------------X--------------|
  //                !               !
  //         conclusion: in content

  // Find the position of the previous '<'
  let start = html.lastIndexOf('<', pos);
  if (start === -1) start = 0;

  // Find the position of the next '>'
  let end = html.indexOf('>', pos);
  if (end === -1) end = html.length;

  // Extract the substring between start and end
  let content = html.slice(start + 1, end);
  // Check if there are any '<' or '>' within the substring (excluding the outer ones)
  if (content.includes(">") || content.includes("<")) {
    return true; // in content
  }
  return false;

}
function getHTMLResponse(html) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}