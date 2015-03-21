module.exports = function() {
  var imus = [
    'CARPALS', 'METACARPALS', 
    'PP_1', 'IP_1', 'DP_1',
    'PP_2', 'IP_2', 'DP_2',
    'PP_3', 'IP_3', 'DP_3',
    'PP_4', 'IP_4', 'DP_4',
    'PP_5', 'IP_5', 'DP_5'
  ];

  function checkPalmDrop(frame) {
    // Desc: Look for flat palm down hand drop
    // pattern is in order of 17 imus in imuset above, with x y z
    // postive value for a greater than trigger, negitave for less than
    var pattern = [8, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1,
               -1, -1, -1]

    if (checkGesture(frame, pattern, 0)) {
      console.log('GESTURE HIT');
    }

  }
  function checkGesture(frame, pattern, count) {
      // move through all imus and vectors and check pattern against frame
      if (count >= 51)
        return true;
      var coord = (count % 3 === 0) ? 3 : (count % 3);
      var imu = MATH.ceil(count/3);
      if ((pattern[count] > 0) && (pattern[count] > frame[imus[imu]][coord]) ||
          (pattern[count] < 0) && (pattern[count] < frame[imus[imu]][coord])) {
            //push counter and check next element of pattern
            count++;
            checkGesture(gm, pattern, count);
      }
      else {
        return false
      }
    }

}
