# Zype Amazon Fire TV SDK

## To run your app in a local browser
1. If you want to develop via desktop browser, use Safari to be able to view HLS videos. Note, some UI/UX is different in browser than in Fire TV. 
2. Go to js/init.js and uncomment initApp(settings).
3. Drag index.html onto Safari.
4. To play videos you will need to spoof the 'AmazonWebAppPlatform' user agent in your browser.

## Setting up your developer environment
1. Turn developer options on your Amazon Fire TV (Settings > System > Developer Options)
2. Download the [Web App Tester App](http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8).


## Running your local app on the Fire TV
1. Navigate to zype-amazonfiretv
2. Fill in your app key. You will find the app key in config/config.js.
3. Set up HTTP server: $ python -m SimpleHTTPServer
4. Open the Web App Tester and target your launch path to http://localhost:8000
5. Enable Devtools inside the Web App Tester
6. Go to http://localhost:9222 in Chrome to launch Chrome debugger

*Find localhost ip address in System Preferences > Network*
