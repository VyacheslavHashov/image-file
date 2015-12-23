'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _progressiveDataView = require('./progressive-data-view');

var _progressiveDataView2 = _interopRequireDefault(_progressiveDataView);

var _pngParser = require('./png-parser');

var _pngParser2 = _interopRequireDefault(_pngParser);

var _jpegParser = require('./jpeg-parser');

var _jpegParser2 = _interopRequireDefault(_jpegParser);

var ImageFile = (function () {
  function ImageFile(arrayBuffer) {
    _classCallCheck(this, ImageFile);

    this.data = new _progressiveDataView2['default'](arrayBuffer);
    this.parse();
  }

  _createClass(ImageFile, [{
    key: 'parse',
    value: function parse() {
      var metadata = null;

      if (this.isPNG()) {
        metadata = _pngParser2['default'].parse(this.data);
      } else if (this.isJPEG()) {
        metadata = _jpegParser2['default'].parse(this.data);
      } else {
        return;
      }

      Object.assign(this, metadata);

      this.data.rewind();
    }
  }, {
    key: 'isPNG',
    value: function isPNG() {
      return _pngParser2['default'].isPNG(this.data);
    }
  }, {
    key: 'isJPEG',
    value: function isJPEG() {
      return _jpegParser2['default'].isJPEG(this.data);
    }
  }]);

  return ImageFile;
})();

exports['default'] = ImageFile;
module.exports = exports['default'];