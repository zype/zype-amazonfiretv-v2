# Zype Amazon Fire TV Recipe

This document outlines step-by-step instructions for creating and publishing an Amazon Fire TV app powered by Zype's Endpoint API service and app production software and SDK template.

## Requirements and Prerequisites

### Technical Contact
IT or developer support strongly recommended. Completing app submission and publishing requires working with app bundles and IDE.

### Zype Amazon Fire TV Endpoint License
To create a Zype Amazon Fire TV app you need a paid and current Zype account that includes purchase of a valid license for the Zype Amazon Fire TV endpoint API. Learn more about [Zype's Endpoint API Service](http://www.zype.com/services/endpoint-api/).

### An Amazon Developer Account
You may sign up for a Amazon Developer account via [Amazon's website](https://developer.amazon.com/appsandservices).

### Amazon Fire TV or Fire TV Stick with the Amazon Web App Tester installed
An Amazon Fire TV or Fire TV Stick with the Amazon Web App Tester installed is required for previewing and testing the app. A Fire TV or Fire TV Stick may be purchased on Amazon.com. The Amazon Web App Tester may be downloaded from the Amazon App Store.

## Creating a New App with the SDK Template

### Generating your app bundle

1. In order to generate an Amazon Fire TV app bundle using this SDK, you will need to first create an Amazon Fire TV app on the Zype platform. If you have not done this yet, log in to your Zype account [here](https://admin.zype.com/users/sign_in), and click on the __Manage Apps__ link under the __Publish__ menu in the left navigation. You will see a button to create a new app. Continue following the instructions provided within the app production software.
1. Once you have your Amazon Fire TV app created in the Zype platform, click on __Get New Bundle__ and the configured app bundle will be emailed to you. You may also reload the page and click the __Download Bundle__ button.

## Previewing and testing your new app

After you've received your app bundle, you'll need to preview and test your new app using Amazon's Web App Tester. There are 2 options:

### Option 1 - Upload the beta app to your own web host
_Note: This option requires third-party SSL web hosting and, in some cases, a domain name. A developer's assistance is recommended for this option._ 

1. Unzip the beta app package archive downloaded from Zype
1. Upload the files to a web host of your choice (examples of common web hosts include Amazon S3, MediaTemple, GoDaddy, Network Solutions, etc.)
1. Copy the HTTP link to the app's index.html file
1. Open the "**Web App Tester**" app on your Fire TV
1. In the top right corner, make sure it's set to "`TEST HOSTED APP`" (*Note: it should default this way*) (Fig. 1)
	
	![screenshot](images/web-app-tester/01-web-app-tester.png)
1. Click "`Name Your App`" (Fig. 2)
	
	![screenshot](images/web-app-tester/02-web-app-tester.png)
1. Enter the app name you want and click "`Submit`" (*Note: this is for internal use only and won't be seen anywhere else*)
1. Enter the URL copied in Step 3 (Fig. 3)
	
	![screenshot](images/web-app-tester/03-web-app-tester.png)
1. Click "`Submit`"
1. Click "`Add to Device`"
1. Your app will appear in the list below
1. Scroll down and click "`Test`" to the left of your app (Fig. 4)
	
	![screenshot](images/web-app-tester/04-web-app-tester.png)
1. Your app will open

### Option 2 - Create a Local Web Server on your computer
_Note: These instructions apply to specifically to macOS, however, the principles are applicable to any operating system (Windows, Linux, etc). A developer's assistance is recommended for this option._

1. Unzip the beta app package archive downloaded from Zype
1. In Finder, navigate to the folder containing the app and copy it (`command + c`)
1. Open the Terminal app.
1. At the prompt, type `cd`, space, then paste the folder copied in Step 2 (`command + v`).
	
	```
	cd /Users/user1/Desktop/zype-aftv
	```

1. In Terminal, start a HTTP server using the following command
	
	```
	python -m SimpleHTTPServer
	```
	
1. Open `System Preferences > Network > Status` to find your IP Address
1. Note the IP Address
1. Make sure both your computer and Fire TV are connected to the same wireless network
1. Open the **Web App Tester** app on your Fire TV
1. In the top right corner, make sure it's set to "`TEST HOSTED APP`" (*Note: it should default this way*) (Fig. 1)
		
	![screenshot](images/web-app-tester/01-web-app-tester.png)
1. Click "`Name Your App`" (Fig. 2)
	
	![screenshot](images/web-app-tester/02-web-app-tester.png)
1. Enter the app name you want and click "`Submit`" (*Note: this is for internal use only and won't be seen anywhere else*)
1. Enter the IP Address from Step 6, prepending `http://` and appending :`8000/index.html` (example: `http://192.168.1.1:8000/index.html`) (Fig. 3)
	
	![screenshot](images/web-app-tester/02-web-app-tester.png)
1. Click "`Submit`"
1. Click "`Add to Device`"
1. Your app will appear in the list below
1. Scroll down and click "`Test`" to the left of your app (Fig. 4)
	
	![screenshot](images/web-app-tester/04-web-app-tester.png)
1. Your app will open
1. Press (`Control + C`) to stop the HTTP server when you have completed testing

## Submitting to the Amazon Appstore
### Take screenshots of your app
In order to submit your Amazon Fire TV app to the Amazon Appstore, Amazon requires 3-10 screenshots of your app: 1920px x 1080px (landscape) in PNG or JPG format. Follow the instructions linked below. *Note: A developer's assistance is highly recommended.*

[https://developer.amazon.com/public/support/submitting-your-app/tech-docs/taking-screenshots](https://developer.amazon.com/public/support/submitting-your-app/tech-docs/taking-screenshots)

### Submit your app
Submit your app to the Amazon Appstore by following [Amazon's Instructions](https://developer.amazon.com/public/support/submitting-your-app/tech-docs/appstore-getting-started). *Note: special considerations detailed below*

1. Go to the [Amazon Developer Console](https://developer.amazon.com/home.html)
2. Click `Add New App`
3. Select `Mobile Web` and click `Next`
4. Fill out the subsequent form and click `Save`. You must complete each tab (detailed below).

### Submission Special Considerations
#### Apply Amazon DRM?
Yes.

#### Select the type of web app you want to submit
* You can choose zip and upload the zip we emailed you, or
* You can choose URL and provide the URL of the files (you must make them available via http).
* For pros/cons of the two approaches see: [Amazon's Article](https://developer.amazon.com/public/solutions/platforms/webapps/docs/differences-between-packaged-and-hosted-apps)

#### Web App Features
* Check `In-App Purchasing` (if you are using it)
* Check `Prevent Sleep for Video Playback`

#### Device Support
Uncheck all items except:

* Fire TV (2014)
* Fire TV Stick
* Fire TV (2015)

#### In-App Items
If your app uses In-App Items, you will need to set up In-App Items with your banking information.

##### In-App Items Subscriptions
If you are using Subscriptions with In App Items you must set up each subscription in the Amazon dashboard.

1. Click `In-App Items`
1. Click `Add a Subscription`
1. General Information
	* **Title**: Choose an appropriate title for your Subscription
	* **SKU**: 
		* This is the Plan’s Amazon ID you set up earlier on the Zype dashboard. (e.g. subscriptionMonthly-123)
		* Note: You must enter the Amazon ID from the Plan you set up in the Zype platform here. **The Amazon ID and SKU must match exactly** for subscriptions to work
	* **Content delivery**: No additional file required
1. Subscription Periods
	* **Subscription Period**: Choose a subscription period
	* **SKU**
		* Enter the Amazon ID here, but repeat it with a dot separator. Example: `subscriptionMonthly-123.subscriptionMonthly-123`
		* Note the dot and the repetition! This is due to the unique way Amazon handle purchase receipts.
		* If you want to have multiple subscription periods you must set up multiple plans in the Zype platform and repeat the above process. Note that you must create a new subscription each time. Do not add multiple Subscription Periods under the same parent SKU.

##### In App Items: Entitlements (Zype Purchase)

1. Click `Add an Entitlement`
1. General Information
	* **Title**: The title of your video
	* **SKU**
		* This is the Zype ID of the video, ie `5629232e4d656c4e94b10000`
		* To find the Video ID in the Zype platform go to `Dashboard > Video Library > Video`. The Video ID is shown in the Details tab.
	* **Content Delivery**: No additional file required

##### In App Items: Consumables (Zype Rental)

1. Click `Add a Consumable`
1. General Information
	* **Title**: The title of your video
	* **SKU**
		* This is the Zype ID of the video, prepended with `rental-`
		
			```
			rental-5629232e4d656c4e94b10000
			```
		
		* To find the Video ID in the Zype platform go to `Dashboard > Video Library > Video`. The Video ID is shown in the Details tab.
	* **Content Delivery**: No additional file required