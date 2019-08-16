var level1,
  level2,
  level3,
  projectOne,
  projectOneUsed,
  projectTwo,
  projectTwoUsed,
  values,
  level2total,
  level2count;

function load() {
  level1 = [];
  level2 = [];
  level3 = [];
  projectOne = 0;
  projectOneUsed = false;
  projectTwo = 0;
  projectTwoUsed = false;

  values = $("#grade-inputs input[type=number]");

  //console.log(values);

  for (var i = 0; i < 4; i++) {
    if ($(values[i]).val()) {
      level1[i] = parseInt($(values[i]).val());
      level1[i + 4] = parseInt($(values[i]).val());
    } else {
      level1[i] = null;
      level1[i + 4] = null;
    }
  }

  //console.log(level1);

  level2total = 0;
  level2count = 0;

  for (var i = 4; i < 8; i++) {
    var pos = i - 4;

    if ($(values[i]).val()) {
      level2[pos] = parseInt($(values[i]).val());
      // we have to produce two half unit scores from the full score
      level2[pos + 4] = parseInt($(values[i]).val());
      level2total = level2total + parseInt($(values[i]).val());
      level2count++;
    } else {
      level2[pos] = null;
      level2[pos + 4] = null;
    }
  }

  //console.log(level2);

  // are we missing some values, then make an average. NB: can't handle resits.
  if (level2count < 4) {
    var candidate = Math.round(level2total / level2count);

    candidate = Math.max(candidate, 35);

    for (i = 4; i < 8; i++) {
      var pos = i - 4;
      if (level2[pos] == null) {
        console.log("inserting candidate");
        level2[pos] = candidate;
        level2[pos + 4] = candidate;
      }
    }
  }

  //console.log(level2);

  for (var i = 8; i < 14; i++) {
    if ($(values[i]).val()) {
      level3[i - 8] = parseInt($(values[i]).val());
    } else {
      level3[i - 8] = null;
    }
  }

  // now get the project score...
  projectOne = parseInt($("#l3project").val());
  projectTwo = projectOne;

  //console.log(level3);
}

function sum(arr) {
  //note couldn't use a map/reduce as it won't work in old versions of IE
  var total = 0;
  $.each(arr, function() {
    total += this;
  });
  return total;
}

// Y score calculation...
function getUnusedBestEightScores(joined) {
  var unused8 = joined
    .sort(function(a, b) {
      return b - a;
    })
    .slice(0, 8);

  // either the project is split or has not been used at all...
  if (projectOneUsed && !projectTwoUsed) {
    //console.log('use second project score');
    unused8[7] = projectTwo;
    projectTwoUsed = true;
  }
  if (!projectOneUsed && !projectTwoUsed) {
    //console.log('use both project scrores');
    unused8[6] = projectOne;
    projectOneUsed = true;
    unused8[7] = projectTwo;
    projectTwoUsed = true;
  }
  return unused8;
}

// get figures for Z total - and handle the project score correctly
function getBestLevelThreeScores() {
  var best6 = new Array();
  var scores = level3.sort(function(a, b) {
    return a - b;
  });

  var score = scores.pop();
  var count = 0; // we only need 6 values for Z
  var z_correction = false; // flag when the project score matches the lowest value in the scores array, we dont split the project we push it all into Z

  while (score && count < 6) {
    if (score <= projectOne) {
      if (!projectOneUsed) {
        best6.push(projectOne);
        projectOneUsed = true; // half project has been used
      } else if (projectOneUsed && !projectTwoUsed) {
        // try to apply second project score

        best6.push(projectTwo);
        projectTwoUsed = true;
        if (scores.length == 1 && score == projectOne) {
          z_correction = true;
        }
        if (scores.length == 1 && count == 5) {
          scores.push(score);
        }
      } else {
        best6.push(score);
        if (count < 5) {
          score = scores.pop(); // dont pop off that last one if we already have 5
        }
      }
    } else {
      best6.push(score);
      score = scores.pop();
    }
    count++;
  }
  // split project variations corrected here - which ever way you try to code the project handling it always
  // ends up with some mess on the end to make corrections...here's some mess!
  if (scores.length == 0 && projectOneUsed) {
    scores.push(score);
  }
  if (z_correction) {
    scores.push(best6[4]);
    best6[4] = projectTwo;
    projectTwoUsed = true;
  }

  var scores = scores.sort(function(a, b) {
    return b - a;
  });

  var temp = level3;
  level3 = scores.slice(0, 6);
  return best6;
}

// get figures for X total
function getBestLevelOneScores(count) {
  return level1
    .sort(function(a, b) {
      return b - a;
    })
    .slice(0, count);
}

// count EMPTY values in array ( instead of zeroes )
function exemptionsAtLevelOne() {
  // count nulls in level1, there are quicker ways of doing this but we are aiming at compatibility
  // with jurassic browsers
  var count = 0;
  var i = level1.length;
  while (i--) {
    //console.log('typeof level1[i] -> ' + level1[i]);
    if (level1[i] === null) count++;
  }
  return count;
}

function calculate() {
  load();
  m = 8 - exemptionsAtLevelOne();
  n = Math.min(m, 6);
  // best 6 at level 1
  var X = getBestLevelOneScores(n);
  // now total marks on best 6 HCU at level 3
  var Z = getBestLevelThreeScores();
  // now the best unused scores from level 2 and 3
  var Y = getUnusedBestEightScores(level3.concat(level2));
  // dividend --------->  X + Y*3 + Z*5'
  // divisor ------------> n + 54
  // final weighted GPA
  return ((sum(X) + sum(Y) * 3 + sum(Z) * 5) / (n + 54)).toFixed(2);
}

function setCalculatedText() {
  $("#calculated-text").text(calculate());
}
