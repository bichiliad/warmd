var DB = require('bookshelf').DB,
		Album = require('../models/album').model;

module.exports = {

	// Preload album with id, as specified in the url
	load: function (req, res, next, id) {
		Album.
			forge({ AlbumID: id}).
			fetch({
				withRelated: ['artist']
			}).
			then(function(album) { // Request returned (may or may not have found it)
				req.album = album;
				next();
			}, function (err) { // Something went wrong
				next(err);
			});
	},

	// Display current album, if it exists
	show: function(req, res) {
		if(req.album) {
			res.json(200, req.album);
		} else {
			res.json(404, {error: "Album not found"});
		}
	},

	// Update given album with contents from body.
	update: function(req, res) {
		if(!req.album) {
			res.json(404, {error: "Album not found"});
		} else {
			req.album.
				save(req.body, {patch: true}).
				then(function(model) {
					res.json(200, model);
				}, function(err) {
					res.json(400, {error: "Error updating playlist", details: err});
				});
		}
	},

	// Gives album art results the given query. Returns the first result. Not very creative.
	// TODO: Make this a bit smarter. i.e. have it take in different parameters, return only one album, etc.
	cover: function(req, res) {
		console.log("Looking up:", req.query);
		iTunes.get('/search?term=' + encodeURI(req.query.term), function(err, meta, body) {
			if(!err) {
				res.json(200, body);
			} else {
				res.json(400, {error: err});
			}
		});
	}
};