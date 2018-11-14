// the dealer has too many dependencies for browserify final build step
var StatsD = require('lynx');
var metrics = new StatsD('localhost', 8125, {
  scope: 'production.pivot.dummy.',
  on_error: () => {}
});

module Plywood {
  export module helper {
    export interface ConcurrentLimitRequesterParameters<T> {
      requester: Requester.PlywoodRequester<T>;
      concurrentLimit: int;
      delayLimit?: int;
    }

    interface QueueItem<T> {
      request: Requester.DatabaseRequest<T>;
      deferred: Q.Deferred<any>;
      deferTime: int;
    }

    export function concurrentLimitRequesterFactory<T>(parameters: ConcurrentLimitRequesterParameters<T>): Requester.PlywoodRequester<T> {
      var requester = parameters.requester;
      var concurrentLimit = parameters.concurrentLimit || 5;
      var delayLimit = parameters.delayLimit || 60000;

      if (typeof concurrentLimit !== "number") throw new TypeError("concurrentLimit should be a number");
      if (typeof delayLimit !== "number") throw new TypeError("delayLimit should be a number");

      var requestQueue: Array<QueueItem<T>> = [];
      var outstandingRequests: int = 0;

      function requestFinished(): void {
        try {
          metrics.gauge('plywood.queued.requests', requestQueue.length, 1);
        } catch (e) {
          console.log('ERROR: Failed sending statsd metric: ' + e);
        }

        outstandingRequests--;
        if (!(requestQueue.length && outstandingRequests < concurrentLimit)) return;

        var now: int = Date.now();
        var elapsed: int = 0;
        var queueItem: QueueItem<T>;
        var deferred: Q.Deferred<any>;
        while (requestQueue.length) {
            queueItem = requestQueue.shift();
            elapsed = now - queueItem.deferTime;
            deferred = queueItem.deferred;

            try {
              metrics.gauge('plywood.queued.time', elapsed, 1);
            } catch (e) {
              console.log('ERROR: Failed sending statsd metric: ' + e);
            }

            if (elapsed > delayLimit) {
                var message =  `Request has been queued for ${elapsed} ms (limit is ${delayLimit}): forcing reject`;
                console.log(`DEBUG: ${message}`);
                deferred.reject(new Error(message));
                continue;
            }
            outstandingRequests++;
            requester(queueItem.request)
                .then(deferred.resolve, deferred.reject)
                .fin(requestFinished);
            return;
        }
      }

      return (request: Requester.DatabaseRequest<T>): Q.Promise<any> => {
        if (outstandingRequests < concurrentLimit) {
          outstandingRequests++;
          return requester(request).fin(requestFinished);
        } else {
          var deferred = Q.defer();
          requestQueue.push({
            request: request,
            deferred: deferred,
            deferTime: Date.now()
          });
          return deferred.promise;
        }
      };
    }
  }
}
