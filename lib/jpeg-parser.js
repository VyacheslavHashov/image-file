'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _exifJs = require('exif-js');

var _exifJs2 = _interopRequireDefault(_exifJs);

var MARKER_SIGNATURE = 0xFF;

var SOI_MARKER = [MARKER_SIGNATURE, 0xD8];

// http://www.setsuki.com/hsp/ext/jpg.htm
var MARKER_TYPES = new Map();
MARKER_TYPES.set(0xC0, 'SOF0');
MARKER_TYPES.set(0xC2, 'SOF2');
MARKER_TYPES.set(0xC4, 'DHT');
for (var i = 0; i <= 7; i++) {
  MARKER_TYPES.set(0xD0 + i, 'RST' + i);
}
MARKER_TYPES.set(0xD8, 'SOI');
MARKER_TYPES.set(0xD9, 'EOI');
MARKER_TYPES.set(0xDA, 'SOS');
MARKER_TYPES.set(0xDB, 'DQT');
MARKER_TYPES.set(0xDD, 'DRI');
for (var i = 0; i <= 15; i++) {
  MARKER_TYPES.set(0xE0 + i, 'APP' + i);
}
MARKER_TYPES.set(0xFE, 'COM');

var NON_DATA_SEGMENT_TYPE_NAMES = ['SOI', 'EOI'];

var DENSITY_UNIT = {
  NONE: 0,
  INCH: 1,
  CENTIMETER: 2
};

var INCH_TO_CENTIMETER_RATIO = 2.54;

var JPEGParser = (function () {
  _createClass(JPEGParser, null, [{
    key: 'isJPEG',
    value: function isJPEG(progressiveDataView) {
      return progressiveDataView.getBytes(0, SOI_MARKER.length).join() === SOI_MARKER.join();
    }
  }, {
    key: 'parse',
    value: function parse(progressiveDataView) {
      var parser = new JPEGParser(progressiveDataView);
      return parser.parse();
    }
  }]);

  function JPEGParser(progressiveDataView) {
    _classCallCheck(this, JPEGParser);

    this.data = progressiveDataView;
    this.metadata = {};
  }

  _createClass(JPEGParser, [{
    key: 'parse',
    value: function parse() {
      this.parseSegments();
      this.parseExif();
      return this.metadata;
    }
  }, {
    key: 'parseSegments',
    value: function parseSegments() {
      var _this = this;

      this.eachSegment(function (segment) {
        var handler = _this['on' + segment.typeName];

        if (handler) {
          handler.call(_this, segment);
        }
      });
    }
  }, {
    key: 'parseExif',
    value: function parseExif() {
      try {
        var tags = _exifJs2['default'].readFromBinaryFile(this.data.buffer);
      } catch (error) {
        return;
      }

      if (!tags) {
        return;
      }
      if (tags.XResolution && tags.YResolution) {
        this.parseDensity(tags.XResolution, tags.YResolution, tags.ResolutionUnit - 1);
      }
    }
  }, {
    key: 'eachSegment',
    value: function eachSegment(callback) {
      while (true) {
        var markerSignature = this.data.getNextUint(1);
        if (markerSignature !== MARKER_SIGNATURE) {
          break;
        }

        var segment = {};
        segment.type = this.data.getNextUint(1);
        segment.typeName = MARKER_TYPES.get(segment.type);

        if (!NON_DATA_SEGMENT_TYPE_NAMES.includes(segment.typeName)) {
          segment.length = this.data.getNextUint(2);
          segment.data = this.data.getNextDataView(segment.length - 2);
        }

        callback(segment);
      }
    }
  }, {
    key: 'onAPP0',
    value: function onAPP0(segment) {
      segment.identifier = segment.data.getNextString(5);
      segment.version = segment.data.getNextBytes(2);
      segment.densityUnit = segment.data.getNextUint(1);
      segment.xDensity = segment.data.getNextUint(2);
      segment.yDensity = segment.data.getNextUint(2);
      segment.xThumbnailSize = segment.data.getNextUint(1);
      segment.yThumbnailSize = segment.data.getNextUint(1);
      segment.thumbnailData = segment.data.getNextDataView(segment.xThumbnailSize * segment.yThumbnailSize * 3);
      this.parseDensity(segment.xDensity, segment.yDensity, segment.densityUnit);
    }
  }, {
    key: 'onSOF0',
    value: function onSOF0(segment) {
      segment.precision = segment.data.getNextUint(1);
      this.metadata.height = segment.height = segment.data.getNextUint(2);
      this.metadata.width = segment.width = segment.data.getNextUint(2);
      segment.colorComponentCount = segment.data.getNextUint(1);
    }
  }, {
    key: 'parseDensity',
    value: function parseDensity(xDensity, yDensity, unit) {
      var averageDensity = (xDensity + yDensity) / 2;

      if (unit === DENSITY_UNIT.INCH) {
        this.metadata.ppi = Math.round(averageDensity);
      } else if (unit === DENSITY_UNIT.CENTIMETER) {
        this.metadata.ppi = Math.round(averageDensity * INCH_TO_CENTIMETER_RATIO);
      }
    }
  }]);

  return JPEGParser;
})();

exports['default'] = JPEGParser;
module.exports = exports['default'];