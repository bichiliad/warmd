/* jshint node: true, expr: true */

"use strict";
/* Test all sorts of user endpoints */

/* global describe, it, before */

var should = require('should'),
    request = require('supertest'),
    app = require('../server'),
    context = describe;

var user, pass;

describe('Users', function() {
  describe('Authentication', function() {

    it('should log in successfully', function(done) {
      request.agent(app).
      post('/users/session').
      send({ username: 'Tom', password: 'test' }).
      end(function(err, res){
        // Catch any errors
        should.not.exist(err);

        // Make sure login was successful
        res.should.have.status(302);
        res.should.have.header('location', '/app');
        done();
      });
    });

    it('should not log in invalid users', function(done) {
      request.agent(app).
      post('/users/session').
      send({ username: 'not_a_username', password: 'not_a_password' }).
      end(function(err, res) {
        // Catch any errors
        should.not.exist(err);

        // Make sure login wasn't successful
        res.should.have.status(302);
        res.should.have.header('location', '/login?success=false');
        done();
      });
    });
  });

  describe('/me', function() {

    var Tom;

    before(function(done) {
      Tom = request.agent(app);
      Tom.post('/users/session')
        .send({ username: 'Tom', password: 'test' })
        .end(function(err, res) {
          if (err) { return done(err); }
          done();
        });
    });

    it('should exist if logged in', function(done) {
      Tom
        .get('/me')
        .end(function(err, res){
          // Catch any errors
          should.not.exist(err);
          should.exist(res);
          should.exist(res.body);
          res.should.be.json;
          res.should.have.status(200);
          res.body.User.should.equal('Tom');
          res.body.FName.should.equal('Tom');
          res.body.UserID.should.be.ok;
          done();
        });
    });

    it('should not render passwords', function(done) {
      Tom
        .get('/me')
        .end(function(err, res) {
          should.not.exist(err);
          should.exist(res);
          should.exist(res.body);
          res.should.be.json;
          res.should.have.status(200);
          should.not.exist(res.body.Password);
          done();
        });
    });

    it('should redirect to /login if user is logged out', function(done) {
      request
        .agent(app)
        .get('/me')
        .end(function(err, res) {
          should.not.exist(err);
          should.exist(res);
          should.exist(res.body);
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

      /* // users/update endpoint doesn't yet exist.
      describe('Privileges', function() {

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
            it('should change Tom to Trainee', function(done) {
				* Tom.
				* post('/app/#/users/update').
				* send('').
				* end(function(err,res) {
					* should.not.exist(err);
					* should.exist(res);
					* should.not.be.empty(res.body);
					* res.should.be.json;
					* res.should.have.status(200);
					* res.body.AuthLevel.should.be('Trainee');
					*
					* done();
				});
			});
		}); */
});
