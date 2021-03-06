(function(){
    'use strict';
    var createDataView = function () {
        // Metadata, describes the data columns, and provides the visual with hints
        // so it can decide how to best represent the data
        var dataViewMetadata = {
            objects: {
              legend: { show: true}
            },
            columns: [
                {
                    displayName: 'Country',
                    queryName: 'Country',
                    type: powerbi.ValueType.fromDescriptor({ text: true })
                    //,roles:{}
                },
                {
                    displayName: 'Sales (2014)',
                    isMeasure: true,
                    format: "$0",
                    queryName:'sales 1',
                    type: powerbi.ValueType.fromDescriptor({ numeric: true })
                },
                {
                    displayName: 'Sales (2013)',
                    isMeasure: true,
                    format: "$0",
                    queryName:'sales 2',
                    type: powerbi.ValueType.fromDescriptor({ numeric: true })
                }
            ]
        };
        var categoryValues = ["Australia", "Canada", "France", "Germany", "UK", "USA"];
        var columns = [
            {
                source: dataViewMetadata.columns[1],// Sales Amount for 2014
                values: utils.random(categoryValues.length, 30000, 100000)
            },
            {
                source: dataViewMetadata.columns[2],// Sales Amount for 2013
                values: utils.random(categoryValues.length, 30000, 100000)
                //[742731.43, 162066.43, 376074.57, 814724.34, 283085.78, 300263.49]
            }
        ];
        var fieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });
        var categoryIdentities = categoryValues.map(function (value) {
            var expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.text(value));
            return powerbi.data.createDataViewScopeIdentity(expr);
        });
        var dataView = {
            metadata: dataViewMetadata,
            categorical: {
                categories: [{
                    source: dataViewMetadata.columns[0],
                    values: categoryValues,
                    identity: categoryIdentities
                }],
                values: powerbi.data.DataViewTransform.createValueColumns(columns)
            }
        };

        return dataView;
    };
    function createVisual(visType,elem) {
        elem.height(250).width(400);
        var viewport = { height: 250, width: 400 };
        var visual = powerbi.visuals.visualPluginFactory.create().getPlugin(visType).create();
        powerbi.visuals.DefaultVisualHostServices.initialize();
        visual.init({
            element: elem,
            host: powerbi.visuals.defaultVisualHostServices,// host services
            style: { colorPalette: {dataColors: new powerbi.visuals.DataColorPalette()} },
            viewport: viewport,
            interactivity: { isInteractiveLegend: false, selection: true },
            settings: { slicingEnabled: true }
        });
        var dataViews = [createDataView()];
        if (visual.update) {
            // Call update to draw the visual with some data
            visual.update({
                dataViews: dataViews,
                viewport: viewport,
                duration: 222
            });
        } else if (visual.onDataChanged && visual.onResizing) {
            // Call onResizing and onDataChanged (old API) to draw the visual with some data
            visual.onResizing(viewport);
            visual.onDataChanged({ dataViews: dataViews });
        }
    }
    createVisual('pieChart', $('.pbi1'));
})();