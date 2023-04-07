/**
 * Created by mao on 2017/9/13.
 */
import Particle from "./Particle";
import WindField from "./WindField";

var _primitives = null; // 场景中的图元。
var SPEED_RATE = 0.15; // 决定粒子速度的常量。
var PARTICLES_NUMBER = 500; // 粒子数量。
var MAX_AGE = 10; // 粒子最大生命值。
var BRIGHTEN = 1.5; // 粒子亮度。

var _windy = function (json, cesiumViewer) {
  this.windData = json; //从 JSON 对象解析出来的风数据。
  this.windField = null; //风场网格
  this.particles = []; //风场粒子
  this.lines = null; //风场线
  _primitives = cesiumViewer.scene.primitives; //场景中的图元
  this._init(); //初始化
};
_windy.prototype = {
  constructor: _windy,
  // 初始化风场网格和粒子的方法。
  _init: function () {
    // 创建风场网格
    this.windField = this.createField();
    // 创建风场粒子
    for (var i = 0; i < PARTICLES_NUMBER; i++) {
      this.particles.push(this.randomParticle(new Particle()));
    }
  },
  // 创建风场网格的方法。
  createField: function () {
    var data = this._parseWindJson();
    return new WindField(data);
  },
  // 更新粒子位置并绘制线条的方法。
  animate: function () {
    var self = this,
      field = self.windField, //风场网格
      particles = self.particles; //风场粒子

    var instances = [], //线条实例
      nextX = null, //下一步的x坐标
      nextY = null, //下一步的y坐标
      xy = null, //当前粒子的x,y坐标
      uv = null; //当前粒子的u,v坐标
    particles.forEach(function (particle) {
      if (particle.age <= 0) {
        // 如果粒子的生命值小于等于0，重新随机生成一个粒子。
        self.randomParticle(particle);
      }
      if (particle.age > 0) {
        // 如果粒子的生命值大于0，更新粒子的位置。
        var x = particle.x,
          y = particle.y;
        // 如果粒子的位置超出了风场网格的范围，重新随机生成一个粒子。
        if (!field.isInBound(x, y)) {
          particle.age = 0;
        } else {
          // 更新粒子的位置。
          uv = field.getIn(x, y);
          nextX = x + SPEED_RATE * uv[0];
          nextY = y + SPEED_RATE * uv[1];
          particle.path.push(nextX, nextY);
          particle.x = nextX;
          particle.y = nextY;
          // 将粒子的位置添加到线条实例中。
          instances.push(
            // 创建线条实例。
            self._createLineInstance(
              // 将风场网格的x,y坐标转换为经纬度坐标。
              self._map(particle.path),
              particle.age / particle.birthAge
            )
          );
          // 更新粒子的生命值。
          particle.age = particle.age - 1;
        }
      }
    });
    // 如果线条实例为空，删除线条。
    if (instances.length <= 0) this.removeLines();
    // 绘制线条。
    self._drawLines(instances);
  },
  // 随机生成粒子的方法。
  _parseWindJson: function () {
    // 现在我不想随机生成，而是通过json文件中的u,v,lon,lat来生成

    var uComponent = null,
      vComponent = null, // 风场网格的u,v坐标。
      header = null; // 风场网格的头部信息。
    uComponent = this.windData.U;
    header = this.windData.header;
    vComponent = this.windData.V;
    return {
      header: header,
      uComponent: uComponent,
      vComponent: vComponent,
    };
  },
  // 清除线条的方法。
  removeLines: function () {
    if (this.lines) {
      // 删除线条。
      _primitives.remove(this.lines);
      this.lines.destroy();
    }
  },
  _map: function (arr) {
    var length = arr.length, // 长度
      field = this.windField, // 风场网格
      dx = field.dx, // 风场网格的x坐标间隔
      dy = field.dy, // 风场网格的y坐标间隔
      west = field.west, // 风场网格的西边界
      south = field.north, // 风场网格的南边界
      newArr = []; // 新的数组
    // 遍历数组，将风场网格的x,y坐标转换为经纬度坐标。
    /**
     * 使用循环遍历粒子位置数组，每次增加2，以便获取每个位置的 x 和 y 坐标。对于每个位置，使用以下公式计算经度和纬度值，并将它们添加到 newArr 中：经度 = west + x * dx纬度 = south - y * dy
     */
    for (var i = 0; i <= length - 2; i += 2) {
      newArr.push(west + arr[i] * dx, south - arr[i + 1] * dy);
    }
    return newArr;
  },
  // 创建线条实例的方法。
  _createLineInstance: function (positions, ageRate) {
    // 根据粒子的生命值，设置线条的颜色。
    var colors = [],
      // 线条的长度。
      length = positions.length,
      // 线条的中间位置。
      count = length / 2;
    // 根据粒子的生命值，设置线条的颜色。
    for (var i = 0; i < length; i++) {
      colors.push(
        Cesium.Color.WHITE.withAlpha((i / count) * ageRate * BRIGHTEN)
      );
    }
    // 创建线条实例。
    return new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        colors: colors,
        width: 1.5,
        colorsPerVertex: true,
      }),
    });
  },
  // 将线条添加到 Cesium 视图的方法。
  _drawLines: function (lineInstances) {
    // 删除线条。
    this.removeLines();
    // 将线条添加到 Cesium 视图。
    var linePrimitive = new Cesium.Primitive({
      appearance: new Cesium.PolylineColorAppearance({
        translucent: true,
      }),
      geometryInstances: lineInstances,
      asynchronous: false,
    });
    // 将线条添加到 Cesium 视图。
    this.lines = _primitives.add(linePrimitive);
  },
  // 生成新随机粒子的方法。
  randomParticle: function (particle) {
    var safe = 30, // 安全次数
      x, // 风场网格的x坐标
      y; // 风场网格的y坐标
    do {
      // 生成随机的风场网格的x,y坐标。
      x = Math.floor(Math.random() * (this.windField.cols - 2));
      y = Math.floor(Math.random() * (this.windField.rows - 2));
      // 如果风场网格的u,v坐标为0，则继续生成随机的风场网格的x,y坐标。
    } while (this.windField.getIn(x, y)[2] <= 0 && safe++ < 30);

    particle.x = x; // 风场网格的x坐标
    particle.y = y; // 风场网格的y坐标
    particle.age = Math.round(Math.random() * MAX_AGE); // 粒子的生命值
    particle.birthAge = particle.age; // 粒子的初始生命值
    particle.path = [x, y]; // 粒子的位置
    return particle;
  },
};

export default _windy;
