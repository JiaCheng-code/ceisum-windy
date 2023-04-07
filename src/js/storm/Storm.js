const degreeKm = 11100000; // 1 degree = 11100000 km
const Storm = function (x, y, speed, direction) {
  var radians = (direction / 180) * Math.PI; // degree to radians
  var sin = Math.sin(radians); // sin
  var cos = Math.cos(radians); // cos
  this.x = x; // longitude
  this.y = y; // latitude
  this.u = (speed * sin) / degreeKm; // x speed
  this.v = (speed * cos) / degreeKm; // y speed
  this.path = null; // path
};

export default Storm;
