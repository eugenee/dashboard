/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
var PlaygroundViewType;
(function (PlaygroundViewType) {
    PlaygroundViewType[PlaygroundViewType["WebView"] = 0] = "WebView";
    PlaygroundViewType[PlaygroundViewType["MobilePortraitView"] = 1] = "MobilePortraitView";
    PlaygroundViewType[PlaygroundViewType["MobileLandscapeView"] = 2] = "MobileLandscapeView";
})(PlaygroundViewType || (PlaygroundViewType = {}));
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals_1) {
        var defaultVisualHostServices = powerbi.visuals.defaultVisualHostServices;
        var visualPluginFactory = powerbi.visuals.visualPluginFactory;
        var HostControls = powerbi.visuals.HostControls;
        /**
         * Demonstrates Power BI visualization elements and the way to embed them in standalone web page.
         */
        var Playground = (function () {
            function Playground() {
            }
            /** Performs sample app initialization.*/
            Playground.initialize = function () {
                var _this = this;
                this.webViewTab = $('#webViewTab');
                this.mobileViewTab = $('#mobileViewTab');
                this.visualsSelectElement = $('#visualTypes');
                this.mobileOrientationOptionsElement = $('#orientation');
                this.mobileOrientationPortraitRadioButton = this.mobileOrientationOptionsElement.find("input[value='portrait']");
                this.mobileOrientationLandscapeRadioButton = this.mobileOrientationOptionsElement.find("input[value='landscape']");
                this.optionsCapabilitiesElement = $('#capabilities');
                this.interactionsEnabledCheckbox = $("input[name='is_interactions']");
                this.webContainer = $('#webContainer');
                this.mobilePortraitDashboardContainer = $('#mobilePortraitDashboardContainer');
                this.mobilePortraitInFocusContainer = $('#mobilePortraitInFocusContainer');
                this.mobileLandscapeDashboardContainer = $('#mobileLandscapeDashboardContainer');
                this.mobileLandscapeInFocusContainer = $('#mobileLandscapeInFocusContainer');
                this.webContainers = this.webContainer.parent();
                this.mobilePortraitContainers = $('.mobile-portrait-image-container');
                this.mobileLandscapeContainers = $('.mobile-landscape-image-container');
                this.initializeView(PlaygroundViewType.WebView);
                this.populateVisualTypeSelect();
                powerbi.visuals.DefaultVisualHostServices.initialize();
                // Wrapper function to simplify visualization element creation when using jQuery
                $.fn.visual = function (host, plugin, dataView) {
                    // Step 1: Create new DOM element to represent Power BI visual
                    var element = $('<div/>');
                    element.addClass('visual');
                    element['visible'] = function () { return true; };
                    this.append(element);
                    // Step 2: Instantiate Power BI visual
                    host.visual = plugin.create();
                    return this;
                };
                this.webViewTab.click(function () { _this.updateView(PlaygroundViewType.WebView); });
                this.mobileViewTab.click(function () { _this.updateView(PlaygroundViewType.MobilePortraitView); });
                this.mobileOrientationPortraitRadioButton.click(function () { _this.updateView(PlaygroundViewType.MobilePortraitView); });
                this.mobileOrientationLandscapeRadioButton.click(function () { _this.updateView(PlaygroundViewType.MobileLandscapeView); });
                this.interactionsEnabledCheckbox.on('change', function () { return _this.updateVisuals; });
                this.hostControls = new HostControls($('#controls'), Playground.updateVisual);
                this.hostControls.setHosts(this.hosts);
                var visualByDefault = jsCommon.Utility.getURLParamValue('visual');
                if (visualByDefault) {
                    this.onVisualTypeSelection(visualByDefault.toString());
                }
                else {
                    this.onVisualTypeSelection(this.visualsSelectElement.val());
                }
            };
            Playground.initVisual = function (host) {
                host.visual.init({
                    element: this.getVisualElementInContainer(host.container),
                    host: defaultVisualHostServices,
                    style: this.visualStyle,
                    viewport: host.renderingViewport,
                    interactivity: {
                        isInteractiveLegend: this.shouldCreateInteractiveVisual(host),
                        selection: this.isInteractiveMode()
                    },
                    settings: { slicingEnabled: true }
                });
            };
            Playground.shouldCreateInteractiveVisual = function (host) {
                var _this = this;
                return host.interactive &&
                    this.isMobileView(this.viewType) &&
                    this.mobileInteractiveVisuals.some(function (visualName) { return visualName === _this.currentVisualPlugin.name; });
            };
            Playground.populateVisualTypeSelect = function () {
                var _this = this;
                this.visualsSelectElement.empty();
                var visuals = this.getPluginService().getVisuals();
                visuals.sort(function (a, b) {
                    if (a.name < b.name)
                        return -1;
                    if (a.name > b.name)
                        return 1;
                    return 0;
                });
                visuals.forEach(function (visual) {
                    if (!Playground.disabledVisuals.some(function (visualName) { return visualName === visual.name; })) {
                        _this.visualsSelectElement.append('<option value="' + visual.name + '">' + visual.name + '</option>');
                    }
                });
                this.visualsSelectElement.change(function () { return _this.onVisualTypeSelection(_this.visualsSelectElement.val()); });
            };
            Playground.onVisualTypeSelection = function (pluginName) {
                if (pluginName.length === 0) {
                    return;
                }
                this.hostControls.onPluginChange(pluginName);
                this.createVisualPlugin(pluginName);
                // this.hostControls.update();
            };
            Playground.createVisualPlugin = function (pluginName) {
                this.currentVisualPlugin = this.getPluginService().getPlugin(pluginName);
                for (var _i = 0, _a = this.hosts; _i < _a.length; _i++) {
                    var host = _a[_i];
                    host.container.children().not(".ui-resizable-handle").remove();
                    if (!this.currentVisualPlugin) {
                        host.container.append('<div class="wrongVisualWarning">Wrong visual name <span>\'' + pluginName + '\'</span> in parameters</div>');
                        return;
                    }
                    host.container.visual(host, this.currentVisualPlugin);
                }
                this.updateVisuals();
            };
            Playground.getPluginService = function () {
                return this.isMobileView(this.viewType) ? this.mobilePluginService : this.webPluginService;
            };
            Playground.updateVisuals = function () {
                for (var _i = 0, _a = this.hosts; _i < _a.length; _i++) {
                    var host = _a[_i];
                    this.updateVisual(host);
                }
            };
            Playground.updateVisual = function (host) {
                // Reset the scaled container to its original size from the previous rendering and then multiply it by the scale
                var containerOriginalSize = Playground.hostControls.getContainerSize(host);
                host.container.removeAttr('style');
                host.container.attr('style', 'width: ' + containerOriginalSize.width * host.renderingScale + 'px; height: ' + containerOriginalSize.height * host.renderingScale + 'px;');
                var visualElement = Playground.getVisualElementInContainer(host.container);
                visualElement.empty();
                Playground.initVisual(host);
                Playground.hostControls.updateHost(host);
                // Scale the visual back down to fit its container
                var scale = 1 / host.renderingScale;
                visualElement.attr('style', 'transform: scale(' + scale + '); transform-origin: top left;');
            };
            Playground.isMobileView = function (viewType) {
                return viewType === PlaygroundViewType.MobilePortraitView || viewType === PlaygroundViewType.MobileLandscapeView;
            };
            Playground.initializeView = function (viewType) {
                if (this.viewType !== viewType) {
                    // Add or remove all mobile specific options
                    if (this.isMobileView(viewType)) {
                        this.mobileOrientationOptionsElement.show();
                        this.optionsCapabilitiesElement.hide();
                    }
                    else {
                        this.mobileOrientationOptionsElement.hide();
                        this.optionsCapabilitiesElement.show();
                    }
                    this.clearAllVisuals();
                    this.hideAllContainers();
                    this.unhighlightTabs();
                    // Update the visual's containers
                    switch (viewType) {
                        case PlaygroundViewType.WebView:
                            this.highlightTab(this.webViewTab);
                            this.webContainers.show();
                            this.hosts = [
                                {
                                    name: this.webContainer[0].id,
                                    container: this.webContainer,
                                    resizable: true,
                                    interactive: false,
                                    renderingScale: this.webTileRenderScale
                                }
                            ];
                            break;
                        case PlaygroundViewType.MobilePortraitView:
                            this.highlightTab(this.mobileViewTab);
                            this.mobilePortraitContainers.show();
                            this.hosts = [
                                {
                                    name: this.mobilePortraitDashboardContainer[0].id,
                                    container: this.mobilePortraitDashboardContainer,
                                    resizable: false,
                                    interactive: false,
                                    renderingScale: this.mobileDashboardTileRenderScale
                                },
                                {
                                    name: this.mobilePortraitInFocusContainer[0].id,
                                    container: this.mobilePortraitInFocusContainer,
                                    resizable: false,
                                    interactive: true,
                                    renderingScale: this.mobileInFocusTileRenderScale
                                }
                            ];
                            break;
                        case PlaygroundViewType.MobileLandscapeView:
                            this.highlightTab(this.mobileViewTab);
                            this.mobileLandscapeContainers.show();
                            this.hosts = [
                                {
                                    name: this.mobileLandscapeDashboardContainer[0].id,
                                    container: this.mobileLandscapeDashboardContainer,
                                    resizable: false,
                                    interactive: false,
                                    renderingScale: this.mobileDashboardTileRenderScale
                                },
                                {
                                    name: this.mobileLandscapeInFocusContainer[0].id,
                                    container: this.mobileLandscapeInFocusContainer,
                                    resizable: false,
                                    interactive: true,
                                    renderingScale: this.mobileInFocusTileRenderScale
                                }
                            ];
                            break;
                        default:
                            break;
                    }
                    if (this.isMobileView(viewType) && !this.isMobileView(this.viewType)) {
                        // Moved to mobile view from web
                        this.resetOrientationRadioButtons();
                    }
                    this.viewType = viewType;
                }
            };
            Playground.updateView = function (viewType) {
                if (this.viewType !== viewType) {
                    this.initializeView(viewType);
                    this.hostControls.setHosts(this.hosts);
                    // The plugin name did not change but since we might have changed between web and mobile views we need the updated plugin itself,
                    // based on the matching plugin service.
                    this.createVisualPlugin(this.currentVisualPlugin.name);
                }
            };
            Playground.getVisualElementInContainer = function (container) {
                return container.children('.visual').first();
            };
            Playground.unhighlightTabs = function () {
                this.webViewTab.find('div').first().removeClass('selected-nav-tab');
                this.mobileViewTab.find('div').first().removeClass('selected-nav-tab');
            };
            Playground.highlightTab = function (tabElement) {
                tabElement.find('div').first().addClass('selected-nav-tab');
            };
            Playground.resetOrientationRadioButtons = function () {
                $('input[name=orientation][value=portrait]').prop('checked', true);
                $('input[name=orientation][value=landscape]').prop('checked', false);
            };
            Playground.hideAllContainers = function () {
                this.webContainers.hide();
                this.mobilePortraitContainers.hide();
                this.mobileLandscapeContainers.hide();
            };
            Playground.clearAllVisuals = function () {
                if (this.hosts) {
                    for (var _i = 0, _a = this.hosts; _i < _a.length; _i++) {
                        var host = _a[_i];
                        this.getVisualElementInContainer(host.container).empty();
                    }
                }
            };
            Playground.isInteractiveMode = function () {
                return this.interactionsEnabledCheckbox.is(':checked');
            };
            Playground.disabledVisuals = [
                "basicShape",
                "matrix",
                "playChart",
                "kpi",
                "scriptVisual",
                "slicer",
                "bulletChart",
                "forceGraph",
                "mekkoChart",
                "gantt",
                "sunburstCustom",
                "timeline"
            ];
            Playground.mobileInteractiveVisuals = [
                "areaChart",
                "barChart",
                "clusteredBarChart",
                "clusteredColumnChart",
                "columnChart",
                "donutChart",
                "hundredPercentStackedBarChart",
                "hundredPercentStackedColumnChart",
                "lineChart",
                "pieChart",
                "scatterChart",
                "table",
                "matrix",
                "multiRowCard"
            ];
            Playground.webTileRenderScale = 1;
            Playground.mobileDashboardTileRenderScale = 3;
            Playground.mobileInFocusTileRenderScale = 1;
            /** Represents sample data view used by visualization elements. */
            Playground.webPluginService = new visualPluginFactory.PlaygroundVisualPluginService();
            Playground.mobilePluginService = new visualPluginFactory.MobileVisualPluginService();
            Playground.visualStyle = {
                titleText: {
                    color: { value: 'rgba(51,51,51,1)' }
                },
                subTitleText: {
                    color: { value: 'rgba(145,145,145,1)' }
                },
                colorPalette: {
                    dataColors: new powerbi.visuals.DataColorPalette(),
                },
                labelText: {
                    color: {
                        value: 'rgba(51,51,51,1)',
                    },
                    fontSize: '11px'
                },
                isHighContrast: false,
            };
            return Playground;
        }());
        visuals_1.Playground = Playground;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
