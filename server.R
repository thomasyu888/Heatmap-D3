require(rCharts)
require(shiny)
<<<<<<< HEAD


m <- read.csv("PCBC_geneExpr_data.csv",row.names = 1, header = TRUE)
d <- read.csv("metadata.csv",row.names=1, header=TRUE)
m <-as.matrix(m)
d <- as.matrix(d)
f <- runif(69)
f <- matrix(f,69,1)
=======
m  <- runif(1000)
m <- matrix(m, ncol=10)
d <- runif(10)
d <- matrix(d,10,1)
f <- runif(100)
f <- matrix(f,100,1)
>>>>>>> a09130413e3cde4fefbb24ec3b15111599fdc384

shinyServer(function(input, output) {
  output$myChart <- renderChart2({
    source("Heatmap.R")
    p1 <- iHeatmap(m,d,f,input$x,Rowv=input$y,Colv=input$z,distM = input$v)
    return(p1)
  })
<<<<<<< HEAD
})
=======
})
>>>>>>> a09130413e3cde4fefbb24ec3b15111599fdc384
