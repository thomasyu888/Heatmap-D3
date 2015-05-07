require(rCharts)
require(shiny)

m  <- runif(1000)
m <- matrix(m, ncol=10)
d <- runif(10)
d <- matrix(d,10,1)
f <- runif(100)
f <- matrix(f,100,1)
m[30,5] = 2000 
min(boxplot(m)$out)

shinyServer(function(input, output) {
  output$myChart <- renderChart2({
    source("Heatmap.R")
    p1 <- iHeatmap(m,Rowv=input$y,Colv=input$z,distM = input$v,ClustM = input$x)
    return(p1)
  })
})
