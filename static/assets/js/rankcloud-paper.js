/**
 * rankcloud-author.js
 *
 * depend on: rankcloud-common.js
 */

(function($, undefined) {
"use strict";

var
  force = d3.layout.force(),
  g_nodes = force.nodes(),
  g_links = force.links(),
  svg = undefined,
  circle_size = 20,
  link_distance = 100,
  trav_stack = [],

  resize_viewport = function(width, height) {
    force.size([width, height]);
    d3.select('svg').attr('width', width).attr('height', height);
  },
  
  preprocess_link = function(nd, lk) {
    var lks = [];

    var find_index_of_id = function(nodes, id) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id == id) {
          return i;
        }
      }
      return -1;
    }
    for (var i = 0; i < lk.length; i++) {
      lks.push({
        source: find_index_of_id(nd, lk[i].source),
        target: find_index_of_id(nd, lk[i].target)
      });
    }
    return lks;
  },

  rankcloud = function(data) {
    var width = 1300,height = 700;
    trav_stack = []; // reset stack
    trav_stack.push(data.center);

    g_nodes = data.nodes;
    g_links = preprocess_link(data.nodes, data.links);

    force.nodes(g_nodes).links(g_links);
    update();
  },
  
  extend = function(data) {
    trav_stack.push(data.center);

    var nd = data.nodes;
    for (var i = 0; i < nd.length; i++) {
      if (g_nodes.filter(function(n) { return n.id == nd[i].id; }).length > 0) {
        continue;
      }
      g_nodes.push(nd[i]);
    }

    var lk = data.links;
    for (var i = 0; i < lk.length; i++) {
      if (g_links.filter(function(l) {
        return l.source.id == lk[i].source.id
        && l.target.id == lk[i].target.id;
      }).length > 0) {
        continue;
      }
      g_links.push({
        source: g_nodes.filter(function(n) { return n.id == lk[i].source; })[0],
        target: g_nodes.filter(function(n) { return n.id == lk[i].target; })[0]
      });
    }

    update();
  },

  shrink = function(node) {
    var end_nodes = [], r_links = [];
    for (var i = 0; i < g_links.length; i++) {
      if (g_links[i].source.id == node.id) {
        end_nodes.push(g_links[i].target);
        r_links.push(g_links[i]);
      }
    }

    for (var i = 0; i < r_links.length; i++) {
      g_links.splice(g_links.indexOf(r_links[i]), 1);
    }

    for (var i = 0; i < end_nodes.length; i++) {
      shrink(end_nodes[i]);

      if (g_links.filter(function(link) {
        return (link.source.id == end_nodes[i].id) &&
               (link.target.id == end_nodes[i].id);
      }).length == 0) {
        g_nodes.splice(g_nodes.indexOf(end_nodes[i]), 1);
      }
    }
    update();
  },

  update = function() {
    var interval = 0.5;
    var color = d3.scale.category20();

    // Restart the force layout
    force.charge(-500)
      .linkDistance(link_distance)
      .start();

    // Nodes
    var node = svg.selectAll("g.node").data(g_nodes, function(d) {
      return d.id;
    });

    var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .call(force.drag);

    nodeEnter.append("svg:circle")
      .attr("r", function(d) { return Math.sqrt(d.rank) * circle_size; })
      .style("fill", function(d) {
        return color(Math.floor(d.rank * 100));
      })
      .attr("stroke", "black").attr("stroke-width", 2)
      .popover(function(d) {
        return {
          title: '<a href="http://ieeexplore.ieee.org/xpl/articleDetails.jsp?arnumber=' + d.name + '" target="_blank">' + d.bibtex.title + '</a>, ' + d.bibtex.year + '<br />',
          content: '<em>' + d.bibtex.author + '</em>',
          placement: "mouse",
          gravity: "right" ,
          displacement: [0, 0],
          mousemove: false
        }
      })
      .on('click', function(d) {
        if (d3.event.button == 0) { // left click
          $.getJSON("/paperrank/" + d.id + ".json", function(data) {
            extend(data);
          });
        } else {
          shrink(d);
        }
      })

    nodeEnter.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .attr("class", "shadow")
      .text(function(d) { return Number(d.rank).toFixed(2); });

    nodeEnter.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .text(function(d) { return Number(d.rank).toFixed(2); });

    node.exit().remove();

    // Disable text selection on node tags
    $('.node').disableTextSelect();

    // Links
    var link = svg.selectAll("line.link")
      .data(g_links, function(l) {
        return l.source.id + '-' + l.target.id;
      });

    link.enter().append("svg:line")
      .attr("class", "link")
      .attr("x1", function(d) { return d.target.x; })
      .attr("y1", function(d) { return d.target.y; })
      .attr("x2", function(d) { return d.source.x; })
      .attr("y2", function(d) { return d.source.y; })
      .attr("marker-end", "url(#arrow)");

    link.exit().remove();


    // Insert Path Marks
    var cur_center = trav_stack[trav_stack.length - 1];
    svg.selectAll("line.link").filter(function(d) {
      for(var i = 0; i < trav_stack.length - 1; i++){
        var last_center = trav_stack[i];
        if (d.source.id == last_center && d.target.id == cur_center ||
            d.target.id == last_center && d.source.id == cur_center)
          return true;
      }
      return false;
    }).classed("path", true);

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.target.x; })
          .attr("y1", function(d) { return d.target.y; })
          .attr("x2", function(d) { return d.source.x; })
          .attr("y2", function(d) { return d.source.y; });

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });
  },

  restart = function(id) {
    $('#loading-modal').modal({backdrop: false, keyboard: false});
    $.getJSON("/paperrank/" + id + ".json", function(data) {
      rankcloud(data);
      $('#loading-modal').modal('hide');
    });
  };

  $(window).resize(function(e) {
    var $el = $('#drawarea');
    resize_viewport($el.width(), $el.height());
  });

  $('document').ready(function() {
    var $el = $('#drawarea');
    svg = d3.select('#drawarea').append("svg:svg");

    // build the arrow.
    svg.append("svg:defs").selectAll("marker")
        .data(["arrow"])
      .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -20 40 40")
        .attr("refX", 60)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-20L40,0L0,20");

    resize_viewport($el.width(), $el.height());

    $('#size-slider').slider({
      orientation: "vertical",
      value: 20,
      max: 100,
      min: 5,
      step: 0.1,
      slide: function(e, ui) {
        circle_size = ui.value;
        svg.selectAll("circle").attr("r", function(d) {
          return Math.sqrt(d.rank) * circle_size;
        });
      }
    });

    $('#distance-slider').slider({
      orientation: "vertical",
      value: 100,
      max: 600,
      min: 0,
      step: 1,
      slide: function(e, ui) {
        link_distance = ui.value;
        force.linkDistance(link_distance).start();
      }
    });

    restart("86656");
  });

  // Export callback result_activated for search-panel.js
  window.result_activated = restart;
}(jQuery));
