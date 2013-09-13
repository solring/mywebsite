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
  circle_size = 10,
  link_distance = 100,
  group_stack = [],
  trav_stack = [],
  depth = 0,

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
        target: find_index_of_id(nd, lk[i].target),
	weight: lk[i].weight
      });
    }
    return lks;
  },

  rankcloud = function(data) {
    var width = 1300,height = 700;
    //cur_center = last_center = data.center;
    
    //initialize stacks
    trav_stack = [];
    group_stack = [];

    trav_stack.push(data.center);
    g_nodes = data.nodes;

    for(var i=0; i < g_nodes.length; i++){
        g_nodes[i].count = 1;
    }

    g_links = preprocess_link(data.nodes, data.links);

    var stat = {
	nodes: data.nodes.slice(0),
	links: data.links.slice(0)
    };
    group_stack.push(stat);

    force.nodes(g_nodes).links(g_links);
    
	    update();
  },

  extend = function(data) {
    trav_stack.push(data.center); 
    depth += 1; 
    // Delete the oldest record    
    if(depth>2){
	var del_id = trav_stack.shift();
        var old_stat = group_stack.shift();
        for(var i=0; i<old_stat.nodes.length; i++){
	    if(trav_stack.filter(function(d){		//skip if it's  on the path
		return d == old_stat.nodes[i].id;
	    }).length > 0) continue;

	    for(var j=0; j<g_nodes.length; j++){
		if(g_nodes[j].id == old_stat.nodes[i].id){
		    g_nodes[j].count -= 1;
	    	    if(g_nodes[j].count < 1) g_nodes.splice(j, 1); 			//delete node
		    break;
		}
	    }
/*
	    var node2del = g_nodes.filter( function(n){	//get ref.
	        return n.id == old_stat.nodes[i].id;
	    });
	    var index = g_nodes.indexOf(node2del);
	    g_nodes.splice(index, 1); 			//delete node
*/
        }
        
	
        for(var i=0; i<old_stat.links.length; i++){
	    var t = old_stat.links[i];
	    for(var j=0; j<g_links.length; j++){
		var l = g_links[j];
	        if ((l.source.id == t.source && l.target.id==t.target) 
			|| (l.target.id == t.source && l.source.id == t.target))
		{
	    	    g_links.splice(j, 1); 		
		    break;
		}
	    }
/*
	    var link2del = g_links.filter( function(l){	//get ref.
		var t = old_stat.links[i];
	        return (l.source.id == t.source.id && l.target.id==t.target.id 
			|| l.target.id == t.source.id && l.source.id == t.target.id);
	    });
	    var index = g_links.indexOf(link2del);
	    g_links.splice(index, 1); 			//delete node 
*/
	}
    }//end if depth > 2

    // Insert new nodes and links
    var nd = data.nodes;
    for (var i = 0; i < nd.length; i++) {
      var tmps = g_nodes.filter(function(n) { return n.id == nd[i].id; });
      if (tmps.length > 0) {
	//tmps[0].count += 1;
        continue;
      }
      g_nodes.push(nd[i]);
      g_nodes[g_nodes.length-1].count = 0;
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
        target: g_nodes.filter(function(n) { return n.id == lk[i].target; })[0],
	weight: lk[i].weight
      });

      //add reference
      var tgd = g_nodes.filter(function(n) { return n.id == lk[i].target; })[0];
      tgd.count += 1;
    }


    var stat = {
	nodes: nd.slice(0),
	links: lk.slice(0)
    };
    group_stack.push(stat);
    

    update();
  },

  update = function() {
    var interval = 50;
    var color = d3.scale.category20();

    // Restart the force layout
    force.charge(-500)
      .linkDistance(link_distance)
      .start();

    // Links

    var link = svg.selectAll("line.link")
      .data(g_links, function(l) {
        return l.source.id + '-' + l.target.id;
      });

    //var link = svg.selectAll("line.link").data(g_links);
    link.enter().insert("svg:line", ".node")
      .classed("link", true)
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .attr("stroke", "black")
      .attr("stroke-width", function(d){ return d.weight+1; });
      
    link.exit().remove();

    //Insert Path Marks
    var cur_center = trav_stack[trav_stack.length-1];
    var path = svg.selectAll("line.link")
      .filter(function(d){

	  for(var i=0; i<trav_stack.length-1; i++){
	    var last_center = trav_stack[i];
	    if (d.source.id == last_center && d.target.id == cur_center ||
	    	d.target.id == last_center && d.source.id == cur_center) return true;
	  }
	  return false;

      });
      path.classed("path", true);


    // Nodes
    var node = svg.selectAll("g.node").data(g_nodes, function(d) {
      return d.id;
    });

    var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .call(force.drag);

    nodeEnter.append("svg:circle")
      .attr("r", function(d) { return Math.sqrt(d.score) * circle_size; })
      .style("fill", function(d) {
        return color(Math.floor(d.id / interval));
      })
      .attr("stroke", "black").attr("stroke-width", 2)
      .popover(function(d) {
        return {
          title:  '<a href=/authorrank/'+ d.id +' target="_blank">' + d.name + '<br />',
          content: '<em> author rank: ' + d.score + '</em>',
          placement: "mouse",
          gravity: "right" ,
          displacement: [0, 0],
          mousemove: false
        }
      })
      .on('click', function(d) {
        $.getJSON("/authorrank/" + d.id + ".json", function(data) {
          extend(data);
        });
      })

    nodeEnter.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .attr("class", "shadow")
      .text(function(d) { return d.name; });

    nodeEnter.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .text(function(d) { return d.name; });

    node.exit().remove();

    // Disable text selection on node tags
    $('.node').disableTextSelect();

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });
  },

  restart = function(id){
    $('#loading-modal').modal({backdrop: false, keyboard: false});
    $.getJSON( "/authorrank/" + id + ".json", function(data){
      rankcloud(data);
      $('#loading-modal').modal('hide');
    });
  };

  $(window).resize(function(width, height) {
    var $el = $('#drawarea');
    resize_viewport($el.width(), $el.height());
  });

  $('document').ready(function() {
    var $el = $('#drawarea');

    svg = d3.select('#drawarea').append("svg:svg");
    resize_viewport($el.width(), $el.height());

    $('#size-slider').slider({
      orientation: "vertical",
      value: 10,
      max: 100,
      min: 5,
      step: 0.1,
      slide: function(e, ui) {
        circle_size = ui.value;
        svg.selectAll("circle").attr("r", function(d) {
          return Math.sqrt(d.score) * circle_size;
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

    $.getJSON("/authorrank/4562.json", function(data) {
      rankcloud(data);
    });
  });

  // Export callback result_activated for search-panel.js
  window.result_activated = restart;
}(jQuery));
