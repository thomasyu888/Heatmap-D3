function heatmapdraw(selector,data) {

    var mainDat = data.matrix;
    //ALERTS!
    //If there are over 170000 data points, there are too many
    if (mainDat.data.length>170000 ) {
        alert("Code not optimal for data that is over 170000 data points")
        return function(){};
    }

    var el = d3.select(myChart);
  //(function() {
    var inner = el.append("div").classed("inner", true);
    //info is hover over, colDend is xDend, rowDend is yDend, colmap is heatmap
    var info = inner.append("div").classed("info", true);
    var colDend = inner.append("svg").classed("colDend", true);
    var rowDend = inner.append("svg").classed("rowDend", true);
    var colmap = inner.append("svg").classed("colormap", true);
    var colAnnote = inner.append("svg").classed("colAnnote",true);
    var rowAnnote = inner.append("svg").classed("rowAnnote",true);
    var legends = inner.append("svg").classed("legends",true)
  //})();

    //Global annotations variables
    var colAnnote = data.colMeta,
        rowAnnote = data.rowMeta,
        colMeta = colAnnote.data,
        rowMeta = rowAnnote.data,
        colHead = colAnnote.header,
        rowHead = rowAnnote.header;
    
    if (colMeta == null || rowMeta == null) {
      alert("One or both annotations missing, or metadata dimensions don't match main data dimensions.")
    }
    
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
    var xScale = d3.scale.linear().range([0, width-marginleft]);
    var yScale = d3.scale.linear().range([0, height-margintop]);

    //This is needed for the dendrogram zooming (Hack for now)
    var xGlobal = d3.scale.linear().domain([0,mainDat.dim[1]])
    var yGlobal = d3.scale.linear().domain([0,mainDat.dim[0]])

    //Heatmap colors

    //var color = d3.scale.linear()
    //	.domain(mainDat.domain)
      //  .range(mainDat.colors);
        
    var color = d3.scale.threshold()
    	.domain([0,0.2,0.4,0.6,0.8,1])
    	.range(colorbrewer.Reds[5])

    //Creates everything for the heatmap
    var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-margintop);
    var col = dendrogram(el.select('svg.colDend'), data.cols, true, width-marginleft, 250);
    var heatmap = heatmapGrid(el.select('svg.colormap'), mainDat,0,0);
    var colAnnots = drawAnnotate(el.select('svg.colAnnote'),colAnnote, false, width-marginleft,(colHead==null ? 0:colHead.length*5));
    var rowAnnots = drawAnnotate(el.select('svg.rowAnnote'),rowAnnote, true,(rowHead==null ? 0:rowHead.length*5),height-margintop);
		
		heatLegend = d3.svg.legend().units("").cellWidth(80).cellHeight(10).inputScale(color).cellStepping(100);
		d3.select("svg").append("g").attr("transform", "translate(240,30)").attr("class", "legend").call(heatLegend);
        
    //gradLegend(color,5,50)

    function heatmapGrid(svg, data, xStart,yStart) {
        // Check for no data
        if (data.length === 0) {
            return function(){};
        }
        var cols = data.dim[1]; //x
        var rows = data.dim[0]; //y
        var main = data.data;

        xScale.domain([0, cols]).range([0,width-marginleft])
        yScale.domain([0, rows]).range([0,height-margintop])

        svg = svg
            .attr("width", width)
            .attr("height", height)

        var heatmap = svg.selectAll("rect").data(main);
            heatmap.enter().append("rect").classed("datapt", true);
            //Removes existing data
            heatmap.exit().remove();
            heatmap
            .attr("x", function(d, i) { return xScale(i%cols); })
            .attr("y", function(d, i) { return yScale(Math.floor(i/cols)); })
            .attr("class","grid")
            .attr("width", xScale(1))
            .attr("height", yScale(1))
            .attr("fill", function(d) { return color(d); })
            .on('mouseover', function(d,i) {
                var j = Math.floor(i/cols)
                d3.select("#yLab"+j).classed("hover",true);
                d3.select("#xLab"+i%cols).classed("hover",true);
                d3.select(this).classed("hoverover",true);
                //xStart and yStart have to be passed in so that 
                //the hoverover works for the dendrogram
                d3.select(".ends_Y"+(j+yStart)).classed("hover",true);
                d3.select(".ends_X"+(i%cols+xStart)).classed("hover",true);
                output = 'Gene loci: '+ data.rows[j]+'<br>Level of expression: '+d+'<br>ID: '+ data.cols[i%cols] +'<br>Annotations:'
                //Get all the metadata
                if (colMeta != null) {
                    for (k=0; k<colHead.length;k++) {
                        output += '<br>- ' + colHead[k] + ': ' + colMeta[(i%cols)+(k*cols)]
                    }
                }
                if (rowMeta != null) {
                    for (k=0; k<rowHead.length; k++) {
                        output += '<br>- '+rowHead[k] + ': ' + rowMeta[j+(k*rows)]
                    }
                }
                info.classed("hover",true)
                    .style('top', d3.event.pageY-175+'px')
                    .style('left', d3.event.pageX-660+'px')
                    .html(output)
        
            })
            .on('mouseout', function(d,i) {
                var j = Math.floor(i/cols)
                d3.select("#yLab"+j).classed("hover",false);
                d3.select("#xLab"+i%cols).classed("hover",false);
                d3.select(this).classed("hoverover",false);
                d3.select(".ends_Y"+(j+yStart)).classed("hover",false);
                d3.select(".ends_X"+(i%cols+xStart)).classed("hover",false);
                info.classed('hover',false)
            });
    
        //y labels if there aren't too many 
        if (marginleft!=0) {
            var yAxis =svg.selectAll('.yLabel').data(data.rows);
                yAxis.enter().append('svg:text').classed('Labels',true);
                yAxis.exit().remove();
                yAxis
                .attr('class','yLabel')
                .attr('x',width-97)
                .attr('y', function(d,i) {
                    return yScale(i)+3.5+(yScale(i+1)-yScale(i))/2;
                })
                .text(function(d) { return d; })
                .attr("id", function(d,i) { return "yLab" + i; });
        }
        //x labels if there aren't too many
        if (margintop!=0) {
            var xAxis = svg.selectAll('.xLabel').data(data.cols);
                xAxis.enter().append('svg:text').classed('Labels',true)
                xAxis.exit().remove();
                xAxis
                .attr('class', 'xLabel')
                .attr('x', function(d,i) {
                    return xScale(i)+(xScale(i+1)-xScale(i))/2;
                }) 
                .attr('y',height-127)
                .text(function(d) { return d; })
                .attr("id", function(d,i) { return "xLab" + i; })
        }
        
        //Select rectangle on heatmap and dendrograms
        var selectHeat = selectArea(colmap,el.select('svg.colormap'),data,undefined,xStart,yStart);
        var selectYDend = selectArea(rowDend,el.select('svg.rowDend'),data,1,xStart,yStart);
        var selectXDend = selectArea(colDend,el.select('svg.colDend'),data,2,xStart,yStart);
        
    }

    function dendrogram(svg, data, rotated, width, height,dend,shift,range) {
    	if (data==null) {
    		return function(){};
    	}
        var x = d3.scale.linear();
        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);
        
        var cluster = d3.layout.cluster()
            .separation(function(a, b) { return 1; })
            .size([rotated ? width : height, (rotated ? height : width) - 160]);
        
        var nodes = cluster.nodes(data),
            links = cluster.links(nodes);
        
        var transform = "translate(40,0)";
        if (rotated) {
            // Flip dendrogram vertically
            x.range([1, 0]);
            // Rotate
            transform = "rotate(-90," + height/2 + "," + height/2 + ") translate(140, 0)";
        }
        //stretch is default 1 because y(d.source) has to remain unchanged when not stretched
        var stretch = 1;
        //If zoom, then dend will not be undefined, Then the data put into draw will be different
        if (dend != undefined) {
            //For the transform scale of the transform:  It is (data length/selected data length) ratio:
            //and length of data is links.length/2+1
            stretch = (links.length/2+1)/dend.length;
            //Shift*range is just the transform to move the dendrogram up after the scaling
            transform = transform+ "translate(0,"+(-shift*range*stretch) + ")";
        }

        svg = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", transform)
            .attr("class","rootDend")

        function draw() {
            function elbow(d, i) {
                return x(d.source.y) + "," + stretch*y(d.source.x) + " " +
                    x(d.source.y) + "," + stretch*y(d.target.x) + " " +
                    x(d.target.y) + "," + stretch*y(d.target.x);
            }
            var link = svg.selectAll(".link")
                .data(links)
                .attr("points", elbow)
                .enter().append("polyline")
                .attr("class", "link")
                .attr("points", elbow)
                .attr("id",function(d,i){ return i; });
            
            var node = svg.selectAll(".node")
                .data(nodes)
                .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
                .attr("id",function(d,i) { return i; });

            //All the ending nodes
            var leafNode = node.filter(function(d, i){ return !d.children; })
            //All the ends of the leafs (This is for the zoom function)
            var leafLink = link.filter(function(d,i) {
                if (d.target.name.substring(0,4)!="node") { return d.target; }
            })
            .attr("class",function(d,i) {
                return "ends_"+(rotated ? "X" : "Y")+(i);
            })
            return leafNode;
        }
        var leaves = draw();
        return {
            draw: draw,
            leaves: leaves[0]
        };
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
/*
    //Linear scaling for continuous values
    function linScale(selectedDat) { 


        var scaling = d3.scale.linear()
            .domain([min, max])
            .range(['powderblue', 'darkblue']);

        return scaling;
    }
    */
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
            .attr('width' , function(d) { return (rotated ? 4 :xScale(1)); })
            .attr('height', function(d) { return (rotated ? yScale(1) : 4)})
            .attr('x' , function(d,i) {
                //This is to account for 2 or more sets of annotation data
                return (rotated ? 5*Math.floor(i/cols): xScale(i%cols));
            })
            .attr('y', function(d,i) {
                return (rotated? yScale(i%cols):5*Math.floor(i/cols));
            })
            .style('fill',function(d,i) {
                return (isNaN(d) ? scaling(d):lin(d));
            });

        //gradLegend(lin,20,20)
		    //catLegend(scaling)   
    verticalLegend = d3.svg.legend()
    	.labelFormat("none").cellPadding(5)
    	.units("Annotations").cellWidth(25).cellHeight(18)
    	.inputScale(scaling).cellStepping(10);

  	d3.select("svg").append("g").attr("transform", "translate(10,30)").attr("class", "legend").call(verticalLegend);


    };

//////////////////////////////////////////////////////////////////////////////////////

    /////ZOOM INTO RECTANGLE/////
    function selectArea(area,svg,dataset,num,oldxStart,oldyStart) { 
        svg
            .attr("width",width)
            .attr("height",height)

        var cols = dataset.dim[1]; //x
        var rows = dataset.dim[0]; //y
        var zoomDat = [];
        var newxLab=[];
        var newyLab = [];
        //Makes the selection rectangles 
        area
            .on("mousedown", function() {
                var e = this,
                origin = d3.mouse(e),
                rect = svg
                    .append("rect")
                    .attr("class", "zoom");

                origin[0] = Math.max(0, Math.min(width, origin[0]));
                origin[1] = Math.max(0, Math.min(height, origin[1]));
                d3.select('body')
                    .on("mousemove.zoomRect", function() {
                        var m = d3.mouse(e);
                        m[0] = Math.max(0, Math.min(width, m[0]));
                        m[1] = Math.max(0, Math.min(height, m[1]));
                        rect.attr("x", Math.min(origin[0], m[0]))
                            .attr("y", Math.min(origin[1], m[1]))
                            .attr("width", Math.abs(m[0] - origin[0]))
                            .attr("height", Math.abs(m[1] - origin[1]));
                    })
                    .on("mouseup.zoomRect", function() {
                            var m = d3.mouse(e);
                            m[0] = Math.max(0, Math.min(width, m[0]));
                            m[1] = Math.max(0, Math.min(height, m[1]));
                            //x,y Start/Finish for the selection of data => Can draw box the other way, and still work.
                            var xStart = Math.min(Math.floor(origin[0]/xScale(1)), Math.floor(m[0]/xScale(1)))
                            var xFinish = Math.max(Math.floor(m[0]/xScale(1)), Math.floor(origin[0]/xScale(1)))+1
                            var yStart = Math.min(Math.floor(origin[1]/yScale(1)), Math.floor(m[1]/yScale(1)))
                            var yFinish =Math.max(Math.floor(m[1]/yScale(1)), Math.floor(origin[1]/yScale(1)))+1

                            var newcolMeta = [];
                            var newrowMeta = [];
                            var newyDend = [];
                            var newxDend = [];

                            //If the Y dendrogram is selected, make the X dendrogram undefined 
                            //because I dont want the x dendrogram to change
                            if (num==1) {
                                xStart = 0;
                                xFinish = cols
                            //If the X dendrogram is selected, make the y dendrogram undefined 
                            //because I dont want the y dendrogram to change
                            } else if (num==2) {
                                yStart = 0;
                                yFinish = rows
                            }
//////////////////////////////////////
                            //Get the data selected and send it back to heatmapgrid
                            for (i = xStart; i<xFinish; i++) {
                                newxLab.push(dataset.cols[i]);
	                            if (data.cols!=null) { //If there is no column clustering
	                                newxDend.push(d3.select(".ends_X"+i).attr("id"))
	                            }
                            }
                            for (i=yStart;i<yFinish; i++) {
                                newyLab.push(dataset.rows[i]);
                                if (data.rows !=null) { //If there is no row clustering
                                	newyDend.push(d3.select(".ends_Y"+i).attr("id"))
                                }
                                for (j=xStart; j<xFinish; j++) {
                                    zoomDat.push(dataset.data[i*cols+j]);
                                }
                            }

                            //Get the Metadata -> If there is more than one line of annotations, the data is in different places, just like the grid
                            if (colMeta !=null) {
                                for (i = 0; i<colHead.length; i++) {
                                    for (j = xStart; j<xFinish; j++) {
                                        newcolMeta.push(colMeta[i*cols+j])
                                    }
                                }
                                colMeta = newcolMeta
                            }
                            if (rowMeta != null) {
                                for (i =0; i<rowHead.length; i++) {
                                    for (j =yStart; j<yFinish; j++) {
                                        newrowMeta.push(rowMeta[i*rows+j])
                                    }
                                }
                                rowMeta = newrowMeta
                            } 
/////////////////////////////////////
                            //Set new parameters based on selected data
                            dataset.dim[1] = newxLab.length;
                            dataset.dim[0] = newyLab.length;
                            dataset.rows = newyLab;
                            dataset.cols = newxLab;
                            dataset.data = zoomDat;
                            colAnnote.data = colMeta;
                            rowAnnote.data = rowMeta;
                            //Changes the margin, if the dimensions are small enough
                            if (dataset.dim[0] <=100) {
                                marginleft=100;
                            }
                            if (dataset.dim[1] <=300) {
                                margintop = 130;
                            }
//////////////////////////////////////////////
                            xGlobal.range([0,width-marginleft])
                            yGlobal.range([0,height-margintop])
                            var x = xGlobal(1);
                            var y = yGlobal(1);

                            //This slows down the program (Remove())
                            d3.selectAll('.rootDend').remove();
                            oldxStart += xStart
                            oldyStart += yStart

                            //olsxStart + xStart because the dendrogram is translated
                            heatmapGrid(el.select('svg.colormap'),dataset,oldxStart,oldyStart);                            
                            //New Vertical dendrogram
                            dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-margintop,newyDend,oldyStart,y);
                            //New Horizontal dendrogram
                            dendrogram(el.select('svg.colDend'), data.cols, true, width-marginleft, 250,newxDend,oldxStart,x);
                            //New annotation bar, if no annotations, don't do this
                            drawAnnotate(el.select('svg.colAnnote'), colAnnote,false, width-marginleft,10);
                            drawAnnotate(el.select('svg.rowAnnote'),rowAnnote,true,10,height-margintop);
                            //zoomDat = [];
                            //remove blue select rectangle
                            rect.remove();
                    });
            });
    };
};

