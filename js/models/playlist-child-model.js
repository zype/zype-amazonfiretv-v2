/* Model
 *
 * Model for Playlist Child
 */

var PlaylistChild = function(args) {
  this.id = args.id;
  this.description = args.description;
  this.imgURL = args.imgURL;
  this.parent_id = args.parent_id;
  this.playlist_item_count = args.playlist_item_count;
  this.title = args.title || '';
};

PlaylistChild.prototype = {
  constructor: PlaylistChild
};
