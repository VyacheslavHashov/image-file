'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ProgressiveDataView = (function () {
  function ProgressiveDataView(arrayBuffer) {
    var byteOffset = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
    var byteLength = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

    _classCallCheck(this, ProgressiveDataView);

    // `new DataView(...args)` does not work on Safari 9.0...
    if (byteOffset === undefined) {
      this.dataView = new DataView(arrayBuffer);
    } else if (byteLength === undefined) {
      this.dataView = new DataView(arrayBuffer, byteLength);
    } else {
      this.dataView = new DataView(arrayBuffer, byteOffset, byteLength);
    }

    this.buffer = this.dataView.buffer;
    this.position = 0;
  }

  _createClass(ProgressiveDataView, [{
    key: 'advance',
    value: function advance(length) {
      this.position += length;
      return length;
    }
  }, {
    key: 'rewind',
    value: function rewind() {
      this.position = 0;
    }
  }, {
    key: 'getBytes',
    value: function getBytes(offset, length) {
      var bytes = [];

      for (var i = 0; i < length; i++) {
        var uint = this.getUint(offset + i, 1);
        bytes.push(uint);
      }

      return bytes;
    }
  }, {
    key: 'getNextBytes',
    value: function getNextBytes(length) {
      return this.getBytes(this.position, this.advance(length));
    }
  }, {
    key: 'getString',
    value: function getString(offset) {
      var length = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];

      var characters = [];

      for (var i = 0; i < length; i++) {
        var uint = this.getUint(offset + i, 1);
        characters.push(String.fromCharCode(uint));

        if (offset + i === this.dataView.byteLength - 1 || length === Infinity && uint === 0) {
          break;
        }
      }

      return characters.join('');
    }
  }, {
    key: 'getNextString',
    value: function getNextString() {
      var length = arguments.length <= 0 || arguments[0] === undefined ? Infinity : arguments[0];

      var string = this.getString(this.position, length);
      this.advance(string.length);
      return string;
    }
  }, {
    key: 'getUint',
    value: function getUint(offset, length) {
      return this.dataView['getUint' + 8 * length](offset);
    }
  }, {
    key: 'getNextUint',
    value: function getNextUint(length) {
      return this.getUint(this.position, this.advance(length));
    }
  }, {
    key: 'getDataView',
    value: function getDataView(offset, length) {
      return new ProgressiveDataView(this.dataView.buffer, offset, length);
    }
  }, {
    key: 'getNextDataView',
    value: function getNextDataView(length) {
      return this.getDataView(this.position, this.advance(length));
    }
  }]);

  return ProgressiveDataView;
})();

exports['default'] = ProgressiveDataView;
module.exports = exports['default'];