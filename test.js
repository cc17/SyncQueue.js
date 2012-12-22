// Run with mocha: http://visionmedia.github.com/mocha/
var assert = require('assert');
var SyncQueue = require('./SyncQueue');
var sq = null;

describe('SyncQueue.js tests', function () {
  beforeEach(function () {
    sq = new SyncQueue();
  });
  it('should execute asynchronous jobs in FIFO order and maintain proper state', function (done) {
    // Track current runs and total planned runs
    var runs = 0;
    var total = 10;
    // Generate total # jobs to execute
    for (var i = 0; i < total; i++) {
      (function (j) {
        sq.push(function (next) {
          setTimeout(function () {
            // Check job number against current run number
            assert.equal(j, runs++);
            // Execute next job
            next();
          }, 100 - (j * 10)); // Each job runs faster than the last
        });
      })(i);
    }
    // Push one final job to be executed at the very end
    sq.push(function (next) {
      // Check queue state to be running and have run the proper number of jobs
      assert.equal(true, sq._running);
      assert.equal(total, runs);
      // There is no next job, so this will shut down the queue until there is a next job
      next();
      // Check queue state to be not running and have zero jobs in queue
      assert.equal(false, sq._running);
      assert.equal(0, sq._queue);
      // Now that queue has been verified to be shut down, push one more job to make sure it can start back up
      sq.push(function (next) {
        // This last job finishes the test
        done();
      });
    });
  });

  it('should execute synchronous jobs without the need for a callback', function () {
    var hello = 'Hello, World!';
    var hello2 = '';
    for (var i = 0; i < hello.length; i++) {
      sq.push(function () {
        hello2 += hello[i];
      });
    }
    assert.equal(hello, hello2);
  });

  it('should execute a mix of synchronous and asynchronous jobs', function (done) {
    var hello = 'Hello, World!';
    var hello2 = '';
    for (var i = 0; i < hello.length; i++) {
      (function (i) {
        if (i % 2 === 0) {
          sq.push(function () {
            hello2 += hello[i];
          });
        } else {
          sq.push(function (next) {
            setTimeout(function () {
              hello2 += hello[i];
              next();
            }, 250);
          });
        }
      })(i);
    }
    sq.push(function () {
      assert.equal(hello, hello2);
      done();
    });
  });
});