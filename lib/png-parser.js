'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
var INCH_TO_METRE_RATIO = 0.0254;

var PNGParser = (function () {
  _createClass(PNGParser, null, [{
    key: 'isPNG',
    value: function isPNG(progressiveDataView) {
      // http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature
      return progressiveDataView.getBytes(0, PNG_SIGNATURE.length).join() === PNG_SIGNATURE.join();
    }
  }, {
    key: 'parse',
    value: function parse(progressiveDataView) {
      var parser = new PNGParser(progressiveDataView);
      return parser.parse();
    }
  }]);

  function PNGParser(progressiveDataView) {
    _classCallCheck(this, PNGParser);

    this.data = progressiveDataView;
    this.metadata = {};
  }

  _createClass(PNGParser, [{
    key: 'parse',
    value: function parse() {
      var _this = this;

      this.eachChunk(function (chunk) {
        var handler = _this['on' + chunk.type];
        if (handler) {
          handler.call(_this, chunk);
        }
      });

      return this.metadata;
    }
  }, {
    key: 'eachChunk',
    value: function eachChunk(callback) {
      this.data.advance(PNG_SIGNATURE.length);

      while (true) {
        // http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout
        var chunk = {};
        chunk.length = this.data.getNextUint(4);
        chunk.type = this.data.getNextString(4);
        chunk.data = this.data.getNextDataView(chunk.length);
        chunk.crc = this.data.getNextUint(4);

        callback(chunk);

        if (chunk.type === 'IEND') {
          break;
        }
      }
    }
  }, {
    key: 'onIHDR',
    value: function onIHDR(chunk) {
      // http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
      this.metadata.width = chunk.data.getNextUint(4);
      this.metadata.height = chunk.data.getNextUint(4);
    }
  }, {
    key: 'onpHYs',
    value: function onpHYs(chunk) {
      // http://www.w3.org/TR/2003/REC-PNG-20031110/#11pHYs
      var dimensions = {};
      dimensions.xPixelPerUnit = chunk.data.getNextUint(4);
      dimensions.yPixelPerUnit = chunk.data.getNextUint(4);
      dimensions.isMetreUnit = chunk.data.getNextUint(1) === 1;

      if (dimensions.isMetreUnit) {
        var pixelPerMetre = (dimensions.xPixelPerUnit + dimensions.yPixelPerUnit) / 2;
        this.metadata.ppi = Math.round(pixelPerMetre * INCH_TO_METRE_RATIO);
      }
    }
  }, {
    key: 'oniTXt',
    value: function oniTXt(chunk) {
      // http://www.w3.org/TR/2003/REC-PNG-20031110/#11iTXt
      var textualData = {};
      textualData.keyword = chunk.data.getNextString().replace('\0', '');
      textualData.isCompressed = chunk.data.getNextUint(1) === 1;
      textualData.compressionMethod = chunk.data.getNextUint(1);
      textualData.languageTag = chunk.data.getNextString().replace('\0', '');
      textualData.translatedKeyword = chunk.data.getNextString().replace('\0', '');
      textualData.text = chunk.data.getNextString();
      this.metadata.internationalTextualData = textualData;
    }
  }]);

  return PNGParser;
})();

exports['default'] = PNGParser;
module.exports = exports['default'];