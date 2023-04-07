/**
 * Created by mao on 2017/9/13.
 */
var _windField = function (obj) {
  this.west = null; //西边界
  this.east = null; //东边界
  this.south = null; //南边界
  this.north = null; //北边界
  this.rows = null; //行数
  this.cols = null; //列数
  this.dx = null; //x坐标间隔
  this.dy = null; //y坐标间隔
  this.unit = null; //单位
  this.date = null; //日期

  this.grid = null; //网格
  this._init(obj); //初始化
};

_windField.prototype = {
  constructor: _windField,
  // 初始化网格的方法。
  _init: function (obj) {
    // 解析网格数据。
    var header = obj.header, // 网格头部信息。
      uComponent = obj["uComponent"], // 网格的u坐标。
      vComponent = obj["vComponent"]; // 网格的v坐标。

    this.west = +header["lo1"]; // 获取网格的西边界。
    this.east = +header["lo2"]; // 获取网格的东边界。
    this.south = +header["la2"]; // 获取网格的南边界。
    this.north = +header["la1"]; // 获取网格的北边界。
    this.rows = +header["ny"]; // 获取网格的行数。
    this.cols = +header["nx"]; // 获取网格的列数。
    this.dx = +header["dx"]; // 获取网格的x坐标间隔。
    this.dy = +header["dy"]; // 获取网格的y坐标间隔。
    this.unit = header["parameterUnit"]; // 获取网格的单位。
    this.date = header["refTime"]; // 获取网格的日期。

    this.grid = []; // 初始化网格。
    var k = 0, // 网格的索引。
      rows = null, // 网格的行。
      uv = null; // 网格的uv坐标。
    // 遍历网格的行。
    for (var j = 0; j < this.rows; j++) {
      // 初始化网格的行。
      rows = [];
      // 遍历网格的列。
      for (var i = 0; i < this.cols; i++, k++) {
        // 计算网格的uv坐标。
        uv = this._calcUV(uComponent[k], vComponent[k]);
        rows.push(uv);
      }
      // 将网格的行添加到网格中。
      this.grid.push(rows);
    }
  },
  /**
   * 计算网格的uv坐标的方法。
   * @param {*} u  u坐标
   * @param {*} v  v坐标
   * @returns  uv坐标,u,v,uv坐标的模
   */
  _calcUV: function (u, v) {
    // 计算网格的uv坐标。
    return [+u, +v, Math.sqrt(u * u + v * v)];
  },
  /**
   * 首先，计算 x 和 y 坐标的差值，分别赋值给变量 rx 和 ry。
    然后，使用这些差值和四个角的风向向量计算出 a、b、c 和 d 四个系数，分别表示在四个角处的插值权重。
    接下来，使用插值公式计算出在位置(x, y)处的风向向量的 u 和 v 分量，其中 u 和 v 分别表示水平和垂直方向上的风向分量。
    最后，调用 _calcUV 方法将 u 和 v 转换为风向角度和速度，并返回该结果。
   * @param {*} x x坐标
   * @param {*} y y坐标
   * @param {*} g00 网格的左上角的uv坐标
   * @param {*} g10 网格的右上角的uv坐标
   * @param {*} g01 网格的左下角的uv坐标
   * @param {*} g11 网格的右下角的uv坐标
   * @returns uv坐标,u,v,uv坐标的模
   */
  _bilinearInterpolation: function (x, y, g00, g10, g01, g11) {
    var rx = 1 - x; // x坐标的差值。
    var ry = 1 - y; // y坐标的差值。
    var a = rx * ry, // x坐标的差值乘以y坐标的差值。
      b = x * ry, // x坐标的差值乘以y坐标的差值。
      c = rx * y, // x坐标的差值乘以y坐标的差值。
      d = x * y; // x坐标的差值乘以y坐标的差值。
    // 计算网格的uv坐标。
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return this._calcUV(u, v);
  },

  getIn: function (x, y) {
    /**
     * 首先，获取 x 和 y 坐标的整数部分，分别赋值给变量 x0 和 y0。
    如果 x 和 y 的值都是整数，则直接从网格中获取该位置的风向向量并返回。
    否则，计算出四个角的位置坐标，分别为 (x0, y0)、(x0+1, y0)、(x0, y0+1) 和 (x0+1, y0+1)。
    然后，使用递归调用 getIn 方法获取这四个角处的风向向量。
    最后，调用 _bilinearInterpolation 方法，利用这四个角处的风向向量进行双线性插值，以计算出该位置处的风向向量，并返回该结果。
     */
    var x0 = Math.floor(x),
      y0 = Math.floor(y),
      x1,
      y1;
    if (x0 === x && y0 === y) return this.grid[y][x];

    x1 = x0 + 1;
    y1 = y0 + 1;
    // 递归调用 getIn 方法获取这四个角处的风向向量。
    var g00 = this.getIn(x0, y0),
      g10 = this.getIn(x1, y0),
      g01 = this.getIn(x0, y1),
      g11 = this.getIn(x1, y1);
    // 调用 _bilinearInterpolation 方法，利用这四个角处的风向向量进行双线性插值，以计算出该位置处的风向向量，并返回该结果。
    return this._bilinearInterpolation(x - x0, y - y0, g00, g10, g01, g11);
  },
  // 判断网格是否在边界内。
  isInBound: function (x, y) {
    if (x >= 0 && x < this.cols - 2 && y >= 0 && y < this.rows - 2) return true;
    return false;
  },
};

export default _windField;
