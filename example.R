m  <- runif(1000)
m <- matrix(m, ncol=10)
metadata <- matrix(rep(1,10))

#method - ward.D, ward.D2, single, complete, average,
#mcquitty, median, centroid
iHeatmap(m, metadata, method = "complete")
