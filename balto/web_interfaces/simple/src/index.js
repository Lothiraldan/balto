'use strict';

require('./styles/treeview.scss');
require('font-awesome/scss/font-awesome.scss');

require('./index.elm')
    .Main
    .embed(document.getElementById('app'), {'wsEndpoint': 'ws://localhost:8888'});
