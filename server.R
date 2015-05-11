require(rCharts)
require(shiny)

m  <- runif(1000)
m <- matrix(m, ncol=10)
d <- runif(10)
d <- matrix(d,10,1)
f <- runif(100)
f <- matrix(f,100,1)

m <- read.csv("PCBC_geneExpr_data.csv",row.names = 1, header = TRUE)
d <- read.csv("metadata.csv",row.names=1, header=TRUE)
m <-as.matrix(m)
d <- as.matrix(d)
f <- runif(69)
f <- matrix(f,69,1)

shinyServer(function(input, output) {
  output$myChart <- renderChart2({
    source("Heatmap.R")
    p1 <- iHeatmap(m,d,f,Rowv=input$y,Colv=input$z,distM = input$v,ClustM = input$x)
    return(p1)
  })
})
