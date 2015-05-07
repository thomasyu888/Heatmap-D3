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

formData <- function(mainData,colAnnote,rowAnnote,...) {
  #NEED ROWNAMES/COLNAMES
  
  dots<- list(...)
  print(dots)
  distM <- dots$distM
  Colv <- dots$Colv
  Rowv<- dots$Rowv
  ClustM <- dots$ClustM
  
  
  ## sees if rownames/ col names exist for entered matrix
  if (length(row.names(mainData))==0) {
    row.names(mainData) = c(1:dim(mainData)[1])
  }
  if (length(colnames(mainData))== 0) {
    colnames(mainData) = c(1:dim(mainData)[2])
  }
#########FIX THIS!!!
#########FIX THIS!!!
#########FIX THIS!!!

  if (Rowv) {
    rowClust <- hclust(dist(mainData,distM),ClustM)
    mainData <- mainData[rowClust$order,]
    if (!is.null(rowAnnote)) {
      rowAnnotes <- rowAnnote[rowClust$order,] 
    }
    rowDend <- HCtoJSON(rowClust)
  } else {
    rowDend = NULL
    rowAnnotes <- rowAnnote
  }
  
  if (Colv) {
    colClust <- hclust(dist(t(mainData),distM),ClustM)
    mainData <- mainData[,colClust$order]
    if (!is.null(colAnnote)) {
      colAnnotes <- colAnnote[colClust$order,]  
    }
    colDend <- HCtoJSON(colClust)
  } else {
    colDend = NULL
    colAnnotes <- colAnnote
  }

  if (!is.null(rowAnnote)) {
    if (length(row.names(rowAnnote))==0) {
      row.names(rowAnnote) = c(1:dim(rowAnnote)[1])
      colnames(rowAnnote) = c(1:dim(rowAnnote)[2])
    }
    if (length(rowAnnote[,1])==dim(mainData)[1]) { 
      rowAnnotes <- matrix(rowAnnotes)
      rowHead <- colnames(rowAnnote)
    } else {
      rowAnnotes <- NULL
      rowHead <- NULL
    }
  } else {
    rowAnnotes <- rowAnnote
    rowHead <- NULL
  }

  if (!is.null(colAnnote)) {
    if(length(row.names(colAnnote))==0) {
      row.names(colAnnote) = c(1:dim(colAnnote)[1])
      colnames(colAnnote) = c(1:dim(colAnnote)[2])
    }
    if (length(colAnnote[,1])==dim(mainData)[2]) { 
      colAnnotes <- matrix(colAnnotes)
      colHead <- colnames(colAnnote)
    } else {
      colAnnotes <- NULL
      colHead <- NULL
    }
  } else {
    colAnnotes <- colAnnote
    colHead <- NULL
  }
#########FIX THIS!!!
#########FIX THIS!!!
  ##Dealing with outliers.. Simple boxplot$out
  rng <- range(mainData[mainData<min(boxplot(mainData)$out)])
  domain <- seq.int(ceiling(rng[2]), floor(rng[1]), length.out = 100)
  colors <- heat.colors(100)
  colors <- sub('FF$', '', colors)
  
  colMeta <- list(data = colAnnotes,
                  header = colHead) 
  rowMeta <- list(data = rowAnnotes,
                  header = rowHead)
  
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
iHeatmap <- function(data, colAnnote=NULL,rowAnnote=NULL, ...) {
  dataset <- formData(data, colAnnote,rowAnnote,...)
  heat <- rCharts$new()
  heat$setLib("libraries/heatmap")
  heat$set(data = dataset)
  return (heat)
}

