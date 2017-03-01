/* Model
 *
 * Model for Category
 */

var Channel = function(args) {
  this.id = args.id;
  this.title = args.title || "";
  this.imgURL = args.imgUrl || "";
  this.description = args.description || "";
  this.playlist_id = args.playlist_id || null;
  this.category_id = args.category_id || null;
};

Channel.prototype = {
  constructor: Channel
};
