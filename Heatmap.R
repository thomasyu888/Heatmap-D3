library(devtools)
library(rCharts)

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

formData <- function(mainData, colAnnote,rowAnnote,...) {
  if (length(row.names(mainData))==0) {
    row.names(mainData) = c(1:dim(mainData)[1])
  }
  if (length(colnames(mainData))== 0) {
    colnames(mainData) = c(1:dim(mainData)[2])
  }
  if(length(row.names(colAnnote))==0) {
    row.names(colAnnote) = c(1:dim(colAnnote)[1])
    colnames(colAnnote) = c(1:dim(colAnnote)[2])
  }
  if(length(row.names(rowAnnote))==0) {
    row.names(rowAnnote) = c(1:dim(rowAnnote)[1])
    colnames(rowAnnote) = c(1:dim(rowAnnote)[2])
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
  
  if (dim(colAnnote)[1]==dim(mainData)[2]) { 
    colAnnotes <- colAnnote[colClust$order,]  
    colAnnotes <- matrix(colAnnotes)
  } else {
    colAnnote <- rep(NA,dim(mainData)[2])
  }
  if (dim(rowAnnote)[1]==dim(mainData)[1]) { 
    rowAnnotes <- rowAnnote[rowClust$order,]    
    rowAnnotes <- matrix(rowAnnotes)
  } else {
    rowAnnote <- rep(NA,dim(mainData)[1])
  }

  colMeta <- list(data = colAnnotes,
                 header = colnames(colAnnote))
  
  rowMeta <- list(data = rowAnnotes,
                  header = colnames(rowAnnote))
  
  matrix <- list(data = as.numeric(t(mainData)),
                 dim = dim(mainData),
                 rows = row.names(mainData),
                 cols = colnames(mainData),
                 colors = colors,
                 domain = domain)
  
  dataset <- list(rows = rowDend, cols = colDend, colMeta = colMeta,rowMeta = rowMeta, matrix = matrix)
  return(dataset)
}

#This creates new rcharts and runs the heatmap
iHeatmap <- function(data, colAnnote,rowAnnote, ...) {
  dataset <- formData(data, colAnnote,rowAnnote,...)
  heat <- rCharts$new()
  heat$setLib("libraries/heatmap")
  heat$set(data = dataset)
  return (heat)
}

