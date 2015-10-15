/* IAP In App Purchase utility
 *
 * Handles In App Purchases
 *
 */

(function(exports) {
  "use strict";


  var IapHandler = function() {
    // make it a singleton
    if (exports.iapHandler) {
      return iapHandler;
    }

    // this.iapTest = function () {
    //   console.log('amzn_wa.enableApiTester(amzn_wa_tester)')
    //   amzn_wa.enableApiTester(amzn_wa_tester);
    // };

    this.purchaseItem = function(video_id) {
      if (amzn_wa.IAP == null) {
        alert("You cannot buy this video, Amazon In-App-Purchasing works only with Apps from the Appstore.");
      } else {
        amzn_wa.IAP.purchaseItem(video_id);
      }
    };

    // purchaseItem will cause a purchase response with one receipt
    this.onPurchaseResponse = function(e) {
      if (e.purchaseRequestStatus == amzn_wa.IAP.PurchaseStatus.SUCCESSFUL) {
        handleReceipt(e.receipt);
      } else if (e.purchaseRequestStatus == amzn_wa.IAP.PurchaseStatus.ALREADY_ENTITLED) {
        amzn_wa.IAP.getPurchaseUpdates(amzn_wa.IAP.Offset.BEGINNING)
      }
      // refreshPageState();
    };

    // getPurchaseUpdates will return an array of receipts
    this.onPurchaseUpdatesResponse = function(e) {
      for (var i = 0; i < e.receipts.length; i++) {
        handleReceipt(e.receipts[i]);
      }
      // state.lastPurchaseCheckTime = e.offset;
      // refreshPageState();
      if (e.isMore) {
        // In case there is more updates that did not
        // get sent with this response, make sure that
        // we get the rest of them.
        // amzn_wa.IAP.getPurchaseUpdates(state.lastPurchaseCheckTime);
      }
    };


    this.validateReceipt = function() {
      // send receipt purchase token to zype verification service
      return 200;
    };

    this.handleReceipt = function(receipt) {
      var status = validateRecript(receipt); // send receipt purchase token to zype verification service
      switch(status) {
      case 200:
        // show video
        console.log('show video')
      case 401:
       // purchase expired, prompt for purchse
      case 422:
       // receipt is not verified, show appropriate messaging.
      }
    };

    this.getAvailableItems = function() {
      return amzn_wa.IAP._amazonClient._items;
    };

    this.allSubscriptionButtons = function() {
      return [
        {
          id: 'subscriptionWeekly',
          name: 'Weekly Subscription'
        },
        {
          id: 'subscriptionBiWeekly',
          name: 'Bi-Weekly Subscription'
        },
        {
          id: 'subscriptionMonthly',
          name: 'Monthly Subscription'
        },
        {
          id: 'subscriptionBiMonthly',
          name: 'Bi-Monthly Subscription'
        },
        {
          id: 'subscriptionQuarterly',
          name: 'Quarterly Subscription'
        },
        {
          id: 'subscriptionSemiAnnually',
          name: 'Semi-Annual Subscription'
        },
        {
          id: 'subscriptionAnnually',
          name: 'Annual Subscription'
        }
      ];
    };

    this.getAvailableSubscriptionButtons = function() {
      var buttons = this.allSubscriptionButtons();
      var item_ids = _.keys(this.getAvailableItems());
      return _.select(buttons, function(b) {
        return _.includes(item_ids, b.id);
      });
    };
    this.iapInit = function () {
      // Ensure we can call the IAP API
      if (amzn_wa.IAP == null) {
        console.log("Amazon In-App-Purchasing only works with Apps from the Appstore");
      } else {
        // Registers the appropriate callback functions
        amzn_wa.IAP.registerObserver({
           // Called the the IAP API is available
          'onSdkAvailable': function(resp) {
            if (resp.isSandboxMode) {
                // In a production application this should trigger either
                // shutting down IAP functionality or redirecting to some
                // page explaining that you should purchase this application
                // from the Amazon Appstore.
                //
                // Not checking can leave your application in a state that
                // is vulnerable to attacks. See the supplied documention
                // for additional information.
                alert("Running in test mode");
            }

            // You should call getPurchaseUpdates to get any purchases
            // that could have been made in a previous run.
            // amzn_wa.IAP.getPurchaseUpdates(state.lastPurchaseCheckTime != null ?
                    // state.lastPurchaseCheckTime : amzn_wa.IAP.Offset.BEGINNING);
          },

          // Called as response to getUserId
          'onGetUserIdResponse': function(resp) {},

          // Called as response to getItemData
          'onItemDataResponse': function(data) {},

          // Called as response to puchaseItem
          'onPurchaseResponse': function(data) { onPurchaseResponse(data); },

          // Called as response to getPurchaseUpdates
          'onPurchaseUpdatesResponse': function(resp) { onPurchaseUpdatesResponse(resp);
          }
        });
      }
    };

  };

  exports.IapHandler = IapHandler;
  exports.iapHandler = new IapHandler();
}(window));
