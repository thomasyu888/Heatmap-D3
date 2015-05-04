require(rCharts)
shinyUI(pageWithSidebar(
  headerPanel("Interactive Heatmap"),
  
  sidebarPanel(
    selectInput(inputId = "x",
                label = "Choose method",
                choices = c('complete', 'average','ward.D','ward.D2','single','mcquitty','median','centroid'),
                selected = "complete")
   
  ),
  mainPanel(
    showOutput("myChart","libraries/heatmap")
  )
))
