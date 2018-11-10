all: clean build_react build_app

clean:
	rm -Rf dist/ build/
	rm -Rf balto/web_interfaces/balto_react/build/

build_react:
	cd balto/web_interfaces/balto_react/ && yarn build

build_app:
	poetry build

publish:
	poetry publish
