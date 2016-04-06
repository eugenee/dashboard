var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var samples;
        (function (samples) {
            var SelectionManager = visuals.utility.SelectionManager;
            var createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
            var AsterPlotVisualClassName = 'asterPlot';
            var AsterDefaultOuterLineThickness = 1;
            var AsterDefaultLabelFill = { solid: { color: '#333' } };
            var AsterDefaultLegendFontSize = 8;
            var AsterDefaultLegendShow = true;
            var AsterLabelFillProp = { objectName: 'label', propertyName: 'fill' };
            var AsterLegendShowProp = { objectName: "legend", propertyName: "show" };
            var AsterOuterLineShowProp = { objectName: 'outerLine', propertyName: 'show' };
            var AsterOuterLineThicknessProp = { objectName: 'outerLine', propertyName: 'thickness' };
            var AsterGeneralFormatStringProp = { objectName: 'general', propertyName: 'formatString' };
            var AsterPlotWarning = (function () {
                function AsterPlotWarning(message) {
                    this.message = message;
                }
                Object.defineProperty(AsterPlotWarning.prototype, "code", {
                    get: function () {
                        return "AsterPlotWarning";
                    },
                    enumerable: true,
                    configurable: true
                });
                AsterPlotWarning.prototype.getMessages = function (resourceProvider) {
                    return {
                        message: this.message,
                        title: resourceProvider.get(""),
                        detail: resourceProvider.get("")
                    };
                };
                return AsterPlotWarning;
            })();
            samples.AsterPlotWarning = AsterPlotWarning;
            var AsterPlot = (function () {
                function AsterPlot() {}
                AsterPlot.GetCenterTextProperties = function (fontSize, text) {
                    return {
                        fontWeight: 'bold',
                        fontSize: jsCommon.PixelConverter.toString(fontSize),
                        text: text
                    };
                };
                AsterPlot.getDefaultAsterData = function () {
                    return {
                        dataPoints: null,
                        legendData: null,
                        settings: { showLegend: AsterDefaultLegendShow },
                        valueFormatter: null
                    };
                };
                AsterPlot.converter = function (dataView, colors) {
                    var asterDataResult = this.getDefaultAsterData();
                    if (!dataView.categorical || !dataView.categorical.categories || dataView.categorical.categories.length !== 1){return asterDataResult;}
                    var catDv = dataView.categorical;
                    var cat = catDv.categories[0];
                    var catValues = cat.values;
                    var values = catDv.values;
                        asterDataResult.dataPoints = [];
                    if (!catValues || catValues.length < 1 || !values || values.length < 1){return asterDataResult;}
                    var categorySourceFormatString = visuals.valueFormatter.getFormatString(cat.source, AsterGeneralFormatStringProp);
                    var minValue = Math.min(0, d3.min(values[0].values));

                    for (var i = 0, length_1 = Math.min(colors.getAllColors().length, catValues.length); i < length_1; i++) {
                        var formattedCategoryValue = visuals.valueFormatter.format(catValues[i], categorySourceFormatString);
                        var tooltipInfo = visuals.TooltipBuilder.createTooltipInfo(AsterGeneralFormatStringProp, catDv, formattedCategoryValue, values[0].values[i], null, null, 0);
                        if (values.length > 1) {
                            var toolTip = visuals.TooltipBuilder.createTooltipInfo(AsterGeneralFormatStringProp, catDv, formattedCategoryValue, values[1].values[i], null, null, 1)[1];
                            if (toolTip) {tooltipInfo.push(toolTip);}
                        }
                        asterDataResult.dataPoints.push({
                            sliceHeight: values[0].values[i] - minValue,
                            sliceWidth: Math.max(0, values.length > 1 ? values[1].values[i] : 1),
                            label: catValues[i],
                            color: colors.getColorByIndex(i).value,
                            selector: visuals.SelectionId.createWithId(cat.identity[i]),
                            tooltipInfo: tooltipInfo
                        });
                    }

                    asterDataResult.legendData = AsterPlot.getLegendData(dataView, asterDataResult.dataPoints);
                    asterDataResult.settings = AsterPlot.parseLegendSettings(dataView);
                    return asterDataResult;
                };
                AsterPlot.getLegendData = function (dataView, asterDataPoints) {
                    var legendData = {
                        fontSize: AsterDefaultLegendFontSize,
                        dataPoints: [],
                        title: dataView.categorical.categories[0].source.displayName
                    };
                    for (var i = 0; i < asterDataPoints.length; ++i) {
                        legendData.dataPoints.push({
                            label: asterDataPoints[i].label,
                            color: asterDataPoints[i].color,
                            icon: visuals.LegendIcon.Box,
                            selected: false,
                            identity: visuals.SelectionId.createWithId(dataView.categorical.categories[0].identity[i], false)
                        });
                    }
                    return legendData;
                };
                AsterPlot.parseLegendSettings = function (dataView) {
                    var objects;
                    if (!dataView){objects = null;}else{objects = dataView.metadata.objects;}
                    return { showLegend: powerbi.DataViewObjects.getValue(objects, AsterLegendShowProp, AsterDefaultLegendShow) };
                };
                AsterPlot.prototype.init = function (options) {
                    var element = options.element;
                    this.selectionManager = new SelectionManager({ hostServices: options.host });
                    var svg = this.svg = d3.select(element.get(0))
                        .append('svg')
                        .classed(AsterPlotVisualClassName, true)
                        .style('position', 'absolute');
                    this.hostService = options.host;
                    this.colors = options.style.colorPalette.dataColors;
                    this.mainGroupElement = svg
                        .append('g');
                    this.centerText = this.mainGroupElement
                        .append('text');
                    this.legend = visuals.createLegend(element, false, null, true);
                };
                AsterPlot.prototype.update = function (options) {
                    var _this = this;
                    if (!options.dataViews || !options.dataViews[0]){
                        return; // or clear the view, display an error, etc.
                    }
                    var duration = options.suppressAnimations ? 0 : visuals.AnimatorCommon.MinervaAnimationDuration;
                    this.currentViewport = {
                        height: Math.max(0, options.viewport.height),
                        width: Math.max(0, options.viewport.width)
                    };
                    var dataView = this.dataView = options.dataViews[0];
                    var convertedData = this.data = AsterPlot.converter(dataView, this.colors);
                    if (!convertedData || !convertedData.dataPoints) {
                        this.clearData();
                        return;
                    }
                    this.renderLegend(this.data);
                    this.updateViewPortAccordingToLegend();
                    this.svg
                        .attr({
                            height: Math.max(0, this.currentViewport.height),
                            width: Math.max(0, this.currentViewport.width)
                        })
                        .on('click', function () { 
                            return _this.selectionManager.clear().then(function () {
                                return selection.style('opacity', 1);
                            });
                        });
                    var width = this.currentViewport.width - 20;
                    var height = this.currentViewport.height - 20;
                    var radius = Math.min(width, height) / 2;
                    var innerRadius = 0.3 * radius;
                    var mainGroup = this.mainGroupElement;
                        mainGroup.attr('transform', visuals.SVGUtil.translate((width + 10) / 2, (height + 10) / 2));
                    var dataPoints = this.validateData(dataView, convertedData.dataPoints);
                    if (!dataPoints){return;}
                    var maxScore = d3.max(dataPoints, function (d) { return d.sliceHeight; });
                    var totalWeight = d3.sum(dataPoints, function (d) { return d.sliceWidth; });
                    var pie = d3.layout.pie()
                        .sort(null)
                        .value(function (d) {
                            return (d && !isNaN(d.sliceWidth) ? d.sliceWidth : 0) / totalWeight;
                        });
                    var arc = d3.svg.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(function (d) {
                            return (radius - innerRadius) * (d && d.data && !isNaN(d.data.sliceHeight) ? d.data.sliceHeight : 1) / maxScore + innerRadius + 1;
                        });
                    var selectionManager = this.selectionManager;
                    var selection = mainGroup
                        .selectAll(AsterPlot.AsterSlice.selector)
                        .data(pie(dataPoints), function (d, idx) {
                            return dataPoints[idx] ? dataPoints[idx].selector.getKey() : idx;
                        });
                    selection.enter()
                        .append('path')
                        .attr('stroke', '#eee')
                        .classed(AsterPlot.AsterSlice.class, true);
                    selection
                        .on('click', function (d) {
                            var _this = this;
                            selectionManager
                                .select(d.data.selector)
                                .then(function (ids) {
                                    if (ids.length > 0) {
                                        selection.style('opacity', 0.5);
                                        d3.select(_this).style('opacity', 1);
                                    }
                                    else {
                                        selection.style('opacity', 1);
                                    }
                                });
                            d3.event.stopPropagation();
                        })
                        .attr('fill', function (d) { return d.data.color; })
                        .transition().duration(duration)
                        .attrTween('d', function (data) {
                            if (!this.oldData) {
                                this.oldData = data;
                                return function () {
                                    return arc(data);
                                };
                            }
                            var interpolation = d3.interpolate(this.oldData, data);
                            this.oldData = interpolation(0);
                            return function (x) {
                                return arc(interpolation(x));
                            };
                        });
                    selection
                        .exit()
                        .remove();
                    this.drawCenterText(innerRadius);
                    //this.drawOuterLine(innerRadius, radius, pie(dataPoints));
                    visuals.TooltipManager.addTooltip(selection, function (tooltipEvent) {
                        return tooltipEvent.data.data.tooltipInfo;
                    });
                };
                AsterPlot.prototype.renderLegend = function (asterPlotData) {
                    if (!asterPlotData || !asterPlotData.legendData)
                        return;
                    this.legendObjectProperties = powerbi.DataViewObjects.getObject(this.dataView.metadata.objects, "legend", {});
                    var legendData = asterPlotData.legendData;
                    if (this.legendObjectProperties) {
                        visuals.LegendData.update(legendData, this.legendObjectProperties);
                        var position = this.legendObjectProperties[visuals.legendProps.position];
                        if (position)
                            this.legend.changeOrientation(visuals.LegendPosition[position]);
                    }
                    this.legend.drawLegend(legendData, _.clone(this.currentViewport));
                    visuals.Legend.positionChartArea(this.svg, this.legend);
                };
                AsterPlot.prototype.updateViewPortAccordingToLegend = function () {
                    var legendMargins = this.legend.getMargins(), legendPosition;
                    if (!this.legendObjectProperties){return;}
                    legendPosition = visuals.LegendPosition[this.legendObjectProperties[visuals.legendProps.position]];
                    switch (legendPosition) {
                        case visuals.LegendPosition.Top:
                        case visuals.LegendPosition.TopCenter:
                        case visuals.LegendPosition.Bottom:
                        case visuals.LegendPosition.BottomCenter: {
                            this.currentViewport.height -= legendMargins.height;
                            break;
                        }
                        case visuals.LegendPosition.Left:
                        case visuals.LegendPosition.LeftCenter:
                        case visuals.LegendPosition.Right:
                        case visuals.LegendPosition.RightCenter: {
                            this.currentViewport.width -= legendMargins.width;
                            break;
                        }
                        default:
                            break;
                    }
                };
                AsterPlot.prototype.validateData = function (dataView, dataPoints) {
                    var maxCategories = this.colors.getAllColors().length;
                    if (dataPoints && dataView.categorical.categories[0].values.length > maxCategories) {
                        this.hostService.setWarnings([new AsterPlotWarning(powerbi.localization.defaultLocalizedStrings.DsrLimitWarning_TooMuchDataMessage)]);
                        var minSliceWidth = dataPoints.sort(function (a, b) { return b.sliceWidth - a.sliceWidth; })[maxCategories - 1].sliceWidth;
                        return dataPoints.filter(function (x) { return x.sliceWidth >= minSliceWidth; }).slice(0, maxCategories);
                    }
                    return dataPoints;
                };
                AsterPlot.prototype.drawOuterLine = function (innerRadius, radius, data) {
                    var mainGroup = this.mainGroupElement;
                    var outlineArc = d3.svg.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(radius);
                    if (this.getShowOuterline(this.dataView)) {
                        var outerLine = mainGroup.selectAll(AsterPlot.OuterLine.selector).data(data);
                        outerLine.enter().append('path');
                        outerLine
                            .attr("fill", "none")
                            .attr({
                                'stroke': '#333',
                                'stroke-width': this.getOuterThickness(this.dataView) + 'px',
                                'd': outlineArc
                            })
                            .style('opacity', 1)
                            .classed(AsterPlot.OuterLine.class, true);
                    }
                    else {
                        mainGroup.selectAll(AsterPlot.OuterLine.selector).style('opacity', 0);
                    }
                };
                AsterPlot.prototype.getCenterText = function (dataView) {
                    var columns = dataView.metadata.columns;
                    for (var _i = 0; _i < columns.length; _i++) {
                        var column = columns[_i];
                        if (!column.isMeasure) {
                            return column.displayName;
                        }
                    }
                    return '';
                };
                AsterPlot.prototype.drawCenterText = function (innerRadius) {
                    var centerTextProperties = AsterPlot.GetCenterTextProperties(innerRadius * AsterPlot.CenterTextFontHeightCoefficient, this.getCenterText(this.dataView));
                    this.centerText
                        .style({
                            'line-height': 1,
                            'font-weight': centerTextProperties.fontWeight,
                            'font-size': centerTextProperties.fontSize,
                            'fill': this.getLabelFill(this.dataView).solid.color
                        })
                        .attr({
                            'dy': '0.35em',
                            'text-anchor': 'middle'
                        })
                        .text(powerbi.TextMeasurementService.getTailoredTextOrDefault(centerTextProperties, innerRadius * AsterPlot.CenterTextFontWidthCoefficient));
                };
                AsterPlot.prototype.getShowOuterline = function (dataView) {
                    return dataView.metadata && powerbi.DataViewObjects.getValue(dataView.metadata.objects, AsterOuterLineShowProp, false);
                };
                AsterPlot.prototype.getOuterThickness = function (dataView) {
                    if (dataView && dataView.metadata && dataView.metadata.objects)
                        return powerbi.DataViewObjects.getValue(dataView.metadata.objects, AsterOuterLineThicknessProp, AsterDefaultOuterLineThickness);
                    return AsterDefaultOuterLineThickness;
                };
                AsterPlot.prototype.getLabelFill = function (dataView) {
                    if (dataView && dataView.metadata && dataView.metadata.objects)
                        return powerbi.DataViewObjects.getValue(dataView.metadata.objects, AsterLabelFillProp, AsterDefaultLabelFill);
                    return AsterDefaultLabelFill;
                };
                AsterPlot.prototype.getLegendInstance = function () {
                    return {
                        selector: null,
                        objectName: 'legend',
                        displayName: 'Legend',
                        properties: {
                            show: this.data.settings.showLegend,
                            position: visuals.LegendPosition[this.legend.getOrientation()],
                            showTitle: powerbi.DataViewObject.getValue(this.legendObjectProperties, visuals.legendProps.showTitle, true),
                            titleText: this.data.legendData ? this.data.legendData.title : '',
                            labelColor: powerbi.DataViewObject.getValue(this.legendObjectProperties, visuals.legendProps.labelColor, null),
                            fontSize: powerbi.DataViewObject.getValue(this.legendObjectProperties, visuals.legendProps.fontSize, AsterDefaultLegendFontSize)
                        }
                    };
                };
                AsterPlot.prototype.clearData = function () {
                    this.mainGroupElement.selectAll("path").remove();
                    this.legend.drawLegend({ dataPoints: [] }, this.currentViewport);
                };
                AsterPlot.prototype.enumerateObjectInstances = function (options) {
                    var instances = [];
                    switch (options.objectName) {
                        case 'legend':
                            var legend = this.getLegendInstance();
                            instances.push(legend);
                            break;
                        case 'label':
                            var label = {
                                objectName: 'label',
                                displayName: 'Label',
                                selector: null,
                                properties: {
                                    fill: this.getLabelFill(this.dataView)
                                }
                            };
                            instances.push(label);
                            break;
                        case 'outerLine':
                            var outerLine = {
                                objectName: 'outerLine',
                                displayName: 'Outer Line',
                                selector: null,
                                properties: {
                                    show: this.getShowOuterline(this.dataView),
                                    thickness: this.getOuterThickness(this.dataView)
                                }
                            };
                            instances.push(outerLine);
                            break;
                    }
                    return instances;
                };
                AsterPlot.capabilities = {
                    dataRoles: [
                        {
                            name: 'Category',
                            kind: powerbi.VisualDataRoleKind.Grouping,
                        },
                        {
                            name: 'Y',
                            kind: powerbi.VisualDataRoleKind.Measure,
                        },
                    ],
                    dataViewMappings: [{
                            conditions: [
                                { 'Category': { max: 1 }, 'Y': { max: 2 } }
                            ],
                            categorical: {
                                categories: {
                                    for: { in: 'Category' },
                                    dataReductionAlgorithm: { top: {} }
                                },
                                values: {
                                    select: [{ bind: { to: 'Y' } }]
                                },
                            }
                        }],
                    objects: {
                        general: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_General'),
                            properties: {
                                formatString: {
                                    type: { formatting: { formatString: true } },
                                },
                            },
                        },
                        legend: {
                            displayName: 'Legend',
                            description: 'Display legend options',
                            properties: {
                                show: {
                                    displayName: 'Show',
                                    type: { bool: true }
                                },
                                position: {
                                    displayName: 'Position',
                                    description: 'Select the location for the legend',
                                    type: { enumeration: visuals.legendPosition.type }
                                },
                                showTitle: {
                                    displayName: 'Title',
                                    description: 'Display a title for legend symbols',
                                    type: { bool: true }
                                },
                                titleText: {
                                    displayName: 'Legend Name',
                                    description: 'Title text',
                                    type: { text: true },
                                    suppressFormatPainterCopy: true
                                },
                                labelColor: {
                                    displayName: 'Color',
                                    type: { fill: { solid: { color: true } } }
                                },
                                fontSize: {
                                    displayName: 'Text Size',
                                    type: { formatting: { fontSize: true } }
                                }
                            }
                        },
                        label: {
                            displayName: 'Label',
                            properties: {
                                fill: {
                                    displayName: 'Fill',
                                    type: { fill: { solid: { color: true } } }
                                }
                            }
                        },
                        outerLine: {
                            displayName: 'Outer line',
                            properties: {
                                show: {
                                    displayName: 'Show',
                                    type: { bool: true }
                                },
                                thickness: {
                                    displayName: 'Thickness',
                                    type: { numeric: true }
                                }
                            }
                        }
                    }
                };
                AsterPlot.AsterSlice = createClassAndSelector('asterSlice');
                AsterPlot.OuterLine = createClassAndSelector('outerLine');
                AsterPlot.CenterTextFontHeightCoefficient = 0.4;
                AsterPlot.CenterTextFontWidthCoefficient = 1.9;
                return AsterPlot;
            })();
            samples.AsterPlot = AsterPlot;
        })(samples = visuals.samples || (visuals.samples = {}));

        //
        // plug it in
        //
        var plugins;
        (function (plugins) {
            plugins.asterPlot = {
                name: 'asterPlot',
                capabilities: visuals.samples.AsterPlot.capabilities,
                create: function () { return new visuals.samples.AsterPlot(); }
            };

        })(plugins = visuals.plugins || (visuals.plugins = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
