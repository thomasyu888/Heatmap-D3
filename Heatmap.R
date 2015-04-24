require(devtools)
install_github('rCharts', 'ramnathv')
library(rCharts)

HCtoJSON<-function(hc){
  
  labels<-hc$labels
  merge<-data.frame(hc$merge)
  
  for (i in (1:nrow(merge))) {
    
    if (merge[i,1]<0 & merge[i,2]<0) {
      eval(parse(text=paste0("node", i, "<-list(name=\"node", i, "\", children=list(list(name=labels[-merge[i,1]]),list(name=labels[-merge[i,2]])))")))}
    else if (merge[i,1]>0 & merge[i,2]<0) {
      eval(parse(text=paste0("node", i, "<-list(name=\"node", i, "\", children=list(node", merge[i,1], ", list(name=labels[-merge[i,2]])))")))}
    else if (merge[i,1]<0 & merge[i,2]>0) {
      eval(parse(text=paste0("node", i, "<-list(name=\"node", i, "\", children=list(list(name=labels[-merge[i,1]]), node", merge[i,2],"))")))}
    else if (merge[i,1]>0 & merge[i,2]>0) {
      eval(parse(text=paste0("node", i, "<-list(name=\"node", i, "\", children=list(node",merge[i,1] , ", node" , merge[i,2]," ))")))}
  }
  
  eval(parse(text=paste0("JSON<-(node",nrow(merge), ")")))
  
  return(JSON)
}

genes <- read.csv(file="Example.csv",head=TRUE,row.names=1)
metadatas <- read.csv(file="metaExample.csv",head=TRUE,row.names=1)
genes <- as.matrix(genes)
rng <- range(genes)


rowClust <- hclust(dist(genes))
genes <- genes[rowClust$order,]
colClust <- hclust(dist(t(genes)))
genes <- genes[,colClust$order]

if (dim(metadatas)[1]==dim(genes)[2]) { 
  metadata <- as.matrix(metadatas)
  metadata <- metadata[colClust$order,]     
} else {
  metadata = rep(NA,dim(genes)[2])
}

rowDend <- HCtoJSON(rowClust)
colDend <- HCtoJSON(colClust)
metadata <- data.frame(metadata,row.names=NULL)

domain <- seq.int(ceiling(rng[2]), floor(rng[1]), length.out = 100)
colors <- heat.colors(100)
colors <- sub('FF$', '', colors)

matrix <- list(data = as.numeric(t(genes)),
               dim = dim(genes),
               rows = row.names(genes),
               cols = colnames(genes),
               colors = colors,
               domain = domain)

dataset <- list(rows = rowDend, cols = colDend, metadata = metadata[,1], matrix = matrix)

#This creates new rcharts and runs the heatmap
heatmap <- function(dataMatrix) {
  heat <- rCharts$new()
  heat$setLib("libraries/heatmap")
  heat$set(data = dataset)
  return (heat)
}

heatmap(dataset) 
#Where dataset is the row dendrogram/column dendrogram, metadata and heatmapgrid data
