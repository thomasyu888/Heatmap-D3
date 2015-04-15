#ui.R
require(shiny)
require(RJSONIO)

#' @export
heatmapOutput <- function(outputId) {
  shiny::addResourcePath('heatmap', 'www');
  tagList(
    singleton(
      tags$head(
        tags$link(rel='stylesheet', type='text/css', href='heatmap/heatmap.css'),
        tags$script(src='heatmap/heatmap.js'),
        tags$script(src='heatmap/binding.js'),
        HTML('<script src="http://d3js.org/d3.v3.js"></script>
             
             <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
             <link href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet">
             <script src="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
             ')
      )
    ),
    tags$div(id=outputId, class='d3-heatmap')
  )
}

shinyUI(pageWithSidebar(
  
    headerPanel('Heatmap'),
    sidebarPanel(
      strong("Interactive heatmap with hover-over capability and zoom feature"),
      p('The hover-over ability shows the X-label, Y-label and metadata
        associated to where the mouse is on the heatmap'),
      p('The zoom feature allows the user to select an area on either the heatmap 
        or dendrogram and the heatmap will be redrawn (Note: There is no fancy way
        to zoom out. Refresh browser/reload app to zoom out)')
    ),
    mainPanel(
      heatmapOutput('heatmap')
    )
  )
)
