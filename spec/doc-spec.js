(function () {
  'use strict';

  const supertest = require('supertest'),
    server = require('../dcman'),
    request = supertest(server),
    helper = require('./helpers/helper');

  let adminToken, adminId, userToken, userId, viewerId, viewerToken;
  beforeAll(function (done) {
    helper.adminLogin(function (body) {
      adminToken = body.token;
      adminId = body.user._id;
      done();
    });
    helper.userLogin(function (body) {
      userToken = body.token;
      userId = body.user._id;
      done();
    });
    helper.viewerLogin(function (body) {
      viewerToken = body.token;
      viewerId = body.user._id;
      done();
    });
  });

  describe('Document suite', function () {
    it('allows only authenticated users to create documents', function (done) {
      request
        .post('/documents')
        .send({
          ownerId: adminId,
          title: 'Admin\'s document',
          content: 'This document belongs to the adminstrator and can only be viewed by admins',
          accessLevel: 'admin'
        })
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(res.status).toEqual(401);
          expect(res.body).toBeDefined();
          expect(res.body.error).toBeDefined();
          expect(res.body.error).toBe('You are not authenticated');
          done();
        });
    });

    it('allows only authenticated users to view documents', function (done) {
      request
        .get('/documents')
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(res.status).toEqual(401);
          expect(res.body.error).toBeDefined();
          expect(res.body.error).toBe('You are not authenticated');
          done();
        });
    });

    it('Document created must have a title and content', function (done) {
      request
        .post('/documents')
        .send({
          ownerId: adminId,
          accessLevel: 'admin'
        })
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeDefined();
          expect(res.body).toBeDefined();
          expect(res.body.errors).toBeDefined();
          expect(res.body.message).toBe('Document validation failed');
          expect(res.body.name).toBe('ValidationError');
          done();
        });
    });

    it('creates a document successfully', function (done) {
      request
        .post('/documents')
        .send({
          ownerId: adminId,
          title: 'Create Test Document',
          content: 'This document has been created by a test spec on the 14th',
          accessLevel: 'admin',
          dateCreated: '2016-03-14T18:05:00.209Z'
        })
        .set('Accept', 'application/json')
        .set('x-access-token', adminToken)
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(res.body).toBeDefined();
          expect(res.status).toBe(200);
          expect(res.body.doc.dateCreated).toBeDefined();
          expect(res.body.doc.title).toEqual('Create Test Document');
          expect(res.body.message).toEqual('Document created successfully');
          done();
        });
    });

    it('creates a document only for existing users', function (done) {
      request
        .post('/documents')
        .send({
          ownerId: '56f3b1e608588e1d4c54744d',
          title: 'Create Test Document',
          content: 'This document has been created by a test spec on the 14th',
          accessLevel: 'private',
        })
        .set('Accept', 'application/json')
        .set('x-access-token', adminToken)
        .end(function (err, res) {
          expect(res.body).toBeDefined();
          expect(res.status).toBe(404);
          expect(res.body.error).toEqual('User not found');
          done();
        });
    });

    it('returns one document whose id is issued', function (done) {
      helper.createDoc(adminToken, adminId, function (body) {
        let doc_id = body.doc._id;
        request
          .get('/documents/' + doc_id)
          .set('x-access-token', adminToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(200);
            expect(res.body).toBeDefined();
            expect(res.body.title).toEqual('Only document to be returned');
            done();
          });
      });
    });

    it('returns all documents if user is admin', function (done) {
      request
        .get('/documents')
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(res.status).toEqual(200);
          expect(res.body).toBeDefined();
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toEqual(5);
          done();
        });
    });

    it('returns the exact number of documents if specified', function (done) {
      request
        .get('/documents?limit=2')
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(res.status).toEqual(200);
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toEqual(2);
          done();
        });
    });

    it('returns only documents within the dates specified', function (done) {
      request
        .get('/documents?from=03-10-2016&to=03-15-2016')
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toEqual(1);
          expect(res.body[0].title).toEqual('Create Test Document');
          done();
        });
    });

    it('returns only the documents that are public', function (done) {
        request
          .get('/documents')
          .set('x-access-token', viewerToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(200);
            expect(res.body).toBeDefined();
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toEqual(2);
            done();
          });
    });
   
    it('returns all documents accessible to a specific role ', function (done) {
      request
        .get('/documents?role=user')
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(res.status).toEqual(200);
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toEqual(3);
          done();
        });
    });

    it('updates a document if user has access to it', function (done) {
      helper.createDoc(adminToken, adminId, function (body) {
        let doc_id = body.doc._id;
        request
          .put('/documents/' + doc_id)
          .send({
            title: 'Updated Title',
            content: 'This document just got updated',
            accessLevel: 'private'
          })
          .set('x-access-token', adminToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(200);
            expect(res.body).toBeDefined();
            expect(res.body.doc.title).toEqual('Updated Title');
            expect(res.body.message).toEqual('Document updated successfully');
            done();
          });
      });
    });

    it('returns error on unauthorised update', function (done) {
      helper.createDoc(userToken, userId, function (body) {
        let doc_id = body.doc._id;
        request
          .put('/documents/' + doc_id)
          .send({
            title: 'Updated Title',
            content: 'This document just got updated',
          })
          .set('x-access-token', viewerToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(403);
            expect(res.body.error.message)
              .toEqual('You have no permission to make changes to this document');
            done();
          });
      });
    });

    it('deletes a document if user has access to it', function (done) {
      helper.createDoc(userToken, userId, function (body) {
        let doc_id = body.doc._id;
        request
          .delete('/documents/' + doc_id)
          .set('x-access-token', userToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(200);
            expect(res.body).toBeDefined();
            expect(res.body.message).toEqual('Document deleted successfully.');
            done();
          });
      });
    });

    it('returns error on unauthorised delete', function (done) {
      helper.createDoc(userToken, userId, function (body) {
        let doc_id = body.doc._id;
        request
          .delete('/documents/' + doc_id)
          .set('x-access-token', viewerToken)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            expect(err).toBeNull();
            expect(res.status).toEqual(403);
            expect(res.body.error.message)
              .toEqual('You have no permission to make changes to this document');
            done();
          });
      });
    });

    it('returns the documents containing the provided search term', function (done) {
      request
        .get('/documents/results?q=viewed')
        .set('x-access-token', adminToken)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          expect(err).toBeNull();
          expect(res.status).toEqual(200);
          expect(res.body.length).toEqual(2);
          expect(res.body[0].content).toContain('viewed');
          done();
        });
    });
  });
})();