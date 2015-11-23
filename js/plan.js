/* Model
 *
 * Model for Plan
 */

var Plan = function(args) {
  this.id = args.id;
  this.name = args.name;
  this.description = args.description;
  this.amount = args.amount;
  this.currency = args.currency;
  this.interval = args.interval;
  this.interval_count = args.interval_count;
  this.trial_period_days = args.trial_period_days;
  this.amazon_id = args.amazon_id;

};

Plan.getPlans = function(settings, successCallback) {
  this.currData = [];

  var url = settings.endpoint + 'plans';
  $.ajax({
    method: 'GET',
    url: url,
    dataType: 'json',
    crossDomain: true,
    data: {
      'api_key': settings.key,
      'app_key': settings.app,
      'device_id': '5429b1c769702d2f7c120000',
    }
  }).fail(function( msg ) {
    console.log('fail');
    console.log(msg);
  }).done(function( msg ) {
    this.currData = _.map(msg.response, function(p) {
      return new Plan(p);
    });
  }).always(function() {
    successCallback(this.currData);
  });
};