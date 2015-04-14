function heatmap(selector, data) {
    var el = d3.select(selector);
  
  //(function() {
    var inner = el.append("div").classed("inner", true);
    var info = inner.append("div").classed("info", true);
    var colDend = inner.append("svg").classed("colDend", true);
    var rowDend = inner.append("svg").classed("rowDend", true);
    var colmap = inner.append("svg").classed("colormap", true);
    var annotation = inner.append("svg").classed("annotations",true);
  //})();

    var width = 1300;
    var height = 600;
    var mainDat = data.matrix;
    var metaDat = data.metadata

    var xScale = d3.scale.linear().range([0, width-100]);
    var yScale = d3.scale.linear().range([0, height-130]);

    var color = d3.scale.linear()
        .domain(mainDat.domain)
        .range(mainDat.colors);


    var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, height-130);
    var col = dendrogram(el.select('svg.colDend'), data.cols, true, width-100, 250);
    var colormap = heatmapGrid(el.select('svg.colormap'), mainDat,0,0);
    var annotate = drawAnnotate(el.select('svg.annotations'),metaDat);



    var label = d3.select('body')
        .append('div')
        .style('position','absolute')
        .style('display','none')
        .style('font-size','10px');  


        

    function heatmapGrid(svg, data, xStart,yStart) {
        var j=0;

        // Check for no data
        if (data.length === 0) {
            return function(){};
        }
        
        var cols = data.dim[1]; //x
        var rows = data.dim[0]; //y

        var merged = data.data;

        xScale.domain([0, cols])
        yScale.domain([0, rows])


        svg = svg
            .attr("width", width)
            .attr("height", height)

        var heatmap = svg.selectAll(".heatmap")
            .data(merged)
            .enter()
            .append('g')

        heatmap.selectAll('.cell')
            .data(function(d,i) {
                j++;
                return d
            })
            .enter()
            .append("svg:rect")
            //.classed("datapt", true);
            //rect.exit().remove();
            //rect
            //.property("colIndex", function(d, i) { return i; })
            //.property("rowIndex", function(d, i,j) { return j; })
            .attr("x", function(d, i) { return xScale(i); })
            .attr("y", function(d, i, j) { return yScale(j); })
            .attr("class","grid")
            .attr("width", xScale(1))
            .attr("height", yScale(1))
            .attr("fill", function(d) { return color(d); })
            .on('mouseover', function(d,i,j) {

                d3.select("#yLab"+j).classed("hover",true);
                d3.select("#xLab"+i).classed("hover",true);
                d3.select(this).classed("hoverover",true);
                //Dendrogram is not recalculated, so xStart and yStart have to be passed in so that 
                //the hoverover works for the dendrogram
                d3.select(".ends_X"+(j+yStart)).classed("hover",true);
                d3.select(".ends_Y"+(i+xStart)).classed("hover",true);

                output = 'Gene loci: '+ data.rows[j]+'<br>Level of expression: '+d+'<br>ID: '+ data.cols[i]
                        +'<br>State: '+metaDat[i];
                               
                label
                    //event.page gives current cursor location
                    .style('top', (d3.event.pageY-90)+'px')
                    .style('left', (d3.event.pageX-155)+'px')
                    .style('background','white')
                    .style('display','block')
                    .style('opacity',0.6)
                    .html(output)        
            })
              
            .on('mouseout', function(d,i,j) {
                d3.select("#yLab"+j).classed("hover",false);
                d3.select("#xLab"+i).classed("hover",false);
                d3.select(this).classed("hoverover",false);
                d3.select(".ends_X"+(j+yStart)).classed("hover",false);
                d3.select(".ends_Y"+(i+xStart)).classed("hover",false);
                                
                label
                    .style('display','none')
            });
    
        //Labels of genes

        var yAxis =svg.selectAll('.yLabel')
            .data(data.rows)
            .enter()
            .append('svg:text')
            .attr('class','yLabel')
            .attr('x',width-97)
            .attr('y', function(d,i) {
                return yScale(i)+2+(yScale(i+1)-yScale(i))/2;
            })
            .text(function(d) { return d; })
            .attr("id", function(d,i) { return "yLab" + i; });

        //Label of patient
        var xAxis = svg.selectAll('.xLabel')
            .data(data.cols)
            .enter()
            .append('svg:text')
            .attr('class', 'xLabel')
            .attr('x', function(d,i) {
                return xScale(i)+(xScale(i+1)-xScale(i))/2;
            }) 
            .attr('y',height-127)
            .text(function(d) { return d; })
            .attr("id", function(d,i) { return "xLab" + i; })
                    //Select rectangle on heatmap
        var selectHeat = selectArea(colmap,
                el.select('svg.colormap'),
                el.select('svg.annotations'),
                el.select('svg.colormap'),
                data,undefined,xStart,yStart);

        var selectXDend = selectArea(rowDend,
                el.select('svg.rowDend'),
                el.select('svg.annotations'),
                el.select('svg.colormap'),
                data,1);

        var selectYDend = selectArea(colDend,
                el.select('svg.colDend'),
                el.select('svg.annotations'),
                el.select('svg.colormap'),
                data,2);
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
        var newLinks = [];  
        var stretch = 1;
        //If zoom, then dend will not be undefined, Then the data put into draw will be different
        if (dend != undefined) {
            //For the transform scale of the transform:  It is (data length/selected data length) ratio:
            //and length of data is links.length/2+1
            stretch = (links.length/2+1)/dend.length;
            //Shift*range is just the transform to move the dendrogram up after the scaling
            transform += "translate(0,"+(-shift*range*stretch) + ")";
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
            
            //var anchor = rotated ? "end" : "start";
            //var dx = rotated ? -3 : 3;
            var leafNode = node.filter(function(d, i){ return !d.children; })
            //.append("text")
            //.attr("dx", dx)
            //.attr("dy", 3)
            //.style("text-anchor", anchor)
            //.text(function(d) { return d.name; });
            
            //All the ends of the leafs (This is for the zoom function)
            var leafLink = link.filter(function(d,i) {
                if (d.target.name.length>7) { return d.target; }
            })
            .attr("class",function(d,i) {
                return "ends_"+(rotated ? "Y" : "X")+(i);
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
            .attr("width",1200)
            .attr("height",10)

        var scaling = annotScale(data);
        xScale.domain([0,data.length]);
        //Annotation svg
        var annotation = svg.selectAll('.annotate')
            .data(data)
            .enter()
            .append('svg:rect')
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
    function selectArea(area, svg, annotesvg, heatmap, dataset,num,oldxStart,oldyStart) {
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
                            var xLength = dataset.dim[1]

                            //If the Y dendrogram is selected, make the Y dendrogram undefined 
                            //because I dont want the y dendrogram to change

                            if (num==1) {
                                xStart = 0;
                                xFinish = dataset.dim[1]
                                newyDend = undefined;
                            //If the X dendrogram is selected, make the X dendrogram undefined 
                            //because I dont want the x dendrogram to change
                            } else if (num==2) {
                                yStart = 0;
                                yFinish = dataset.dim[0]
                                newxDend = undefined;
                            }

//////////////////////////////////////
                            //Get the data selected and send it back to heatmaprect
                            for (i = xStart; i<xFinish; i++) {
                                newxLab.push(dataset.cols[i]);
                                newAnnot.push(data.metadata[i])
                                if (newyDend != undefined) {
                                    newyDend.push(d3.select(".ends_Y"+i).attr("id"))
                                }
                            }
                            //Get selected Data
                            for (i=yStart;i<yFinish; i++) {
                                newyLab.push(dataset.rows[i]);
                                if (newxDend != undefined) {
                                    newxDend.push(d3.select(".ends_X"+i).attr("id"))
                                }
                                for (j=xStart; j<xFinish; j++) {
                                    rows.push(dataset.data[i][j]);
                                }
                                zoomDat.push(rows);
                                rows = [];  
                            }
                            dataset.dim[1] = newxLab.length;
                            dataset.dim[0] = newyLab.length;
                            dataset.rows = newyLab;
                            dataset.cols = newxLab;
                            dataset.data = zoomDat;
//////////////////////////////////////////////

                            //Clear the sample, gene, and heatmap so the new data can be put on
                            yLength = newyLab.length;
                            var x = xScale(1);
                            var y = yScale(1);

                            //Delete all the labels and heatmap and annotations so that the zoomed ones can be updated

                            d3.selectAll('.xLabel').remove();
                            d3.selectAll('.yLabel').remove();
                            d3.selectAll('.annote').remove();
                            d3.selectAll('.grid').remove();
                            d3.selectAll('.rootDend').remove();
                            //New heatmap
                            //olsxStart + xStart because the dendrogram is translated
                            heatmapGrid(heatmap, dataset,(oldxStart+xStart),(oldyStart+yStart));
                            //New dendrogram
                            //drawDend(newxDend,newyDend,xStart,yStart,x,y); 
                            var row = dendrogram(el.select('svg.rowDend'), data.rows, false, 250, 470,newxDend,yStart,y);
                            var col = dendrogram(el.select('svg.colDend'), data.cols, true, 1200, 250,newyDend,xStart,x);
                            //New annotation bar
                            drawAnnotate(annotesvg, newAnnot);
                            zoomDat = [];
                            //mainDat = dataset;
                            //remove blue select rectangle
                            rect.remove();
                    });

            });

    }

  /*
  var dispatcher = d3.dispatch('hover', 'click');
  
  $('.datapt').on('mouseover', function() {
    $('.info').text($(this).children('title').text());
    d3.select(row.leaves[this.rowIndex]).classed('active', true);
    d3.select(col.leaves[this.colIndex]).classed('active', true);
    dispatcher.hover({
      data: {
        value: +$(this).children('title').text(),
        row: this.rowIndex,
        col: this.colIndex
      }
    });
  });
  $('.datapt').on('click', function() {
    $('.info').text($(this).children('title').text());
    d3.selectAll('.datapt.clicked').classed('clicked', false);
    d3.select(row.leaves[this.rowIndex]).classed('clicked', true);
    d3.select(this).classed('clicked', true);
    dispatcher.click({
      data: {
        value: +$(this).children('title').text(),
        row: this.rowIndex,
        col: this.colIndex
      }
    });
  });
  $('.datapt').mouseleave(function() {
    $('.info').text('');
    d3.select(row.leaves[this.rowIndex]).classed('active', false);
    d3.select(col.leaves[this.colIndex]).classed('active', false);
  });
  $('.colormap').mouseover(function() {
    el.classed('highlighting', true);
  });
  $('.colormap').mouseleave(function() {
    el.classed('highlighting', false);
  });
  
  return {
    on: function(type, listener) {
      dispatcher.on(type, listener);
      return this;
    }
  };
  */
}
