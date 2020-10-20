/**
 * jQuery || Zepto Parallax Plugin
 * @author Matthew Wagerfield - @wagerfield
 * @description Creates a parallax effect between an array of layers,
 *              driving the motion from the gyroscope output of a smartdevice.
 *              If no gyroscope is available, the cursor position is used.
 */
(function (c, e, f, b) {
  var i = "parallax";
  var g = 30;
  var d = {
    relativeInput: false,
    clipRelativeInput: false,
    calibrationThreshold: 100,
    calibrationDelay: 500,
    supportDelay: 1000,
    calibrateX: false,
    calibrateY: true,
    invertX: true,
    invertY: true,
    limitX: false,
    limitY: false,
    scalarX: 10,
    scalarY: 10,
    frictionX: 0.1,
    frictionY: 0.1,
    originX: 0.5,
    originY: 0.5,
  };
  function h(l, j) {
    this.element = l;
    this.$context = c(l).data("api", this);
    this.$layers = this.$context.find(".layer");
    var m = {
      calibrateX: this.$context.data("calibrate-x") || null,
      calibrateY: this.$context.data("calibrate-y") || null,
      invertX: this.$context.data("invert-x") || null,
      invertY: this.$context.data("invert-y") || null,
      limitX: parseFloat(this.$context.data("limit-x")) || null,
      limitY: parseFloat(this.$context.data("limit-y")) || null,
      scalarX: parseFloat(this.$context.data("scalar-x")) || null,
      scalarY: parseFloat(this.$context.data("scalar-y")) || null,
      frictionX: parseFloat(this.$context.data("friction-x")) || null,
      frictionY: parseFloat(this.$context.data("friction-y")) || null,
      originX: parseFloat(this.$context.data("origin-x")) || null,
      originY: parseFloat(this.$context.data("origin-y")) || null,
    };
    for (var k in m) {
      if (m[k] === null) {
        delete m[k];
      }
    }
    c.extend(this, d, j, m);
    this.calibrationTimer = null;
    this.calibrationFlag = true;
    this.enabled = false;
    this.depths = [];
    this.raf = null;
    this.bounds = null;
    this.ex = 0;
    this.ey = 0;
    this.ew = 0;
    this.eh = 0;
    this.ecx = 0;
    this.ecy = 0;
    this.erx = 0;
    this.ery = 0;
    this.cx = 0;
    this.cy = 0;
    this.ix = 0;
    this.iy = 0;
    this.mx = 0;
    this.my = 0;
    this.vx = 0;
    this.vy = 0;
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
    this.onOrientationTimer = this.onOrientationTimer.bind(this);
    this.onCalibrationTimer = this.onCalibrationTimer.bind(this);
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.initialise();
  }
  h.prototype.transformSupport = function (w) {
    var p = f.createElement("div");
    var t = false;
    var o = null;
    var s = false;
    var u = null;
    var k = null;
    for (var q = 0, n = this.vendors.length; q < n; q++) {
      if (this.vendors[q] !== null) {
        u = this.vendors[q][0] + "transform";
        k = this.vendors[q][1] + "Transform";
      } else {
        u = "transform";
        k = "transform";
      }
      if (p.style[k] !== b) {
        t = true;
        break;
      }
    }
    switch (w) {
      case "2D":
        s = t;
        break;
      case "3D":
        if (t) {
          var r = f.body || f.createElement("body");
          var v = f.documentElement;
          var m = v.style.overflow;
          var j = false;
          if (!f.body) {
            j = true;
            v.style.overflow = "hidden";
            v.appendChild(r);
            r.style.overflow = "hidden";
            r.style.background = "";
          }
          r.appendChild(p);
          p.style[k] = "translate3d(1px,1px,1px)";
          o = e.getComputedStyle(p).getPropertyValue(u);
          s = o !== b && o.length > 0 && o !== "none";
          v.style.overflow = m;
          r.removeChild(p);
          if (j) {
            r.removeAttribute("style");
            r.parentNode.removeChild(r);
          }
        }
        break;
    }
    return s;
  };
  h.prototype.ww = null;
  h.prototype.wh = null;
  h.prototype.wcx = null;
  h.prototype.wcy = null;
  h.prototype.wrx = null;
  h.prototype.wry = null;
  h.prototype.portrait = null;
  h.prototype.desktop = !navigator.userAgent.match(
    /(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i
  );
  h.prototype.vendors = [null, ["-webkit-", "webkit"], ["-moz-", "Moz"], ["-o-", "O"], ["-ms-", "ms"]];
  h.prototype.motionSupport = !!e.DeviceMotionEvent;
  h.prototype.orientationSupport = !!e.DeviceOrientationEvent;
  h.prototype.orientationStatus = 0;
  h.prototype.transform2DSupport = h.prototype.transformSupport("2D");
  h.prototype.transform3DSupport = h.prototype.transformSupport("3D");
  h.prototype.propertyCache = {};
  h.prototype.initialise = function () {
    if (this.$context.css("position") === "static") {
      this.$context.css({ position: "relative" });
    }
    this.accelerate(this.$context);
    this.updateLayers();
    this.updateDimensions();
    this.enable();
    this.queueCalibration(this.calibrationDelay);
  };
  h.prototype.updateLayers = function () {
    this.$layers = this.$context.find(".layer");
    this.depths = [];
    this.$layers.css({ position: "absolute", display: "block", left: 0, top: 0 });
    this.$layers.first().css({ position: "relative" });
    this.accelerate(this.$layers);
    this.$layers.each(
      c.proxy(function (j, k) {
        this.depths.push(c(k).data("depth") || 0);
      }, this)
    );
  };
  h.prototype.updateDimensions = function () {
    this.ww = e.innerWidth;
    this.wh = e.innerHeight;
    this.wcx = this.ww * this.originX;
    this.wcy = this.wh * this.originY;
    this.wrx = Math.max(this.wcx, this.ww - this.wcx);
    this.wry = Math.max(this.wcy, this.wh - this.wcy);
  };
  h.prototype.updateBounds = function () {
    this.bounds = this.element.getBoundingClientRect();
    this.ex = this.bounds.left;
    this.ey = this.bounds.top;
    this.ew = this.bounds.width;
    this.eh = this.bounds.height;
    this.ecx = this.ew * this.originX;
    this.ecy = this.eh * this.originY;
    this.erx = Math.max(this.ecx, this.ew - this.ecx);
    this.ery = Math.max(this.ecy, this.eh - this.ecy);
  };
  h.prototype.queueCalibration = function (j) {
    clearTimeout(this.calibrationTimer);
    this.calibrationTimer = setTimeout(this.onCalibrationTimer, j);
  };
  h.prototype.enable = function () {
    if (!this.enabled) {
      this.enabled = true;
      if (this.orientationSupport) {
        this.portrait = null;
        e.addEventListener("deviceorientation", this.onDeviceOrientation);
        setTimeout(this.onOrientationTimer, this.supportDelay);
      } else {
        this.cx = 0;
        this.cy = 0;
        this.portrait = false;
        e.addEventListener("mousemove", this.onMouseMove);
      }
      e.addEventListener("resize", this.onWindowResize);
      this.raf = requestAnimationFrame(this.onAnimationFrame);
    }
  };
  h.prototype.disable = function () {
    if (this.enabled) {
      this.enabled = false;
      if (this.orientationSupport) {
        e.removeEventListener("deviceorientation", this.onDeviceOrientation);
      } else {
        e.removeEventListener("mousemove", this.onMouseMove);
      }
      e.removeEventListener("resize", this.onWindowResize);
      cancelAnimationFrame(this.raf);
    }
  };
  h.prototype.calibrate = function (j, k) {
    this.calibrateX = j === b ? this.calibrateX : j;
    this.calibrateY = k === b ? this.calibrateY : k;
  };
  h.prototype.invert = function (j, k) {
    this.invertX = j === b ? this.invertX : j;
    this.invertY = k === b ? this.invertY : k;
  };
  h.prototype.friction = function (j, k) {
    this.frictionX = j === b ? this.frictionX : j;
    this.frictionY = k === b ? this.frictionY : k;
  };
  h.prototype.scalar = function (j, k) {
    this.scalarX = j === b ? this.scalarX : j;
    this.scalarY = k === b ? this.scalarY : k;
  };
  h.prototype.limit = function (j, k) {
    this.limitX = j === b ? this.limitX : j;
    this.limitY = k === b ? this.limitY : k;
  };
  h.prototype.origin = function (j, k) {
    this.originX = j === b ? this.originX : j;
    this.originY = k === b ? this.originY : k;
  };
  h.prototype.clamp = function (l, k, j) {
    l = Math.max(l, k);
    l = Math.min(l, j);
    return l;
  };
  h.prototype.css = function (m, p, o) {
    var n = this.propertyCache[p];
    if (!n) {
      for (var k = 0, j = this.vendors.length; k < j; k++) {
        if (this.vendors[k] !== null) {
          n = c.camelCase(this.vendors[k][1] + "-" + p);
        } else {
          n = p;
        }
        if (m.style[n] !== b) {
          this.propertyCache[p] = n;
          break;
        }
      }
    }
    m.style[n] = o;
  };
  h.prototype.accelerate = function (k) {
    for (var n = 0, j = k.length; n < j; n++) {
      var m = k[n];
      this.css(m, "transform", "translate3d(0,0,0)");
      this.css(m, "transform-style", "preserve-3d");
      this.css(m, "backface-visibility", "hidden");
    }
  };
  h.prototype.setPosition = function (k, j, l) {
    j += "px";
    l += "px";
    if (this.transform3DSupport) {
      this.css(k, "transform", "translate3d(" + j + "," + l + ",0)");
    } else {
      if (this.transform2DSupport) {
        this.css(k, "transform", "translate(" + j + "," + l + ")");
      } else {
        k.style.left = j;
        k.style.top = l;
      }
    }
  };
  h.prototype.onOrientationTimer = function (j) {
    if (this.orientationSupport && this.orientationStatus === 0) {
      this.disable();
      this.orientationSupport = false;
      this.enable();
    }
  };
  h.prototype.onCalibrationTimer = function (j) {
    this.calibrationFlag = true;
  };
  h.prototype.onWindowResize = function (j) {
    this.updateDimensions();
  };
  h.prototype.onAnimationFrame = function () {
    this.updateBounds();
    var m = this.ix - this.cx;
    var k = this.iy - this.cy;
    if (Math.abs(m) > this.calibrationThreshold || Math.abs(k) > this.calibrationThreshold) {
      this.queueCalibration(0);
    }
    if (this.portrait) {
      this.mx = this.calibrateX ? k : this.iy;
      this.my = this.calibrateY ? m : this.ix;
    } else {
      this.mx = this.calibrateX ? m : this.ix;
      this.my = this.calibrateY ? k : this.iy;
    }
    this.mx *= this.ew * (this.scalarX / 100);
    this.my *= this.eh * (this.scalarY / 100);
    if (!isNaN(parseFloat(this.limitX))) {
      this.mx = this.clamp(this.mx, -this.limitX, this.limitX);
    }
    if (!isNaN(parseFloat(this.limitY))) {
      this.my = this.clamp(this.my, -this.limitY, this.limitY);
    }
    this.vx += (this.mx - this.vx) * this.frictionX;
    this.vy += (this.my - this.vy) * this.frictionY;
    for (var o = 0, j = this.$layers.length; o < j; o++) {
      var r = this.depths[o];
      var n = this.$layers[o];
      var p = this.vx * r * (this.invertX ? -1 : 1);
      var q = this.vy * r * (this.invertY ? -1 : 1);
      this.setPosition(n, p, q);
    }
    this.raf = requestAnimationFrame(this.onAnimationFrame);
  };
  h.prototype.onDeviceOrientation = function (k) {
    if (!this.desktop && k.beta !== null && k.gamma !== null) {
      this.orientationStatus = 1;
      var j = (k.beta || 0) / g;
      var m = (k.gamma || 0) / g;
      var l = e.innerHeight > e.innerWidth;
      if (this.portrait !== l) {
        this.portrait = l;
        this.calibrationFlag = true;
      }
      if (this.calibrationFlag) {
        this.calibrationFlag = false;
        this.cx = j;
        this.cy = m;
      }
      this.ix = j;
      this.iy = m;
    }
  };
  h.prototype.onMouseMove = function (l) {
    var k = l.clientX;
    var j = l.clientY;
    if (!this.orientationSupport && this.relativeInput) {
      if (this.clipRelativeInput) {
        k = Math.max(k, this.ex);
        k = Math.min(k, this.ex + this.ew);
        j = Math.max(j, this.ey);
        j = Math.min(j, this.ey + this.eh);
      }
      this.ix = (k - this.ex - this.ecx) / this.erx;
      this.iy = (j - this.ey - this.ecy) / this.ery;
    } else {
      this.ix = (k - this.wcx) / this.wrx;
      this.iy = (j - this.wcy) / this.wry;
    }
  };
  var a = {
    enable: h.prototype.enable,
    disable: h.prototype.disable,
    updateLayers: h.prototype.updateLayers,
    calibrate: h.prototype.calibrate,
    friction: h.prototype.friction,
    invert: h.prototype.invert,
    scalar: h.prototype.scalar,
    limit: h.prototype.limit,
    origin: h.prototype.origin,
  };
  c.fn[i] = function (k) {
    var j = arguments;
    return this.each(function () {
      var m = c(this);
      var l = m.data(i);
      if (!l) {
        l = new h(this, k);
        m.data(i, l);
      }
      if (a[k]) {
        l[k].apply(l, Array.prototype.slice.call(j, 1));
      }
    });
  };
})(window.jQuery || window.Zepto, window, document);
(function () {
  var b = 0;
  var c = ["ms", "moz", "webkit", "o"];
  for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
    window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
    window.cancelAnimationFrame = window[c[a] + "CancelAnimationFrame"] || window[c[a] + "CancelRequestAnimationFrame"];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (h, e) {
      var d = new Date().getTime();
      var f = Math.max(0, 16 - (d - b));
      var g = window.setTimeout(function () {
        h(d + f);
      }, f);
      b = d + f;
      return g;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (d) {
      clearTimeout(d);
    };
  }
})();

(function (r) {
  r.fn.qrcode = function (h) {
    var s;
    function u(a) {
      this.mode = s;
      this.data = a;
    }
    function o(a, c) {
      this.typeNumber = a;
      this.errorCorrectLevel = c;
      this.modules = null;
      this.moduleCount = 0;
      this.dataCache = null;
      this.dataList = [];
    }
    function q(a, c) {
      if (void 0 == a.length) throw Error(a.length + "/" + c);
      for (var d = 0; d < a.length && 0 == a[d]; ) d++;
      this.num = Array(a.length - d + c);
      for (var b = 0; b < a.length - d; b++) this.num[b] = a[b + d];
    }
    function p(a, c) {
      this.totalCount = a;
      this.dataCount = c;
    }
    function t() {
      this.buffer = [];
      this.length = 0;
    }
    u.prototype = {
      getLength: function () {
        return this.data.length;
      },
      write: function (a) {
        for (var c = 0; c < this.data.length; c++) a.put(this.data.charCodeAt(c), 8);
      },
    };
    o.prototype = {
      addData: function (a) {
        this.dataList.push(new u(a));
        this.dataCache = null;
      },
      isDark: function (a, c) {
        if (0 > a || this.moduleCount <= a || 0 > c || this.moduleCount <= c) throw Error(a + "," + c);
        return this.modules[a][c];
      },
      getModuleCount: function () {
        return this.moduleCount;
      },
      make: function () {
        if (1 > this.typeNumber) {
          for (var a = 1, a = 1; 40 > a; a++) {
            for (var c = p.getRSBlocks(a, this.errorCorrectLevel), d = new t(), b = 0, e = 0; e < c.length; e++)
              b += c[e].dataCount;
            for (e = 0; e < this.dataList.length; e++)
              (c = this.dataList[e]), d.put(c.mode, 4), d.put(c.getLength(), j.getLengthInBits(c.mode, a)), c.write(d);
            if (d.getLengthInBits() <= 8 * b) break;
          }
          this.typeNumber = a;
        }
        this.makeImpl(!1, this.getBestMaskPattern());
      },
      makeImpl: function (a, c) {
        this.moduleCount = 4 * this.typeNumber + 17;
        this.modules = Array(this.moduleCount);
        for (var d = 0; d < this.moduleCount; d++) {
          this.modules[d] = Array(this.moduleCount);
          for (var b = 0; b < this.moduleCount; b++) this.modules[d][b] = null;
        }
        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(a, c);
        7 <= this.typeNumber && this.setupTypeNumber(a);
        null == this.dataCache &&
          (this.dataCache = o.createData(this.typeNumber, this.errorCorrectLevel, this.dataList));
        this.mapData(this.dataCache, c);
      },
      setupPositionProbePattern: function (a, c) {
        for (var d = -1; 7 >= d; d++)
          if (!(-1 >= a + d || this.moduleCount <= a + d))
            for (var b = -1; 7 >= b; b++)
              -1 >= c + b ||
                this.moduleCount <= c + b ||
                (this.modules[a + d][c + b] =
                  (0 <= d && 6 >= d && (0 == b || 6 == b)) ||
                  (0 <= b && 6 >= b && (0 == d || 6 == d)) ||
                  (2 <= d && 4 >= d && 2 <= b && 4 >= b)
                    ? !0
                    : !1);
      },
      getBestMaskPattern: function () {
        for (var a = 0, c = 0, d = 0; 8 > d; d++) {
          this.makeImpl(!0, d);
          var b = j.getLostPoint(this);
          if (0 == d || a > b) (a = b), (c = d);
        }
        return c;
      },
      createMovieClip: function (a, c, d) {
        a = a.createEmptyMovieClip(c, d);
        this.make();
        for (c = 0; c < this.modules.length; c++)
          for (var d = 1 * c, b = 0; b < this.modules[c].length; b++) {
            var e = 1 * b;
            this.modules[c][b] &&
              (a.beginFill(0, 100),
              a.moveTo(e, d),
              a.lineTo(e + 1, d),
              a.lineTo(e + 1, d + 1),
              a.lineTo(e, d + 1),
              a.endFill());
          }
        return a;
      },
      setupTimingPattern: function () {
        for (var a = 8; a < this.moduleCount - 8; a++) null == this.modules[a][6] && (this.modules[a][6] = 0 == a % 2);
        for (a = 8; a < this.moduleCount - 8; a++) null == this.modules[6][a] && (this.modules[6][a] = 0 == a % 2);
      },
      setupPositionAdjustPattern: function () {
        for (var a = j.getPatternPosition(this.typeNumber), c = 0; c < a.length; c++)
          for (var d = 0; d < a.length; d++) {
            var b = a[c],
              e = a[d];
            if (null == this.modules[b][e])
              for (var f = -2; 2 >= f; f++)
                for (var i = -2; 2 >= i; i++)
                  this.modules[b + f][e + i] = -2 == f || 2 == f || -2 == i || 2 == i || (0 == f && 0 == i) ? !0 : !1;
          }
      },
      setupTypeNumber: function (a) {
        for (var c = j.getBCHTypeNumber(this.typeNumber), d = 0; 18 > d; d++) {
          var b = !a && 1 == ((c >> d) & 1);
          this.modules[Math.floor(d / 3)][(d % 3) + this.moduleCount - 8 - 3] = b;
        }
        for (d = 0; 18 > d; d++)
          (b = !a && 1 == ((c >> d) & 1)), (this.modules[(d % 3) + this.moduleCount - 8 - 3][Math.floor(d / 3)] = b);
      },
      setupTypeInfo: function (a, c) {
        for (var d = j.getBCHTypeInfo((this.errorCorrectLevel << 3) | c), b = 0; 15 > b; b++) {
          var e = !a && 1 == ((d >> b) & 1);
          6 > b
            ? (this.modules[b][8] = e)
            : 8 > b
            ? (this.modules[b + 1][8] = e)
            : (this.modules[this.moduleCount - 15 + b][8] = e);
        }
        for (b = 0; 15 > b; b++)
          (e = !a && 1 == ((d >> b) & 1)),
            8 > b
              ? (this.modules[8][this.moduleCount - b - 1] = e)
              : 9 > b
              ? (this.modules[8][15 - b - 1 + 1] = e)
              : (this.modules[8][15 - b - 1] = e);
        this.modules[this.moduleCount - 8][8] = !a;
      },
      mapData: function (a, c) {
        for (var d = -1, b = this.moduleCount - 1, e = 7, f = 0, i = this.moduleCount - 1; 0 < i; i -= 2)
          for (6 == i && i--; ; ) {
            for (var g = 0; 2 > g; g++)
              if (null == this.modules[b][i - g]) {
                var n = !1;
                f < a.length && (n = 1 == ((a[f] >>> e) & 1));
                j.getMask(c, b, i - g) && (n = !n);
                this.modules[b][i - g] = n;
                e--;
                -1 == e && (f++, (e = 7));
              }
            b += d;
            if (0 > b || this.moduleCount <= b) {
              b -= d;
              d = -d;
              break;
            }
          }
      },
    };
    o.PAD0 = 236;
    o.PAD1 = 17;
    o.createData = function (a, c, d) {
      for (var c = p.getRSBlocks(a, c), b = new t(), e = 0; e < d.length; e++) {
        var f = d[e];
        b.put(f.mode, 4);
        b.put(f.getLength(), j.getLengthInBits(f.mode, a));
        f.write(b);
      }
      for (e = a = 0; e < c.length; e++) a += c[e].dataCount;
      if (b.getLengthInBits() > 8 * a) throw Error("code length overflow. (" + b.getLengthInBits() + ">" + 8 * a + ")");
      for (b.getLengthInBits() + 4 <= 8 * a && b.put(0, 4); 0 != b.getLengthInBits() % 8; ) b.putBit(!1);
      for (; !(b.getLengthInBits() >= 8 * a); ) {
        b.put(o.PAD0, 8);
        if (b.getLengthInBits() >= 8 * a) break;
        b.put(o.PAD1, 8);
      }
      return o.createBytes(b, c);
    };
    o.createBytes = function (a, c) {
      for (var d = 0, b = 0, e = 0, f = Array(c.length), i = Array(c.length), g = 0; g < c.length; g++) {
        var n = c[g].dataCount,
          h = c[g].totalCount - n,
          b = Math.max(b, n),
          e = Math.max(e, h);
        f[g] = Array(n);
        for (var k = 0; k < f[g].length; k++) f[g][k] = 255 & a.buffer[k + d];
        d += n;
        k = j.getErrorCorrectPolynomial(h);
        n = new q(f[g], k.getLength() - 1).mod(k);
        i[g] = Array(k.getLength() - 1);
        for (k = 0; k < i[g].length; k++) (h = k + n.getLength() - i[g].length), (i[g][k] = 0 <= h ? n.get(h) : 0);
      }
      for (k = g = 0; k < c.length; k++) g += c[k].totalCount;
      d = Array(g);
      for (k = n = 0; k < b; k++) for (g = 0; g < c.length; g++) k < f[g].length && (d[n++] = f[g][k]);
      for (k = 0; k < e; k++) for (g = 0; g < c.length; g++) k < i[g].length && (d[n++] = i[g][k]);
      return d;
    };
    s = 4;
    for (
      var j = {
          PATTERN_POSITION_TABLE: [
            [],
            [6, 18],
            [6, 22],
            [6, 26],
            [6, 30],
            [6, 34],
            [6, 22, 38],
            [6, 24, 42],
            [6, 26, 46],
            [6, 28, 50],
            [6, 30, 54],
            [6, 32, 58],
            [6, 34, 62],
            [6, 26, 46, 66],
            [6, 26, 48, 70],
            [6, 26, 50, 74],
            [6, 30, 54, 78],
            [6, 30, 56, 82],
            [6, 30, 58, 86],
            [6, 34, 62, 90],
            [6, 28, 50, 72, 94],
            [6, 26, 50, 74, 98],
            [6, 30, 54, 78, 102],
            [6, 28, 54, 80, 106],
            [6, 32, 58, 84, 110],
            [6, 30, 58, 86, 114],
            [6, 34, 62, 90, 118],
            [6, 26, 50, 74, 98, 122],
            [6, 30, 54, 78, 102, 126],
            [6, 26, 52, 78, 104, 130],
            [6, 30, 56, 82, 108, 134],
            [6, 34, 60, 86, 112, 138],
            [6, 30, 58, 86, 114, 142],
            [6, 34, 62, 90, 118, 146],
            [6, 30, 54, 78, 102, 126, 150],
            [6, 24, 50, 76, 102, 128, 154],
            [6, 28, 54, 80, 106, 132, 158],
            [6, 32, 58, 84, 110, 136, 162],
            [6, 26, 54, 82, 110, 138, 166],
            [6, 30, 58, 86, 114, 142, 170],
          ],
          G15: 1335,
          G18: 7973,
          G15_MASK: 21522,
          getBCHTypeInfo: function (a) {
            for (var c = a << 10; 0 <= j.getBCHDigit(c) - j.getBCHDigit(j.G15); )
              c ^= j.G15 << (j.getBCHDigit(c) - j.getBCHDigit(j.G15));
            return ((a << 10) | c) ^ j.G15_MASK;
          },
          getBCHTypeNumber: function (a) {
            for (var c = a << 12; 0 <= j.getBCHDigit(c) - j.getBCHDigit(j.G18); )
              c ^= j.G18 << (j.getBCHDigit(c) - j.getBCHDigit(j.G18));
            return (a << 12) | c;
          },
          getBCHDigit: function (a) {
            for (var c = 0; 0 != a; ) c++, (a >>>= 1);
            return c;
          },
          getPatternPosition: function (a) {
            return j.PATTERN_POSITION_TABLE[a - 1];
          },
          getMask: function (a, c, d) {
            switch (a) {
              case 0:
                return 0 == (c + d) % 2;
              case 1:
                return 0 == c % 2;
              case 2:
                return 0 == d % 3;
              case 3:
                return 0 == (c + d) % 3;
              case 4:
                return 0 == (Math.floor(c / 2) + Math.floor(d / 3)) % 2;
              case 5:
                return 0 == ((c * d) % 2) + ((c * d) % 3);
              case 6:
                return 0 == (((c * d) % 2) + ((c * d) % 3)) % 2;
              case 7:
                return 0 == (((c * d) % 3) + ((c + d) % 2)) % 2;
              default:
                throw Error("bad maskPattern:" + a);
            }
          },
          getErrorCorrectPolynomial: function (a) {
            for (var c = new q([1], 0), d = 0; d < a; d++) c = c.multiply(new q([1, l.gexp(d)], 0));
            return c;
          },
          getLengthInBits: function (a, c) {
            if (1 <= c && 10 > c)
              switch (a) {
                case 1:
                  return 10;
                case 2:
                  return 9;
                case s:
                  return 8;
                case 8:
                  return 8;
                default:
                  throw Error("mode:" + a);
              }
            else if (27 > c)
              switch (a) {
                case 1:
                  return 12;
                case 2:
                  return 11;
                case s:
                  return 16;
                case 8:
                  return 10;
                default:
                  throw Error("mode:" + a);
              }
            else if (41 > c)
              switch (a) {
                case 1:
                  return 14;
                case 2:
                  return 13;
                case s:
                  return 16;
                case 8:
                  return 12;
                default:
                  throw Error("mode:" + a);
              }
            else throw Error("type:" + c);
          },
          getLostPoint: function (a) {
            for (var c = a.getModuleCount(), d = 0, b = 0; b < c; b++)
              for (var e = 0; e < c; e++) {
                for (var f = 0, i = a.isDark(b, e), g = -1; 1 >= g; g++)
                  if (!(0 > b + g || c <= b + g))
                    for (var h = -1; 1 >= h; h++)
                      0 > e + h || c <= e + h || (0 == g && 0 == h) || (i == a.isDark(b + g, e + h) && f++);
                5 < f && (d += 3 + f - 5);
              }
            for (b = 0; b < c - 1; b++)
              for (e = 0; e < c - 1; e++)
                if (
                  ((f = 0),
                  a.isDark(b, e) && f++,
                  a.isDark(b + 1, e) && f++,
                  a.isDark(b, e + 1) && f++,
                  a.isDark(b + 1, e + 1) && f++,
                  0 == f || 4 == f)
                )
                  d += 3;
            for (b = 0; b < c; b++)
              for (e = 0; e < c - 6; e++)
                a.isDark(b, e) &&
                  !a.isDark(b, e + 1) &&
                  a.isDark(b, e + 2) &&
                  a.isDark(b, e + 3) &&
                  a.isDark(b, e + 4) &&
                  !a.isDark(b, e + 5) &&
                  a.isDark(b, e + 6) &&
                  (d += 40);
            for (e = 0; e < c; e++)
              for (b = 0; b < c - 6; b++)
                a.isDark(b, e) &&
                  !a.isDark(b + 1, e) &&
                  a.isDark(b + 2, e) &&
                  a.isDark(b + 3, e) &&
                  a.isDark(b + 4, e) &&
                  !a.isDark(b + 5, e) &&
                  a.isDark(b + 6, e) &&
                  (d += 40);
            for (e = f = 0; e < c; e++) for (b = 0; b < c; b++) a.isDark(b, e) && f++;
            a = Math.abs((100 * f) / c / c - 50) / 5;
            return d + 10 * a;
          },
        },
        l = {
          glog: function (a) {
            if (1 > a) throw Error("glog(" + a + ")");
            return l.LOG_TABLE[a];
          },
          gexp: function (a) {
            for (; 0 > a; ) a += 255;
            for (; 256 <= a; ) a -= 255;
            return l.EXP_TABLE[a];
          },
          EXP_TABLE: Array(256),
          LOG_TABLE: Array(256),
        },
        m = 0;
      8 > m;
      m++
    )
      l.EXP_TABLE[m] = 1 << m;
    for (m = 8; 256 > m; m++)
      l.EXP_TABLE[m] = l.EXP_TABLE[m - 4] ^ l.EXP_TABLE[m - 5] ^ l.EXP_TABLE[m - 6] ^ l.EXP_TABLE[m - 8];
    for (m = 0; 255 > m; m++) l.LOG_TABLE[l.EXP_TABLE[m]] = m;
    q.prototype = {
      get: function (a) {
        return this.num[a];
      },
      getLength: function () {
        return this.num.length;
      },
      multiply: function (a) {
        for (var c = Array(this.getLength() + a.getLength() - 1), d = 0; d < this.getLength(); d++)
          for (var b = 0; b < a.getLength(); b++) c[d + b] ^= l.gexp(l.glog(this.get(d)) + l.glog(a.get(b)));
        return new q(c, 0);
      },
      mod: function (a) {
        if (0 > this.getLength() - a.getLength()) return this;
        for (
          var c = l.glog(this.get(0)) - l.glog(a.get(0)), d = Array(this.getLength()), b = 0;
          b < this.getLength();
          b++
        )
          d[b] = this.get(b);
        for (b = 0; b < a.getLength(); b++) d[b] ^= l.gexp(l.glog(a.get(b)) + c);
        return new q(d, 0).mod(a);
      },
    };
    p.RS_BLOCK_TABLE = [
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12],
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16],
    ];
    p.getRSBlocks = function (a, c) {
      var d = p.getRsBlockTable(a, c);
      if (void 0 == d) throw Error("bad rs block @ typeNumber:" + a + "/errorCorrectLevel:" + c);
      for (var b = d.length / 3, e = [], f = 0; f < b; f++)
        for (var h = d[3 * f + 0], g = d[3 * f + 1], j = d[3 * f + 2], l = 0; l < h; l++) e.push(new p(g, j));
      return e;
    };
    p.getRsBlockTable = function (a, c) {
      switch (c) {
        case 1:
          return p.RS_BLOCK_TABLE[4 * (a - 1) + 0];
        case 0:
          return p.RS_BLOCK_TABLE[4 * (a - 1) + 1];
        case 3:
          return p.RS_BLOCK_TABLE[4 * (a - 1) + 2];
        case 2:
          return p.RS_BLOCK_TABLE[4 * (a - 1) + 3];
      }
    };
    t.prototype = {
      get: function (a) {
        return 1 == ((this.buffer[Math.floor(a / 8)] >>> (7 - (a % 8))) & 1);
      },
      put: function (a, c) {
        for (var d = 0; d < c; d++) this.putBit(1 == ((a >>> (c - d - 1)) & 1));
      },
      getLengthInBits: function () {
        return this.length;
      },
      putBit: function (a) {
        var c = Math.floor(this.length / 8);
        this.buffer.length <= c && this.buffer.push(0);
        a && (this.buffer[c] |= 128 >>> this.length % 8);
        this.length++;
      },
    };
    "string" === typeof h && (h = { text: h });
    h = r.extend(
      {},
      {
        render: "canvas",
        width: 256,
        height: 256,
        typeNumber: -1,
        correctLevel: 2,
        background: "#ffffff",
        foreground: "#000000",
      },
      h
    );
    return this.each(function () {
      var a;
      if ("canvas" == h.render) {
        a = new o(h.typeNumber, h.correctLevel);
        a.addData(h.text);
        a.make();
        var c = document.createElement("canvas");
        c.width = h.width;
        c.height = h.height;
        for (
          var d = c.getContext("2d"), b = h.width / a.getModuleCount(), e = h.height / a.getModuleCount(), f = 0;
          f < a.getModuleCount();
          f++
        )
          for (var i = 0; i < a.getModuleCount(); i++) {
            d.fillStyle = a.isDark(f, i) ? h.foreground : h.background;
            var g = Math.ceil((i + 1) * b) - Math.floor(i * b),
              j = Math.ceil((f + 1) * b) - Math.floor(f * b);
            d.fillRect(Math.round(i * b), Math.round(f * e), g, j);
          }
      } else {
        a = new o(h.typeNumber, h.correctLevel);
        a.addData(h.text);
        a.make();
        c = r("<table></table>")
          .css("width", h.width + "px")
          .css("height", h.height + "px")
          .css("border", "0px")
          .css("border-collapse", "collapse")
          .css("background-color", h.background);
        d = h.width / a.getModuleCount();
        b = h.height / a.getModuleCount();
        for (e = 0; e < a.getModuleCount(); e++) {
          f = r("<tr></tr>")
            .css("height", b + "px")
            .appendTo(c);
          for (i = 0; i < a.getModuleCount(); i++)
            r("<td></td>")
              .css("width", d + "px")
              .css("background-color", a.isDark(e, i) ? h.foreground : h.background)
              .appendTo(f);
        }
      }
      a = c;
      jQuery(a).appendTo(this);
    });
  };
})(jQuery);

(function e$$0(x, z, l) {
  function h(p, b) {
    if (!z[p]) {
      if (!x[p]) {
        var a = "function" == typeof require && require;
        if (!b && a) return a(p, !0);
        if (g) return g(p, !0);
        a = Error("Cannot find module '" + p + "'");
        throw ((a.code = "MODULE_NOT_FOUND"), a);
      }
      a = z[p] = { exports: {} };
      x[p][0].call(
        a.exports,
        function (a) {
          var b = x[p][1][a];
          return h(b ? b : a);
        },
        a,
        a.exports,
        e$$0,
        x,
        z,
        l
      );
    }
    return z[p].exports;
  }
  for (var g = "function" == typeof require && require, w = 0; w < l.length; w++) h(l[w]);
  return h;
})(
  {
    1: [
      function (A, x, z) {
        if (!l)
          var l = {
            map: function (h, g) {
              var l = {};
              return g
                ? h.map(function (h, b) {
                    l.index = b;
                    return g.call(l, h);
                  })
                : h.slice();
            },
            naturalOrder: function (h, g) {
              return h < g ? -1 : h > g ? 1 : 0;
            },
            sum: function (h, g) {
              var l = {};
              return h.reduce(
                g
                  ? function (h, b, a) {
                      l.index = a;
                      return h + g.call(l, b);
                    }
                  : function (h, b) {
                      return h + b;
                    },
                0
              );
            },
            max: function (h, g) {
              return Math.max.apply(null, g ? l.map(h, g) : h);
            },
          };
        A = (function () {
          function h(f, c, a) {
            return (f << (2 * d)) + (c << d) + a;
          }
          function g(f) {
            function c() {
              a.sort(f);
              b = !0;
            }
            var a = [],
              b = !1;
            return {
              push: function (c) {
                a.push(c);
                b = !1;
              },
              peek: function (f) {
                b || c();
                void 0 === f && (f = a.length - 1);
                return a[f];
              },
              pop: function () {
                b || c();
                return a.pop();
              },
              size: function () {
                return a.length;
              },
              map: function (c) {
                return a.map(c);
              },
              debug: function () {
                b || c();
                return a;
              },
            };
          }
          function w(f, c, a, b, m, e, q) {
            this.r1 = f;
            this.r2 = c;
            this.g1 = a;
            this.g2 = b;
            this.b1 = m;
            this.b2 = e;
            this.histo = q;
          }
          function p() {
            this.vboxes = new g(function (f, c) {
              return l.naturalOrder(f.vbox.count() * f.vbox.volume(), c.vbox.count() * c.vbox.volume());
            });
          }
          function b(f) {
            var c = Array(1 << (3 * d)),
              a,
              b,
              m,
              r;
            f.forEach(function (f) {
              b = f[0] >> e;
              m = f[1] >> e;
              r = f[2] >> e;
              a = h(b, m, r);
              c[a] = (c[a] || 0) + 1;
            });
            return c;
          }
          function a(f, c) {
            var a = 1e6,
              b = 0,
              m = 1e6,
              d = 0,
              q = 1e6,
              n = 0,
              h,
              k,
              l;
            f.forEach(function (c) {
              h = c[0] >> e;
              k = c[1] >> e;
              l = c[2] >> e;
              h < a ? (a = h) : h > b && (b = h);
              k < m ? (m = k) : k > d && (d = k);
              l < q ? (q = l) : l > n && (n = l);
            });
            return new w(a, b, m, d, q, n, c);
          }
          function n(a, c) {
            function b(a) {
              var f = a + "1";
              a += "2";
              var v, d, m, e;
              d = 0;
              for (k = c[f]; k <= c[a]; k++)
                if (y[k] > n / 2) {
                  m = c.copy();
                  e = c.copy();
                  v = k - c[f];
                  d = c[a] - k;
                  for (v = v <= d ? Math.min(c[a] - 1, ~~(k + d / 2)) : Math.max(c[f], ~~(k - 1 - v / 2)); !y[v]; ) v++;
                  for (d = s[v]; !d && y[v - 1]; ) d = s[--v];
                  m[a] = v;
                  e[f] = m[a] + 1;
                  return [m, e];
                }
            }
            if (c.count()) {
              var d = c.r2 - c.r1 + 1,
                m = c.g2 - c.g1 + 1,
                e = l.max([d, m, c.b2 - c.b1 + 1]);
              if (1 == c.count()) return [c.copy()];
              var n = 0,
                y = [],
                s = [],
                k,
                g,
                t,
                u,
                p;
              if (e == d)
                for (k = c.r1; k <= c.r2; k++) {
                  u = 0;
                  for (g = c.g1; g <= c.g2; g++) for (t = c.b1; t <= c.b2; t++) (p = h(k, g, t)), (u += a[p] || 0);
                  n += u;
                  y[k] = n;
                }
              else if (e == m)
                for (k = c.g1; k <= c.g2; k++) {
                  u = 0;
                  for (g = c.r1; g <= c.r2; g++) for (t = c.b1; t <= c.b2; t++) (p = h(g, k, t)), (u += a[p] || 0);
                  n += u;
                  y[k] = n;
                }
              else
                for (k = c.b1; k <= c.b2; k++) {
                  u = 0;
                  for (g = c.r1; g <= c.r2; g++) for (t = c.g1; t <= c.g2; t++) (p = h(g, t, k)), (u += a[p] || 0);
                  n += u;
                  y[k] = n;
                }
              y.forEach(function (a, c) {
                s[c] = n - a;
              });
              return e == d ? b("r") : e == m ? b("g") : b("b");
            }
          }
          var d = 5,
            e = 8 - d;
          w.prototype = {
            volume: function (a) {
              if (!this._volume || a)
                this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
              return this._volume;
            },
            count: function (a) {
              var c = this.histo;
              if (!this._count_set || a) {
                a = 0;
                var b, d, n;
                for (b = this.r1; b <= this.r2; b++)
                  for (d = this.g1; d <= this.g2; d++)
                    for (n = this.b1; n <= this.b2; n++) (index = h(b, d, n)), (a += c[index] || 0);
                this._count = a;
                this._count_set = !0;
              }
              return this._count;
            },
            copy: function () {
              return new w(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo);
            },
            avg: function (a) {
              var c = this.histo;
              if (!this._avg || a) {
                a = 0;
                var b = 1 << (8 - d),
                  n = 0,
                  e = 0,
                  g = 0,
                  q,
                  l,
                  s,
                  k;
                for (l = this.r1; l <= this.r2; l++)
                  for (s = this.g1; s <= this.g2; s++)
                    for (k = this.b1; k <= this.b2; k++)
                      (q = h(l, s, k)),
                        (q = c[q] || 0),
                        (a += q),
                        (n += q * (l + 0.5) * b),
                        (e += q * (s + 0.5) * b),
                        (g += q * (k + 0.5) * b);
                this._avg = a
                  ? [~~(n / a), ~~(e / a), ~~(g / a)]
                  : [
                      ~~((b * (this.r1 + this.r2 + 1)) / 2),
                      ~~((b * (this.g1 + this.g2 + 1)) / 2),
                      ~~((b * (this.b1 + this.b2 + 1)) / 2),
                    ];
              }
              return this._avg;
            },
            contains: function (a) {
              var c = a[0] >> e;
              gval = a[1] >> e;
              bval = a[2] >> e;
              return (
                c >= this.r1 && c <= this.r2 && gval >= this.g1 && gval <= this.g2 && bval >= this.b1 && bval <= this.b2
              );
            },
          };
          p.prototype = {
            push: function (a) {
              this.vboxes.push({ vbox: a, color: a.avg() });
            },
            palette: function () {
              return this.vboxes.map(function (a) {
                return a.color;
              });
            },
            size: function () {
              return this.vboxes.size();
            },
            map: function (a) {
              for (var c = this.vboxes, b = 0; b < c.size(); b++)
                if (c.peek(b).vbox.contains(a)) return c.peek(b).color;
              return this.nearest(a);
            },
            nearest: function (a) {
              for (var c = this.vboxes, b, n, d, e = 0; e < c.size(); e++)
                if (
                  ((n = Math.sqrt(
                    Math.pow(a[0] - c.peek(e).color[0], 2) +
                      Math.pow(a[1] - c.peek(e).color[1], 2) +
                      Math.pow(a[2] - c.peek(e).color[2], 2)
                  )),
                  n < b || void 0 === b)
                )
                  (b = n), (d = c.peek(e).color);
              return d;
            },
            forcebw: function () {
              var a = this.vboxes;
              a.sort(function (a, b) {
                return l.naturalOrder(l.sum(a.color), l.sum(b.color));
              });
              var b = a[0].color;
              5 > b[0] && 5 > b[1] && 5 > b[2] && (a[0].color = [0, 0, 0]);
              var b = a.length - 1,
                n = a[b].color;
              251 < n[0] && 251 < n[1] && 251 < n[2] && (a[b].color = [255, 255, 255]);
            },
          };
          return {
            quantize: function (d, c) {
              function e(a, b) {
                for (var c = 1, d = 0, f; 1e3 > d; )
                  if (((f = a.pop()), f.count())) {
                    var m = n(h, f);
                    f = m[0];
                    m = m[1];
                    if (!f) break;
                    a.push(f);
                    m && (a.push(m), c++);
                    if (c >= b) break;
                    if (1e3 < d++) break;
                  } else a.push(f), d++;
              }
              if (!d.length || 2 > c || 256 < c) return !1;
              var h = b(d),
                m = 0;
              h.forEach(function () {
                m++;
              });
              var r = a(d, h),
                q = new g(function (a, b) {
                  return l.naturalOrder(a.count(), b.count());
                });
              q.push(r);
              e(q, 0.75 * c);
              for (
                r = new g(function (a, b) {
                  return l.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
                });
                q.size();

              )
                r.push(q.pop());
              e(r, c - r.size());
              for (q = new p(); r.size(); ) q.push(r.pop());
              return q;
            },
          };
        })();
        x.exports = A.quantize;
      },
      {},
    ],
    2: [
      function (A, x, z) {
        (function () {
          var l,
            h,
            g,
            w = function (b, a) {
              return function () {
                return b.apply(a, arguments);
              };
            },
            p = [].slice;
          window.Swatch = h = (function () {
            function b(a, b) {
              this.rgb = a;
              this.population = b;
            }
            b.prototype.hsl = void 0;
            b.prototype.rgb = void 0;
            b.prototype.population = 1;
            b.yiq = 0;
            b.prototype.getHsl = function () {
              return this.hsl ? this.hsl : (this.hsl = g.rgbToHsl(this.rgb[0], this.rgb[1], this.rgb[2]));
            };
            b.prototype.getPopulation = function () {
              return this.population;
            };
            b.prototype.getRgb = function () {
              return this.rgb;
            };
            b.prototype.getHex = function () {
              return "#" + (16777216 + (this.rgb[0] << 16) + (this.rgb[1] << 8) + this.rgb[2]).toString(16).slice(1, 7);
            };
            b.prototype.getTitleTextColor = function () {
              this._ensureTextColors();
              return 200 > this.yiq ? "#fff" : "#000";
            };
            b.prototype.getBodyTextColor = function () {
              this._ensureTextColors();
              return 150 > this.yiq ? "#fff" : "#000";
            };
            b.prototype._ensureTextColors = function () {
              if (!this.yiq) return (this.yiq = (299 * this.rgb[0] + 587 * this.rgb[1] + 114 * this.rgb[2]) / 1e3);
            };
            return b;
          })();
          window.Vibrant = g = (function () {
            function b(a, b, d) {
              this.swatches = w(this.swatches, this);
              var e, f, c, g, p, m, r, q;
              "undefined" === typeof b && (b = 64);
              "undefined" === typeof d && (d = 5);
              p = new l(a);
              r = p.getImageData().data;
              m = p.getPixelCount();
              a = [];
              for (g = 0; g < m; )
                (e = 4 * g),
                  (q = r[e + 0]),
                  (c = r[e + 1]),
                  (f = r[e + 2]),
                  (e = r[e + 3]),
                  125 <= e && ((250 < q && 250 < c && 250 < f) || a.push([q, c, f])),
                  (g += d);
              this._swatches = this.quantize(a, b).vboxes.map(
                (function (a) {
                  return function (a) {
                    return new h(a.color, a.vbox.count());
                  };
                })(this)
              );
              this.maxPopulation = this.findMaxPopulation;
              this.generateVarationColors();
              this.generateEmptySwatches();
              p.removeCanvas();
            }
            b.prototype.quantize = A("quantize");
            b.prototype._swatches = [];
            b.prototype.TARGET_DARK_LUMA = 0.26;
            b.prototype.MAX_DARK_LUMA = 0.45;
            b.prototype.MIN_LIGHT_LUMA = 0.55;
            b.prototype.TARGET_LIGHT_LUMA = 0.74;
            b.prototype.MIN_NORMAL_LUMA = 0.3;
            b.prototype.TARGET_NORMAL_LUMA = 0.5;
            b.prototype.MAX_NORMAL_LUMA = 0.7;
            b.prototype.TARGET_MUTED_SATURATION = 0.3;
            b.prototype.MAX_MUTED_SATURATION = 0.4;
            b.prototype.TARGET_VIBRANT_SATURATION = 1;
            b.prototype.MIN_VIBRANT_SATURATION = 0.35;
            b.prototype.WEIGHT_SATURATION = 3;
            b.prototype.WEIGHT_LUMA = 6;
            b.prototype.WEIGHT_POPULATION = 1;
            b.prototype.VibrantSwatch = void 0;
            b.prototype.MutedSwatch = void 0;
            b.prototype.DarkVibrantSwatch = void 0;
            b.prototype.DarkMutedSwatch = void 0;
            b.prototype.LightVibrantSwatch = void 0;
            b.prototype.LightMutedSwatch = void 0;
            b.prototype.HighestPopulation = 0;
            b.prototype.generateVarationColors = function () {
              this.VibrantSwatch = this.findColorVariation(
                this.TARGET_NORMAL_LUMA,
                this.MIN_NORMAL_LUMA,
                this.MAX_NORMAL_LUMA,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.LightVibrantSwatch = this.findColorVariation(
                this.TARGET_LIGHT_LUMA,
                this.MIN_LIGHT_LUMA,
                1,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.DarkVibrantSwatch = this.findColorVariation(
                this.TARGET_DARK_LUMA,
                0,
                this.MAX_DARK_LUMA,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.MutedSwatch = this.findColorVariation(
                this.TARGET_NORMAL_LUMA,
                this.MIN_NORMAL_LUMA,
                this.MAX_NORMAL_LUMA,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              );
              this.LightMutedSwatch = this.findColorVariation(
                this.TARGET_LIGHT_LUMA,
                this.MIN_LIGHT_LUMA,
                1,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              );
              return (this.DarkMutedSwatch = this.findColorVariation(
                this.TARGET_DARK_LUMA,
                0,
                this.MAX_DARK_LUMA,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              ));
            };
            b.prototype.generateEmptySwatches = function () {
              var a;
              void 0 === this.VibrantSwatch &&
                void 0 !== this.DarkVibrantSwatch &&
                ((a = this.DarkVibrantSwatch.getHsl()),
                (a[2] = this.TARGET_NORMAL_LUMA),
                (this.VibrantSwatch = new h(b.hslToRgb(a[0], a[1], a[2]), 0)));
              if (void 0 === this.DarkVibrantSwatch && void 0 !== this.VibrantSwatch)
                return (
                  (a = this.VibrantSwatch.getHsl()),
                  (a[2] = this.TARGET_DARK_LUMA),
                  (this.DarkVibrantSwatch = new h(b.hslToRgb(a[0], a[1], a[2]), 0))
                );
            };
            b.prototype.findMaxPopulation = function () {
              var a, b, d, e, f;
              d = 0;
              e = this._swatches;
              a = 0;
              for (b = e.length; a < b; a++) (f = e[a]), (d = Math.max(d, f.getPopulation()));
              return d;
            };
            b.prototype.findColorVariation = function (a, b, d, e, f, c) {
              var g, h, m, l, q, p, s, k;
              l = void 0;
              q = 0;
              p = this._swatches;
              g = 0;
              for (h = p.length; g < h; g++)
                if (
                  ((k = p[g]),
                  (s = k.getHsl()[1]),
                  (m = k.getHsl()[2]),
                  s >= f &&
                    s <= c &&
                    m >= b &&
                    m <= d &&
                    !this.isAlreadySelected(k) &&
                    ((m = this.createComparisonValue(s, e, m, a, k.getPopulation(), this.HighestPopulation)),
                    void 0 === l || m > q))
                )
                  (l = k), (q = m);
              return l;
            };
            b.prototype.createComparisonValue = function (a, b, d, e, f, c) {
              return this.weightedMean(
                this.invertDiff(a, b),
                this.WEIGHT_SATURATION,
                this.invertDiff(d, e),
                this.WEIGHT_LUMA,
                f / c,
                this.WEIGHT_POPULATION
              );
            };
            b.prototype.invertDiff = function (a, b) {
              return 1 - Math.abs(a - b);
            };
            b.prototype.weightedMean = function () {
              var a, b, d, e, f, c;
              f = 1 <= arguments.length ? p.call(arguments, 0) : [];
              for (a = d = b = 0; a < f.length; ) (e = f[a]), (c = f[a + 1]), (b += e * c), (d += c), (a += 2);
              return b / d;
            };
            b.prototype.swatches = function () {
              return {
                Vibrant: this.VibrantSwatch,
                Muted: this.MutedSwatch,
                DarkVibrant: this.DarkVibrantSwatch,
                DarkMuted: this.DarkMutedSwatch,
                LightVibrant: this.LightVibrantSwatch,
                LightMuted: this.LightMuted,
              };
            };
            b.prototype.isAlreadySelected = function (a) {
              return (
                this.VibrantSwatch === a ||
                this.DarkVibrantSwatch === a ||
                this.LightVibrantSwatch === a ||
                this.MutedSwatch === a ||
                this.DarkMutedSwatch === a ||
                this.LightMutedSwatch === a
              );
            };
            b.rgbToHsl = function (a, b, d) {
              var e, f, c, g, h;
              a /= 255;
              b /= 255;
              d /= 255;
              g = Math.max(a, b, d);
              h = Math.min(a, b, d);
              f = void 0;
              c = (g + h) / 2;
              if (g === h) f = h = 0;
              else {
                e = g - h;
                h = 0.5 < c ? e / (2 - g - h) : e / (g + h);
                switch (g) {
                  case a:
                    f = (b - d) / e + (b < d ? 6 : 0);
                    break;
                  case b:
                    f = (d - a) / e + 2;
                    break;
                  case d:
                    f = (a - b) / e + 4;
                }
                f /= 6;
              }
              return [f, h, c];
            };
            b.hslToRgb = function (a, b, d) {
              var e, f, c;
              e = f = c = void 0;
              e = function (a, b, c) {
                0 > c && (c += 1);
                1 < c && (c -= 1);
                return c < 1 / 6 ? a + 6 * (b - a) * c : 0.5 > c ? b : c < 2 / 3 ? a + (b - a) * (2 / 3 - c) * 6 : a;
              };
              0 === b
                ? (c = f = e = d)
                : ((b = 0.5 > d ? d * (1 + b) : d + b - d * b),
                  (d = 2 * d - b),
                  (c = e(d, b, a + 1 / 3)),
                  (f = e(d, b, a)),
                  (e = e(d, b, a - 1 / 3)));
              return [255 * c, 255 * f, 255 * e];
            };
            return b;
          })();
          window.CanvasImage = l = (function () {
            function b(a) {
              this.canvas = document.createElement("canvas");
              this.context = this.canvas.getContext("2d");
              document.body.appendChild(this.canvas);
              this.width = this.canvas.width = a.width;
              this.height = this.canvas.height = a.height;
              this.context.drawImage(a, 0, 0, this.width, this.height);
            }
            b.prototype.clear = function () {
              return this.context.clearRect(0, 0, this.width, this.height);
            };
            b.prototype.update = function (a) {
              return this.context.putImageData(a, 0, 0);
            };
            b.prototype.getPixelCount = function () {
              return this.width * this.height;
            };
            b.prototype.getImageData = function () {
              return this.context.getImageData(0, 0, this.width, this.height);
            };
            b.prototype.removeCanvas = function () {
              return this.canvas.parentNode.removeChild(this.canvas);
            };
            return b;
          })();
        }.call(this));
      },
      { quantize: 1 },
    ],
  },
  {},
  [2]
);
