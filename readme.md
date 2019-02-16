Open index.html to see the demo.

included are 2 bmps that work well with this demo.

many bmps distort, so I will try to fix these.

the first hour was spent creating the page, layout and uploading,
the next 7 hours of this project were spent tryng to decode the base64 bmp dataURI
the next 40 minutes was spent making the color slider work

sorry for the naive color slider solution, but that is all I have time for


This current solution only works for 24bit bmp files
See: http://www.di.unito.it/~marcog/SM/BMPformat-Wiki.pdf

I could adjust convertTo2d function to handle 16 bit bmps, but that is outside the scope of this assignment.