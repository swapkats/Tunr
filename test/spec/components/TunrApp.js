'use strict';

describe('Main', function () {
  var TunrApp, component;

  beforeEach(function () {
    var container = document.createElement('div');
    container.id = 'content';
    document.body.appendChild(container);

    TunrApp = require('../../../src/scripts/components/TunrApp.jsx');
    component = TunrApp();
  });

  it('should create a new instance of TunrApp', function () {
    expect(component).toBeDefined();
  });
});
