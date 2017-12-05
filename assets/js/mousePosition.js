L.Control.MousePosition = L.Control.extend({
    options: {
      position: 'bottomright',
      separator: ', ',
      emptyString: '',
      numDigits: 3,
      prefix: ""
    },
  
    onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
      L.DomUtil.addClass(this._container, 'shadow');
      L.DomEvent.disableClickPropagation(this._container);
      map.on('mousemove', this._onMouseMove, this);
      this._container.innerHTML = this.options.emptyString;
      return this._container;
    },
  
    onRemove: function (map) {
      map.off('mousemove', this._onMouseMove)
    },
  
    _onMouseMove: function (e) {
      var lng = L.Util.formatNum(e.latlng.lng, this.options.numDigits);
      var lat = L.Util.formatNum(e.latlng.lat, this.options.numDigits);
      var value = lat + this.options.separator + lng;
      var prefixAndValue = this.options.prefix + ' ' + value;
      this._container.innerHTML = prefixAndValue;
    }
  
  });
  
  L.control.mousePosition = function (options) {
      return new L.Control.MousePosition(options);
  };