// Each chart should define a function that takes the data as an argument
(function() {
  var App = function() {};

  App.prototype.amounts = {};

  App.prototype.init = function(chartEl, data) {
    var _this = this;

    for (var i = 0; i < data.length; i++) {
      var el = data[i],
        amount = parseInt(el.Tran_Amt1.replace('$', ''));

      if (this.amounts[el.Filer_NamL]) {
        this.amounts[el.Filer_NamL] += amount;
      } else {
        this.amounts[el.Filer_NamL] = amount;
      }
    }

    data = _.collect(this.amounts, function(v, k) { return {name: k, amount: v}});
    data = _.sortBy(data, function(el) { return -el.amount; });
    data = _.filter(data, function(el) { return !isNaN(el.amount); });

    var margin = {top: 30, right: 40, bottom: 300, left: 50},
      width = 960 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

    var formatDollar = d3.format("$.0");

    var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatDollar);

    var svg = d3.select(chartEl).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.amount; })]);

    svg.append("g")
      .attr("class", "x axis")
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
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Dollar amount");

    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { 
        return x(d.name); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.amount); })
      .attr("height", function(d) { return height - y(d.amount); });

    function type(d) {
      d.frequency = +d.frequency;
      return d;
    }

  };

  chart1 = function(chartEl, data) {
    var app = new App();
    app.init(chartEl, data);
  };

})();