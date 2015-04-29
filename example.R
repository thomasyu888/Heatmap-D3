m  <- runif(1000)
m <- matrix(m, ncol=10)
d <- runif(10)
d <- matrix(d,10,1)
f <- runif(100)
f <- matrix(f,100,1)

#method - ward.D, ward.D2, single, complete, average,
#mcquitty, median, centroid
iHeatmap(m, d,f, method = "complete")
