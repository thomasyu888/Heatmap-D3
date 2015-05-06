require(rCharts)
require(shiny)


m <- read.csv("PCBC_geneExpr_data.csv",row.names = 1, header = TRUE)
d <- read.csv("metadata.csv",row.names=1, header=TRUE)
m <-as.matrix(m)
d <- as.matrix(d)
f <- runif(69)
f <- matrix(f,69,1)

shinyServer(function(input, output) {
  output$myChart <- renderChart2({
    source("Heatmap.R")
    p1 <- iHeatmap(m,d,f,input$x,Rowv=input$y,Colv=input$z,distM = input$v)
    return(p1)
  })
})