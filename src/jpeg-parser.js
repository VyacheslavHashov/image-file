import ExifParser from 'exif-js'

const MARKER_SIGNATURE = 0xFF

const SOI_MARKER = [MARKER_SIGNATURE, 0xD8]

// http://www.setsuki.com/hsp/ext/jpg.htm
const MARKER_TYPES = new Map()
MARKER_TYPES.set(0xC0, 'SOF0')
MARKER_TYPES.set(0xC2, 'SOF2')
MARKER_TYPES.set(0xC4, 'DHT')
for (var i = 0; i <= 7; i++) {
  MARKER_TYPES.set(0xD0 + i, `RST${i}`)
}
MARKER_TYPES.set(0xD8, 'SOI')
MARKER_TYPES.set(0xD9, 'EOI')
MARKER_TYPES.set(0xDA, 'SOS')
MARKER_TYPES.set(0xDB, 'DQT')
MARKER_TYPES.set(0xDD, 'DRI')
for (var i = 0; i <= 15; i++) {
  MARKER_TYPES.set(0xE0 + i, `APP${i}`)
}
MARKER_TYPES.set(0xFE, 'COM')

const NON_DATA_SEGMENT_TYPE_NAMES = ['SOI', 'EOI']

const DENSITY_UNIT = {
  NONE: 0,
  INCH: 1,
  CENTIMETER: 2
}

const INCH_TO_CENTIMETER_RATIO = 2.54

export default class JPEGParser {
  static isJPEG(progressiveDataView) {
    return progressiveDataView.getBytes(0, SOI_MARKER.length).join() === SOI_MARKER.join()
  }

  static parse(progressiveDataView) {
    let parser = new JPEGParser(progressiveDataView)
    return parser.parse()
  }

  constructor(progressiveDataView) {
    this.data = progressiveDataView
    this.metadata = {}
  }

  parse() {
    this.parseSegments()
    this.parseExif()
    return this.metadata
  }

  parseSegments() {
    this.eachSegment((segment) => {
      let handler = this['on' + segment.typeName]

      if (handler) {
        handler.call(this, segment)
      }
    })
  }

  parseExif() {
    try {
      var tags = ExifParser.readFromBinaryFile(this.data.buffer)
    } catch(error) {
      return
    }

    if (!tags) {
      return
    }
    if (tags.XResolution && tags.YResolution) {
      this.parseDensity(tags.XResolution, tags.YResolution, tags.ResolutionUnit - 1)
    }
  }

  eachSegment(callback) {
    while (true) {
      let markerSignature = this.data.getNextUint(1)
      if (markerSignature !== MARKER_SIGNATURE) {
        break;
      }

      let segment = {}
      segment.type = this.data.getNextUint(1)
      segment.typeName = MARKER_TYPES.get(segment.type)

      if (!NON_DATA_SEGMENT_TYPE_NAMES.includes(segment.typeName)) {
        segment.length = this.data.getNextUint(2)
        segment.data = this.data.getNextDataView(segment.length - 2)
      }

      callback(segment)
    }
  }

  onAPP0(segment) {
    segment.identifier = segment.data.getNextString(5)
    segment.version = segment.data.getNextBytes(2)
    segment.densityUnit = segment.data.getNextUint(1)
    segment.xDensity = segment.data.getNextUint(2)
    segment.yDensity = segment.data.getNextUint(2)
    segment.xThumbnailSize = segment.data.getNextUint(1)
    segment.yThumbnailSize = segment.data.getNextUint(1)
    segment.thumbnailData = segment.data.getNextDataView(segment.xThumbnailSize * segment.yThumbnailSize * 3)
    this.parseDensity(segment.xDensity, segment.yDensity, segment.densityUnit)
  }

  onSOF0(segment) {
    segment.precision = segment.data.getNextUint(1)
    this.metadata.height = segment.height = segment.data.getNextUint(2)
    this.metadata.width = segment.width = segment.data.getNextUint(2)
    segment.colorComponentCount = segment.data.getNextUint(1)
  }

  parseDensity(xDensity, yDensity, unit) {
    let averageDensity = (xDensity + yDensity) / 2

    if (unit === DENSITY_UNIT.INCH) {
      this.metadata.ppi = Math.round(averageDensity)
    } else if (unit === DENSITY_UNIT.CENTIMETER) {
      this.metadata.ppi = Math.round(averageDensity * INCH_TO_CENTIMETER_RATIO)
    }
  }
}
