(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// public
module.exports = construct;

// implementation
function construct(Instance, a, b, c) {
  if (c) {
    return new Instance(a, b, c);
  }
  if (b) {
    return new Instance(a, b);
  }
  if (a) {
    return new Instance(a);
  }
  return new Instance();
}

},{}],2:[function(require,module,exports){
(function (global){
// modules
var processBenchmarks = require('./process-benchmarks');
var provideApi = require('./provide-api');
var provideDump = require('./provide-dump');
var runBenchmarks = require('./run-benchmarks');
var store = require('./store');
var WrappedBenchmark = require('./wrapped-benchmark');

// implementation
global.Benchmark = WrappedBenchmark;
provideApi(global);
provideDump(global);

global.__karma__.start = function () {
  runBenchmarks(global,
    processBenchmarks(store.getSuites())
  );
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./process-benchmarks":3,"./provide-api":4,"./provide-dump":5,"./run-benchmarks":6,"./store":7,"./wrapped-benchmark":8}],3:[function(require,module,exports){
// public
module.exports = processBenchmarks;

// implementation
function processBenchmarks(suites) {
  var focusedSuites = _.filter(suites, isFocusedSuite);

  return focusedSuites.length > 0 ?
    focusedSuites.map(focusBenchmarks) :
    suites;

  function isFocusedSuite(suite) {
    return isFocused(suite) || _.some(suite, isFocused);
  }

  function focusBenchmarks(suite) {
    var focusedBenchmarks = suite.filter(isFocused);
    var removed = suite.length - focusedBenchmarks.length;
    focusedBenchmarks.name = suite.name + ' (' + removed + ' benchmarks have been ignored)';
    return focusedBenchmarks.length ? focusedBenchmarks : suite;
  }

  function isFocused(obj) {
    return obj.runAlone === true;
  }
}

},{}],4:[function(require,module,exports){
// public
module.exports = provideApi;

// implementation
function provideApi(obj) {
  obj.suite = addSuite;
  obj.suite.only = obj.ssuite = focusSuite;
  obj.suite.skip = obj.xsuite = skipSuite;

  function addSuite(name, addBenchmarks, options, runAlone) {
    var suite = new obj.Benchmark.Suite(name, options);
    suite.runAlone = Boolean(runAlone);
    updateBenchmarkApi(obj, suite);
    addBenchmarks();
  }

  function focusSuite(name, addBenchmarks, options) {
    addSuite(name, addBenchmarks, options, true);
  }

  function skipSuite() {}
}

function updateBenchmarkApi(obj, suite) {
  obj.benchmark = addBenchmark;
  obj.benchmark.only = obj.bbenchmark = focusBenchmark;
  obj.benchmark.skip = obj.xbenchmark = skipBenchmark;

  function addBenchmark(name, fn, options, runAlone) {
    suite.add(name, fn, options);
    var benchmark = suite[suite.length - 1];
    benchmark.runAlone = Boolean(runAlone);
  }

  function focusBenchmark(name, addBenchmarks, options) {
    addBenchmark(name, addBenchmarks, options, true);
  }

  function skipBenchmark() {}
}

},{}],5:[function(require,module,exports){
// public
module.exports = provideDump;

// implementation
function provideDump(obj) {
  obj.dump = function () {
    var ngMock = obj.angular && obj.angular.mock ? obj.angular.mock : null;
    obj.__karma__.info({
      dump: _.map(arguments, function (value) {
        return ngMock ? ngMock.dump(value) : value;
      })
    });
  };
}

},{}],6:[function(require,module,exports){
// public
module.exports = runBenchmarks;

// implementation
function runBenchmarks(obj, suites) {
  runNextBenchmark();

  function runNextBenchmark() {
    if (suites.length > 0) {
      runSuite(suites.shift());
    } else {
      onComplete();
    }
  }

  function onComplete() {
    obj.__karma__.complete({
      coverage: obj.__coverage__
    });
  }

  function runSuite(suite) {
    var errors = [];
    suite
      .on('cycle', function (e) {
        obj.__karma__.result({
          id: e.target.id,
          description: suite.name + ': ' + e.target.name,
          suite: [],
          success: errors.length === 0,
          log: errors,
          skipped: false,
          time: e.target.stats.mean * 1000,
          benchmark: {
            suite: suite.name,
            name: e.target.name,
            stats: e.target.stats,
            count: e.target.count,
            cycles: e.target.cycles,
            error: e.target.error,
            hz: e.target.hz
          }
        });
        errors = [];
      })
      .on('abort error', function (e) {
        errors.push(e.target.error.toString());
      })
      .on('complete', runNextBenchmark)
      .run({
        async: true
      });
  }
}

},{}],7:[function(require,module,exports){
// public
module.exports = {
  addBenchmark: addBenchmark,
  addSuite: addSuite,
  getSuites: getSuites
};

// implementation
var benchmarks = [];
var suites = [];

function addBenchmark(benchmark, hasSuite) {
  benchmark.hasSuite = Boolean(hasSuite);
  benchmarks.push(benchmark);
  return benchmark;
}

function addSuite(suite) {
  suites.push(suite);
  return suite;
}

function getSuites() {
  return suites;
}

},{}],8:[function(require,module,exports){
(function (global){
// 3rd party modules
var Benchmark = (typeof window !== "undefined" ? window['Benchmark'] : typeof global !== "undefined" ? global['Benchmark'] : null);

// modules
var construct = require('./lib/construct');
var store = require('./store');

// public
WrappedBenchmark.Suite = WrappedSuite;
module.exports = WrappedBenchmark;

// implementation
var Suite = Benchmark.Suite;

function WrappedBenchmark(name, fn, options) {
  var benchmark = construct(Benchmark, name, fn, options);
  return store.addBenchmark(benchmark, false);
}

function WrappedSuite(name, options) {
  var suite = construct(Suite, name, options);
  suite.add = addBenchmark;
  store.addSuite(suite);
  return suite;
}

function addBenchmark(name, fn, options) {
  var suite = Suite.prototype.add.call(this, name, fn, options);
  var benchmark = suite[suite.length - 1];
  store.addBenchmark(benchmark, true);
  return suite;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/construct":1,"./store":7}]},{},[2]);
