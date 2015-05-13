function heatmapdraw(selector,data) {

    var Controller = function() {
        this._events = d3.dispatch("datapoint_hover", "transform");
        this._datapoint_hover = {x: null, y: null, value: null};
        this._transform = null;
    };

    (function() {
        this.datapoint_hover = function(_) {
            if (!arguments.length) return this._datapoint_hover;
                this._datapoint_hover = _;
                this._events.datapoint_hover.call(this, _);
        };

        this.transform = function(_) {
            if (!arguments.length) return this._transform;
            this._transform = _;
            this._events.transform.call(this, _);
        };

        this.on = function(evt, callback) {
            this._events.on(evt, callback);
        };
    }).call(Controller.prototype);

    var controller = new Controller();
      
    var mainDat = data.matrix;
    //ALERTS!
    //If there are over 170000 data points, there are too many
    if (mainDat.data.length>170000 ) {
        alert("Code not optimal for data that is over 170000 data points")
        return function(){};
    }

    var el = d3.select(myChart);

    (function() { 

        var inner = el.append("div").classed("inner", true);
        //colDend is xDend, rowDend is yDend, colmap is heatmap
        var colDend = inner.append("svg").classed("colDend", true);
        var rowDend = inner.append("svg").classed("rowDend", true);
        var colmap = inner.append("svg").classed("colormap", true);
        var colAnnote = inner.append("svg").classed("colAnnote",true);
        var rowAnnote = inner.append("svg").classed("rowAnnote",true);
        var xAxis = inner.append("svg").classed("xAxis",true);
        var yAxis = inner.append("svg").classed("yAxis",true)

    })();
    
    //Global annotations variables
    var colAnnote = data.colMeta,
        rowAnnote = data.rowMeta,
        colMeta = colAnnote.data,
        rowMeta = rowAnnote.data,
        colHead = colAnnote.header,
        rowHead = rowAnnote.header;
    
    //Width/height of svg
    var width = 1300;
    var height = 600;
    var margintop = 130;
    var marginleft = 100;

    //if there are more than 100 x values, it doesn't make sense to show the label
    if (mainDat.dim[0] > 100) {
        marginleft=  0;
    }
    if (mainDat.dim[1] > 300) {
        margintop = 0;
    }
    
    //Set xScale and yScale
    var x = d3.scale.linear().range([0, width-marginleft]);
    var y = d3.scale.linear().range([0, height-margintop]);

    //Heatmap colors

    //var color = d3.scale.linear()
    //	.domain(mainDat.domain)
      //  .range(mainDat.colors);
        
    //Color scheme needs to be fixed
    var color = d3.scale.threshold()
    	.domain([-6,-4,-2,-1,0,1,2,4,6])
    	.range(colorbrewer.YlOrRd[9])

    //Creates everything for the heatmap
    var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-margintop);
    var col = dendrogram(el.select('svg.colDend'), data.cols, true, width-marginleft, 250);
    var heatmap = heatmapGrid(el.select('svg.colormap'), mainDat, width-marginleft,height-margintop);
    var colAnnots = (colMeta == null) ? 0 : drawAnnotate(el.select('svg.colAnnote'),colAnnote, false, width-marginleft,colHead.length*5);
    var rowAnnots = (rowMeta == null) ? 0: drawAnnotate(el.select('svg.rowAnnote'),rowAnnote, true,rowHead.length*5,height-margintop);
	var xLabel = (mainDat.dim[0] > 100) ? 0 : axis(el.select('svg.xAxis'),data.matrix.cols,true,width-marginleft,150)
    var yLabel = (mainDat.dim[1] > 300) ? 0 : axis(el.select('svg.yAxis'),data.matrix.rows,false, 100, height-margintop)
	
    //heatLegend = d3.svg.legend().units("").cellWidth(80).cellHeight(10).inputScale(color).cellStepping(100);
	//d3.select("svg").append("g").attr("transform", "translate(240,30)").attr("class", "legend").call(heatLegend);
        
    //gradLegend(color,5,50)

    function heatmapGrid(svg, data, width, height) {
        // Check for no data
        if (data.length === 0)
            return function() {};
     
        var cols = data.dim[1];
        var rows = data.dim[0];
        
        var merged = data.data;
        
        x.domain([0, cols]).range([0, width-marginleft]);
        y.domain([0, rows]).range([0, height-margintop]);

        var tip = d3.tip()
            .attr('class', 'd3heatmap-tip')
            .html(function(d) {
                return d;
            })
            .direction("se")
            .style("position", "fixed");
        
        var brush = d3.svg.brush()
            .x(x)
            .y(y)
            .clamp([true, true])
            .on('brush', function() {
                var extent = brush.extent();
                extent[0][0] = Math.round(extent[0][0]);
                extent[0][1] = Math.round(extent[0][1]);
                extent[1][0] = Math.round(extent[1][0]);
                extent[1][1] = Math.round(extent[1][1]);
                d3.select(this).call(brush.extent(extent));
            })
            .on('brushend', function() {
                if (brush.empty()) {
                    controller.transform({
                        scale: [1,1],
                        translate: [0,0],
                        extent: [[0,0],[cols,rows]]
                    });
                } else {
                    var tf = controller.transform();
                    var ex = brush.extent();
                    var scale = [
                        cols / (ex[1][0] - ex[0][0]),
                        rows / (ex[1][1] - ex[0][1])
                    ];
                    var translate = [
                        ex[0][0] * (width / cols) * scale[0] * -1,
                        ex[0][1] * (height / rows) * scale[1] * -1
                    ];
                    controller.transform({scale: scale, translate: translate, extent: ex});
                }
                brush.clear();
                d3.select(this).call(brush).select(".brush .extent")
                    .style({fill: "steelblue", stroke: "steelblue",opacity: 0.5});
            });

        svg = svg
            .attr("width", width)
            .attr("height", height);

        var rect = svg.selectAll("rect").data(merged);
            rect.enter().append("rect").classed("datapt", true)
            .property("colIndex", function(d, i) { return i % cols; })
            .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
            .property("value", function(d, i) { return d; })
            .attr("fill", function(d) {
                if (d === null) {
                    return "transparent";
                }
                return color(d);
            })
            
        rect.exit().remove();
        rect.append("title")
            .text(function(d, i) { return (d === null) ? "NA" : d + ""; })
        rect.call(tip);

        function draw(selection) {
            selection
                .attr("x", function(d, i) {
                    return x(i % cols);
                })
                .attr("y", function(d, i) {
                    return y(Math.floor(i/cols));
                })
                .attr("width", (x(1) - x(0)))
                .attr("height", (y(1) - y(0)))
        }

        draw(rect);

        controller.on('transform.colormap', function(_) {
            x.range([_.translate[0], width * _.scale[0] + _.translate[0]]);
            y.range([_.translate[1], height * _.scale[1] + _.translate[1]]);
            draw(rect.transition().duration(500).ease("linear"));
        });
        

        var brushG = svg.append("g")
            .attr('class', 'brush')
            .call(brush)
            .call(brush.event);
        brushG.select("rect.background")
            .on("mouseenter", function() {
                tip.style("display", "block");
            })
            .on("mousemove", function() {
                var col = Math.floor(x.invert(d3.event.offsetX));
                var row = Math.floor(y.invert(d3.event.offsetY));
                var value = merged[row*cols + col];
                var output = 'Gene loci: '+ data.rows[row]+'<br>Level of expression: '+value+'<br>ID: '+ data.cols[col] +'<br>Annotations:'
                //Get all the metadata
                if (colMeta != null) {
                    for (k=0; k<colHead.length;k++) {
                        output += '<br>- ' + colHead[k] + ': ' + colMeta[col+(k*cols)]
                    }
                }
                if (rowMeta != null) {
                    for (k=0; k<rowHead.length; k++) {
                        output += '<br>- '+rowHead[k] + ': ' + rowMeta[row+(k*rows)]
                    }
                }
                tip.show(output).style({
                    top: d3.event.clientY + 15 + "px",
                    left: d3.event.clientX + 15 + "px",
                    opacity: 0.9
                });
                controller.datapoint_hover({col:col, row:row, value:value});

                //d3.select("#yLab"+row).classed("hover",true);
                //d3.select("#xLab"+col).classed("hover",true);
                //d3.select(this).classed("hoverover",true);
                //xStart and yStart have to be passed in so that 
                //the hoverover works for the dendrogram
                //d3.select(".ends_Y"+row).classed("hover",true);
                //d3.select(".ends_X"+col).classed("hover",true);

                //info.classed("hover",true)
                  //  .style('top', d3.event.clientY+15+'px')
                    //.style('left', d3.event.clientX+'px')
                    //.html(output)
            })
            .on("mouseleave", function() {
                //var col = Math.floor(x.invert(d3.event.offsetX));
                //var row = Math.floor(y.invert(d3.event.offsetY));
                tip.hide().style("display","none")
                controller.datapoint_hover(null);
                //d3.select("#yLab"+row).classed("hover",false);
                //d3.select("#xLab"+col).classed("hover",false);
                //d3.select(this).classed("hoverover",false);
                //d3.select(".ends_Y"+row).classed("hover",false);
                //d3.select(".ends_X"+col).classed("hover",false);
                //info.classed('hover',false)
            });
    }

    function axis(svg, data, rotated,width,height) {
        svg = svg.attr("width", width)
            .attr('height',height)
            .append('g')

        // Define scale, axis
        var scale = d3.scale.ordinal()
            .domain(data)
            .rangeBands([0, rotated ? width : height]);

        var axis = d3.svg.axis()
            .scale(scale)
            .orient(rotated ? "bottom" : "right")
            .outerTickSize(0)
            //.tickPadding(3)
            .tickValues(data)

        // Create the actual axis
        var axisNodes = svg.append("g")
            .call(axis);
        var fontSize = Math.min(4, Math.max(9, scale.rangeBand() - (rotated ? 11: 8))) + "px";
            axisNodes.selectAll("text").style("text-anchor", "start").style("font-size", fontSize).attr("class","axisLabels"   )
            .attr("id", function(d,i) { return rotated ? "xLab" + i : "yLab" + i })


        controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function(_) {
            var dim = rotated ? 0 : 1;

            var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]];
            scale.rangeBands(rb);
            var tAxisNodes = axisNodes.transition().duration(500).ease('linear');
            tAxisNodes.call(axis);
            // Set text-anchor on the non-transitioned node to prevent jumpiness
            // in RStudio Viewer pane
            axisNodes.selectAll("text").style("text-anchor", "start");
            tAxisNodes.selectAll("g")
                .style("opacity", function(d, i) {
                    if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            tAxisNodes
                .selectAll("text")
                .style("text-anchor", "start");
        });

    
    }



    function dendrogram(svg, data, rotated, width, height) {
        var x = d3.scale.linear();
        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);
        
        var cluster = d3.layout.cluster()
            .separation(function(a, b) { return 1; })
            .size([rotated ? width : height, (rotated ? height : width) - 160]);
        
        var transform = "translate(1,0)";
        if (rotated) {
            // Flip dendrogram vertically
            x.range([1, 0]);
            // Rotate
            transform = "rotate(-90) translate(-2,0)";
        }

        var dendrG = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", transform);
        
        var nodes = cluster.nodes(data),
            links = cluster.links(nodes);

        // I'm not sure why, but after the heatmap loads the "links"
        // array mutates to much smaller values. I can't figure out
        // what's doing it, so instead we just make a deep copy of
        // the parts we want.
        var links1 = links.map(function(link, i) {
            return {
                source: {x: link.source.x, y: link.source.y},
                target: {x: link.target.x, y: link.target.y}
            };
        });
        
        var lines = dendrG.selectAll("polyline").data(links1);
        lines
            .enter().append("polyline")
            .attr("class", "link");

        function draw(selection) {
            function elbow(d, i) {
                return x(d.source.y) + "," + y(d.source.x) + " " +
                    x(d.source.y) + "," + y(d.target.x) + " " +
                    x(d.target.y) + "," + y(d.target.x);
            }

            selection
                .attr("points", elbow);
        }

        controller.on('transform.dendr-' + (rotated ? 'x' : 'y'), function(_) {
            var scaleBy = _.scale[rotated ? 0 : 1];
            var translateBy = _.translate[rotated ? 0 : 1];
            y.range([translateBy, height * scaleBy + translateBy]);
            draw(lines.transition().duration(500).ease("linear"));
        });

        draw(lines);
    }
//////////////////////////////////////////////////////////////////////////////////////
/*
    //Legend for the annotations for categorical annotations!
    function catLegend(scales) {
    	var legsvg = el.select('svg.legends').attr('width',1000).attr('height', 80)
       	var leg = legsvg.selectAll('.legend')
            .data(scales.domain())
            .enter()
            .append('g')
            .attr("class","legend")
            .attr('transform', function(d,i) {
                return 'translate(' + i*30+',0)';
            });
        leg.append('rect')
            .attr('width',5)
            .attr('height',5)
            .style('fill',scales)
            .style('stroke',scales)

        leg.append('text')
            .attr('x',5)
            .attr('y',10)
            .text(function(d) { return d});
       }
/*
    //Legend for quantized values
    function gradLegend(color,width, location) {
    	var legsvg = el.select('svg.legends').attr('width',1000).attr('height', 80)
    	var leg = legsvg.append("g")
    		.attr("class", "key")
    		.attr("transform", "translate(0," + location +")");

		leg.selectAll("rect")
		    .data(color.range().map(function(d, i) {
			    return { z: d };
		    }))
		  	.enter().append("rect")
		    .attr("height", 12)
		    .attr("x", function(d,i) { return width*i; })
		    .attr("width", width)
		    .style("fill", function(d) { return d.z; })

        leg.selectAll('text')
            .attr('class','legendT')
            .data(color.domain().map(function(d,i) {
                return  {y:d};
            }))
            .enter().append('text')
            .attr('x',function(d,i) { return width*i})
            .attr('y',24)
            .text(function(d) {  
                if (d.y%1==0) return "≤ "+d.y 
            })
    }
*/
    //Linear scaling for continuous values
    function linScale(selectedDat) { 
    	var max = Math.max.apply(Math,selectedDat);
        var min = Math.min.apply(Math,selectedDat);


        var scaling = d3.scale.linear()
            .domain([min, max])
            .range(['powderblue', 'darkblue']);

		//horizontalLegend = d3.svg.legend().units("").labelFormat("none").cellWidth(50).cellHeight(10).inputScale(scaling).cellStepping(100);
		//d3.select("svg").append("g").attr("transform", "translate(113,30)").attr("class", "legend").call(horizontalLegend);

        return scaling;
    }
    /*
    function linScale(selectedDat) { 
    	var max = Math.max.apply(Math,selectedDat);
        var min = Math.min.apply(Math,selectedDat);

        var scaling = d3.scale.threshold()
            .domain([min,max])
            .range(['powderblue', 'darkblue']);

		horizontalLegend = d3.svg.legend().units("").cellWidth(50).cellHeight(10).inputScale(scaling).cellStepping(100);
		d3.select("svg").append("g").attr("transform", "translate(113,30)").attr("class", "legend").call(horizontalLegend);
        
        return scaling;
    }
    */
    function drawAnnotate(svg,datum, rotated,width,height) {

        svg.attr("width",width).attr("height",height)
        //If no metadata, return the function
        if (datum.data==null) {
            return function(){};
        }

        var scaling = d3.scale.category10()
        var cols = datum.data.length/datum.header.length
        for (k=0;k<datum.header.length;k++) {
        	//If the data is not cateogorical value, get all the values to get a linear scale
        	if (!isNaN(datum.data[k*cols])) {
        		var lin = linScale(datum.data.slice(k*cols, (1+k)*cols-1));
        	}
        }
        //Annotation svg
        var annotation = svg.selectAll('.annotate').data(datum.data);
            annotation.enter().append('svg:rect').classed("annotate",true)
            annotation.exit().remove();
            annotation
            .attr('width' , function(d) { return (rotated ? 4 :x(1)); })
            .attr('height', function(d) { return (rotated ? y(1) : 4)})
            .attr('x' , function(d,i) {
                //This is to account for 2 or more sets of annotation data
                return (rotated ? 5*Math.floor(i/cols): x(i%cols));
            })
            .attr('y', function(d,i) {
                return (rotated? y(i%cols):5*Math.floor(i/cols));
            })
            .style('fill',function(d,i) {
                return (isNaN(d) ? scaling(d):lin(d));
            });

        //gradLegend(lin,20,20)
		    //catLegend(scaling)   

   // verticalLegend = d3.svg.legend().cellPadding(5).orientation("vertical")
    //	.units("Annotation").cellWidth(25).cellHeight(18)
    //	.inputScale(scaling).cellStepping(10);

  	//d3.select("svg").append("g").attr("transform", "translate(10,30)").attr("class", "legend").call(verticalLegend);


    };
};

