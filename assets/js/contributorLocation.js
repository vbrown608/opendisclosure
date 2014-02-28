(function() {

  this.ContributorLocation = (function() {
    function App() {
      var _this = this;

      this.init = _.bind(this.init, this);

      d3.csv('assets/data/mayoral_contributions_A.csv', this.init);
    }


    App.prototype.init = function(data) {
      var amounts = {};
      for (var i = 0; i < data.length; i++) {
        var el = data[i],
          amount = parseInt(el.Tran_Amt1),
          candidate = el.Filer_NamL,
          donor = el.Tran_NamF + ' ' + el.Tran_NamL
          city = el.Tran_City,
          state = el.Tran_State;

        // Add candidates
        if (!amounts[candidate]) {
          amounts[candidate] = {
            'dollars': {
              'total': 0,
              'oakland': 0,
              'california': 0
            },
            'donors': {
              'total': {},
              'oakland': {},
              'california': {}
            }
          }
        }

        // Increment donations and donors
        amounts[candidate]['dollars']['total'] += amount;
        amounts[candidate]['donors']['total'][donor] = true
        if (state == 'CA') {
          amounts[candidate]['dollars']['california'] += amount;
          amounts[candidate]['donors']['california'][donor] = true
          if (city == 'Oakland') {
            amounts[candidate]['dollars']['oakland'] += amount;
            amounts[candidate]['donors']['oakland'][donor] = true
          }
        }
      }

      // Convert data to an array of objects
      data = _.collect(amounts, function(v, k) {

        // Summing donor totals
        total_donors = _.collect(v['donors']['total'], function(donor, status) {
          return status;
        }).length
        oakland_donors = _.collect(v['donors']['oakland'], function(donor, status) {
          return status;
        }).length
        california_donors = _.collect(v['donors']['california'], function(donor, status) {
          return status;
        }).length


        return {
          name: k,
          dollars: {
            total: v['dollars']['total'],
            oakland: v['dollars']['oakland'],
            california: v['dollars']['california']
          },
          donors: {
            total: total_donors,
            oakland: oakland_donors,
            california: california_donors
          }
        }
      });
      data = _.sortBy(data, function(el) {
        return -el.dollars.total;
      });
      data = _.filter(data, function(el) {
        return !isNaN(el.dollars.total) || !isNaN(el.dollars.oakland) || isNaN(el.dollars.california);
      });

      // Initialize chart type (updates come from radio buttons)
      var scale_type = 'total'; // total or percent
      var count_type = 'dollars'; // dollars or donors

      // Set variables for D3
      var margin = {
        top: 30,
        right: 40,
        bottom: 300,
        left: 50
      },
        width = 960 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

      var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      var y = d3.scale.linear()
        .range([height, 0]);

      setYFormat = function() {
        var format_string;
        if (scale_type == 'percent') {
          y.domain([0, 1]);
          format_string = "%.0";

        } else {
          y.domain([0, d3.max(data, function(d) {
            return d[count_type].total;
          })]);
          if (count_type == 'dollars') {
            format_string = "$.0";
          } else {
            format_string = "0";
          }
        }
        format = d3.format(format_string);

        yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .tickFormat(format);
      }
      setYFormat();

      var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(data.map(function(d) {
        return d.name;
      }));
      y.domain([0, d3.max(data, function(d) {
        return d[count_type].total;
      })]);

      // Set up the chart
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
          return "rotate(-65)"
        });

      svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(scale_type);

      // Create a container for each bar.
      var valgroup = svg.selectAll('g.valgroup')
        .data(data)
        .enter().append('g')
        .attr('class', 'g')
        .attr("transform", function(d) {
          return "translate(" + x(d.name) + ",0)";
        });

      var colors = ["#98abc5", "#a05d56", "#ff8c00"]

      rectangleData = function(d) {
        d = d[count_type];
        if (scale_type == 'total') {
          result = [
            [d.total, d.total - d.california],
            [d.california, d.california - d.oakland],
            [d.oakland, d.oakland]
          ];
          return result;
        } else {
          result = [
            [1, (d.total - d.california) / d.total],
            [d.california / d.total, (d.california - d.oakland) / d.total],
            [d.oakland / d.total, d.oakland / d.total]
          ];
          return result;
        }
      }

      // Fill the bars with stacked rectangles.
      var rectangles = valgroup.selectAll('rect')
        .data(rectangleData)
        .enter().append('rect')
        .attr('width', x.rangeBand())
        .attr('y', function(d) {
          return y(d[0]);
        })
        .attr('height', function(d) {
          return height - y(d[1]);
        })
        .attr('fill', function(d, i) {
          return colors[i];
        });

      d3.selectAll("input")
        .on("change", update);

      function update() {
        scale_type = $("#scale_type input[type='radio']:checked").val();
        count_type = $("#count_type input[type='radio']:checked").val();

        setYFormat();

        d3.selectAll('.y-axis').call(yAxis)
        d3.selectAll('.y-axis .label').text(scale_type);

        rectangles = rectangles.data(rectangleData);

        rectangles
          .attr('width', x.rangeBand())
          .attr('y', function(d) {
            return y(d[0]);
          })
          .attr('height', function(d) {
            return height - y(d[1]);
          });
      }
    }

    return App;
  })();

}).call(this);