dev:
	node_modules/.bin/parcel src/index.html

build:
	rm -rf dist
	node_modules/.bin/parcel build src/index.html
