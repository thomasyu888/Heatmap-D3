library(devtools)
library(rCharts)
#sets working directory
this.dir <- dirname(parent.frame(2)$ofile)
setwd(this.dir)

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

formData <- function(mainData, metaData,...) {
  if (length(row.names(mainData))==0) {
    row.names(mainData) = c(1:dim(mainData)[1])
  }
  if (length(colnames(mainData))== 0) {
    colnames(mainData) = c(1:dim(mainData)[2])
  }
  
  rowClust <- hclust(dist(mainData),...)
  mainData <- mainData[rowClust$order,]
  colClust <- hclust(dist(t(mainData)),...)
  mainData <- mainData[,colClust$order]
  
  rowDend <- HCtoJSON(rowClust)
  colDend <- HCtoJSON(colClust)
  
  rng <- range(mainData)
  domain <- seq.int(ceiling(rng[2]), floor(rng[1]), length.out = 100)
  colors <- heat.colors(100)
  colors <- sub('FF$', '', colors)
  
  if (dim(metaData)[1]==dim(mainData)[2]) { 
    metaData <- metaData[colClust$order,]     
  } else {
    metaData = rep(NA,dim(mainData)[2])
  }
  
  metaData <- data.frame(metaData,row.names=NULL)

  matrix <- list(data = as.numeric(t(mainData)),
                 dim = dim(mainData),
                 rows = row.names(mainData),
                 cols = colnames(mainData),
                 colors = colors,
                 domain = domain)
  
  dataset <- list(rows = rowDend, cols = colDend, metadata = metaData[,1], matrix = matrix)
  return(dataset)
}


#This creates new rcharts and runs the heatmap
iHeatmap <- function(data, annotations,...) {
  
  dataset <- formData(data, annotations,...)
  heat <- rCharts$new()
  heat$setLib("libraries/heatmap")
  heat$set(data = dataset)
  return (heat)
}

