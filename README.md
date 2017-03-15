# Zype Amazon Fire TV SDK

This SDK allows you to create an Amazon Fire TV Web App integrated with the Zype platform. This app is based on the Amazon Web App Starter Kit for Fire TV and leverages the Zype API.

NOTE: This app only supports Fire TV and Fire TV Stick

## Supported Features

- Populates your app with content from Zype enhanced playlists
- About page
- Autoplay
- Custom hero image slider
- Live streaming videos
- Video Favorites (available with device linking)
- Video Search

### Unsupported Features
- Midroll, postroll ads
- Closed Captions
- Subtitles

## Supported Monetization
- Pre-roll ads (VAST)
- Universal SVOD via device linking
- Native SVOD via In-App Purchases
- Native TVOD via In-App Purchases

## Requirements
### Enhanced Playlists
- Enhanced Playlists require setting a root playlist in the Zype platform. To set the root playlist, go to **Manage Apps > Amazon Fire TV** and set the Featured Playlist to your root playlist’s ID. For more information on setting up enhanced playlists, you can [read the documentation here](https://zype.zendesk.com/hc/en-us/articles/115000332928-Managing-Playlist-Relationships).

## Creating a New App with the SDK
1. First, create an Amazon Fire TV app in the Zype platform (**Manage Apps > Create An App**)
1. Copy the **App Key**, **Client ID**, and **Client Secret** from the bottom of the app’s detail page
1. In the SDK rename the `/config/config.default.js` file to `config.js`
1. Add the **App Key**, **Client ID**, and **Client Secret** to `config.js`
1. You may view the app using the Amazon Web App Tester by following the instructions here: <https://zype.zendesk.com/hc/en-us/articles/115002194907>. You may also view the app on your development computer by uncommenting `initApp(settings)` in `init.js` and opening `index.html` in a browser (Google Chrome or Safari recommended).

## To run your app in a local browser
1. To develop via desktop browser, use Google Chrome or Safari. *Note: some UI/UX is different in-browser than on Fire TV*
1. Go to `/js/init.js` and uncomment `initApp(settings)`
1. Open `index.html` in Safari or Chrome
1. On your keyboard, use the `left`, `right`, `up`, and `down` arrows, `return/enter`, and `delete/backspace` to navigate the app
1. To play videos in-browser, you will need to use Safari and spoof the `Amazon Web App Platform` user agent. <https://developer.amazon.com/public/solutions/devices/fire-tv/docs/user-agent-strings>

## Setting up Your Developer Environment
1. Turn developer options on your Amazon Fire TV (Settings > System > Developer Options)
1. Download the [Web App Tester app](http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8)
1. See Amazon's documentation for more details <https://developer.amazon.com/public/solutions/platforms/webapps/docs/getting-started-with-web-apps-for-fire-tv>


## Running your local app on the Fire TV
1. Navigate to the app's directory
1. Set up a HTTP server: `$ python -m SimpleHTTPServer`
1. Open the Web App Tester and target your launch path to `http://localhost:8000`
1. Enable DevTools inside the Web App Tester
1. Go to `http://localhost:9222` in Chrome to launch Chrome debugger

*Find localhost IP address in System Preferences > Network*

## Contributing to the repo

We welcome contributions to Zype Amazon Fire SDK. If you have any suggestions or notice any bugs you can open an issue. If you have any changes to the code base that you want to see added, you can fork the repository, then submit a pull request with your changes explaining what you changed, why you believe it should be added, and how one would test these changes. Thank you to the community!