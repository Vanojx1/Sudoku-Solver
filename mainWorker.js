importScripts('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.1/lodash.min.js');

var sudokuSolver = function(){
    //UTILITY FUNCTIONS
    String.prototype.removeAt = function(index) {
      return this.substr(0, index) + this.substr(index + 1);
    }
    Array.prototype.flattenMatrix = function(){
       var res = ""; for(var i = 0; i < this.length; i++){ for(var j = 0; j < this[i].length; j++){ res+=this[i][j]; } } return res;
    }
    //GET SUDOKU STRING AS ARRAY
    this.asArray = function(sdkuString){
      return _.chunk(sdkuString.split(""), 9);
    }
    //REPLACE 0 VALUES WITH 123456789 AND TRACK STARTING VALUES
    this.starting = [];
    this.prepare = function(sdkuString){
      var sdku = _.chunk(sdkuString.split(""), 9);
      for(var i = 0; i < sdku.length; i++){
        for(var j = 0; j < sdku[i].length; j++){
          if(sdku[i][j]=="0")
            sdku[i][j] = "123456789";
          else
            this.starting.push(i+""+j);
        }
      }
      return sdku;
    }
    //CHECK IF EVERY CELL VE ONLY 1 VALUE
    this.everyoneone = function(sdku){
      return sdku.filter(function(r){
        return r.filter(function(c){
          return c.length != 1;
        }).length != 0;
      }).length == 0;
    }
    //PARSE THE GRID UNTIL NO CHANGE CAN BE APPLIED
    this.reduceSdku = function(data, sdkuString){
      var parsed = [];
      for(var i = 0; i < data.length; i++){
        parsed[i] = [];
        for(var j = 0; j < data[i].length; j++){
          currentCell = data[i][j];
          if(currentCell.length === 1){
            data = this.propagate(i,j,currentCell,data);
            if(data == false) return false;
          }
        }
      }
      if(sdkuString != data.flattenMatrix()){
        return this.reduceSdku(data, data.flattenMatrix());
      }else
        return data;
    }
    //PROPAGATE THE GIVEN VALUE TO THE CHUNK THE ROW AND THE COL 
    this.propagate = function(i,j,currentCell,data){
      //CHUNK LIMITS
      var iLimit = (i < 3 ? 0 : (i < 6 ? 1 : 2))*3;
      var jLimit = (j < 3 ? 0 : (j < 6 ? 1 : 2))*3;
      //PROPAGATE ON CHUNK
      for(var k = iLimit; k < iLimit+3; k++){
        for(var l = jLimit; l < jLimit+3; l++){
          if(k != i && j != l)
          data[k][l] = data[k][l].replace(currentCell, "");
        }
      }
      //CHECK UNIQUE NUMS IN CHUNK 
      var n = "123456789";
      for(var p = 0; p < n.length; p++){
        var cN = n[p];
        var found = 0;
        var at = null;
        for(var k = iLimit; k < iLimit+3; k++){
          for(var l = jLimit; l < jLimit+3; l++){
            if(data[k][l].indexOf(cN) != -1){
              found++;
              at = [k,l];
            }
          }
        }
        if(found == 1)
          data[at[0]][at[1]] = cN;
      }
      //PROPAGATE ON ROW
      for (var p = 0; p < 9; p++) {
        if(p!=j)
        data[i][p] = data[i][p].replace(currentCell, "");
      }
      //PROPAGATE ON COL
      for (var p = 0; p < 9; p++) {
        if(p!=i)
        data[p][j] =  data[p][j].replace(currentCell, "");
      }
      //CHECK AVAILABLE
      for(var k = iLimit; k < iLimit+3; k++){
        for(var l = jLimit; l < jLimit+3; l++){
          if(data[k][k].length == 0)
            return false;
        }
      }
      return data;
    }
    //FIND THE CELL WITH THE MIN POSSIBLE VALUES
    this.findMin = function(sdku){
      var min = 9;
      var minPos = null;
      for(var i = 0; i < sdku.length; i++){
        for(var j = 0; j < sdku[i].length; j++){
          if(sdku[i][j].length > 1 && sdku[i][j].length < min){
            min = sdku[i][j].length;
            minPos = [i,j];
          }
        }
      }
      return minPos;
    }
    //PROCESS THE GRID TRYING EVERY POSSIBLE SOLUTION OF EACH REMAINING CELL
    this.process = function(sdku){
      var res = this.reduceSdku(sdku, "");
      var solution = [];
      if(res == false)
        return "";
      if(this.everyoneone(res)){
        return JSON.stringify(res);
      }
      var startFrom = this.findMin(res);
      if(startFrom != null){
        for(var i = 0; i < res[startFrom[0]][startFrom[1]].length; i++){
          var copy = JSON.parse(JSON.stringify(res));
          var cTry = copy[startFrom[0]][startFrom[1]].removeAt(i);
          copy[startFrom[0]][startFrom[1]] = cTry;
          solution+=this.process(copy);
        }
      }
      return solution;
    }
    //CREATE THE HTML OF THE SUDOKU
    this.printSdku = function(data){
      var table = "<table><tbody>";
      for (var i = 0; i < 9; i++) {
        table += "<tr>";
        for (var j = 0; j < 9; j++) {
          var cellClass = "";
          if((j+1)%3==0 && j!=0)
            cellClass += " borderRight ";

          if((i+1)%3==0)
            cellClass += " borderBottom ";

          if(data[i][j] == "0")
            cellClass += " zero "
          else if(this.starting.indexOf(i+""+j) != -1)
            cellClass += " startingnumber ";
          else
            cellClass += " number "

          table += "<td class='"+cellClass+"'>" +  data[i][j] + "</td>";
        }
        table += "</tr>";
      }
      return table += "</tbody></table>";
    }
    //SOLVE SUDOKU AND RETURN RESULT OBJECT
    this.solve = function(sdkuString){
      var t0 = performance.now();
      var solution = this.process(this.prepare(sdkuString));
      if(solution.length > 0){
        var t1 = performance.now();
        var solvedIn = ( (t1 - t0)/1000 ).toFixed(4);
        console.log("Sudoku solved in: "+solvedIn+" Seconds");
        return {
          solved: true,
          start: sdkuString,
          startAsArray: this.asArray(sdkuString),
          startHTML: this.printSdku(this.asArray(sdkuString)),
          solution: JSON.parse(solution).flattenMatrix(),
          solutionAsArray: JSON.parse(solution),
          solutionHTML: this.printSdku(JSON.parse(solution)),
          solvedIn: solvedIn
        };
      }else{
        console.log("Not a valid Sudoku!");
        return {
          solved: false,
          start: sdkuString,
          startAsArray: this.asArray(sdkuString),
          startHTML: this.printSdku(sdkuString),
          solution: null,
          solutionAsArray: null,
          solutionHTML: null,
          solvedIn: solvedIn
        };
      }
    }
}

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage({what: 'msg', msg: 'Working....'});

      var solver = new sudokuSolver();
     
      self.postMessage({what: 'result', solution: solver.solve(data.sdku)});
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);