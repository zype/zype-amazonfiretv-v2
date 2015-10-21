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

    this.settingsParams = appConfig;

    // this.iapTest = function () {
    //   console.log('amzn_wa.enableApiTester(amzn_wa_tester)')
    //   amzn_wa.enableApiTester(amzn_wa_tester);
    // };

    this.state = {
      lastPurchaseCheckTime: null,
      userId: null,
      validSkus: []
    };

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
        this.handleReceipt(e.receipt);
      } else if (e.purchaseRequestStatus == amzn_wa.IAP.PurchaseStatus.ALREADY_ENTITLED) {
        amzn_wa.IAP.getPurchaseUpdates(amzn_wa.IAP.Offset.BEGINNING)
      }
      // refreshPageState();
    };

    // getPurchaseUpdates will return an array of receipts
    this.onPurchaseUpdatesResponse = function(e) {
      for (var i = 0; i < e.receipts.length; i++) {
        this.handleReceipt(e.receipts[i]);
      }
      this.state.lastPurchaseCheckTime = e.offset;
      // refreshPageState();
      if (e.isMore) {
        // In case there is more updates that did not
        // get sent with this response, make sure that
        // we get the rest of them.
        amzn_wa.IAP.getPurchaseUpdates(this.state.lastPurchaseCheckTime);
      }
    };

    this.removeSku = function(sku) {
      var index = this.state.validSkus.indexOf(sku);
      if(index != -1) {
        this.state.validSkus.splice(index, 1);
      }
    };

    this.addSku = function(sku) {
      if(this.state.validSkus.indexOf(sku) == -1) {
        this.state.validSkus.push(sku);
      }
    };

    this.verifyReceipt = function(receipt) {
      // send receipt purchase token to zype verification service
      var amazon_verify_receipt_url = this.settingsParams.endpoint + 'amazon_fire_receipts/process_receipt';

      var that = this;

      $.ajax({
        method: 'POST',
        url: amazon_verify_receipt_url,
        dataType: 'json',
        data: {
          'api_key': this.settingsParams.apiKey,
          'device_id': '5429b1c769702d2f7c120000',
          'item_type': receipt.itemType,
          'purchase_token': receipt.purchaseToken,
          'sku': receipt.sku,
          'user_id': this.state.userId
        }
      }).error(function( msg ) {
        that.removeSku(receipt.sku);
        console.log(that.state.validSkus);
      }).done(function( msg ) {
        that.addSku(receipt.sku);
        console.log(that.state.validSkus);
      });
    };

    this.createFakeReceipt = function(receipt) {
      // send receipt purchase token to zype verification service
      var url = 'http://localhost:9123/amazon_receipts';

      $.ajax({
        method: 'POST',
        url: url,
        dataType: 'json',
        data: {
          'amazon_receipt': {
            'item_type': receipt.itemType,
            'purchase_token': receipt.purchaseToken,
            'sku': receipt.sku
          }
        }
      }).error(function( msg ) {
        console.log(msg)
      }).done(function( msg ) {
        console.log(msg);
      });
    };

    this.handleReceipt = function(receipt) {

      // uncomment this in dev to enable creating valid receipts on a fake server
      // use amazon_receipt_faker repo
      // bundle exec rails s -p 9123
      this.createFakeReceipt(receipt);

      this.verifyReceipt(receipt); // send receipt purchase token to zype
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

    // this.getAvailableSubscriptions = function() {
    //   var items = this.getAvailableItems();
    //   return _.pick(items, this.subscriptionIds())
    // };

    // type can be:
    // SUBSCRIPTION
    // CONSUMABLE
    // ENTITLED
    // this.findItem = function(sku, type) {
    //   var items = this.getAvailableItems();
    //   if (items[id] && items[id].itemType == type) {
    //     return items[id];
    //   }
    // };

    this.iapInit = function () {
      var that = this;
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

            // get current user
            amzn_wa.IAP.getUserId();
          },
          // Called as response to getUserId
          'onGetUserIdResponse': function(resp) {
            console.log('onGetUserIdResponse');
            console.log(resp);
            if(resp.userIdRequestStatus == 'SUCCESSFUL') {

              // set current user id
              that.state.userId = resp.userId;

              // You should call getPurchaseUpdates to get any purchases
              // that could have been made in a previous run.
              amzn_wa.IAP.getPurchaseUpdates(that.state.lastPurchaseCheckTime != null ?
                    that.state.lastPurchaseCheckTime : amzn_wa.IAP.Offset.BEGINNING);
            }
          },
          // Called as response to getItemData
          'onItemDataResponse': function(data) {
            console.log('onItemDataResponse');
            console.log(data);
          },
          // Called as response to puchaseItem
          'onPurchaseResponse': function(data) {
            that.onPurchaseResponse(data);
          },
          // Called as response to getPurchaseUpdates
          'onPurchaseUpdatesResponse': function(resp) {
            that.onPurchaseUpdatesResponse(resp);
          }
        });
      }
    };

  };

  exports.IapHandler = IapHandler;
  exports.iapHandler = new IapHandler();
}(window));
