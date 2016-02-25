/* Model
 *
 * Model for Consumer
 */

var Consumer = function(args) {
  this.id = args.id || args._id;
  this.created_at = args.created_at;
  this.site_id = args.site_id;
  this.access_token = args.access_token;
};
