Vue.component('filter-panel', {
    template: '#filter-panel-component',
    props: {
        defaultFilters: {
            type: Object,
            required: true
        },
        filtersData: {
            type: Object,
            required: true
        }
    },
    data: function () {
      return {
        min: 1,
        calendars: undefined,
        timePickers: undefined,
        showDate: true,
        datePanel: 'date',
        dateFilter: '',
        filters: {
            date: this.defaultFilters.date,
            satellite: this.defaultFilters.satellite,
            area: this.defaultFilters.area,
            source: this.defaultFilters.source,
            confidence_user: this.defaultFilters.confidence_user,
        }
      }
    },
    computed: {
        isDisabled: function() {
            if(this.calendars !== undefined) {
                return (this.calendars[0].config.maxDate).toString() == (this.calendars[0].selectedDates[0]).toString();
            }
            else return false;
        }
    },
    methods: {
        openCalendar: function(e) {
            this.calendars[e.target.dataset.calendar].toggle();
        },
        changeDay: function(e) {
            const currentDate = this.calendars[0].selectedDates[0];
            const newDate = e.target.textContent == '+' ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1) : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
            this.calendars[0].setDate(newDate);
            this.updateDate();
        },
        updateFilter: function() {
            this.$emit('update', this.filters);
        },
        closePanel: function() {
            this.$emit('close');
        },
        updateDate: function(e) {
            this.filters.date = [`${this.calendars[0].formatDate(this.calendars[0].selectedDates[0], "Y-m-d")}T${this.timePickers[0].formatDate(this.timePickers[0].selectedDates[0], "H:i:S")}.000Z`, `${this.calendars[0].formatDate(this.calendars[0].selectedDates[0], "Y-m-d")}T${this.timePickers[1].formatDate(this.timePickers[1].selectedDates[0], "H:i:S")}.000Z`];
            this.updateFilter();
        },
        updateDates: function(e) {
            this.filters.date = [`${this.calendars[1].formatDate(this.calendars[1].selectedDates[0], "Y-m-d")}T${this.timePickers[2].formatDate(this.timePickers[2].selectedDates[0], "H:i:S")}.000Z`, `${this.calendars[2].formatDate(this.calendars[2].selectedDates[0], "Y-m-d")}T${this.timePickers[3].formatDate(this.timePickers[3].selectedDates[0], "H:i:S")}.000Z`];
            this.updateFilter();
        }
    },
    mounted: function() {    
        L.DomEvent.disableClickPropagation(L.DomUtil.get('filterPanel'));
        L.DomEvent.disableScrollPropagation(L.DomUtil.get('filterPanel'));

        flatpickr.localize(flatpickr.l10ns.ru);
        this.calendars = flatpickr(".calendar", {
            maxDate: 'today',
            defaultDate: 'today' 
        });
        this.timePickers = flatpickr(".timepicker", {
            enableTime: true,
            noCalendar: true,
            time_24hr: true,
            dateFormat: "H:i" 
        });
    }
});

var app = new Vue({
    el: '#app',
    data: {
        map: undefined,
        openPanel: false,
        url: 'https://fire-rs.gazprom-spacesystems.ru/proxy_gazcom_rs/geoserver/GSS/wms',
        baseLayers: {
            "Bing": new L.BingLayer("ApTJzdkyN1DdFKkRAE6QIDtzihNaf6IWJsT-nQ_2eMoO4PN__0Tzhl2-WgJtXFSp", {type: 'Aerial'}),
            "Yandex": L.tileLayer('http://vec{s}.maps.yandex.net/tiles?l=map&v=4.55.2&z={z}&x={x}&y={y}&scale=2&lang=ru_RU', {
                subdomains: ['01', '02', '03', '04'],
                attribution: '<a href="https://yandex.ru/" target="_blank">Яндекс</a>',
                reuseTiles: true,
                updateWhenIdle: false
                }),
            "OpenStreetMap": L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '<a href="http://osm.org/copyright">OpenStreetMap</a>'})
        },
        overlays: {},
        groupedOverlays: {},
        userFilters: {
            date: [],
            confidence_user: [1, 2],
            satellite: [0, 1, 2],
            area: [1, 2, 3, 4],
            source: [0, 1],
        },
        filterString: '',
        threatsFilterString: '',
        filtersData: {
            confidences: ['Низкая', 'Средняя', 'Высокая'],
            satellites: ['SuomiNPP', 'Aqua', 'Terra'],
            areas: ['0 - 0.1', '0.1 - 2', '2 - 20', '20 - 200', '> 200'],
            sources: ['GSS', 'EOSDIS']
        }
    },
    methods: {
        updateFilter: function(filtersObject) {
            let filterArray = [];
            this.userFilters = filtersObject;
            for (let prop in this.userFilters) {
                switch(prop) {
                    case 'date':
                        filterArray.push(`(date BETWEEN ${this.userFilters[prop][0]} AND ${this.userFilters[prop][1]})`);
                        this.threatsFilterString = `(date BETWEEN ${this.userFilters[prop][0]} AND ${this.userFilters[prop][1]})`;
                        break;
                    case 'area':
                        const sortArray = this.userFilters[prop].sort((a, b) => a - b);
                        const areaArray = [];                     
                        sortArray.map(index => {
                            if(index === 4) {
                                areaArray.push(`area > 200`);    
                            }
                            else {
                                const [lower, upper] = this.filtersData.areas[index].split(' - ');
                                areaArray.push(`area BETWEEN ${lower} AND ${upper}`);
                            }
                        });
                        filterArray.push(`(${areaArray.join(' OR ')})`);
                        break;                    
                    case 'confidence_user':
                        filterArray.push(`(confidence_user IN (${this.userFilters[prop].map(index => `'${this.filtersData.confidences[index].toLowerCase()}'`)}))`);
                        break;
                    case 'satellite':
                        filterArray.push(`(satellite IN (${this.userFilters[prop].map(index => `'${this.filtersData.satellites[index]}'`)}))`);
                        break;
                    case 'source':
                        filterArray.push(`(source IN (${this.userFilters[prop].map(index => `'${this.filtersData.sources[index]}'`)}))`);
                }
            }
            this.filterString = filterArray.join(' AND ');
            this.groupedOverlays['Пожары']['Зоны пожаров (круп. масштаб)'].setParams({cql_filter: this.filterString});
            this.groupedOverlays['Пожары']['Зоны пожаров (мел. масштаб)'].setParams({cql_filter: this.filterString});
            this.groupedOverlays['Пожары']['Угрозы'].setParams({cql_filter: this.threatsFilterString});
        },
        getFeatureInfo: function (evt) {
            const url = this.getFeatureInfoUrl(evt.latlng),
            showResults = L.Util.bind(this.showGetFeatureInfo, this);
            fetch(url)
                .then(function(data) {
                    return data.text();
                })
                .then(function(data){
                    showResults(evt.latlng, data);
                })
                .catch(function(error) {
                    console.log(error);
                });
        },
        getFeatureInfoUrl: function (latlng) {
            let arr = '';
            let filters = '';
            this.map.eachLayer(layer => { 
                if (layer instanceof L.TileLayer.WMS && layer.options.queryable === true) {
                    arr += layer.wmsParams.layers + ',';
                    if (layer.wmsParams.layers === 'GSS:firepoint_poly_mini') {
                        filters += this.filterString + ';';
                    } else if (layer.wmsParams.layers === 'GSS:threats_sql') {
                        filters += this.threatsFilterString + ';';
                    } else {
                        filters += 'INCLUDE;';
                    }
                }
            });
            filters = filters.slice(0, -1);
            arr = arr.slice(0, -1);
            const point = this.map.latLngToContainerPoint(latlng, this.map.getZoom()),
                size = this.map.getSize(),
                params = {
                    request: 'GetFeatureInfo',
                    service: 'WMS',
                    srs: 'EPSG:4326',
                    transparent: true,
                    version: '1.1.1', 
                    format: 'image/png',
                    bbox: this.map.getBounds().toBBoxString(),
                    height: size.y,
                    width: size.x,
                    layers: arr,
                    query_layers: arr,
                    info_format: 'text/html',
                    feature_count: 10,
                    cql_filter: filters
                };
            
            params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
            params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
            
            return this.url + L.Util.getParamString(params, this.url, true);
        },
        showGetFeatureInfo: function (latlng, content) {
            if (content.search('<ul>') == -1) {
                return;
            }
            const popup = L.popup({ maxWidth: 800})
              .setLatLng(latlng)
              .setContent(content)
              .openOn(this.map);
        }
    },
    created: function() {
        const url = this.url;
        const date1 = new Date();
        date1.setUTCHours(0,0,0,0);
        const date2 = new Date();
        date2.setUTCHours(23,59,0,0);
        this.userFilters.date = [date1.toISOString(), date2.toISOString()];

        this.groupedOverlays = {
            'Другие': {
                'Километраж газопровода': L.tileLayer.wms(url, {
                    layers: 'GSS:piki_km',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                }),
                'Зона мониторинга ГКС': L.tileLayer.wms(url, {
                    layers: 'GSS:zone_monitor',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                })
            },
            'Объекты': {
                'Газопровод': L.tileLayer.wms(url, {
                    layers: 'GSS:tube',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                }),
                'Газодобывающие комплексы': L.tileLayer.wms(url, {
                    layers: 'GSS:dobycha',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                }),
                'Факельные установки': L.tileLayer.wms(url, {
                    layers: 'GSS:fakel',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                }),
                'Эксплуатационные нарушения': L.tileLayer.wms(url, {
                    layers: 'GSS:violations',
                    transparent: true,
                    format: 'image/png',
                    queryable: false
                }),
                'Зоны ответственности': L.tileLayer.wms(url, {
                    layers: 'GSS:zone_notif',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                })
            },
            'Пожары': {
                'Зоны пожаров (круп. масштаб)': L.tileLayer.wms(url, {
                    layers: 'GSS:firepoint_poly',
                    transparent: true,
                    format: 'image/png',
                    queryable: false
                }),
                'Зоны пожаров (мел. масштаб)': L.tileLayer.wms(url, {
                    layers: 'GSS:firepoint_poly_mini',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                }),
                'Угрозы': L.tileLayer.wms(url, {
                    layers: 'GSS:threats_sql',
                    transparent: true,
                    format: 'image/png',
                    queryable: true
                })                
            }
        };
        this.updateFilter(this.userFilters);
    },
    mounted: function() {
        const layers = [
            this.baseLayers['Bing'], 
            this.groupedOverlays['Объекты']['Газопровод'], 
            this.groupedOverlays['Объекты']['Газодобывающие комплексы'], 
            this.groupedOverlays['Объекты']['Факельные установки'], 
            this.groupedOverlays['Объекты']['Эксплуатационные нарушения'],
            this.groupedOverlays['Объекты']['Зоны ответственности'], 
            this.groupedOverlays['Пожары']['Зоны пожаров (круп. масштаб)'], 
            this.groupedOverlays['Пожары']['Зоны пожаров (мел. масштаб)'],
            this.groupedOverlays['Пожары']['Угрозы']
        ];
        this.map = L.map('map',{
            layers: layers,
            center: [57, 104],
            zoom: 3,
            minZoom: 3,
            maxBounds: L.latLngBounds(L.latLng(90, 270), L.latLng(-90, -90))
        });

        L.control.mousePosition().addTo(this.map);
        L.control.scale({imperial: false}).addTo(this.map);
        L.control.ruler().addTo(this.map);
        L.control.groupedLayers(this.baseLayers, this.groupedOverlays, { groupCheckboxes: true }).addTo(this.map);      
        const layerSwitcher = document.querySelector('.leaflet-control-layers-list');
        L.DomEvent.disableClickPropagation(layerSwitcher);
        L.DomEvent.disableScrollPropagation(layerSwitcher);
        this.map.on('click', this.getFeatureInfo);
    }
});

// const overlays = {
//     //"<span style='color:red'>wms</span>": wms,
//     "Факельные установки": fakel,
//     "Зоны ответственности": zone_notif,
//     "Газопровод": tube,
//     "Газодобывающие комплексы": dobycha,
//     'Пожары': firepoint_poly,
//     'Пожары1': firepoints_poly_mini
// };