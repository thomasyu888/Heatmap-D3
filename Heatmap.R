
genes <- read.csv(file="INPUT FILE NAME",head=TRUE,row.names=1)
metadatas <- read.csv(file="metadata.csv",head=TRUE,row.names=1)
data <- list(main = genes,metadatas = metadatas)

runApp(
  list(
    ui = pageWithSidebar(
      headerPanel('Heatmap'),
      sidebarPanel(
       #verbatimTextOutput('hovered')
      ),
      mainPanel(
        heatmapOutput('heatmap')
      )
    ),
    server = function(input, output) {
      output$heatmap <- renderHeatmap(
        data
      )
      #output$hovered <- renderPrint(
      #  input$heatmap_hover
      #)
    }
  )
)

