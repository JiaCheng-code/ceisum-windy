import Windy from "./js/windy/Windy";
import StormField from "./js/storm/StormField";
import $ from "jquery";

var viewer = new Cesium.Viewer("cesiumContainer", {
  imageryProvider: Cesium.createTileMapServiceImageryProvider({
    url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
  }),
  geocoder: false,
  baseLayerPicker: false,
});

var czml = [
  {
    id: "document",
    name: "CZML Polygon - Intervals and Availability",
    version: "1.0",
    clock: {
      interval: "2012-08-04T16:00:00Z/2012-08-04T17:00:00Z",
      currentTime: "2012-08-04T16:00:00Z",
      multiplier: 900,
    },
  },
  {
    id: "dynamicWind",
    name: "Dynamic Wind with Intervals",
    availability: "2012-08-04T16:00:00Z/2012-08-04T17:00:00Z",
    path: {
      material: {
        polylineOutline: {
          color: {
            rgba: [255, 255, 255, 255],
          },
          outlineColor: {
            rgba: [255, 255, 0, 125],
          },
          outlineWidth: 1,
        },
      },
      width: 3,
      leadTime: 1,
      resolution: 5,
    },
    billboard: {
      image: "./Data/TVS.png",
      scale: 0.15,
    },
    // "position": {
    // 	"cartographicDegrees": [120, 20, 0]
    // }
    position: {
      epoch: "2012-08-04T16:00:00Z",
      cartographicDegrees: [
        400, 120, 20, 0, 400, 119, 20.5, 0, 800, 118, 21, 0, 1200, 117, 21.5, 0,
        1600, 116, 22, 0, 2000, 115, 23.5, 0, 2400, 114, 24, 0, 3600, 110, 27,
        0,
      ],
    },
  },
];

const g = function (id) {
  return document.getElementById(id);
};
/* 1. CZML 龙卷移动轨迹 （效果不满意） */
// g('czml').onclick = function () {
//     viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
// }

/* 2. 动态风场 */
g("grid").onclick = function () {
  reqDynamicWind();
};

/* 3. 龙卷移动轨迹 */
// g('storm').onclick = function () {
//     var data = [{
//         x: 120.3077,
//         y: 31.0539,
//         speed: 15,
//         direction: 269
//     }];
//     var stormField = new StormField(viewer, data, {
//         forecastTime: 1
//     });
//     stormField.animate();
// }

var windy;
// 动态风场
function reqDynamicWind() {
  $.ajax({
    type: "get",
    url: "./Data/wind_with_lonlat.json",
    dataType: "json",
    success: function (response) {
      console.log(response);
      var header = response.header;
      /**
       * description: 生成风场矩形
       */
      createRect(header["lo1"], header["la2"], header["lo2"], header["la1"]);
      viewer.camera.setView({
        destination: Cesium.Rectangle.fromDegrees(
          header["lo1"], // west中文 东经
          header["la2"], // south 中文 南纬
          header["lo2"], // east  中文 西经
          header["la1"] // north 中文 北纬
        ),
      });
      /**
       * description: 生成动态风场
       */
      windy = new Windy(response, viewer);
      redraw();
    },
    error: function (errorMsg) {
      alert("请求数据失败1!");
    },
  });
}

var timer = null;
// 重绘
function redraw() {
  timer = setInterval(function () {
    windy.animate();
  }, 200);
}

function createRect(west, south, east, north) {
  /**
   * description: 生成风场矩形
   */
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: [
        getRectInstance(Cesium.Rectangle.fromDegrees(west, south, east, north)),
      ],
      appearance: new Cesium.PolylineColorAppearance({
        translucent: false,
      }),
    })
  );
}
/**
 * description: 生成风场矩形
 */
function getRectInstance(rect) {
  return new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleOutlineGeometry({
      rectangle: rect,
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED),
    },
  });
}
