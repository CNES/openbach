all: prod

help:               ## Show this help.
		@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

prod:               ## Package the application in a .tar.gz file (default)
		@npm run prod

dev:                ## Run the application using the development server
		@npm install
		@npm run start
