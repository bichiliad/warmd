var DB = require('bookshelf').DB,
    Artist = DB.Artist,
    Artists = DB.Collection.extend({
      model: Artist
    }).forge(); 

module.exports = {

  // Look up artist in context of request
  load: function(req, res, next, id) {
    Artist.forge({ ArtistID: id })
      .fetch({ require: true })
      .then(function (artist) {
        req.artist = artist;
        next();
      }, function (err) {
        if(err.message && err.message.indexOf("EmptyResponse") !== -1) {
          next(new Error('not found'));
        } else {
          next(err);
        }
      });
  },

  show: function(req, res) {
    res.format( {
      json: function() {
        res.json(req.artist.attributes);
      },
      default: function() {
        res.json(req.artist.attributes);
      }
             //TODO: other views? 
    });
  },

  query: function(req, res) {
    var query = req.body.query;

    // Make sure this query is a thang.
    if(!query) {
      res.json({
        error: "bad request",
        code: 400
      });
    }

    // Make a knex query
    Artists.query(function(qb){
      qb.where("Artist", "like", query)
        .orWhere("ShortName", "like", query)
        .orWhere("Artist", "like", "%" + query + "%")
        .orWhere("ShortName", "like", "%" + query + "%")
        .limit(10);   
    }).fetch()
      .then(function(collection) {
        res.json(collection.toJSON({shallow: true}));
      }); 
  }

}