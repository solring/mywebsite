var update_view;

(function($, undefined) {
"use strict";

var
  g_paths = [],
  actives = [],
  svg,
  width, height,
  xs, ys,
  xAxis, yAxis,
  line,
  startYear = 1990,
  endYear = 2012,
  trend_type,
  color = d3.scale.category20(),

  init = function() {
    var
      max_width = $('body').width() - $('#search-panel').width() - 100,
      max_height = $('body').height() - $('#active-listing').height() - 100,
      margin = {top: 20, right: 20, bottom: 30, left: 50};

    width = max_width - margin.left - margin.right;
    height = max_height - margin.top - margin.bottom;
    xs = d3.time.scale().range([0, width]);
    ys = d3.scale.linear().range([height, 0]);
    xAxis = d3.svg.axis().scale(xs).orient("bottom");
    yAxis = d3.svg.axis().scale(ys).orient("left");
    line = d3.svg.line()
      .interpolate("basis")
      .x(function(d, i) { return xs(d.x); })
      .y(function(d) { return ys(d.y); }),

    svg = d3.select('#drawarea').append("svg:svg")
      .attr("width", max_width)
      .attr("height", max_height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    $('#active-listing').width(max_width - margin.left - margin.right);
    $('#active-tag-container').slimScroll({height: 'auto'});
  },

  update_view = function() {
    xs.domain([
        d3.time.format("%Y").parse(String(startYear)),
        d3.time.format("%Y").parse(String(endYear))
    ]);
    ys.domain([
        d3.min(g_paths, function(c) {
          return d3.min(c.points, function(d) { return d.y; }) }),
        d3.max(g_paths, function(c) {
          return d3.max(c.points, function(d) { return d.y; }) })
    ]);

    d3.selectAll("g.axis").remove();
    svg.append('g')
      .attr("class", "axis")
      .attr("transform", "translate(0, " + height + ")")
      .call(xAxis);
    svg.append('g')
      .attr("class", "axis")
      .call(yAxis);

    svg.selectAll(".data-path").remove();
    svg.selectAll(".data-path")
      .data(g_paths, function(d) { return d.keyword; }).enter()
      .append("svg:path")
      .attr("class", "data-path")
      .attr("d", function(d) { return line(d.points); })
      .attr("stroke", function(d) {
        return color(Math.floor(d.total / 10));
      })
      .on("mouseover", function(d, i) {
        d3.select(this).classed("current", true);
        $('.tag[data-id="' + d.keyword + '"]').addClass('highlight');
      }).on("mouseout", function(d, i) {
        d3.select(this).classed("current", false);
        $('.tag[data-id="' + d.keyword + '"]').removeClass('highlight');
      });
  },

  add_keyword_core = function(data) {
    var path = {
      keyword: data.keyword,
      total: data.total,
       points: []
    };
    for (var year in data.freq) {
      if (year >= startYear && year <= endYear) {
        path.points.push({
          x: d3.time.format("%Y").parse(year),
          y: data.freq[year]
        });
      }
    }
    g_paths.push(path);

    var $tag = $('#keyword-tag-tmpl').tmpl(data);
    var tc = color(Math.floor(data.total / 10));
    $tag.css("background-color", tc);
    $tag.css("border-color", d3.rgb(tc).darker().toString());
    // Adjust text color by contrast
    $tag.css("color",
      (parseInt(tc.substring(1), 16) > 0xffffff / 2)? '#000': '#FFF');

    $tag.hover(function() {
      svg.selectAll('.data-path').data([path],
        function(d) { return d.keyword; }).classed("current", true);
    });
    $tag.mouseleave(function() {
      svg.selectAll('.data-path').data([path],
        function(d) { return d.keyword; }).classed("current", false);
    });

    $tag.find('.close').click(function() {
      g_paths = g_paths.filter(function(p) {
        return p.keyword != data.keyword;
      });
      svg.select('.data-path').data([path],
        function(d) { return d.keyword; }).remove();
      $tag.remove();
      actives.splice(actives.indexOf(data.keyword), 1);
      update_view();
    });

    $('#active-tag-container').append($tag);
    $('#loading-modal').modal('hide');
  },

  add_keyword = function(keyword) {
    trend_type = $('input[name="type"]:checked').val();
    if (actives.indexOf(keyword) != -1) {
      return;
    } else {
      actives.push(keyword);
    }

    $('#loading-modal').modal();
    $.getJSON("/" + trend_type + "/" + keyword + ".json", function(data) {
      add_keyword_core(data);
      update_view();
    });
  },

  topic_trends = function() {
    $.getJSON("/topic/all", function(data) {
      for (var i = 0; i < data.length; i++) {
        add_keyword_core(data[i]);
      }
      update_view();
    });
  };

  window.result_activated = add_keyword;

  $(window).resize(function(e) {
    var $el = $('#drawarea');
  });

  $('document').ready(function() {
    $('#loading-modal').modal({backdrop: false, keyboard: false, show: false});
    init();
    topic_trends();

    $('input[name="type"]').change(function() {
      actives = [];
      g_paths = [];
      svg.selectAll('.data-path').remove();
      $('#active-tag-container').empty();
    });
  });
}(jQuery));
