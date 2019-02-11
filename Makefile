all: build_react build_app

clean:
	rm -Rf dist/ build/
	rm -Rf balto/web_interfaces/balto_react/build/

build_react: clean balto/web_interfaces/balto_react/node_modules
	cd balto/web_interfaces/balto_react/ && yarn build

build_app: clean
	poetry build

develop: build_react build_app
	pipx install --spec ~/project/balto/balto/dist/balto-*.tar.gz balto

publish:
	poetry publish

balto/web_interfaces/balto_react/node_modules:
	cd balto/web_interfaces/balto_react/ && yarn install
