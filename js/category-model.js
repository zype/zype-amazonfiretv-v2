/* Model
 *
 * Model for Category
 */

var Category = function(args) {
  this.id = args.id;
  this.title = args.title;
  this.imgURL = args.imgUrl;
  this.description = args.description;
  this.playlist_id = args.playlist_id;
  this.category_id = args.category_id;
};

Category.prototype = {
  constructor: Category
};
