require(rCharts)
shinyUI(pageWithSidebar(
  headerPanel("Interactive Heatmap"),
  
  sidebarPanel(
    selectInput(inputId = "x",
                label = "Clustering method",
                choices = c('complete', 'average','ward.D','ward.D2','single','mcquitty','median','centroid'),
                selected = "complete"),
    
    selectInput(inputId = "y",
                label = "Cluster rows",
                choices = c('TRUE', 'FALSE'),
                selected = 'TRUE'),

    selectInput(inputId = "z",
                label = "Cluster columns",
                choices = c('TRUE','FALSE'),
                selected = 'TRUE'),
    
    selectInput(inputId = "v",
                label = "Distance method",
                choices = c('euclidean','maximum','manhattan','canberra','binary','minkowski'),
                selected = 'euclidean')
  ),

  mainPanel(
    showOutput("myChart","libraries/heatmap")
  )
))
