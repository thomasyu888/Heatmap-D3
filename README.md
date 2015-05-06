<<<<<<< HEAD
# Shiny-d3-Heatmap
Given a feature matrix/annotations, this will display an interactive Heatmap with hover over ability and zoom by selection capability.  With the help of rCharts, this javascript function is able to be used R:  

>heatmap(dataset)

To use your own data: change two lines of code in heatmap.R:

> genes <- read.csv(file = "______",head=TRUE, row.names =1)

> metadatas <- read.csv(file = "_______",head=TRUE, row.names=1)


=======
# Interactive heatmap
Given a feature matrix/annotations, this will display an interactive Heatmap with hover over ability and zoom by selection capability.  With the help of rCharts, and Shiny, this javascript function is able to be used R:  

> Change m (main data), d (column annotations), f (row annotations) in server.R. Run App!

Look at example.R for reference
>>>>>>> a09130413e3cde4fefbb24ec3b15111599fdc384

**References**

http://rcharts.io/howitworks/

http://bl.ocks.org/PBrockmann/635179ff33f17d2d75c2

http://www.totallab.com/products/samespots/support/faq/dendrogram.aspx

https://gist.github.com/jasondavies/3689931

http://stackoverflow.com/questions/12925266/drawing-heatmap-with-d3

Dendrogram

http://stackoverflow.com/questions/17837973/how-to-turn-a-hclust-object-into-json-for-d3

https://stat.ethz.ch/R-manual/R-patched/library/stats/html/hclust.html

http://www.r-tutor.com/gpu-computing/clustering/hierarchical-cluster-analysis

