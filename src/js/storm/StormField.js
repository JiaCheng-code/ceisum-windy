/*
 * direction degree
 * speed m/s
 **/
import Storm from "./Storm";

const TIME_RATE = 300; // 300s
const LINE_LENGTH_RATE = 10; // 10km

const StormField = function (viewer, data, options) {
  this._primitives = viewer.scene.primitives; // primitives
  this.data = data; //
  this.forecastTime = options.forecastTime * 60 * 60; // 时间范围
  this.currentTime = 0; // 当前时间
  this.storms = null; // 风暴

  this._init(); // 初始化
};

StormField.prototype = {
  constructor: StormField,
  // 初始化
  _init: function () {
    // 创建风暴
    this._createField();
  },
  // 创建风暴
  _createField: function () {
    var storms = []; // 风暴
    // 遍历风暴数据
    this.data.forEach(function (item) {
      // 创建风暴
      var storm = new Storm(item.x, item.y, item.speed, item.direction);
      // 设置风暴的路径
      storm.path = [
        storm.x,
        storm.y,
        storm.x + storm.u * TIME_RATE * LINE_LENGTH_RATE,
        storm.y + storm.v * TIME_RATE * LINE_LENGTH_RATE,
      ];
      // 添加风暴
      storms.push(storm);
    });
    // 设置风暴
    this.storms = storms;
  },
  // 开始动画
  animate: function () {
    var that = this;
    // 设置定时器
    this._timer = setInterval(function () {
      // 更新风暴的位置
      that.updatePosition();
      // 清除风暴
      that.clearStorm();
      // 绘制风暴
      that.updateStorm();
    }, 100);
  },
  // 清除风暴
  stopAnimate: function () {
    this._timer && clearInterval(this._timer);
    this._timer = null;
  },
  // 清除风暴
  resetPosition: function () {
    this.storms.forEach(function (storm) {
      storm.path[0] = storm.x;
      storm.path[1] = storm.y;
      storm.path[2] = storm.x + storm.u * TIME_RATE * LINE_LENGTH_RATE;
      storm.path[3] = storm.y + storm.v * TIME_RATE * LINE_LENGTH_RATE;
    });
  },
  /**
   * 首先，获取 x 和 y 坐标的整数部分，分别赋值给变量 x0 和 y0。
  如果 x 和 y 的值都是整数，则直接从网格中获取该位置的风向向量并返回。
  否则，计算出四个角的位置坐标，分别为 (x0, y0)、(x0+1, y0)、(x0, y0+1) 和 (x0+1, y0+1)。
  然后，使用递归调用 getIn 方法获取这四个角处的风向向量。
  最后，调用 _bilinearInterpolation 方法，利用这四个角处的风向向量进行双线性插值，以计算出该位置处的风向向量，并返回该结果。
   */
  // 更新风暴的位置
  updatePosition: function () {
    // 如果当前时间大于预测时间
    if (this.currentTime >= this.forecastTime) {
      this.resetPosition(); // 重置风暴的位置
      this.currentTime = 0; // 重置当前时间
      return;
    }
    // 更新当前时间
    this.currentTime += TIME_RATE; // 300s
    var that = this; // this
    // 遍历风暴
    this.storms.forEach(function (storm) {
      var dx = storm.u * that.currentTime; // x轴的偏移量
      var dy = storm.v * that.currentTime; // y轴的偏移量
      storm.path[0] += dx;
      storm.path[1] += dy;
      storm.path[2] += dx;
      storm.path[3] += dy;
    });
  },
  // 绘制风暴
  updateStorm: function () {
    var instances = [];
    // 遍历风暴
    this.storms.forEach(function (storm) {
      var polylineGeometry = new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(storm.path),
        colors: [Cesium.Color.WHITE.withAlpha(0), Cesium.Color.WHITE],
        width: 1.5,
        colorsPerVertex: true,
      });

      instances.push(
        new Cesium.GeometryInstance({
          geometry: polylineGeometry,
        })
      );
    });
    // 添加风暴
    this._polylines = this._primitives.add(
      new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PolylineColorAppearance({
          translucent: true,
        }),
        asynchronous: false,
      })
    );
  },
  // 清除风暴
  clearStorm: function () {
    this._polylines && this._primitives.remove(this._polylines);
  },
};

export default StormField;
