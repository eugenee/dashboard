
(function(){
    'use strict';
    var createDataView = function () {
        // Metadata, describes the data columns, and provides the visual with hints
        // so it can decide how to best represent the data
        var dataViewMetadata = {
            objects: {
                categoryLabels: { show: true }
            },
            columns: [
                {
                    displayName: 'series',
                    isMeasure: false,
                    queryName: 'series',
                    roles: {"Category": true,"Series": true},
                    type: powerbi.ValueType.fromPrimitiveTypeAndCategory(powerbi.PrimitiveType.Text)
                },
                {
                    displayName: 'Total Sales Variance %',
                    groupName: 'Total Sales Variance %',
                    isMeasure: true,
                    queryName: "x",
                    roles: { "X": true },
                    type: powerbi.ValueType.fromPrimitiveTypeAndCategory(powerbi.PrimitiveType.Double)
                },
                {
                    displayName: 'Sales Per Sq Ft',
                    groupName: 'Sales Per Sq Ft',
                    isMeasure: true,
                    queryName: "y",
                    roles: { "Y": true },
                    type: powerbi.ValueType.fromPrimitiveTypeAndCategory(powerbi.PrimitiveType.Double)
                },
                {
                    displayName: 'valueSize',
                    groupName: 'valueSize',
                    isMeasure: true,
                    queryName: "size",
                    roles: { "Size": true },
                    type: powerbi.ValueType.fromPrimitiveTypeAndCategory(powerbi.PrimitiveType.Double)
                }
            ]
        };
        var categoryValues = ["FD - 01", "FD - 02", "FD - 03", "FD - 04", "LI - 01", "LI - 02", "LI - 03"];
        var columns = [
            {
                source: dataViewMetadata.columns[1],
                values: utils.random(categoryValues.length, 10, 300)
            }, {
                source: dataViewMetadata.columns[2],
                values: utils.random(categoryValues.length, 10, 300)
            }, {
                source: dataViewMetadata.columns[3],
                values: utils.random(categoryValues.length, 10, 300)
            }];
        var fieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });
        var categoryIdentities = categoryValues.map(function (value) {
            var expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.text(value));
            return powerbi.data.createDataViewScopeIdentity(expr);
        });
        var seriesIdentityField = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: 'e', name: 'series' } });
        var dataView = {
            metadata: dataViewMetadata,
            categorical: {
                categories: [{
                    source: dataViewMetadata.columns[0],
                    values: categoryValues,
                    identity: categoryIdentities,
                    identityFields: [seriesIdentityField],
                    objects: [
                        { dataPoint: { fill: { solid: { color: '#113F8C' } } } },
                        { dataPoint: { fill: { solid: { color: '#61AE24' } } } },
                        { dataPoint: { fill: { solid: { color: '#D0D102' } } } },
                        { dataPoint: { fill: { solid: { color: '#D70060' } } } },
                        { dataPoint: { fill: { solid: { color: '#F18D05' } } } },
                        { dataPoint: { fill: { solid: { color: '#616161' } } } },
                        { dataPoint: { fill: { solid: { color: '#00A1CB' } } } }]
                }],
                values: powerbi.data.DataViewTransform.createValueColumns(columns)
            }
        };

        return dataView;
    };

    function createVisual(visType, elem) {
        elem.height(250).width(400);
        var viewport = { height: 250, width: 400 };
        var visual = powerbi.visuals.visualPluginFactory.create().getPlugin(visType).create();
        powerbi.visuals.DefaultVisualHostServices.initialize();
        visual.init({
            element: elem,
            host: powerbi.visuals.defaultVisualHostServices,// host services
            style: {colorPalette: {dataColors: new powerbi.visuals.DataColorPalette()} },
            viewport: viewport,
            interactivity: { isInteractiveLegend: false, selection: true },
            settings: { slicingEnabled: true }
        });
        var dataViews = [createDataView()]
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
    createVisual('enhancedScatterChart',$('.pbi2'));
})();