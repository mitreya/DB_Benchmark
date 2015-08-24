var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 600 - margin.right - margin.left,
    height = 1000 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([width, height]);

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
        return [d.x, d.y];
    });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .style({"overflow" : 'visible'})
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


var fn = "data/" + location.hash.replace("#", '') + ".json";

d3.json(fn, function (error, flare) {
    root = createChildrenArray(flare);
    root.x0 = width / 2;
    root.y0 = 0;

    function createChildrenArray(root) {
        root.children = [];
        if (root.left) {
            root.children.push(root.left);
            createChildrenArray(root.left);
        }

        if (root.right) {
            root.children.push(root.right);
            createChildrenArray(root.right);
        }
        return root;
    }

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    //root.children.forEach(collapse);
    update(root);
});

d3.select(self.frameElement).style("height", "800px");

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * 120;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + source.x0 + "," + source.y0 + ")";
        })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        });


    var nodeText = nodeEnter.append("text");

    nodeText
        .append("tspan").text(function (d) {
            return d.operation;
        });


    nodeText
        .append("tspan").text(function (d) {
            var result;
            if (d.cost) {
                result = d.cost ? "COST : " + d.cost : "";
            }
            return result;
        })
        .attr('x', 0)
        .attr("dy", '1.2em');

    nodeText
        .append("tspan").text(function (d) {
         return d.relation_name;
        })
        .attr('x', 0)
        .attr("dy", '1.2em');

    nodeText
        .append("tspan").text(function (d) {
            var result;
            if(d.predicate_string){
                result = d.predicate_string.slice(0, 40) + " ...";
            }
            return result;
        })
        .attr('x', 0)
        .attr("dy", '1.2em');



    nodeText
        .attr("y", function (d) {
            var y_offset = 0;

                y_offset += d.operation ? 10 : 0;
                y_offset += d.cost ? 10 : 0;
                y_offset += d.predicate_string ? 10 : 0;
                y_offset += d.relation_name ? 10 : 0;

            return d.children || d._children ? -y_offset : 10;
        })
        .attr("dy", function (d) {
            return "0.35em"
        })
        .attr("text-anchor", function (d) {
            return 'middle'
        })
        .style({"fill-opacity": 1e-6});

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", 4)
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function (d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children on click.
function click(d) {
    if (d.name === 'root') {
        return;
    }

    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}