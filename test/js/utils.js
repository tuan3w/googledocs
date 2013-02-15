/**
 * Matrix methods
 *
 */
var Matrix = {
    create : function(m, n) {
        var mt = new Array(m);

        for (var i = 0; i < m; i++)
            mt[i] = new Array(n);

        return mt;
    },
    fill : function(matrix, v) {
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix[0].length; j++) {
                matrix[i][j] = v;
            }
        }
    },
    clone : function(m) {
        var c = Matrix.create(m.length, m[0].length);
        for (var i = 0; i < m.length; i++) {
            for (var j = 0; j < m[0].length; j++) {
                c[i][j] = m[i][j];
            }
        }
        return c;
    },
    convolve : function(m1, filter) {
        var temp = Matrix.clone(m1);

        var divisionFactor = 0;
        var halfSize = Math.floor(filter.length / 2);
        // for ( y2 = 0; y2 < filter.length; y2++)
        //     for ( x2 = 0; x2 < filter.length; x2++) {
        //         divisionFactor += filter[y2][x2];

        //     }
        // if (divisionFactor < 1)
            divisionFactor = 1;
        //apply filter
        var mR = m1.length - filter.length;
        var mC = m1[0].length - filter.length;
        for (var i = 0; i < mR; ++i) {
            for (var j = 0; j < mC; ++j) {
                var result = 0;

                for (var x2 = 0; x2 < filter.length; ++x2)
                    for (var y2 = 0; y2 < filter.length; ++y2) {
                        result += m1[i+x2][j + y2] * filter[x2][y2];
                    }
                result /= divisionFactor;
                temp[i + halfSize][j + halfSize] = Math.floor(result);

            }
        }

        return temp;
    }
};

/**
 * Point object
 */
function Point(x,y){
    this.x = x;
    this.y = y;
}

/*
 * Tool for line check
 */