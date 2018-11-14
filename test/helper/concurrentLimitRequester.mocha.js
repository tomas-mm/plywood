var { expect } = require("chai");
var sinon = require('sinon');

var Q = require('q');

var plywood = require("../../build/plywood");
var { concurrentLimitRequesterFactory } = plywood.helper;

describe("Retry requester", () => {
  var sandbox = sinon.createSandbox();
  var makeRequester = () => {
    var deferreds = {};

    var requester = (request) => {
      var deferred = Q.defer();
      deferreds[request.query] = deferred;
      return deferred.promise;
    };

    requester.hasQuery = (query) => {
      return Boolean(deferreds[query]);
    };
    requester.resolve = (query) => {
      return deferreds[query].resolve([1, 2, 3]);
    };
    requester.reject = (query) => {
      return deferreds[query].reject(new Error('fail'));
    };
    return requester;
  };

  afterEach(function () {
    sandbox.restore();
  });

  it("basic works", (testComplete) => {
    var requester = makeRequester();
    var concurrentLimitRequester = concurrentLimitRequesterFactory({
      requester,
      concurrentLimit: 2
    });

    concurrentLimitRequester({ query: 'a' })
      .then((res) => {
        expect(res).to.be.an('array');
        testComplete();
      })
      .done();

    return requester.resolve('a');
  });

  it("limit works", (testComplete) => {
    var requester = makeRequester();
    var concurrentLimitRequester = concurrentLimitRequesterFactory({
      requester,
      concurrentLimit: 2
    });

    var nextQuery = 'a';
    concurrentLimitRequester({ query: 'a' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('a');
        return nextQuery = 'b';
      })
      .done();

    concurrentLimitRequester({ query: 'b' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('b');
        nextQuery = 'c';
        expect(requester.hasQuery('c', 'has c')).to.equal(true);
        return requester.resolve('c');
      })
      .done();

    concurrentLimitRequester({ query: 'c' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('c');
        testComplete();
      })
      .done();

    expect(requester.hasQuery('a'), 'has a').to.equal(true);
    expect(requester.hasQuery('b'), 'has b').to.equal(true);
    expect(requester.hasQuery('c'), 'has c').to.equal(false);
    requester.resolve('a');
    return requester.resolve('b');
  });

  it("limit delay works", (testComplete) => {
    var requester = makeRequester();
    var concurrentLimitRequester = concurrentLimitRequesterFactory({
      requester,
      concurrentLimit: 2,
      delayLimit: 5,
    });

    var mockDate = sandbox.mock(Date);
    var expectationDate = mockDate.expects('now').exactly(4)
      .onCall(0).returns(0)
      .onCall(1).returns(1)
      .onCall(2).returns(2)
      .onCall(3).returns(20);

    var nextQuery = 'a';
    concurrentLimitRequester({ query: 'a' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('a');
        return nextQuery = 'b';
      })
      .done();

    concurrentLimitRequester({ query: 'b' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('b');
        nextQuery = 'c';
        expect(requester.hasQuery('c', 'has c')).to.equal(true);
        return requester.resolve('c');
      })
      .done();

    concurrentLimitRequester({ query: 'c' })
      .then((res) => {
        expect(res).to.be.an('array');
        expect(nextQuery).to.equal('c');
        expect(requester.hasQuery('d', 'has d')).to.equal(false);
        try {
          sandbox.verify();
          testComplete();
        } catch (err) {
          testComplete(err);
        }
      })
      .done();

    concurrentLimitRequester({ query: 'd' })
      .catch((rejectError) => {
        // Assert that a request that timed out is rejected
        expect(rejectError).to.be.an('Error');
        // just after 'a' finished, 'd' is removed from the queue
        expect(nextQuery).to.equal('a');
      })
      .done();

    expect(requester.hasQuery('a'), 'has a').to.equal(true);
    expect(requester.hasQuery('b'), 'has b').to.equal(true);
    expect(requester.hasQuery('c'), 'has c').to.equal(false);
    expect(requester.hasQuery('d'), 'has d').to.equal(false);
    requester.resolve('a');
    return requester.resolve('b');
  });
});
