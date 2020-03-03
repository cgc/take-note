dev:
	node_modules/.bin/parcel src/index.html

build:
	rm -rf dist
	node_modules/.bin/parcel build src/index.html

CURR_BRANCH = $(shell git rev-parse --abbrev-ref HEAD)

release:
	@echo Currently on branch $(CURR_BRANCH)
	-git branch -D gh-pages
	git checkout -b gh-pages
	make build
	git add dist --force
	git commit -am "update site"
	git push origin gh-pages --force
	git checkout $(CURR_BRANCH)
