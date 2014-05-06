"use strict";
/* Test all sorts of endpoints */

/* global describe, it, before */

var should = require('should'),
    request = require('supertest'),
    app = require('../server'),
    context = describe;


describe('Endpoints', function() {

      describe('server active', function() {
         it('should be alive', function(done) {
            request.agent(app).
            get('/ping').
            end(function(err, res) {
               should.not.exist(err);
               should.exist(res);
               res.should.have.status(200);
               res.should.be.ok;

               done();
            });
         });
      });

      describe('dealing with users', function(){

         var Tom;

         before(function(done) {
            Tom = request.agent(app);
            Tom.post('/users/session').
            send({ username: 'Tom', password: 'test' }).
            end(function(err, res) {
               if (err) { return done(err); }
               done();
               });
            });
         it('should be /me', function(done) {
            Tom.
            get('/me').
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               res.should.be.json;
               res.should.have.status(200);
               res.body.should.be.type('object');
               res.body.should.not.be.empty;
               res.body.User.should.equal('Tom');

               done();
            });
         });

         it('should see mcbaron at /users/571', function (done) {
            Tom.
            get('/users/571').
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.WRCTUser.should.match(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@WRCT.ORG/);
               res.body.User.should.equal('mcbaron');
               res.body.UserID.should.be.ok;

               done();
               });
            });

         it('should find an array of "Matt\'s" at /users/query', function (done) {
               Tom.
               post('/users/query').
               send({query:'matt'}).
               end(function(err, res){
                  should.not.exist(err);
                  should.exist(res);
                  should.exist(res.body);
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.should.be.type('object');
                  res.body.should.be.an.instanceOf(Array);
                  res.body.should.not.be.empty;
                  res.body.should.containDeep([{User: 'msiko'}]);

                  done();
                  });
               });
      });

      describe('dealing with artists', function(){

         var Tom;

         before(function(done) {
            Tom = request.agent(app);
            Tom.post('/users/session').
            send({ username: 'Tom', password: 'test' }).
            end(function(err, res) {
               if (err) { return done(err); }
               done();
               });
            });

         it('should see daft punk at /artists/429', function (done) {
            Tom.
            get('/artists/429').
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.should.not.be.empty;
               res.body.Artist.should.equal('Daft Punk');
               res.body.should.be.ok;

               done();
            });
         });

         it('should search at /artist/query', function (done) {
            Tom.
            post('/artists/query').
            send({query:'daft'}).
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.should.be.type('object');
               res.body.should.not.be.empty;

               done();
            });
         });
      });

      describe('dealing with albums', function() {
         var Tom;

         before(function(done) {
            Tom = request.agent(app);
            Tom.post('/users/session').
            send({ username: 'Tom', password: 'test' }).
            end(function(err, res) {
               if (err) { return done(err); }
               done();
               });
            });

         it('should find More Than Just a Dream at /albums/46679', function(done) {
            Tom.
            get('/album/46679').
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.Album.should.equal('More Than Just a Dream');
               res.body.Year.should.equal('2013');

               done()
            });
         });

         it('should search at /album/query', function(done){
            Tom.
            post('/album/query').
            send({query: 'More'}).
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.should.be.type('object');
               res.body.should.not.be.empty;

               done();
            });

         });

         it('should let me update', function(done) {
            Tom.
            put('/album/46679').
            send({Status: 'Library'}).
            end(function(err, res) {
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.should.not.be.empty;
               res.body.Album.should.equal('More Than Just a Dream');
               res.body.Status.should.not.equal('OOB');

               done();
            });

         });


      });

      describe('dealing with programs', function() {
         var Tom;

         before(function(done) {
            Tom = request.agent(app);
            Tom.post('/users/session').
            send({ username: 'Tom', password: 'test' }).
            end(function(err, res) {
               if (err) { return done(err); }
               done();
               });
            });

         it('should find a show at /program/32', function(done){
            Tom.
            get('/program/32').
            end(function(err, res){
               should.not.exist(err);
               should.exist(res);
               should.exist(res.body);
               res.should.be.json;
               res.should.have.status(200);
               res.body.

               done()
            });

         });
      });

});
