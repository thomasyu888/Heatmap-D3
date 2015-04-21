function heatmap(selector, data) {
    var el = d3.select(selector);
  //(function() {
    var inner = el.append("div").classed("inner", true);
    //info is hover over 
    var info = inner.append("div").classed("info", true);
    var colDend = inner.append("svg").classed("colDend", true);
    var rowDend = inner.append("svg").classed("rowDend", true);
    var colmap = inner.append("svg").classed("colormap", true);
    var annotation = inner.append("svg").classed("annotations",true);
  //})();


    
    var mainDat = data.matrix;
    var metaDat = data.metadata;

    //If there are over 1000 genes, that is way too many data points. This is the max
    if (mainDat.dim[0]>1000) {
        alert("Code not optimal for data that is over 1000x203 data points!")
        return function(){};
    }

    var width = 1300;
    var height = 600;
    var margintop = 130;
    var marginleft = 100;
    //if there are more than 100 x values, it doesn't make sense to show the label
    if (mainDat.dim[0] > 100) {
        marginleft=  0;
    }
    
    //Set xScale and yScale
    var xScale = d3.scale.linear().range([0, width-marginleft]);
    var yScale = d3.scale.linear().range([0, height-margintop]);

    //This is needed for the dendrogram zooming (Hack for now)
    var xGlobal = d3.scale.linear().domain([0,mainDat.dim[1]])
    var yGlobal = d3.scale.linear().domain([0,mainDat.dim[0]]).range([0,height-margintop])
    
    //Heatmap colors
    var color = d3.scale.linear()
        .domain(mainDat.domain)
        .range(mainDat.colors);

    //Creates everything for the heatmap
    var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-margintop);
    var col = dendrogram(el.select('svg.colDend'), data.cols, true, width-marginleft, 250);
    var heatmap = heatmapGrid(el.select('svg.colormap'), mainDat,0,0);
    var annotate = drawAnnotate(el.select('svg.annotations'),metaDat);


    function heatmapGrid(svg, data, xStart,yStart) {
        // Check for no data
        if (data.length === 0) {
            return function(){};
        }
        var cols = data.dim[1]; //x
        var rows = data.dim[0]; //y
        var main = data.data;

        xScale.domain([0, cols]).range([0,width-marginleft])
        yScale.domain([0, rows])

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

                output = 'Gene loci: '+ data.rows[j]+'<br>Level of expression: '+d+'<br>ID: '+ data.cols[i%cols]
                        +'<br>State: '+metaDat[i%cols+xStart];
                               
                info.classed("hover",true)
                    //event.page gives current cursor location
                    .style('top', (d3.event.pageY-75)+'px')
                    .style('left', (d3.event.pageX-490)+'px')
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
    
        //Labels of genes
        if (marginleft!=0) {
            var yAxis =svg.selectAll('.yLabel').data(data.rows);
                yAxis.enter().append('svg:text').classed('Labels',true);
                yAxis.exit().remove();
                yAxis
                .attr('class','yLabel')
                .classed('nohighlight',true)
                .attr('x',width-97)
                .attr('y', function(d,i) {
                    return yScale(i)+2+(yScale(i+1)-yScale(i))/2;
                })
                .text(function(d) { return d; })
                .attr("id", function(d,i) { return "yLab" + i; });
        }

        //Label of patient
        var xAxis = svg.selectAll('.xLabel').data(data.cols);
            xAxis.enter().append('svg:text').classed('Labels',true)
            xAxis.exit().remove();
            xAxis
            .attr('class', 'xLabel')
            .classed('nohighlight',true)
            .attr('x', function(d,i) {
                return xScale(i)+(xScale(i+1)-xScale(i))/2;
            }) 
            .attr('y',height-127)
            .text(function(d) { return d; })
            .attr("id", function(d,i) { return "xLab" + i; })
        
        //Select rectangle on heatmap and dendrograms
        var selectHeat = selectArea(colmap,el.select('svg.colormap'),data,undefined,xStart,yStart);
        var selectYDend = selectArea(rowDend,el.select('svg.rowDend'),data,1,xStart,yStart);
        
        var selectXDend = selectArea(colDend,el.select('svg.colDend'),data,2,xStart,yStart);
    }

    function dendrogram(svg, data, rotated, width, height,dend,shift,range) {
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


    function annotScale(selectedDat) { 
        var scaling;
        //Changes the color scale for annotation bar
        if (!isNaN(selectedDat[0])) {
            var max = Math.max.apply(Math,selectedDat);
            var min = Math.min.apply(Math,selectedDat);

            scaling = d3.scale.linear()
                .domain([min, max])
                .range(['powderblue', 'darkblue']);
        } else {
            scaling = d3.scale.category10()
                .domain(selectedDat)
        }
        return scaling;
    }

  function drawAnnotate(svg,data) {
        svg
            .attr("width",width-marginleft)
            .attr("height",10)

        var scaling = annotScale(data);
        xScale.domain([0,data.length]);
        //Annotation svg
        var annotation = svg.selectAll('.annotate').data(data);
            annotation.enter().append('svg:rect').classed('annotate',true)
            annotation.exit().remove();
            annotation
            .attr("class","annote")
            .attr('width' , xScale(1))
            .attr('height', 5)
            .attr('x' , function(d,i) {
                return xScale(i);
            })
            .attr('y', 5)
            .style('fill',function(d,i) {
                return scaling(d);
            }) 
    };

    /////ZOOM INTO RECTANGLE/////
    function selectArea(area,svg,dataset,num,oldxStart,oldyStart) {
        svg
            .attr("width",width)
            .attr("height",height)

        var cols = dataset.dim[1]; //x
        var rows = dataset.dim[0]; //y
      
        var rows= [];
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

                            var newAnnot = [];
                            var newyDend = [];
                            var newxDend = [];

                            //If the Y dendrogram is selected, make the X dendrogram undefined 
                            //because I dont want the x dendrogram to change
                            if (num==1) {
                                xStart = 0;
                                xFinish = dataset.dim[1]
                            //If the X dendrogram is selected, make the y dendrogram undefined 
                            //because I dont want the y dendrogram to change
                            } else if (num==2) {
                                yStart = 0;
                                yFinish = dataset.dim[0]
                            }
//////////////////////////////////////
                            //Get the data selected and send it back to heatmapgrid
                            for (i = xStart; i<xFinish; i++) {
                                newxLab.push(dataset.cols[i]);
                                newAnnot.push(data.metadata[i+oldxStart])
                                newxDend.push(d3.select(".ends_X"+i).attr("id"))
                            }

                            for (i=yStart;i<yFinish; i++) {
                                newyLab.push(dataset.rows[i]);
                                newyDend.push(d3.select(".ends_Y"+i).attr("id"))
                                for (j=xStart; j<xFinish; j++) {
                                    zoomDat.push(dataset.data[i*cols+j]);
                                }
                            }
                            //Set new parameters based on selected data
                            dataset.dim[1] = newxLab.length;
                            dataset.dim[0] = newyLab.length;
                            dataset.rows = newyLab;
                            dataset.cols = newxLab;
                            dataset.data = zoomDat;
                            
                            if (dataset.dim[0] <100) {
                                marginleft=100;
                            }
//////////////////////////////////////////////
                            xGlobal.range([0,width-marginleft])
                            var x = xGlobal(1);
                            var y = yGlobal(1);

////// THIS is the problem/////////Deleted the dendrograms ///THIS SLOWS DOWN THE PROGRAM
                            d3.selectAll('.rootDend').remove();
                            oldxStart += xStart
                            oldyStart += yStart

                            //olsxStart + xStart because the dendrogram is translated
                            heatmapGrid(el.select('svg.colormap'),dataset,oldxStart,oldyStart);                            
                            //New Vertical dendrogram
                            var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-margintop,newyDend,oldyStart,y);
                           
                            //New Horizontal dendrogram
                            var col = dendrogram(el.select('svg.colDend'), data.cols, true, width-marginleft, 250,newxDend,oldxStart,x);
                            //New annotation bar
                            drawAnnotate(el.select('svg.annotations'), newAnnot);
                            zoomDat = [];
                            //remove blue select rectangle
                            rect.remove();
                    });
            });
    }
}
