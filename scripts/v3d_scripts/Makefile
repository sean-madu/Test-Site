#we need to append the imports to the TOP of the file, which is why the temp file is needed
all:
	rm -rf bundle.js
	browserify v3dconv.js -o temp.js
	touch bundle.js
	cat imports.js >> bundle.js
	cat temp.js >> bundle.js
	rm -rf temp.js
