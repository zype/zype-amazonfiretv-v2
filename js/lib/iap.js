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

    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['purchaseSuccess', 'purchaseFail', 'purchased']);

    this.settingsParams = null;
    this.oneDView = null;
    this.state = {
      lastPurchaseCheckTime: null,
      userId: null,
      validSkus: [], // these are the skus that have been purchased by the user and validated by amazon
      allVideoIds: [], // note that this is all video ids, some of which may not actually be available to purchase on amazon
      availableSkus: [], // this should be the list of items actually available to purchase
      currentConsumer: null
    };

    this.on("purchaseSuccess", function(receipt) {
      iapHandler.addSku(receipt.sku);
      app.trigger("purchased");
    }.bind(this));

    this.on('purchaseFail', function(receipt) {
      iapHandler.removeSku(receipt.sku);
    }, this);

    this.purchaseItem = function(id) {
      var sku = this.parseSku(id);
      if (amzn_wa.IAP === null) {
        alert("You cannot buy this video, Amazon In-App-Purchasing works only with Apps from the Appstore.");
      } else {
        amzn_wa.IAP.purchaseItem(sku);
      }
    };

    this.parseSku = function(id) {
      if (id.indexOf('-purchase') != -1) {
        return id.replace('-purchase', '');
      } else {
        return id;
      }
    };

    // purchaseItem will cause a purchase response with one receipt
    this.onPurchaseResponse = function(e) {
      if (e.purchaseRequestStatus == amzn_wa.IAP.PurchaseStatus.SUCCESSFUL) {
        this.handleReceipt(e.receipt);
      } else if (e.purchaseRequestStatus == amzn_wa.IAP.PurchaseStatus.ALREADY_ENTITLED) {
        amzn_wa.IAP.getPurchaseUpdates(amzn_wa.IAP.Offset.BEGINNING);
      }
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
      if (index != -1) {
        this.state.validSkus.splice(index, 1);
      }
    };

    this.addSku = function(sku) {
      if (this.state.validSkus.indexOf(sku) == -1) {
        this.state.validSkus.push(sku);
      }
    };

    /**
     * This is for testing only.
     * We need to add the SKUs to the validSkus. So hasValid* will work properly.
     * Add the following code to the AJAX request
     * @NOTE for testing only
     complete(function() {
       that.trigger('purchaseSuccess', receipt);
     });
    */
    this.handleReceipt = function(receipt) {

      // send receipt purchase token to zype verification service
      var amazon_verify_receipt_url = this.settingsParams.endpoint + 'amazon_fire_receipts/process_receipt';

      var that = this;

      $.ajax({
        method: 'POST',
        url: amazon_verify_receipt_url,
        crossDomain: true,
        dataType: 'jsonp',
        context: this,
        data: {
          'app_key': this.settingsParams.app_key,
          'item_type': receipt.itemType,
          'purchase_token': receipt.purchaseToken,
          'sku': receipt.sku,
          'user_id': this.state.userId
        }
      }).fail(function(msg) {
        that.trigger('purchaseFail', receipt);
      }).done(function(msg) {
        var consumer = msg.response;
        that.state.currentConsumer = new Consumer(consumer);
        that.trigger('purchaseSuccess', receipt);
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
      }).fail(function(msg) {
        console.log(msg);
      }).done(function(msg) {
        console.log(msg);
      });
    };

    this.checkAvailableItems = function(onItemDataResponseCallback) {
      if (amzn_wa.IAP === null) {
        onItemDataResponseCallback();
      } else {
        this.onItemDataResponseCallback = onItemDataResponseCallback;
        amzn_wa.IAP.getItemData(this.state.allVideoIds);
      }
    };

    this.onItemDataResponse = function(e) {
      this.state.availableSkus = _.difference(this.state.allVideoIds, e.unavailableSkus);
      this.onItemDataResponseCallback();
    };

    this.allSubscriptions = function() {
      return _.select(app.data.plans, function(p) {
        return p.amazon_id;
      });
    };

    this.allSubscriptionIds = function() {
      return _.map(this.allSubscriptions(), function(s) {
        return s.amazon_id;
      });
    };

    this.getAvailableSubscriptionButtons = function() {
      if (this.settingsParams.IAP) {
        return _.map(this.allSubscriptions(), function(p) {
          return {
            "name": p.name,
            "id": p.amazon_id,
            "class": "btnIAP btnSubscribe"
          };
        });
      } else {
        return [];
      }
    };

    this.getAvailablePurchaseButtons = function() {
      var buttons = [];

      if (this.settingsParams.IAP) {
        _.each(this.state.availableSkus, function(i) {
          // purchase button
          buttons.push({
            "id": i,
            "name": 'Purchase',
            "class": "btnIAP btnPurchase"
          });
        });
      }

      return buttons;
    };

    this.hasValidSubscription = function() {
      var sub_ids = this.allSubscriptionIds();
      var res = _.find(this.state.validSkus, function(sku) {
        return sub_ids.indexOf(sku) != -1;
      });
      if (res !== undefined) {
        return true;
      } else {
        return false;
      }
    };

    this.hasValidPurchase = function(video_id) {
      if (this.state.validSkus.indexOf(this.purchaseSku(video_id)) != -1) {
        return true;
      } else {
        return false;
      }
    };

    this.rentalSku = function(video_id) {
      return 'rental-' + video_id;
    };

    this.purchaseSku = function(video_id) {
      return video_id;
    };


    this.hasValidRental = function(video_id) {
      if (this.state.validSkus.indexOf(this.rentalSku(video_id)) != -1) {
        return true;
      } else {
        return false;
      }
    };

    this.canPlayVideo = function(video) {

      if (!this.settingsParams.IAP) {
        return true;
      } else if (video.hasPaywall() === false) {
        return true;
      }

      if (video.subscription_required === true && this.hasValidSubscription()) {
        return true;
      } else if (video.purchase_required === true && this.hasValidPurchase(video.id)) {
        return true;
      } else if (video.rental_required === true && this.hasValidRental(video.id)) {
        return true;
      }

      return false;
    };

    this.iapInit = function() {
      var that = this;
      // Ensure we can call the IAP API
      if (amzn_wa.IAP === null) {
        console.log("Amazon In-App-Purchasing only works with Apps from the Appstore");
      } else {
        // Registers the appropriate callback functions
        amzn_wa.IAP.registerObserver({
          // Called the the IAP API is available
          onSdkAvailable: function(resp) {
            if (resp.isSandboxMode) {
              // In a production application this should trigger either
              // shutting down IAP functionality or redirecting to some
              // page explaining that you should purchase this application
              // from the Amazon Appstore.
              //
              // Not checking can leave your application in a state that
              // is vulnerable to attacks. See the supplied documention
              // for additional information.
              console.log("Running in test mode");
            }

            // get current user
            amzn_wa.IAP.getUserId();
            console.log(amzn_wa.IAP);
          },
          // Called as response to getUserId
          onGetUserIdResponse: function(resp) {
            // console.log('onGetUserIdResponse');
            // console.log(resp);
            // it could be either of these depending on the varying whims of amazon
            if (resp.userIdRequestStatus == 'SUCCESSFUL' || resp.getUserIdRequestStatus == 'SUCCESSFUL') {

              // set current user id
              that.state.userId = resp.userId;

              // You should call getPurchaseUpdates to get any purchases
              // that could have been made in a previous run.
              amzn_wa.IAP.getPurchaseUpdates(that.state.lastPurchaseCheckTime !== null ?
                that.state.lastPurchaseCheckTime : amzn_wa.IAP.Offset.BEGINNING);
            }
          },
          // Called as response to getItemData
          onItemDataResponse: function(data) {
            that.onItemDataResponse(data);
          },
          // Called as response to puchaseItem
          onPurchaseResponse: function(data) {
            that.onPurchaseResponse(data);
          },
          // Called as response to getPurchaseUpdates
          onPurchaseUpdatesResponse: function(resp) {
            that.onPurchaseUpdatesResponse(resp);
          }
        });
      }
    };

  };

  exports.IapHandler = IapHandler;
  exports.iapHandler = new IapHandler();
}(window));
