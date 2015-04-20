
genes <- read.csv(file="Example.csv",head=TRUE,row.names=1)
metadatas <- read.csv(file="metaExample.csv",head=TRUE,row.names=1)

data <- list(main = genes,metadatas = metadatas)



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
  
  eval(parse(text=paste0("JSON<-toJSON(node",nrow(merge), ")")))
  
  return(JSON)
}



#' @export
renderHeatmap <- function(expr, env = parent.frame(1), quoted = FALSE) {
  func <- shiny::exprToFunction(expr, env, quoted)
  
  function() {
    data <- func()
    
    genes <- as.matrix(data$main)
    rng <- range(genes)
    metadata <- as.matrix(data$metadatas)
    
    rowClust <- hclust(dist(genes))
    genes <- genes[rowClust$order,]
    colClust <- hclust(dist(t(genes)))
    genes <- genes[,colClust$order]
    metadata <- metadata[colClust$order,]
    
    rowDend <- HCtoJSON(rowClust)
    colDend <- HCtoJSON(colClust)
    rowDend <- fromJSON(rowDend)
    colDend <- fromJSON(colDend)
    
    domain <- seq.int(ceiling(rng[2]), floor(rng[1]), length.out = 100)
    metadata <- data.frame(metadata,row.names=NULL)
    colors <- heat.colors(100)
    colors <- sub('FF$', '', colors)
    
    matrix <- list(data = as.numeric(t(genes)),
                   dim = dim(genes),
                   rows = row.names(genes),
                   cols = colnames(genes),
                   colors = colors,
                   domain = domain)
    return(list(rows = rowDend, cols = colDend, metadata = metadata[,1], matrix = matrix))
  }
}

shinyServer = function(input, output) {
  output$heatmap <- renderHeatmap(
    data
  )
}
