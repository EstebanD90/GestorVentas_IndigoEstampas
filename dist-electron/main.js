import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import fs$2 from "fs";
import Database from "better-sqlite3";
import require$$0 from "constants";
import require$$0$1 from "stream";
import require$$4 from "util";
import require$$5 from "assert";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
const APP_NAME = "INDIGO ESTAMPAS";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var fs$1 = {};
var universalify = {};
var hasRequiredUniversalify;
function requireUniversalify() {
  if (hasRequiredUniversalify) return universalify;
  hasRequiredUniversalify = 1;
  universalify.fromCallback = function(fn) {
    return Object.defineProperty(function(...args) {
      if (typeof args[args.length - 1] === "function") fn.apply(this, args);
      else {
        return new Promise((resolve, reject) => {
          args.push((err, res) => err != null ? reject(err) : resolve(res));
          fn.apply(this, args);
        });
      }
    }, "name", { value: fn.name });
  };
  universalify.fromPromise = function(fn) {
    return Object.defineProperty(function(...args) {
      const cb = args[args.length - 1];
      if (typeof cb !== "function") return fn.apply(this, args);
      else {
        args.pop();
        fn.apply(this, args).then((r) => cb(null, r), cb);
      }
    }, "name", { value: fn.name });
  };
  return universalify;
}
var polyfills;
var hasRequiredPolyfills;
function requirePolyfills() {
  if (hasRequiredPolyfills) return polyfills;
  hasRequiredPolyfills = 1;
  var constants = require$$0;
  var origCwd = process.cwd;
  var cwd = null;
  var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    if (!cwd)
      cwd = origCwd.call(process);
    return cwd;
  };
  try {
    process.cwd();
  } catch (er) {
  }
  if (typeof process.chdir === "function") {
    var chdir = process.chdir;
    process.chdir = function(d) {
      cwd = null;
      chdir.call(process, d);
    };
    if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
  }
  polyfills = patch;
  function patch(fs2) {
    if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
      patchLchmod(fs2);
    }
    if (!fs2.lutimes) {
      patchLutimes(fs2);
    }
    fs2.chown = chownFix(fs2.chown);
    fs2.fchown = chownFix(fs2.fchown);
    fs2.lchown = chownFix(fs2.lchown);
    fs2.chmod = chmodFix(fs2.chmod);
    fs2.fchmod = chmodFix(fs2.fchmod);
    fs2.lchmod = chmodFix(fs2.lchmod);
    fs2.chownSync = chownFixSync(fs2.chownSync);
    fs2.fchownSync = chownFixSync(fs2.fchownSync);
    fs2.lchownSync = chownFixSync(fs2.lchownSync);
    fs2.chmodSync = chmodFixSync(fs2.chmodSync);
    fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
    fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
    fs2.stat = statFix(fs2.stat);
    fs2.fstat = statFix(fs2.fstat);
    fs2.lstat = statFix(fs2.lstat);
    fs2.statSync = statFixSync(fs2.statSync);
    fs2.fstatSync = statFixSync(fs2.fstatSync);
    fs2.lstatSync = statFixSync(fs2.lstatSync);
    if (fs2.chmod && !fs2.lchmod) {
      fs2.lchmod = function(path2, mode, cb) {
        if (cb) process.nextTick(cb);
      };
      fs2.lchmodSync = function() {
      };
    }
    if (fs2.chown && !fs2.lchown) {
      fs2.lchown = function(path2, uid, gid, cb) {
        if (cb) process.nextTick(cb);
      };
      fs2.lchownSync = function() {
      };
    }
    if (platform === "win32") {
      fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : (function(fs$rename) {
        function rename(from, to, cb) {
          var start = Date.now();
          var backoff = 0;
          fs$rename(from, to, function CB(er) {
            if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
              setTimeout(function() {
                fs2.stat(to, function(stater, st) {
                  if (stater && stater.code === "ENOENT")
                    fs$rename(from, to, CB);
                  else
                    cb(er);
                });
              }, backoff);
              if (backoff < 100)
                backoff += 10;
              return;
            }
            if (cb) cb(er);
          });
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
        return rename;
      })(fs2.rename);
    }
    fs2.read = typeof fs2.read !== "function" ? fs2.read : (function(fs$read) {
      function read(fd, buffer, offset, length, position, callback_) {
        var callback;
        if (callback_ && typeof callback_ === "function") {
          var eagCounter = 0;
          callback = function(er, _, __) {
            if (er && er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
            }
            callback_.apply(this, arguments);
          };
        }
        return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
      return read;
    })(fs2.read);
    fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ (function(fs$readSync) {
      return function(fd, buffer, offset, length, position) {
        var eagCounter = 0;
        while (true) {
          try {
            return fs$readSync.call(fs2, fd, buffer, offset, length, position);
          } catch (er) {
            if (er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              continue;
            }
            throw er;
          }
        }
      };
    })(fs2.readSync);
    function patchLchmod(fs22) {
      fs22.lchmod = function(path2, mode, callback) {
        fs22.open(
          path2,
          constants.O_WRONLY | constants.O_SYMLINK,
          mode,
          function(err, fd) {
            if (err) {
              if (callback) callback(err);
              return;
            }
            fs22.fchmod(fd, mode, function(err2) {
              fs22.close(fd, function(err22) {
                if (callback) callback(err2 || err22);
              });
            });
          }
        );
      };
      fs22.lchmodSync = function(path2, mode) {
        var fd = fs22.openSync(path2, constants.O_WRONLY | constants.O_SYMLINK, mode);
        var threw = true;
        var ret;
        try {
          ret = fs22.fchmodSync(fd, mode);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs22.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs22.closeSync(fd);
          }
        }
        return ret;
      };
    }
    function patchLutimes(fs22) {
      if (constants.hasOwnProperty("O_SYMLINK") && fs22.futimes) {
        fs22.lutimes = function(path2, at, mt, cb) {
          fs22.open(path2, constants.O_SYMLINK, function(er, fd) {
            if (er) {
              if (cb) cb(er);
              return;
            }
            fs22.futimes(fd, at, mt, function(er2) {
              fs22.close(fd, function(er22) {
                if (cb) cb(er2 || er22);
              });
            });
          });
        };
        fs22.lutimesSync = function(path2, at, mt) {
          var fd = fs22.openSync(path2, constants.O_SYMLINK);
          var ret;
          var threw = true;
          try {
            ret = fs22.futimesSync(fd, at, mt);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs22.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs22.closeSync(fd);
            }
          }
          return ret;
        };
      } else if (fs22.futimes) {
        fs22.lutimes = function(_a, _b, _c, cb) {
          if (cb) process.nextTick(cb);
        };
        fs22.lutimesSync = function() {
        };
      }
    }
    function chmodFix(orig) {
      if (!orig) return orig;
      return function(target, mode, cb) {
        return orig.call(fs2, target, mode, function(er) {
          if (chownErOk(er)) er = null;
          if (cb) cb.apply(this, arguments);
        });
      };
    }
    function chmodFixSync(orig) {
      if (!orig) return orig;
      return function(target, mode) {
        try {
          return orig.call(fs2, target, mode);
        } catch (er) {
          if (!chownErOk(er)) throw er;
        }
      };
    }
    function chownFix(orig) {
      if (!orig) return orig;
      return function(target, uid, gid, cb) {
        return orig.call(fs2, target, uid, gid, function(er) {
          if (chownErOk(er)) er = null;
          if (cb) cb.apply(this, arguments);
        });
      };
    }
    function chownFixSync(orig) {
      if (!orig) return orig;
      return function(target, uid, gid) {
        try {
          return orig.call(fs2, target, uid, gid);
        } catch (er) {
          if (!chownErOk(er)) throw er;
        }
      };
    }
    function statFix(orig) {
      if (!orig) return orig;
      return function(target, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = null;
        }
        function callback(er, stats) {
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          if (cb) cb.apply(this, arguments);
        }
        return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
      };
    }
    function statFixSync(orig) {
      if (!orig) return orig;
      return function(target, options) {
        var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
        if (stats) {
          if (stats.uid < 0) stats.uid += 4294967296;
          if (stats.gid < 0) stats.gid += 4294967296;
        }
        return stats;
      };
    }
    function chownErOk(er) {
      if (!er)
        return true;
      if (er.code === "ENOSYS")
        return true;
      var nonroot = !process.getuid || process.getuid() !== 0;
      if (nonroot) {
        if (er.code === "EINVAL" || er.code === "EPERM")
          return true;
      }
      return false;
    }
  }
  return polyfills;
}
var legacyStreams;
var hasRequiredLegacyStreams;
function requireLegacyStreams() {
  if (hasRequiredLegacyStreams) return legacyStreams;
  hasRequiredLegacyStreams = 1;
  var Stream = require$$0$1.Stream;
  legacyStreams = legacy;
  function legacy(fs2) {
    return {
      ReadStream,
      WriteStream
    };
    function ReadStream(path2, options) {
      if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
      Stream.call(this);
      var self2 = this;
      this.path = path2;
      this.fd = null;
      this.readable = true;
      this.paused = false;
      this.flags = "r";
      this.mode = 438;
      this.bufferSize = 64 * 1024;
      options = options || {};
      var keys = Object.keys(options);
      for (var index2 = 0, length = keys.length; index2 < length; index2++) {
        var key = keys[index2];
        this[key] = options[key];
      }
      if (this.encoding) this.setEncoding(this.encoding);
      if (this.start !== void 0) {
        if ("number" !== typeof this.start) {
          throw TypeError("start must be a Number");
        }
        if (this.end === void 0) {
          this.end = Infinity;
        } else if ("number" !== typeof this.end) {
          throw TypeError("end must be a Number");
        }
        if (this.start > this.end) {
          throw new Error("start must be <= end");
        }
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          self2._read();
        });
        return;
      }
      fs2.open(this.path, this.flags, this.mode, function(err, fd) {
        if (err) {
          self2.emit("error", err);
          self2.readable = false;
          return;
        }
        self2.fd = fd;
        self2.emit("open", fd);
        self2._read();
      });
    }
    function WriteStream(path2, options) {
      if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
      Stream.call(this);
      this.path = path2;
      this.fd = null;
      this.writable = true;
      this.flags = "w";
      this.encoding = "binary";
      this.mode = 438;
      this.bytesWritten = 0;
      options = options || {};
      var keys = Object.keys(options);
      for (var index2 = 0, length = keys.length; index2 < length; index2++) {
        var key = keys[index2];
        this[key] = options[key];
      }
      if (this.start !== void 0) {
        if ("number" !== typeof this.start) {
          throw TypeError("start must be a Number");
        }
        if (this.start < 0) {
          throw new Error("start must be >= zero");
        }
        this.pos = this.start;
      }
      this.busy = false;
      this._queue = [];
      if (this.fd === null) {
        this._open = fs2.open;
        this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
        this.flush();
      }
    }
  }
  return legacyStreams;
}
var clone_1;
var hasRequiredClone;
function requireClone() {
  if (hasRequiredClone) return clone_1;
  hasRequiredClone = 1;
  clone_1 = clone;
  var getPrototypeOf = Object.getPrototypeOf || function(obj) {
    return obj.__proto__;
  };
  function clone(obj) {
    if (obj === null || typeof obj !== "object")
      return obj;
    if (obj instanceof Object)
      var copy2 = { __proto__: getPrototypeOf(obj) };
    else
      var copy2 = /* @__PURE__ */ Object.create(null);
    Object.getOwnPropertyNames(obj).forEach(function(key) {
      Object.defineProperty(copy2, key, Object.getOwnPropertyDescriptor(obj, key));
    });
    return copy2;
  }
  return clone_1;
}
var gracefulFs;
var hasRequiredGracefulFs;
function requireGracefulFs() {
  if (hasRequiredGracefulFs) return gracefulFs;
  hasRequiredGracefulFs = 1;
  var fs2 = fs$2;
  var polyfills2 = requirePolyfills();
  var legacy = requireLegacyStreams();
  var clone = requireClone();
  var util = require$$4;
  var gracefulQueue;
  var previousSymbol;
  if (typeof Symbol === "function" && typeof Symbol.for === "function") {
    gracefulQueue = /* @__PURE__ */ Symbol.for("graceful-fs.queue");
    previousSymbol = /* @__PURE__ */ Symbol.for("graceful-fs.previous");
  } else {
    gracefulQueue = "___graceful-fs.queue";
    previousSymbol = "___graceful-fs.previous";
  }
  function noop() {
  }
  function publishQueue(context, queue2) {
    Object.defineProperty(context, gracefulQueue, {
      get: function() {
        return queue2;
      }
    });
  }
  var debug = noop;
  if (util.debuglog)
    debug = util.debuglog("gfs4");
  else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
    debug = function() {
      var m = util.format.apply(util, arguments);
      m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
      console.error(m);
    };
  if (!fs2[gracefulQueue]) {
    var queue = commonjsGlobal[gracefulQueue] || [];
    publishQueue(fs2, queue);
    fs2.close = (function(fs$close) {
      function close(fd, cb) {
        return fs$close.call(fs2, fd, function(err) {
          if (!err) {
            resetQueue();
          }
          if (typeof cb === "function")
            cb.apply(this, arguments);
        });
      }
      Object.defineProperty(close, previousSymbol, {
        value: fs$close
      });
      return close;
    })(fs2.close);
    fs2.closeSync = (function(fs$closeSync) {
      function closeSync(fd) {
        fs$closeSync.apply(fs2, arguments);
        resetQueue();
      }
      Object.defineProperty(closeSync, previousSymbol, {
        value: fs$closeSync
      });
      return closeSync;
    })(fs2.closeSync);
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
      process.on("exit", function() {
        debug(fs2[gracefulQueue]);
        require$$5.equal(fs2[gracefulQueue].length, 0);
      });
    }
  }
  if (!commonjsGlobal[gracefulQueue]) {
    publishQueue(commonjsGlobal, fs2[gracefulQueue]);
  }
  gracefulFs = patch(clone(fs2));
  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
    gracefulFs = patch(fs2);
    fs2.__patched = true;
  }
  function patch(fs22) {
    polyfills2(fs22);
    fs22.gracefulify = patch;
    fs22.createReadStream = createReadStream;
    fs22.createWriteStream = createWriteStream;
    var fs$readFile = fs22.readFile;
    fs22.readFile = readFile;
    function readFile(path2, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$readFile(path2, options, cb);
      function go$readFile(path22, options2, cb2, startTime) {
        return fs$readFile(path22, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$readFile, [path22, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$writeFile = fs22.writeFile;
    fs22.writeFile = writeFile;
    function writeFile(path2, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$writeFile(path2, data, options, cb);
      function go$writeFile(path22, data2, options2, cb2, startTime) {
        return fs$writeFile(path22, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$writeFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$appendFile = fs22.appendFile;
    if (fs$appendFile)
      fs22.appendFile = appendFile;
    function appendFile(path2, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$appendFile(path2, data, options, cb);
      function go$appendFile(path22, data2, options2, cb2, startTime) {
        return fs$appendFile(path22, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$appendFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$copyFile = fs22.copyFile;
    if (fs$copyFile)
      fs22.copyFile = copyFile;
    function copyFile(src, dest, flags, cb) {
      if (typeof flags === "function") {
        cb = flags;
        flags = 0;
      }
      return go$copyFile(src, dest, flags, cb);
      function go$copyFile(src2, dest2, flags2, cb2, startTime) {
        return fs$copyFile(src2, dest2, flags2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$readdir = fs22.readdir;
    fs22.readdir = readdir;
    var noReaddirOptionVersions = /^v[0-5]\./;
    function readdir(path2, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path22, options2, cb2, startTime) {
        return fs$readdir(path22, fs$readdirCallback(
          path22,
          options2,
          cb2,
          startTime
        ));
      } : function go$readdir2(path22, options2, cb2, startTime) {
        return fs$readdir(path22, options2, fs$readdirCallback(
          path22,
          options2,
          cb2,
          startTime
        ));
      };
      return go$readdir(path2, options, cb);
      function fs$readdirCallback(path22, options2, cb2, startTime) {
        return function(err, files) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([
              go$readdir,
              [path22, options2, cb2],
              err,
              startTime || Date.now(),
              Date.now()
            ]);
          else {
            if (files && files.sort)
              files.sort();
            if (typeof cb2 === "function")
              cb2.call(this, err, files);
          }
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var legStreams = legacy(fs22);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs22.ReadStream;
    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs22.WriteStream;
    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }
    Object.defineProperty(fs22, "ReadStream", {
      get: function() {
        return ReadStream;
      },
      set: function(val) {
        ReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(fs22, "WriteStream", {
      get: function() {
        return WriteStream;
      },
      set: function(val) {
        WriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileReadStream = ReadStream;
    Object.defineProperty(fs22, "FileReadStream", {
      get: function() {
        return FileReadStream;
      },
      set: function(val) {
        FileReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs22, "FileWriteStream", {
      get: function() {
        return FileWriteStream;
      },
      set: function(val) {
        FileWriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    function ReadStream(path2, options) {
      if (this instanceof ReadStream)
        return fs$ReadStream.apply(this, arguments), this;
      else
        return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          if (that.autoClose)
            that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
          that.read();
        }
      });
    }
    function WriteStream(path2, options) {
      if (this instanceof WriteStream)
        return fs$WriteStream.apply(this, arguments), this;
      else
        return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
        }
      });
    }
    function createReadStream(path2, options) {
      return new fs22.ReadStream(path2, options);
    }
    function createWriteStream(path2, options) {
      return new fs22.WriteStream(path2, options);
    }
    var fs$open = fs22.open;
    fs22.open = open;
    function open(path2, flags, mode, cb) {
      if (typeof mode === "function")
        cb = mode, mode = null;
      return go$open(path2, flags, mode, cb);
      function go$open(path22, flags2, mode2, cb2, startTime) {
        return fs$open(path22, flags2, mode2, function(err, fd) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$open, [path22, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    return fs22;
  }
  function enqueue(elem) {
    debug("ENQUEUE", elem[0].name, elem[1]);
    fs2[gracefulQueue].push(elem);
    retry();
  }
  var retryTimer;
  function resetQueue() {
    var now = Date.now();
    for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
      if (fs2[gracefulQueue][i].length > 2) {
        fs2[gracefulQueue][i][3] = now;
        fs2[gracefulQueue][i][4] = now;
      }
    }
    retry();
  }
  function retry() {
    clearTimeout(retryTimer);
    retryTimer = void 0;
    if (fs2[gracefulQueue].length === 0)
      return;
    var elem = fs2[gracefulQueue].shift();
    var fn = elem[0];
    var args = elem[1];
    var err = elem[2];
    var startTime = elem[3];
    var lastTime = elem[4];
    if (startTime === void 0) {
      debug("RETRY", fn.name, args);
      fn.apply(null, args);
    } else if (Date.now() - startTime >= 6e4) {
      debug("TIMEOUT", fn.name, args);
      var cb = args.pop();
      if (typeof cb === "function")
        cb.call(null, err);
    } else {
      var sinceAttempt = Date.now() - lastTime;
      var sinceStart = Math.max(lastTime - startTime, 1);
      var desiredDelay = Math.min(sinceStart * 1.2, 100);
      if (sinceAttempt >= desiredDelay) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args.concat([startTime]));
      } else {
        fs2[gracefulQueue].push(elem);
      }
    }
    if (retryTimer === void 0) {
      retryTimer = setTimeout(retry, 0);
    }
  }
  return gracefulFs;
}
var hasRequiredFs;
function requireFs() {
  if (hasRequiredFs) return fs$1;
  hasRequiredFs = 1;
  (function(exports$1) {
    const u = requireUniversalify().fromCallback;
    const fs2 = requireGracefulFs();
    const api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs2[key] === "function";
    });
    Object.assign(exports$1, fs2);
    api.forEach((method) => {
      exports$1[method] = u(fs2[method]);
    });
    exports$1.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs2.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs2.exists(filename, resolve);
      });
    };
    exports$1.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs2.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports$1.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports$1.readv = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.readv(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports$1.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs2.realpath.native === "function") {
      exports$1.realpath.native = u(fs2.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  })(fs$1);
  return fs$1;
}
var makeDir = {};
var utils$1 = {};
var hasRequiredUtils$1;
function requireUtils$1() {
  if (hasRequiredUtils$1) return utils$1;
  hasRequiredUtils$1 = 1;
  const path$1 = path;
  utils$1.checkPath = function checkPath(pth) {
    if (process.platform === "win32") {
      const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$1.parse(pth).root, ""));
      if (pathHasInvalidWinCharacters) {
        const error = new Error(`Path contains invalid characters: ${pth}`);
        error.code = "EINVAL";
        throw error;
      }
    }
  };
  return utils$1;
}
var hasRequiredMakeDir;
function requireMakeDir() {
  if (hasRequiredMakeDir) return makeDir;
  hasRequiredMakeDir = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const { checkPath } = /* @__PURE__ */ requireUtils$1();
  const getMode = (options) => {
    const defaults = { mode: 511 };
    if (typeof options === "number") return options;
    return { ...defaults, ...options }.mode;
  };
  makeDir.makeDir = async (dir, options) => {
    checkPath(dir);
    return fs2.mkdir(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  makeDir.makeDirSync = (dir, options) => {
    checkPath(dir);
    return fs2.mkdirSync(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  return makeDir;
}
var mkdirs;
var hasRequiredMkdirs;
function requireMkdirs() {
  if (hasRequiredMkdirs) return mkdirs;
  hasRequiredMkdirs = 1;
  const u = requireUniversalify().fromPromise;
  const { makeDir: _makeDir, makeDirSync } = /* @__PURE__ */ requireMakeDir();
  const makeDir2 = u(_makeDir);
  mkdirs = {
    mkdirs: makeDir2,
    mkdirsSync: makeDirSync,
    // alias
    mkdirp: makeDir2,
    mkdirpSync: makeDirSync,
    ensureDir: makeDir2,
    ensureDirSync: makeDirSync
  };
  return mkdirs;
}
var pathExists_1;
var hasRequiredPathExists;
function requirePathExists() {
  if (hasRequiredPathExists) return pathExists_1;
  hasRequiredPathExists = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  function pathExists(path2) {
    return fs2.access(path2).then(() => true).catch(() => false);
  }
  pathExists_1 = {
    pathExists: u(pathExists),
    pathExistsSync: fs2.existsSync
  };
  return pathExists_1;
}
var utimes;
var hasRequiredUtimes;
function requireUtimes() {
  if (hasRequiredUtimes) return utimes;
  hasRequiredUtimes = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const u = requireUniversalify().fromPromise;
  async function utimesMillis(path2, atime, mtime) {
    const fd = await fs2.open(path2, "r+");
    let closeErr = null;
    try {
      await fs2.futimes(fd, atime, mtime);
    } finally {
      try {
        await fs2.close(fd);
      } catch (e) {
        closeErr = e;
      }
    }
    if (closeErr) {
      throw closeErr;
    }
  }
  function utimesMillisSync(path2, atime, mtime) {
    const fd = fs2.openSync(path2, "r+");
    fs2.futimesSync(fd, atime, mtime);
    return fs2.closeSync(fd);
  }
  utimes = {
    utimesMillis: u(utimesMillis),
    utimesMillisSync
  };
  return utimes;
}
var stat;
var hasRequiredStat;
function requireStat() {
  if (hasRequiredStat) return stat;
  hasRequiredStat = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path$1 = path;
  const u = requireUniversalify().fromPromise;
  function getStats(src, dest, opts) {
    const statFunc = opts.dereference ? (file2) => fs2.stat(file2, { bigint: true }) : (file2) => fs2.lstat(file2, { bigint: true });
    return Promise.all([
      statFunc(src),
      statFunc(dest).catch((err) => {
        if (err.code === "ENOENT") return null;
        throw err;
      })
    ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
  }
  function getStatsSync(src, dest, opts) {
    let destStat;
    const statFunc = opts.dereference ? (file2) => fs2.statSync(file2, { bigint: true }) : (file2) => fs2.lstatSync(file2, { bigint: true });
    const srcStat = statFunc(src);
    try {
      destStat = statFunc(dest);
    } catch (err) {
      if (err.code === "ENOENT") return { srcStat, destStat: null };
      throw err;
    }
    return { srcStat, destStat };
  }
  async function checkPaths(src, dest, funcName, opts) {
    const { srcStat, destStat } = await getStats(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path$1.basename(src);
        const destBaseName = path$1.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  function checkPathsSync(src, dest, funcName, opts) {
    const { srcStat, destStat } = getStatsSync(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path$1.basename(src);
        const destBaseName = path$1.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  async function checkParentPaths(src, srcStat, dest, funcName) {
    const srcParent = path$1.resolve(path$1.dirname(src));
    const destParent = path$1.resolve(path$1.dirname(dest));
    if (destParent === srcParent || destParent === path$1.parse(destParent).root) return;
    let destStat;
    try {
      destStat = await fs2.stat(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPaths(src, srcStat, destParent, funcName);
  }
  function checkParentPathsSync(src, srcStat, dest, funcName) {
    const srcParent = path$1.resolve(path$1.dirname(src));
    const destParent = path$1.resolve(path$1.dirname(dest));
    if (destParent === srcParent || destParent === path$1.parse(destParent).root) return;
    let destStat;
    try {
      destStat = fs2.statSync(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPathsSync(src, srcStat, destParent, funcName);
  }
  function areIdentical(srcStat, destStat) {
    return destStat.ino !== void 0 && destStat.dev !== void 0 && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
  }
  function isSrcSubdir(src, dest) {
    const srcArr = path$1.resolve(src).split(path$1.sep).filter((i) => i);
    const destArr = path$1.resolve(dest).split(path$1.sep).filter((i) => i);
    return srcArr.every((cur, i) => destArr[i] === cur);
  }
  function errMsg(src, dest, funcName) {
    return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
  }
  stat = {
    // checkPaths
    checkPaths: u(checkPaths),
    checkPathsSync,
    // checkParent
    checkParentPaths: u(checkParentPaths),
    checkParentPathsSync,
    // Misc
    isSrcSubdir,
    areIdentical
  };
  return stat;
}
var async;
var hasRequiredAsync;
function requireAsync() {
  if (hasRequiredAsync) return async;
  hasRequiredAsync = 1;
  async function asyncIteratorConcurrentProcess(iterator, fn) {
    const promises = [];
    for await (const item of iterator) {
      promises.push(
        fn(item).then(
          () => null,
          (err) => err ?? new Error("unknown error")
        )
      );
    }
    await Promise.all(
      promises.map(
        (promise) => promise.then((possibleErr) => {
          if (possibleErr !== null) throw possibleErr;
        })
      )
    );
  }
  async = {
    asyncIteratorConcurrentProcess
  };
  return async;
}
var copy_1;
var hasRequiredCopy$1;
function requireCopy$1() {
  if (hasRequiredCopy$1) return copy_1;
  hasRequiredCopy$1 = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path$1 = path;
  const { mkdirs: mkdirs2 } = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { utimesMillis } = /* @__PURE__ */ requireUtimes();
  const stat2 = /* @__PURE__ */ requireStat();
  const { asyncIteratorConcurrentProcess } = /* @__PURE__ */ requireAsync();
  async function copy2(src, dest, opts = {}) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(
        "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
        "Warning",
        "fs-extra-WARN0001"
      );
    }
    const { srcStat, destStat } = await stat2.checkPaths(src, dest, "copy", opts);
    await stat2.checkParentPaths(src, srcStat, dest, "copy");
    const include = await runFilter(src, dest, opts);
    if (!include) return;
    const destParent = path$1.dirname(dest);
    const dirExists = await pathExists(destParent);
    if (!dirExists) {
      await mkdirs2(destParent);
    }
    await getStatsAndPerformCopy(destStat, src, dest, opts);
  }
  async function runFilter(src, dest, opts) {
    if (!opts.filter) return true;
    return opts.filter(src, dest);
  }
  async function getStatsAndPerformCopy(destStat, src, dest, opts) {
    const statFn = opts.dereference ? fs2.stat : fs2.lstat;
    const srcStat = await statFn(src);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
    if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
    if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
    if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
    if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  async function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat) return copyFile(srcStat, src, dest, opts);
    if (opts.overwrite) {
      await fs2.unlink(dest);
      return copyFile(srcStat, src, dest, opts);
    }
    if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  async function copyFile(srcStat, src, dest, opts) {
    await fs2.copyFile(src, dest);
    if (opts.preserveTimestamps) {
      if (fileIsNotWritable(srcStat.mode)) {
        await makeFileWritable(dest, srcStat.mode);
      }
      const updatedSrcStat = await fs2.stat(src);
      await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    return fs2.chmod(dest, srcStat.mode);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return fs2.chmod(dest, srcMode | 128);
  }
  async function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) {
      await fs2.mkdir(dest);
    }
    await asyncIteratorConcurrentProcess(await fs2.opendir(src), async (item) => {
      const srcItem = path$1.join(src, item.name);
      const destItem = path$1.join(dest, item.name);
      const include = await runFilter(srcItem, destItem, opts);
      if (include) {
        const { destStat: destStat2 } = await stat2.checkPaths(srcItem, destItem, "copy", opts);
        await getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
      }
    });
    if (!destStat) {
      await fs2.chmod(dest, srcStat.mode);
    }
  }
  async function onLink(destStat, src, dest, opts) {
    let resolvedSrc = await fs2.readlink(src);
    if (opts.dereference) {
      resolvedSrc = path$1.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs2.symlink(resolvedSrc, dest);
    }
    let resolvedDest = null;
    try {
      resolvedDest = await fs2.readlink(dest);
    } catch (e) {
      if (e.code === "EINVAL" || e.code === "UNKNOWN") return fs2.symlink(resolvedSrc, dest);
      throw e;
    }
    if (opts.dereference) {
      resolvedDest = path$1.resolve(process.cwd(), resolvedDest);
    }
    if (resolvedSrc !== resolvedDest) {
      if (stat2.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat2.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
    }
    await fs2.unlink(dest);
    return fs2.symlink(resolvedSrc, dest);
  }
  copy_1 = copy2;
  return copy_1;
}
var copySync_1;
var hasRequiredCopySync;
function requireCopySync() {
  if (hasRequiredCopySync) return copySync_1;
  hasRequiredCopySync = 1;
  const fs2 = requireGracefulFs();
  const path$1 = path;
  const mkdirsSync = requireMkdirs().mkdirsSync;
  const utimesMillisSync = requireUtimes().utimesMillisSync;
  const stat2 = /* @__PURE__ */ requireStat();
  function copySync(src, dest, opts) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts = opts || {};
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(
        "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
        "Warning",
        "fs-extra-WARN0002"
      );
    }
    const { srcStat, destStat } = stat2.checkPathsSync(src, dest, "copy", opts);
    stat2.checkParentPathsSync(src, srcStat, dest, "copy");
    if (opts.filter && !opts.filter(src, dest)) return;
    const destParent = path$1.dirname(dest);
    if (!fs2.existsSync(destParent)) mkdirsSync(destParent);
    return getStats(destStat, src, dest, opts);
  }
  function getStats(destStat, src, dest, opts) {
    const statSync = opts.dereference ? fs2.statSync : fs2.lstatSync;
    const srcStat = statSync(src);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
    else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
    else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
    else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat) return copyFile(srcStat, src, dest, opts);
    return mayCopyFile(srcStat, src, dest, opts);
  }
  function mayCopyFile(srcStat, src, dest, opts) {
    if (opts.overwrite) {
      fs2.unlinkSync(dest);
      return copyFile(srcStat, src, dest, opts);
    } else if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  function copyFile(srcStat, src, dest, opts) {
    fs2.copyFileSync(src, dest);
    if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
    return setDestMode(dest, srcStat.mode);
  }
  function handleTimestamps(srcMode, src, dest) {
    if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
    return setDestTimestamps(src, dest);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return setDestMode(dest, srcMode | 128);
  }
  function setDestMode(dest, srcMode) {
    return fs2.chmodSync(dest, srcMode);
  }
  function setDestTimestamps(src, dest) {
    const updatedSrcStat = fs2.statSync(src);
    return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }
  function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
    return copyDir(src, dest, opts);
  }
  function mkDirAndCopy(srcMode, src, dest, opts) {
    fs2.mkdirSync(dest);
    copyDir(src, dest, opts);
    return setDestMode(dest, srcMode);
  }
  function copyDir(src, dest, opts) {
    const dir = fs2.opendirSync(src);
    try {
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        copyDirItem(dirent.name, src, dest, opts);
      }
    } finally {
      dir.closeSync();
    }
  }
  function copyDirItem(item, src, dest, opts) {
    const srcItem = path$1.join(src, item);
    const destItem = path$1.join(dest, item);
    if (opts.filter && !opts.filter(srcItem, destItem)) return;
    const { destStat } = stat2.checkPathsSync(srcItem, destItem, "copy", opts);
    return getStats(destStat, srcItem, destItem, opts);
  }
  function onLink(destStat, src, dest, opts) {
    let resolvedSrc = fs2.readlinkSync(src);
    if (opts.dereference) {
      resolvedSrc = path$1.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs2.symlinkSync(resolvedSrc, dest);
    } else {
      let resolvedDest;
      try {
        resolvedDest = fs2.readlinkSync(dest);
      } catch (err) {
        if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs2.symlinkSync(resolvedSrc, dest);
        throw err;
      }
      if (opts.dereference) {
        resolvedDest = path$1.resolve(process.cwd(), resolvedDest);
      }
      if (resolvedSrc !== resolvedDest) {
        if (stat2.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat2.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
      }
      return copyLink(resolvedSrc, dest);
    }
  }
  function copyLink(resolvedSrc, dest) {
    fs2.unlinkSync(dest);
    return fs2.symlinkSync(resolvedSrc, dest);
  }
  copySync_1 = copySync;
  return copySync_1;
}
var copy;
var hasRequiredCopy;
function requireCopy() {
  if (hasRequiredCopy) return copy;
  hasRequiredCopy = 1;
  const u = requireUniversalify().fromPromise;
  copy = {
    copy: u(/* @__PURE__ */ requireCopy$1()),
    copySync: /* @__PURE__ */ requireCopySync()
  };
  return copy;
}
var remove_1;
var hasRequiredRemove;
function requireRemove() {
  if (hasRequiredRemove) return remove_1;
  hasRequiredRemove = 1;
  const fs2 = requireGracefulFs();
  const u = requireUniversalify().fromCallback;
  function remove(path2, callback) {
    fs2.rm(path2, { recursive: true, force: true }, callback);
  }
  function removeSync(path2) {
    fs2.rmSync(path2, { recursive: true, force: true });
  }
  remove_1 = {
    remove: u(remove),
    removeSync
  };
  return remove_1;
}
var empty;
var hasRequiredEmpty;
function requireEmpty() {
  if (hasRequiredEmpty) return empty;
  hasRequiredEmpty = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  const path$1 = path;
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const remove = /* @__PURE__ */ requireRemove();
  const emptyDir = u(async function emptyDir2(dir) {
    let items;
    try {
      items = await fs2.readdir(dir);
    } catch {
      return mkdir.mkdirs(dir);
    }
    return Promise.all(items.map((item) => remove.remove(path$1.join(dir, item))));
  });
  function emptyDirSync(dir) {
    let items;
    try {
      items = fs2.readdirSync(dir);
    } catch {
      return mkdir.mkdirsSync(dir);
    }
    items.forEach((item) => {
      item = path$1.join(dir, item);
      remove.removeSync(item);
    });
  }
  empty = {
    emptyDirSync,
    emptydirSync: emptyDirSync,
    emptyDir,
    emptydir: emptyDir
  };
  return empty;
}
var file;
var hasRequiredFile;
function requireFile() {
  if (hasRequiredFile) return file;
  hasRequiredFile = 1;
  const u = requireUniversalify().fromPromise;
  const path$1 = path;
  const fs2 = /* @__PURE__ */ requireFs();
  const mkdir = /* @__PURE__ */ requireMkdirs();
  async function createFile(file2) {
    let stats;
    try {
      stats = await fs2.stat(file2);
    } catch {
    }
    if (stats && stats.isFile()) return;
    const dir = path$1.dirname(file2);
    let dirStats = null;
    try {
      dirStats = await fs2.stat(dir);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir.mkdirs(dir);
        await fs2.writeFile(file2, "");
        return;
      } else {
        throw err;
      }
    }
    if (dirStats.isDirectory()) {
      await fs2.writeFile(file2, "");
    } else {
      await fs2.readdir(dir);
    }
  }
  function createFileSync(file2) {
    let stats;
    try {
      stats = fs2.statSync(file2);
    } catch {
    }
    if (stats && stats.isFile()) return;
    const dir = path$1.dirname(file2);
    try {
      if (!fs2.statSync(dir).isDirectory()) {
        fs2.readdirSync(dir);
      }
    } catch (err) {
      if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
      else throw err;
    }
    fs2.writeFileSync(file2, "");
  }
  file = {
    createFile: u(createFile),
    createFileSync
  };
  return file;
}
var link;
var hasRequiredLink;
function requireLink() {
  if (hasRequiredLink) return link;
  hasRequiredLink = 1;
  const u = requireUniversalify().fromPromise;
  const path$1 = path;
  const fs2 = /* @__PURE__ */ requireFs();
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { areIdentical } = /* @__PURE__ */ requireStat();
  async function createLink(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = await fs2.lstat(dstpath);
    } catch {
    }
    let srcStat;
    try {
      srcStat = await fs2.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    if (dstStat && areIdentical(srcStat, dstStat)) return;
    const dir = path$1.dirname(dstpath);
    const dirExists = await pathExists(dir);
    if (!dirExists) {
      await mkdir.mkdirs(dir);
    }
    await fs2.link(srcpath, dstpath);
  }
  function createLinkSync(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = fs2.lstatSync(dstpath);
    } catch {
    }
    try {
      const srcStat = fs2.lstatSync(srcpath);
      if (dstStat && areIdentical(srcStat, dstStat)) return;
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    const dir = path$1.dirname(dstpath);
    const dirExists = fs2.existsSync(dir);
    if (dirExists) return fs2.linkSync(srcpath, dstpath);
    mkdir.mkdirsSync(dir);
    return fs2.linkSync(srcpath, dstpath);
  }
  link = {
    createLink: u(createLink),
    createLinkSync
  };
  return link;
}
var symlinkPaths_1;
var hasRequiredSymlinkPaths;
function requireSymlinkPaths() {
  if (hasRequiredSymlinkPaths) return symlinkPaths_1;
  hasRequiredSymlinkPaths = 1;
  const path$1 = path;
  const fs2 = /* @__PURE__ */ requireFs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const u = requireUniversalify().fromPromise;
  async function symlinkPaths(srcpath, dstpath) {
    if (path$1.isAbsolute(srcpath)) {
      try {
        await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path$1.dirname(dstpath);
    const relativeToDst = path$1.join(dstdir, srcpath);
    const exists = await pathExists(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    try {
      await fs2.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureSymlink");
      throw err;
    }
    return {
      toCwd: srcpath,
      toDst: path$1.relative(dstdir, srcpath)
    };
  }
  function symlinkPathsSync(srcpath, dstpath) {
    if (path$1.isAbsolute(srcpath)) {
      const exists2 = fs2.existsSync(srcpath);
      if (!exists2) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path$1.dirname(dstpath);
    const relativeToDst = path$1.join(dstdir, srcpath);
    const exists = fs2.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    const srcExists = fs2.existsSync(srcpath);
    if (!srcExists) throw new Error("relative srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: path$1.relative(dstdir, srcpath)
    };
  }
  symlinkPaths_1 = {
    symlinkPaths: u(symlinkPaths),
    symlinkPathsSync
  };
  return symlinkPaths_1;
}
var symlinkType_1;
var hasRequiredSymlinkType;
function requireSymlinkType() {
  if (hasRequiredSymlinkType) return symlinkType_1;
  hasRequiredSymlinkType = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const u = requireUniversalify().fromPromise;
  async function symlinkType(srcpath, type) {
    if (type) return type;
    let stats;
    try {
      stats = await fs2.lstat(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  function symlinkTypeSync(srcpath, type) {
    if (type) return type;
    let stats;
    try {
      stats = fs2.lstatSync(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  symlinkType_1 = {
    symlinkType: u(symlinkType),
    symlinkTypeSync
  };
  return symlinkType_1;
}
var symlink;
var hasRequiredSymlink;
function requireSymlink() {
  if (hasRequiredSymlink) return symlink;
  hasRequiredSymlink = 1;
  const u = requireUniversalify().fromPromise;
  const path$1 = path;
  const fs2 = /* @__PURE__ */ requireFs();
  const { mkdirs: mkdirs2, mkdirsSync } = /* @__PURE__ */ requireMkdirs();
  const { symlinkPaths, symlinkPathsSync } = /* @__PURE__ */ requireSymlinkPaths();
  const { symlinkType, symlinkTypeSync } = /* @__PURE__ */ requireSymlinkType();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { areIdentical } = /* @__PURE__ */ requireStat();
  async function createSymlink(srcpath, dstpath, type) {
    let stats;
    try {
      stats = await fs2.lstat(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      const [srcStat, dstStat] = await Promise.all([
        fs2.stat(srcpath),
        fs2.stat(dstpath)
      ]);
      if (areIdentical(srcStat, dstStat)) return;
    }
    const relative = await symlinkPaths(srcpath, dstpath);
    srcpath = relative.toDst;
    const toType = await symlinkType(relative.toCwd, type);
    const dir = path$1.dirname(dstpath);
    if (!await pathExists(dir)) {
      await mkdirs2(dir);
    }
    return fs2.symlink(srcpath, dstpath, toType);
  }
  function createSymlinkSync(srcpath, dstpath, type) {
    let stats;
    try {
      stats = fs2.lstatSync(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      const srcStat = fs2.statSync(srcpath);
      const dstStat = fs2.statSync(dstpath);
      if (areIdentical(srcStat, dstStat)) return;
    }
    const relative = symlinkPathsSync(srcpath, dstpath);
    srcpath = relative.toDst;
    type = symlinkTypeSync(relative.toCwd, type);
    const dir = path$1.dirname(dstpath);
    const exists = fs2.existsSync(dir);
    if (exists) return fs2.symlinkSync(srcpath, dstpath, type);
    mkdirsSync(dir);
    return fs2.symlinkSync(srcpath, dstpath, type);
  }
  symlink = {
    createSymlink: u(createSymlink),
    createSymlinkSync
  };
  return symlink;
}
var ensure;
var hasRequiredEnsure;
function requireEnsure() {
  if (hasRequiredEnsure) return ensure;
  hasRequiredEnsure = 1;
  const { createFile, createFileSync } = /* @__PURE__ */ requireFile();
  const { createLink, createLinkSync } = /* @__PURE__ */ requireLink();
  const { createSymlink, createSymlinkSync } = /* @__PURE__ */ requireSymlink();
  ensure = {
    // file
    createFile,
    createFileSync,
    ensureFile: createFile,
    ensureFileSync: createFileSync,
    // link
    createLink,
    createLinkSync,
    ensureLink: createLink,
    ensureLinkSync: createLinkSync,
    // symlink
    createSymlink,
    createSymlinkSync,
    ensureSymlink: createSymlink,
    ensureSymlinkSync: createSymlinkSync
  };
  return ensure;
}
var utils;
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
    const EOF = finalEOL ? EOL : "";
    const str = JSON.stringify(obj, replacer, spaces);
    return str.replace(/\n/g, EOL) + EOF;
  }
  function stripBom(content) {
    if (Buffer.isBuffer(content)) content = content.toString("utf8");
    return content.replace(/^\uFEFF/, "");
  }
  utils = { stringify, stripBom };
  return utils;
}
var jsonfile$1;
var hasRequiredJsonfile$1;
function requireJsonfile$1() {
  if (hasRequiredJsonfile$1) return jsonfile$1;
  hasRequiredJsonfile$1 = 1;
  let _fs;
  try {
    _fs = requireGracefulFs();
  } catch (_) {
    _fs = fs$2;
  }
  const universalify2 = requireUniversalify();
  const { stringify, stripBom } = requireUtils();
  async function _readFile(file2, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs2 = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    let data = await universalify2.fromCallback(fs2.readFile)(file2, options);
    data = stripBom(data);
    let obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file2}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
    return obj;
  }
  const readFile = universalify2.fromPromise(_readFile);
  function readFileSync(file2, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs2 = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    try {
      let content = fs2.readFileSync(file2, options);
      content = stripBom(content);
      return JSON.parse(content, options.reviver);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file2}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
  }
  async function _writeFile(file2, obj, options = {}) {
    const fs2 = options.fs || _fs;
    const str = stringify(obj, options);
    await universalify2.fromCallback(fs2.writeFile)(file2, str, options);
  }
  const writeFile = universalify2.fromPromise(_writeFile);
  function writeFileSync(file2, obj, options = {}) {
    const fs2 = options.fs || _fs;
    const str = stringify(obj, options);
    return fs2.writeFileSync(file2, str, options);
  }
  jsonfile$1 = {
    readFile,
    readFileSync,
    writeFile,
    writeFileSync
  };
  return jsonfile$1;
}
var jsonfile;
var hasRequiredJsonfile;
function requireJsonfile() {
  if (hasRequiredJsonfile) return jsonfile;
  hasRequiredJsonfile = 1;
  const jsonFile = requireJsonfile$1();
  jsonfile = {
    // jsonfile exports
    readJson: jsonFile.readFile,
    readJsonSync: jsonFile.readFileSync,
    writeJson: jsonFile.writeFile,
    writeJsonSync: jsonFile.writeFileSync
  };
  return jsonfile;
}
var outputFile_1;
var hasRequiredOutputFile;
function requireOutputFile() {
  if (hasRequiredOutputFile) return outputFile_1;
  hasRequiredOutputFile = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  const path$1 = path;
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const pathExists = requirePathExists().pathExists;
  async function outputFile(file2, data, encoding = "utf-8") {
    const dir = path$1.dirname(file2);
    if (!await pathExists(dir)) {
      await mkdir.mkdirs(dir);
    }
    return fs2.writeFile(file2, data, encoding);
  }
  function outputFileSync(file2, ...args) {
    const dir = path$1.dirname(file2);
    if (!fs2.existsSync(dir)) {
      mkdir.mkdirsSync(dir);
    }
    fs2.writeFileSync(file2, ...args);
  }
  outputFile_1 = {
    outputFile: u(outputFile),
    outputFileSync
  };
  return outputFile_1;
}
var outputJson_1;
var hasRequiredOutputJson;
function requireOutputJson() {
  if (hasRequiredOutputJson) return outputJson_1;
  hasRequiredOutputJson = 1;
  const { stringify } = requireUtils();
  const { outputFile } = /* @__PURE__ */ requireOutputFile();
  async function outputJson(file2, data, options = {}) {
    const str = stringify(data, options);
    await outputFile(file2, str, options);
  }
  outputJson_1 = outputJson;
  return outputJson_1;
}
var outputJsonSync_1;
var hasRequiredOutputJsonSync;
function requireOutputJsonSync() {
  if (hasRequiredOutputJsonSync) return outputJsonSync_1;
  hasRequiredOutputJsonSync = 1;
  const { stringify } = requireUtils();
  const { outputFileSync } = /* @__PURE__ */ requireOutputFile();
  function outputJsonSync(file2, data, options) {
    const str = stringify(data, options);
    outputFileSync(file2, str, options);
  }
  outputJsonSync_1 = outputJsonSync;
  return outputJsonSync_1;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json;
  hasRequiredJson = 1;
  const u = requireUniversalify().fromPromise;
  const jsonFile = /* @__PURE__ */ requireJsonfile();
  jsonFile.outputJson = u(/* @__PURE__ */ requireOutputJson());
  jsonFile.outputJsonSync = /* @__PURE__ */ requireOutputJsonSync();
  jsonFile.outputJSON = jsonFile.outputJson;
  jsonFile.outputJSONSync = jsonFile.outputJsonSync;
  jsonFile.writeJSON = jsonFile.writeJson;
  jsonFile.writeJSONSync = jsonFile.writeJsonSync;
  jsonFile.readJSON = jsonFile.readJson;
  jsonFile.readJSONSync = jsonFile.readJsonSync;
  json = jsonFile;
  return json;
}
var move_1;
var hasRequiredMove$1;
function requireMove$1() {
  if (hasRequiredMove$1) return move_1;
  hasRequiredMove$1 = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path$1 = path;
  const { copy: copy2 } = /* @__PURE__ */ requireCopy();
  const { remove } = /* @__PURE__ */ requireRemove();
  const { mkdirp } = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const stat2 = /* @__PURE__ */ requireStat();
  async function move2(src, dest, opts = {}) {
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = await stat2.checkPaths(src, dest, "move", opts);
    await stat2.checkParentPaths(src, srcStat, dest, "move");
    const destParent = path$1.dirname(dest);
    const parsedParentPath = path$1.parse(destParent);
    if (parsedParentPath.root !== destParent) {
      await mkdirp(destParent);
    }
    return doRename(src, dest, overwrite, isChangingCase);
  }
  async function doRename(src, dest, overwrite, isChangingCase) {
    if (!isChangingCase) {
      if (overwrite) {
        await remove(dest);
      } else if (await pathExists(dest)) {
        throw new Error("dest already exists.");
      }
    }
    try {
      await fs2.rename(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") {
        throw err;
      }
      await moveAcrossDevice(src, dest, overwrite);
    }
  }
  async function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    await copy2(src, dest, opts);
    return remove(src);
  }
  move_1 = move2;
  return move_1;
}
var moveSync_1;
var hasRequiredMoveSync;
function requireMoveSync() {
  if (hasRequiredMoveSync) return moveSync_1;
  hasRequiredMoveSync = 1;
  const fs2 = requireGracefulFs();
  const path$1 = path;
  const copySync = requireCopy().copySync;
  const removeSync = requireRemove().removeSync;
  const mkdirpSync = requireMkdirs().mkdirpSync;
  const stat2 = /* @__PURE__ */ requireStat();
  function moveSync(src, dest, opts) {
    opts = opts || {};
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = stat2.checkPathsSync(src, dest, "move", opts);
    stat2.checkParentPathsSync(src, srcStat, dest, "move");
    if (!isParentRoot(dest)) mkdirpSync(path$1.dirname(dest));
    return doRename(src, dest, overwrite, isChangingCase);
  }
  function isParentRoot(dest) {
    const parent = path$1.dirname(dest);
    const parsedPath = path$1.parse(parent);
    return parsedPath.root === parent;
  }
  function doRename(src, dest, overwrite, isChangingCase) {
    if (isChangingCase) return rename(src, dest, overwrite);
    if (overwrite) {
      removeSync(dest);
      return rename(src, dest, overwrite);
    }
    if (fs2.existsSync(dest)) throw new Error("dest already exists.");
    return rename(src, dest, overwrite);
  }
  function rename(src, dest, overwrite) {
    try {
      fs2.renameSync(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") throw err;
      return moveAcrossDevice(src, dest, overwrite);
    }
  }
  function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    copySync(src, dest, opts);
    return removeSync(src);
  }
  moveSync_1 = moveSync;
  return moveSync_1;
}
var move;
var hasRequiredMove;
function requireMove() {
  if (hasRequiredMove) return move;
  hasRequiredMove = 1;
  const u = requireUniversalify().fromPromise;
  move = {
    move: u(/* @__PURE__ */ requireMove$1()),
    moveSync: /* @__PURE__ */ requireMoveSync()
  };
  return move;
}
var lib;
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  lib = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ requireFs(),
    // Export extra methods:
    .../* @__PURE__ */ requireCopy(),
    .../* @__PURE__ */ requireEmpty(),
    .../* @__PURE__ */ requireEnsure(),
    .../* @__PURE__ */ requireJson(),
    .../* @__PURE__ */ requireMkdirs(),
    .../* @__PURE__ */ requireMove(),
    .../* @__PURE__ */ requireOutputFile(),
    .../* @__PURE__ */ requirePathExists(),
    .../* @__PURE__ */ requireRemove()
  };
  return lib;
}
var libExports = /* @__PURE__ */ requireLib();
const fs = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
const index = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: fs
}, [libExports]);
const isDev = !app.isPackaged;
const dbPath = isDev ? path.join(app.getAppPath(), "database.sqlite") : path.join(app.getPath("userData"), "database.sqlite");
let db;
function initDB() {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      total REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      cost_at_sale REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `);
  try {
    db.prepare("ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5").run();
  } catch (e) {
  }
  try {
    db.prepare("ALTER TABLE products ADD COLUMN category TEXT").run();
  } catch (e) {
  }
  try {
    db.prepare("ALTER TABLE products ADD COLUMN image_path TEXT").run();
  } catch (e) {
  }
  try {
    db.prepare("ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0").run();
  } catch (e) {
  }
  try {
    db.prepare('ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT "paid"').run();
  } catch (e) {
  }
}
const getProducts = () => db.prepare("SELECT * FROM products ORDER BY name").all();
const addProduct = (p) => db.prepare("INSERT INTO products (name, description, price, cost, stock, min_stock, category, image_path) VALUES (@name, @description, @price, @cost, @stock, @min_stock, @category, @image_path)").run({ ...p, min_stock: p.min_stock || 5, category: p.category || "General" });
const updateProduct = (p) => db.prepare("UPDATE products SET name=@name, description=@description, price=@price, cost=@cost, stock=@stock, min_stock=@min_stock, category=@category, image_path=@image_path WHERE id=@id").run({ ...p, min_stock: p.min_stock || 5, category: p.category || "General" });
const deleteProduct = (id) => db.prepare("DELETE FROM products WHERE id = ?").run(id);
const getClients = () => db.prepare("SELECT * FROM clients ORDER BY name").all();
const addClient = (c) => db.prepare("INSERT INTO clients (name, email, phone, address, balance) VALUES (@name, @email, @phone, @address, 0)").run(c);
const updateClient = (c) => db.prepare("UPDATE clients SET name=@name, email=@email, phone=@phone, address=@address WHERE id=@id").run(c);
const deleteClient = (id) => db.prepare("DELETE FROM clients WHERE id = ?").run(id);
const registerClientPayment = (payment) => {
  const transaction = db.transaction((p) => {
    db.prepare("INSERT INTO client_payments (client_id, amount, note) VALUES (@client_id, @amount, @note)").run(p);
    db.prepare("UPDATE clients SET balance = balance - @amount WHERE id = @client_id").run(p);
  });
  return transaction(payment);
};
const getClientPayments = (clientId) => db.prepare("SELECT * FROM client_payments WHERE client_id = ? ORDER BY date DESC").all(clientId);
const getSuppliers = () => db.prepare("SELECT * FROM suppliers ORDER BY name").all();
const addSupplier = (s) => db.prepare("INSERT INTO suppliers (name, email, phone, address) VALUES (@name, @email, @phone, @address)").run(s);
const updateSupplier = (s) => db.prepare("UPDATE suppliers SET name=@name, email=@email, phone=@phone, address=@address WHERE id=@id").run(s);
const deleteSupplier = (id) => db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
const getExpenses = () => db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
const addExpense = (e) => db.prepare("INSERT INTO expenses (description, amount, category, date) VALUES (@description, @amount, @category, @date)").run(e);
const deleteExpense = (id) => db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
const getSales = () => {
  return db.prepare(`
        SELECT 
            s.*, 
            c.name as client_name,
            GROUP_CONCAT(p.name || ' (x' || si.quantity || ')', ', ') as products_summary
        FROM sales s 
        LEFT JOIN clients c ON s.client_id = c.id 
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        GROUP BY s.id
        ORDER BY s.date DESC
    `).all();
};
const getSaleItems = (saleId) => {
  return db.prepare(`
        SELECT si.*, p.name 
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
    `).all(saleId);
};
const deleteSale = (id) => {
  const deleteTransaction = db.transaction((saleId) => {
    const items = db.prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?").all(saleId);
    const updateStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }
    db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(saleId);
    db.prepare("DELETE FROM sales WHERE id = ?").run(saleId);
  });
  try {
    deleteTransaction(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
const clearSalesHistory = () => {
  const clearTransaction = db.transaction(() => {
    const items = db.prepare("SELECT product_id, quantity FROM sale_items").all();
    const updateStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }
    db.prepare("DELETE FROM sale_items").run();
    db.prepare("DELETE FROM sales").run();
    db.prepare('DELETE FROM sqlite_sequence WHERE name="sales" OR name="sale_items"').run();
  });
  try {
    clearTransaction();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
const createSale = (saleData) => {
  const createSaleTransaction = db.transaction((sale) => {
    let total = 0;
    for (const item of sale.items) {
      total += item.price * item.quantity;
    }
    const paymentStatus = sale.payment_status || "paid";
    const result = db.prepare("INSERT INTO sales (client_id, total, payment_status) VALUES (?, ?, ?)").run(sale.client_id, total, paymentStatus);
    const saleId = result.lastInsertRowid;
    if (paymentStatus === "pending" && sale.client_id) {
      db.prepare("UPDATE clients SET balance = balance + ? WHERE id = ?").run(total, sale.client_id);
    }
    const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_at_sale) VALUES (?, ?, ?, ?, ?)");
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const item of sale.items) {
      const product = db.prepare("SELECT cost FROM products WHERE id = ?").get(item.id);
      insertItem.run(saleId, item.id, item.quantity, item.price, product.cost);
      updateStock.run(item.quantity, item.id);
    }
    return saleId;
  });
  return createSaleTransaction(saleData);
};
const getDashboardStats = () => {
  const salesCount = db.prepare("SELECT count(*) as count FROM sales").get();
  const productsCount = db.prepare("SELECT count(*) as count FROM products").get();
  const clientsCount = db.prepare("SELECT count(*) as count FROM clients").get();
  const totalRevenue = db.prepare("SELECT sum(total) as total FROM sales").get();
  const totalOpExpenses = db.prepare("SELECT sum(amount) as total FROM expenses").get();
  const totalCOGS = db.prepare("SELECT sum(cost_at_sale * quantity) as total FROM sale_items").get();
  const totalExpenses = (totalOpExpenses.total || 0) + (totalCOGS.total || 0);
  const lowStockProducts = db.prepare("SELECT * FROM products WHERE stock <= min_stock").all();
  const salesHistory = db.prepare(`
        WITH RECURSIVE days(date) AS (
          SELECT date('now', '-29 days')
          UNION ALL
          SELECT date(date, '+1 day') FROM days WHERE date < date('now')
        )
        SELECT 
            strftime('%d/%m', days.date) as day, 
            COALESCE(SUM(sales.total), 0) as total
        FROM days
        LEFT JOIN sales ON date(sales.date) = days.date
        GROUP BY days.date
        ORDER BY days.date
    `).all();
  const topProducts = db.prepare(`
        SELECT p.name, sum(si.quantity) as sold 
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY sold DESC
        LIMIT 5
    `).all();
  const expensesByCategory = db.prepare(`
        SELECT category, SUM(amount) as total
        FROM expenses
        GROUP BY category
    `).all();
  return {
    salesCount: salesCount.count,
    productsCount: productsCount.count,
    clientsCount: clientsCount.count,
    totalRevenue: totalRevenue.total || 0,
    totalExpenses,
    lowStockProducts,
    salesHistory,
    topProducts,
    expensesByCategory
  };
};
const backupDB = (targetPath) => {
  try {
    db.backup(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
const restoreDB = (sourcePath) => {
  try {
    db.close();
    fs.copySync(sourcePath, dbPath);
    initDB();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const invoicesPath = path.join(app.getPath("documents"), APP_NAME, "Facturas");
const assetsPath = path.join(app.getPath("documents"), APP_NAME, "Assets");
const productImagesPath = path.join(app.getPath("documents"), APP_NAME, "Productos");
[invoicesPath, assetsPath, productImagesPath].forEach((p) => {
  if (!fs$2.existsSync(p)) {
    fs$2.mkdirSync(p, { recursive: true });
  }
});
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    },
    autoHideMenuBar: true
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  initDB();
  ipcMain.handle("get-products", () => getProducts());
  ipcMain.handle("add-product", (_, p) => addProduct(p));
  ipcMain.handle("update-product", (_, p) => updateProduct(p));
  ipcMain.handle("delete-product", (_, id) => deleteProduct(id));
  ipcMain.handle("get-clients", () => getClients());
  ipcMain.handle("add-client", (_, c) => addClient(c));
  ipcMain.handle("update-client", (_, c) => updateClient(c));
  ipcMain.handle("delete-client", (_, id) => deleteClient(id));
  ipcMain.handle("register-client-payment", (_, p) => registerClientPayment(p));
  ipcMain.handle("get-client-payments", (_, id) => getClientPayments(id));
  ipcMain.handle("get-suppliers", () => getSuppliers());
  ipcMain.handle("add-supplier", (_, s) => addSupplier(s));
  ipcMain.handle("update-supplier", (_, s) => updateSupplier(s));
  ipcMain.handle("delete-supplier", (_, id) => deleteSupplier(id));
  ipcMain.handle("get-expenses", () => getExpenses());
  ipcMain.handle("add-expense", (_, e) => addExpense(e));
  ipcMain.handle("delete-expense", (_, id) => deleteExpense(id));
  ipcMain.handle("get-sales", () => getSales());
  ipcMain.handle("get-sale-items", (_, id) => getSaleItems(id));
  ipcMain.handle("create-sale", (_, data) => createSale(data));
  ipcMain.handle("delete-sale", (_, id) => deleteSale(id));
  ipcMain.handle("clear-sales-history", () => clearSalesHistory());
  ipcMain.handle("get-dashboard-stats", () => getDashboardStats());
  ipcMain.handle("select-image", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Imágenes", extensions: ["jpg", "png", "jpeg", "webp"] }]
    });
    if (result.canceled) return null;
    const sourcePath = result.filePaths[0];
    const ext = path.extname(sourcePath);
    const fileName = `${Date.now()}${ext}`;
    const destPath = path.join(productImagesPath, fileName);
    fs$2.copyFileSync(sourcePath, destPath);
    return destPath;
  });
  ipcMain.handle("get-image-base64", (_, filePath) => {
    if (!filePath || !fs$2.existsSync(filePath)) return null;
    const buffer = fs$2.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  });
  ipcMain.handle("print-ticket", async (_, saleData) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `Venta_${saleData.id || "NUEVA"}_${timestamp}.pdf`;
    const fullPath = path.join(invoicesPath, fileName);
    let logoBase64 = "";
    const possibleLogos = ["logo.png", "logo.jpg", "logo.jpeg"];
    for (const logoName of possibleLogos) {
      const p = path.join(assetsPath, logoName);
      if (fs$2.existsSync(p)) {
        const buffer = fs$2.readFileSync(p);
        const ext = path.extname(p).slice(1);
        logoBase64 = `data:image/${ext};base64,${buffer.toString("base64")}`;
        break;
      }
    }
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    });
    const itemsHtml = saleData.items.map((item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x${item.quantity}</td>
        <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">$${(item.price_at_sale * item.quantity).toFixed(2)}</td>
      </tr>
    `).join("");
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { 
                margin: 10mm;
                size: auto;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              width: 100%;
              max-width: 100mm;
              margin: 0 auto; 
              padding: 20px;
              font-size: 14px;
              line-height: 1.4;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 150px;
              max-height: 80px;
              margin-bottom: 10px;
            }
            .business-name {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .ticket-info {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            .client-info {
              margin-bottom: 20px;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .total-section {
              border-top: 2px solid #333;
              padding-top: 15px;
              text-align: right;
            }
            .total-amount {
              margin: 0;
              font-size: 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px dashed #ccc;
              font-size: 12px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ""}
            <h1 class="business-name">${APP_NAME}</h1>
            <p class="ticket-info">Ticket de Venta #${saleData.id || "NUEVA"}</p>
            <p class="ticket-info">Fecha: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
          </div>
          
          <div class="client-info">
            <p style="margin: 0;"><strong>Cliente:</strong> ${saleData.client_name || "Consumidor Final"}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Detalle</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <p class="total-amount">TOTAL: $${saleData.total.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 12px;"><strong>Estado:</strong> ${saleData.payment_status === "pending" ? "CUENTA CORRIENTE" : "PAGADO"}</p>
          </div>

          <div class="footer">
            <p>¡Gracias por confiar en nosotros!</p>
            <p style="font-size: 10px; margin-top: 5px;">Archivo: ${fileName}</p>
          </div>
        </body>
      </html>
    `;
    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return new Promise((resolve) => {
      printWin.webContents.on("did-finish-load", async () => {
        try {
          const data = await printWin.webContents.printToPDF({
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            pageSize: "A4",
            printBackground: true
          });
          fs$2.writeFileSync(fullPath, data);
          printWin.close();
          resolve({ success: true, path: fullPath });
        } catch (error) {
          console.error("Error generating PDF:", error);
          printWin.close();
          resolve({ success: false, error: String(error) });
        }
      });
    });
  });
  ipcMain.handle("open-invoices-folder", () => {
    shell.openPath(invoicesPath);
  });
  ipcMain.handle("backup-db", async () => {
    const { filePath } = await dialog.showSaveDialog({
      title: "Guardar Backup de Base de Datos",
      defaultPath: `backup_db_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: "SQLite Database", extensions: ["sqlite"] }]
    });
    if (filePath) {
      return backupDB(filePath);
    }
    return { success: false, error: "Cancelado" };
  });
  ipcMain.handle("backup-full", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: "Seleccionar Carpeta para Backup Completo (Drive/Dropbox/Local)",
      properties: ["openDirectory", "createDirectory"]
    });
    if (filePaths && filePaths.length > 0) {
      const destBase = path.join(filePaths[0], `Backup_${APP_NAME}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`);
      try {
        if (!fs$2.existsSync(destBase)) fs$2.mkdirSync(destBase);
        const dbSource = path.join(app.getPath("userData"), "database.sqlite");
        fs$2.copyFileSync(dbSource, path.join(destBase, "database.sqlite"));
        const userDocs = path.join(app.getPath("documents"), APP_NAME);
        if (fs$2.existsSync(userDocs)) {
          const folders = ["Facturas", "Assets", "Productos"];
          folders.forEach((f) => {
            const src = path.join(userDocs, f);
            const dst = path.join(destBase, f);
            if (fs$2.existsSync(src)) {
              Promise.resolve().then(() => index).then((fse) => fse.default.copySync(src, dst));
            }
          });
        }
        return { success: true, path: destBase };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: "Cancelado" };
  });
  ipcMain.handle("check-updates", async () => {
    try {
      const { net } = await import("electron");
      const response = await net.fetch(UPDATE_URL);
      if (!response.ok) throw new Error("Servidor no disponible");
      const remote = await response.json();
      return { success: true, remoteVersion: remote.version, updateUrl: remote.url };
    } catch (e) {
      return { success: false, error: "No se pudo conectar al servidor de actualizaciones." };
    }
  });
  ipcMain.handle("restore-db", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: "Seleccionar Backup",
      filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
      properties: ["openFile"]
    });
    if (filePaths && filePaths.length > 0) {
      return restoreDB(filePaths[0]);
    }
    return { success: false, error: "Cancelado" };
  });
  ipcMain.handle("export-data", async (_, { type, data }) => {
    const { filePath } = await dialog.showSaveDialog({
      title: `Exportar ${type}`,
      defaultPath: `${type}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`,
      filters: [{ name: "CSV File", extensions: ["csv"] }]
    });
    if (filePath && data.length > 0) {
      try {
        const fs2 = await import("fs/promises");
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map((row) => Object.values(row).map(
          (v) => typeof v === "string" && v.includes(",") ? `"${v}"` : v
        ).join(","));
        const csvContent = [headers, ...rows].join("\n");
        await fs2.writeFile(filePath, csvContent, "utf-8");
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
    return { success: false, error: "Cancelado" };
  });
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
