function _AmazonWebAppApiTester(){this._init()}
_AmazonWebAppApiTester.prototype={_CLOUD_SYNC_DATA_KEY:"mock-cloud-sync-data",_CLOUD_SYNC_LAST_TOUCH_KEY:"mock-cloud-sync-last-touch",_ENTITLEMENT_KEY:"mock-entitlement",_amazonServices:null,_storage:null,_callbacks:null,_items:null,_IAP:null,_GameCircle:null,_init:function(){this._callbacks={};this._items={};this._determineStorage();this.setMockItems(this._getMockItems())},initialize:function(a){this._amazonServices=a},get IAP(){null==this._IAP&&null!=this._amazonServices&&(this._IAP=new _MockAmazonJavascriptInAppPurchasingBindings(this._amazonServices,
this));return this._IAP},get GameCircle(){null==this._GameCircle&&null!=this._amazonServices&&(this._GameCircle=new _MockAmazonJavascriptGameCircleBindings(this._amazonServices,this));return this._GameCircle},get Cache(){return null},_determineStorage:function(){if("undefined"===typeof localStorage||null==localStorage){var a=this;this._storage={_items:{},setItem:function(c,b){a._storage._items[c]=b},getItem:function(c){return a._storage._items[c]},removeItem:function(c){a._storage._items[c]&&delete a._storage._items[c]}}}else this._storage=
localStorage},_getMockItems:function(){if("undefined"!==typeof window){for(var a=["amazon.sdktester.json","/amazon.sdktester.json","/static/amazon.sdktester.json"],c=new XMLHttpRequest,b=0;b<a.length;b++)if(c.open("GET",a[b],!1),c.send(),200==c.status)return JSON.parse(c.responseText);return null}},getCloudSyncData:function(){return this._loadAsJSON(this._CLOUD_SYNC_DATA_KEY)},setCloudSyncData:function(a){this._saveAsJSON(this._CLOUD_SYNC_DATA_KEY,a)},clearCloudSyncData:function(){this._storage.removeItem(this._CLOUD_SYNC_DATA_KEY);
this._saveAsJSON(this._CLOUD_SYNC_LAST_TOUCH_KEY,{lastTouch:!1})},touchCloudSync:function(){this._saveAsJSON(this._CLOUD_SYNC_LAST_TOUCH_KEY,{lastTouch:!0})},getCloudSyncLastTouch:function(){var a=this._loadAsJSON(this._CLOUD_SYNC_LAST_TOUCH_KEY);return a&&a.lastTouch},getMockItemData:function(a){(a=this._items[a])||(a=null);return a},setMockItems:function(a){this._items=a},getEntitled:function(){return this._loadAsJSON(this._ENTITLEMENT_KEY)},grantEntitlement:function(a){var c=this.getEntitled();
c[a]=!0;this._saveAsJSON(this._ENTITLEMENT_KEY,c)},clearEntitlements:function(){this._saveAsJSON(this._ENTITLEMENT_KEY,{})},revokeEntitlement:function(a){var c=this.getEntitled();c[a]&&delete c[a];this._saveAsJSON(this._ENTITLEMENT_KEY,c)},isEntitled:function(a){return null!=this.getEntitled()[a]},_saveAsJSON:function(a,c){"undefined"!=typeof JSON&&(c=JSON.stringify(c));this._storage.setItem(a,c)},_loadAsJSON:function(a){a=this._storage.getItem(a);return null!=a?("undefined"!=typeof JSON&&(a=JSON.parse(a)),
a):{}},setCallbackForMethod:function(a,c){this._callbacks[a]=c;console.log("Callback set for "+a)},getCallbackForMethod:function(a){var c=this._callbacks[a];return c?(delete this._callbacks[a],c):null},_createReceipt:function(a){var c=null,b=this.getMockItemData(a);b.itemType==this._amazonServices.IAP.ItemType.SUBSCRIPTION&&(c=(new Date).getTime(),c={startDate:c,endDate:c+2592E6});return{itemType:b.itemType,purchaseToken:(new Date).getTime(),sku:a,subscriptionPeriod:c}},createMockCallback:function(a,
c){switch(a){case "IAP.registerObserver":return{callbackName:"onSdkAvailable",response:{isSandboxMode:!0}};case "IAP.getUserId":var b=c[0];return{callbackName:"onGetUserIdResponse",response:{jsReqId:b,requestId:"IAP.getUserId"+new Date,userId:"userId",userIdRequestStatus:"SUCCESSFUL"}};case "IAP.getItemData":var b=c[0],b={jsReqId:b,requestId:"IAP.getItemData"+new Date,userId:"userId",itemDataRequestStatus:this._amazonServices.IAP.ItemDataStatus.SUCCESSFUL,itemData:{}},h=c[1].split(","),g;for(g in h){var f=
h[g];b.itemData[f]=this.getMockItemData(f);b.itemData[f].sku=f}return{callbackName:"onItemDataResponse",response:b};case "IAP.getPurchaseUpdates":b=c[0];b={jsReqId:b,requestId:"IAP.getPurchaseUpdates"+new Date,userId:"userId",revokedSkus:[],receipts:[],isMore:!1,offset:"",purchaseUpdatesRequestStatus:this._amazonServices.IAP.PurchaseUpdatesStatus.SUCCESSFUL};for(f in this.getEntitled())b.receipts.push(this._createReceipt(f));return{callbackName:"onPurchaseUpdatesResponse",response:b};case "IAP.purchaseItem":return b=
c[0],f=c[1],b={jsReqId:b,requestId:"IAP.purchaseItem"+new Date,userId:"userId",purchaseRequestStatus:this._amazonServices.IAP.PurchaseStatus.SUCCESSFUL,receipt:{}},null==this.getMockItemData(f)?b.purchaseRequestStatus=this._amazonServices.IAP.PurchaseStatus.INVALID_SKU:this.isEntitled(f)?b.purchaseRequestStatus=this._amazonServices.IAP.PurchaseStatus.ALREADY_ENTITLED:(b.purchaseRequestStatus=this._amazonServices.IAP.PurchaseStatus.SUCCESSFUL,b.receipt=this._createReceipt(f)),{callbackName:"onPurchaseResponse",
response:b};case "GameCircle.initialize":return{callbackName:"onServiceReady",response:{}};case "GameCircle.synchronize":return f=c[0],g=this.getCloudSyncData(),f=f==this._amazonServices.GameCircle.ConflictStrategy.AUTO_RESOLVE_TO_IGNORE||this.getCloudSyncLastTouch()||!g.data?{callbackName:"onAlreadySynchronized",response:{}}:{callbackName:"onNewGameData",response:{data:g.data}},this.setCloudSyncData(g),this.touchCloudSync(),f;case "GameCircle.synchronizeProgress":return f=c[0],b=c[1],h=c[2],g=this.getCloudSyncData(),
this.getCloudSyncLastTouch()||h===g.data?f={callbackName:"onAlreadySynchronized",response:{}}:b==this._amazonServices.GameCircle.ConflictStrategy.AUTO_RESOLVE_TO_IGNORE?(g.data=h,g.description=f,f={callbackName:"onGameUploadSuccess",response:{}}):f={callbackName:"onNewGameData",response:{data:g.data,description:g.description}},this.setCloudSyncData(g),this.touchCloudSync(),f;default:return console.log("no default mock callback for this method "+a),null}}};
function _MockAmazonJavascriptInAppPurchasingBindings(a,c){this._init(a,c)}
_MockAmazonJavascriptInAppPurchasingBindings.prototype={_amazonServices:null,_webAppApiTester:null,_init:function(a,c){this._amazonServices=a;this._webAppApiTester=c},_runDebugModeCallback:function(a,c){var b=this._webAppApiTester.getCallbackForMethod(a);null==b&&(b=this._webAppApiTester.createMockCallback(a,c));this._amazonServices.IAP._runCallback(b.callbackName,b.response)},registerObserver:function(){this._runDebugModeCallback("IAP.registerObserver",[])},getUserId:function(a){this._runDebugModeCallback("IAP.getUserId",
[a])},getItemData:function(a,c){this._runDebugModeCallback("IAP.getItemData",[a,c])},getPurchaseUpdates:function(a,c){this._runDebugModeCallback("IAP.getPurchaseUpdates",[a,c])},purchaseItem:function(a,c){var b=[a,c],h=this._webAppApiTester.getCallbackForMethod("IAP.purchaseItem"),g=this._webAppApiTester.getMockItemData(c);if(null!=h)this._amazonServices.IAP._runCallback(h.callbackName,h.response);else if(h=this._webAppApiTester.createMockCallback("IAP.purchaseItem",b),"undefined"==typeof JSON||h.response.purchaseRequestStatus==
this._amazonServices.IAP.PurchaseStatus.INVALID_SKU)this._amazonServices.IAP._runCallback(h.callbackName,h.response),g&&h.response.purchaseRequestStatus!=this._amazonServices.IAP.PurchaseStatus.ALREADY_ENTITLED&&g.itemType!=this._amazonServices.IAP.ItemType.CONSUMABLE&&this._webAppApiTester.grantEntitlement(c);else{var f=this,k=document.createElement("div");k.id="AmazonServicesPurchaseItem";b=document.createElement("div");b.style.position="fixed";b.style.width="100%";b.style.height="100%";b.style.backgroundColor=
"black";b.style.opacity=0.75;b.style.top="0px";b.style.left="0px";k.appendChild(b);b=document.createElement("div");b.style.position="fixed";b.style.width="60%";b.style.height="75%";b.style.top="5%";b.style.left="20%";b.style.fontFamily="sans-serif";b.style.backgroundColor="black";b.style.color="white";b.style.borderBottomColor="white";b.style.textAlign="left";b.style.paddingLeft="15px";var d=document.createElement("div");d.id="AmazonServicesPurchaseItem-Logo";d.style.textAlign="left";d.style.paddingLeft=
"5px";d.innerHTML='<img src="http://rialto-mas-dev.s3.amazonaws.com/images/nodpi/amazon_apps_logo.png" width="110" height="21" vspace="2"/>';b.appendChild(d);d=document.createElement("div");d.id="AmazonServicesPurchaseItem-Close";d.style.position="absolute";d.style.top="5px";d.style.right="5px";d.style.color="#bbb";d.style.fontSize="12px";d.style.verticalAlign="middle";var m=document.createElement("a");m.innerHTML='<img src="http://rialto-mas-dev.s3.amazonaws.com/images/nodpi/cancel.png"  height="20" border="0" />';
m.onclick=function(){document.body.removeChild(k);h.response.receipt={};h.response.purchaseRequestStatus=f._amazonServices.IAP.PurchaseStatus.FAILED;f._amazonServices.IAP._runCallback(h.callbackName,h.response)};d.appendChild(m);b.appendChild(d);d=document.createElement("hr");d.style.height="1px";d.style.borderWidth=0;d.style.backgroundColor="#333";b.appendChild(d);d=document.createElement("img");d.style.cssFloat="left";d.style.paddingRight="15px";d.src=g.smallIconUrl;b.appendChild(d);var d=document.createElement("div"),
n=document.createElement("div");n.id="AmazonServicesPurchaseItem-ThankYou";n.style.display="none";n.innerHTML="Thank You for purchasing <b>"+g.title+"</b>";d.appendChild(n);var p=document.createElement("div");p.id="AmazonServicesPurchaseItem-Pwnd";p.style.display="none";p.innerHTML="You already own <b>"+g.title+"</b>";d.appendChild(p);var j=document.createElement("div");j.id="AmazonServicesPurchaseItem-ItemTitle";j.style.marginTop="15px";j.style.marginBottom="15px";j.style.fontSize="16px";j.style.fontWeight=
"normal";j.innerHTML=g.title;d.appendChild(j);var l=document.createElement("div");l.id="AmazonServicesPurchaseItem-Processing";l.style.display="none";var e=document.createElement("div");e.id="AmazonServicesPurchaseItem-ProcessingMsg";e.style.cssFloat="left";e.style.clear="right";e.style.marginLeft="20px";e.style.paddingLeft="20px";e.style.backgroundImage="url(http://rialto-mas-dev.s3-website-us-east-1.amazonaws.com/images/nodpi/ajax-loader.gif)";e.style.backgroundRepeat="no-repeat";e.style.backgroundPosition=
"left center";e.style.backgroundSize="16px 16px";e.style.fontSize="20px";e.innerHTML="Processing<br/>";l.appendChild(e);d.appendChild(l);var i=document.createElement("button");i.id="AmazonServicesPurchaseItem-BuyButton";i.style.cssFloat="left";i.style.clear="right";i.style.height="30px";i.style.width="100px";i.style.borderRadius="4px";i.style.fontSize="18px";i.style.fontWeight="bold";i.style.color="white";i.style.borderTop="0.063rem solid #fed78b";i.style.borderBottom="0.063rem solid #a65f2c";i.style.backgroundImage=
"-webkit-gradient(linear, left bottom, left top, color-stop(0, #ed7723), color-stop(1, #faa719))";i.style.textShadow="0rem -0.063rem 0rem #8b4c16";i.innerHTML="$"+g.price;i.onclick=function(){l.style.display="block";i.style.display="none";setTimeout(function(){var a=h.response.purchaseRequestStatus==f._amazonServices.IAP.PurchaseStatus.ALREADY_ENTITLED;l.style.display="none";j.style.display="none";m.innerHTML="Close";m.onclick=function(){document.body.removeChild(k)};a?p.style.display="block":(n.style.display=
"block",!a&&g.itemType!=f._amazonServices.IAP.ItemType.CONSUMABLE&&f._webAppApiTester.grantEntitlement(c));f._amazonServices.IAP._runCallback(h.callbackName,h.response)},1E3)};d.appendChild(i);e=document.createElement("div");e.id="AmazonServicesPurchaseItem-Description";e.style.cssFloat="left";e.style.width="350px";e.style.marginTop="15px";e.style.marginBottom="15px";e.style.color="#bbb";e.style.fontSize="14px";e.innerHTML=g.description;d.appendChild(e);e=document.createElement("div");e.id="AmazonServicesPurchaseItem-Disclaimer";
e.style.cssFloat="left";e.style.width="350px";e.style.color="#999";e.style.fontSize="10px";e.innerHTML="Sold by Amazon Digital Services, Inc. Additional taxes may apply.";d.appendChild(e);b.appendChild(d);k.appendChild(b);document.body.appendChild(k)}}};function _MockAmazonJavascriptGameCircleBindings(a,c){this._init(a,c)}
_MockAmazonJavascriptGameCircleBindings.prototype={_amazonServices:null,_webAppApiTester:null,_init:function(a,c){this._amazonServices=a;this._webAppApiTester=c},_runDebugModeCallback:function(a,c){var b=this._webAppApiTester.getCallbackForMethod(a);null==b&&(b=this._webAppApiTester.createMockCallback(a,c));this._amazonServices.GameCircle._runCallback(b.callbackName,b.response)},initialize:function(){this._runDebugModeCallback("GameCircle.initialize",[])},synchronize:function(a){this._runDebugModeCallback("GameCircle.synchronize",
[a])},synchronizeProgress:function(a,c,b){this._runDebugModeCallback("GameCircle.synchronizeProgress",[a,c,b])},onNewGameDataReturnValue:function(){}};var amzn_wa_tester=new _AmazonWebAppApiTester;
