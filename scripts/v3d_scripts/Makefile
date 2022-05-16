all:
	rm -rf bundle.js
	browserify v3dconv.js -o temp.js
	touch bundle.js
	cat imports.js >> bundle.js
	cat temp.js >> bundle.js
	rm -rf temp.js
