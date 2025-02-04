/** @license
 * Copyright 2022 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Element, Host, h, Prop, VNode, State, Watch, Event, EventEmitter, Fragment } from "@stencil/core";
import { ILayerExpression, IMapChange, IMapClick, IMapInfo, IReportingOption, IReportingOptions, ISearchConfiguration, ISortingInfo, theme } from "../../utils/interfaces";
import { getLocaleComponentStrings } from "../../utils/locale";
import { loadModules } from "../../utils/loadModules";
import CrowdsourceReporter_T9n from "../../assets/t9n/crowdsource-reporter/resources.json";
import { getAllLayers, getAllTables, getFeatureLayerView, getLayerOrTable, getMapLayerHash, highlightFeatures } from "../../utils/mapViewUtils";
import { queryFeaturesByID } from "../../utils/queryUtils";
import { ILayerItemsHash } from "../layer-list/layer-list";

@Component({
  tag: "crowdsource-reporter",
  styleUrl: "crowdsource-reporter.css",
  shadow: false,
})
export class CrowdsourceReporter {
  //--------------------------------------------------------------------------
  //
  //  Host element access
  //
  //--------------------------------------------------------------------------

  @Element() el: HTMLCrowdsourceReporterElement;

  //--------------------------------------------------------------------------
  //
  //  Properties (public)
  //
  //--------------------------------------------------------------------------

  /**
   * string: Semicolon delimited numbers that will be used as the maps center point from URL params
   */
  @Prop() center: string;

  /**
   * string: Item ID of the web map that should be selected by default
   */
  @Prop() defaultWebmap = "";

  /**
   * string: The text that will display under the title on the landing page
   */
  @Prop() description: string;

  /**
   * boolean: When true the anonymous users will be allowed to submit reports and comments
   */
  @Prop() enableAnonymousAccess: boolean;

  /**
   * boolean: When true the anonymous users will be allowed to submit comments
   */
  @Prop() enableAnonymousComments: boolean;

  /**
   * boolean: When true the user will be allowed to submit comments
   */
  @Prop() enableComments: boolean;

  /**
   * boolean: when true the home widget will be available
   */
  @Prop() enableHome = true;

  /**
   * boolean: When true the user will be provided a login page
   */
  @Prop() enableLogin: boolean;

  /**
   * boolean: When true the user will be allowed to submit new reports
   */
  @Prop() enableNewReports: boolean;

  /**
   * boolean: when true the search widget will be available
   */
  @Prop() enableSearch = true;

  /**
   * boolean: when true the zoom widget will be available
   */
  @Prop() enableZoom = true;

  /**
   * boolean: When true the application will be in mobile mode, controls the mobile or desktop view
   */
  @Prop() isMobile: boolean;

  /**
   * ILayerExpression[]: Array of layer expressions for layers (filter configuration)
   */
  @Prop() layerExpressions: ILayerExpression[] = [];

  /**
   * string: Layer id of the feature from URL params
   */
  @Prop() layerId: string;

  /**
   * string: Id of the zoom level from URL params
   */
  @Prop() level: string;

  /**
   * string: The text that will display at the top of the landing page
   */
  @Prop() loginTitle: string;

  /**
   * IMapInfo[]: array of map infos (name and id)
   */
  @Prop() mapInfos: IMapInfo[] = [];

  /**
   * esri/views/MapView: https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html
   */
  @Prop() mapView: __esri.MapView;

  /**
   * string: Object id of the feature from URL params
   */
  @Prop() objectId: string;

  /**
   * string: The word(s) to display in the reports submit button
   */
  @Prop() reportButtonText: string;

  /**
   * IReportingOptions: Key options for reporting
   */
  @Prop() reportingOptions: IReportingOptions;

  /**
   * string: The word(s) to display in the reports header
   */
  @Prop() reportsHeader: string;

  /**
   * string: The message to display when the report has been submitted
   */
  @Prop() reportSubmittedMessage: string;

  /**
   * ISearchConfiguration: Configuration details for the Search widget
   */
  @Prop() searchConfiguration: ISearchConfiguration;

  /**
   * boolean: When true the comments from all users will be visible
   */
  @Prop() showComments: boolean;

  /**
   * theme: "light" | "dark" theme to be used
   */
  @Prop() theme: theme = "light";

  /**
   * number: default scale to zoom to when zooming to a single point feature
   */
  @Prop() zoomToScale: number;

  //--------------------------------------------------------------------------
  //
  //  State (internal)
  //
  //--------------------------------------------------------------------------

  /**
   * string: Error message when feature creation fails
   */
  @State() _featureCreationFailedErrorMsg: string;

  /**
   * boolean: When true an indicator will be shown on the action
   */
  @State() _filterActive = false;

  /**
   * boolean: When true the filter component will be displayed
   */
  @State() _filterOpen = false;

  /**
   * string[]: Reporter flow items list
   */
  @State() _flowItems: string[] = [];

  /**
   * boolean: Will be true when has valid reporting layers (This will be used to show the create report button on layer list)
   */
  @State() _hasValidLayers = false;

  /**
   * boolean: show loading indicator for feature details component upto completing pending operations
   */
  @State() _loadingFeatureDetails: boolean;

  /**
   * IMapInfo: The current map info stores configuration details
   */
  @State() _mapInfo: IMapInfo;

  /**
   * boolean: When true show the success message in the panel
   */
  @State() _reportSubmitted = false;

   /**
   * string: The selected feature layer's name from the layer's list
   */
   @State() _selectedLayerName: string;

  /**
   * boolean: When true show the submit and cancel button
   */
  @State() _showSubmitCancelButton = false;

  /**
   * boolean: show loading indicator in the reporter component
   */
  @State() _showLoadingIndicator = false;

  /**
   * boolean: Controls the state for panel in mobile view
   */
  @State() _sidePanelCollapsed = false;

  /**
   * Contains the translations for this component.
   * All UI strings should be defined here.
   */
  @State() _translations: typeof CrowdsourceReporter_T9n;

  /**
   * number: Show the updated progress bar status
   */
  @State() _updatedProgressBarStatus = 0.25;

  /**
   * ISortingInfo: Sort the feature list depending on the sort field and order
   */
  @State() _updatedSorting: ISortingInfo;

  /**
   * string: Selected sort option
   */
  @State() _updatedSortOption = "sortNewest"

  /**
   * boolean: When true show the success message in the panel
   */
  @State() _commentSubmitted = false;

  /**
   * string: Error message when feature creation fails
   */
  @State() _addingCommentFailed = false;

  //--------------------------------------------------------------------------
  //
  //  Properties (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * HTMLCreateFeatureElement: Create Feature component instance
   */
  protected _createFeature: HTMLCreateFeatureElement;

  /**
   * ObjectId of the feature currently shown in the details
   */
  protected _currentFeatureId: string;

  /**
   * number[]: X,Y pair used to center the map
   */
  protected _defaultCenter: number[];

  /**
   * number: zoom level the map should go to
   */
  protected _defaultLevel: number;

  /**
   * string[]: Configured/all layers id from current map which can be used for reporting
   */
  protected _editableLayerIds: string[];

  /**
   * HTMLCreateFeatureElement: features details component instance
   */
  protected _featureDetails: HTMLFeatureDetailsElement;

  /**
   * HTMLFeatureListElement: Create feature list component instance
   */
  protected _featureList: HTMLFeatureListElement;

  /**
   * __esri.Graphic: The current selected feature
   */
  protected _currentFeature: __esri.Graphic;

  /**
   * __esri.Graphic: The selected related feature from layer table
   */
  protected _selectedRelatedFeature: __esri.Graphic[];

  /**
   * __esri.FeatureLayer: The related table from map
   */
  protected _relatedTable: __esri.FeatureLayer;

  /**
   * HTMLInstantAppsFilterListElement: Component from Instant Apps that supports interacting with the current filter config
   */
  protected _filterList: HTMLInstantAppsFilterListElement;

  /**
   * __esri.Handle: Highlight handles of the selections
   */
  protected _highlightHandle: __esri.Handle;

  /**
   * HTMLLayerListElement: Create Layer list component instance
   */
  protected _layerList: HTMLLayerListElement;

  /**
   * HTMLCreateFeatureElement: Create Feature component instance
   */
  protected _createRelatedFeature: HTMLCreateRelatedFeatureElement;

  /**
   * string[]: list of configured reporting layer ids
   */
  protected _layers: string[];

  /**
   * IMapChange: The current map change details
   */
  protected _mapChange: IMapChange;

  /**
   * IHandle: The map click handle
   */
  protected _mapClickHandle: IHandle;

  /**
   * esri/core/reactiveUtils: https://developers.arcgis.com/javascript/latest/api-reference/esri-core-reactiveUtils.html
   */
  protected reactiveUtils: typeof import("esri/core/reactiveUtils");

  /**
   * __esri.Graphic: The selected feature
   */
  protected _selectedFeature: __esri.Graphic[];

  /**
   * number: selected feature index
   */
  protected _selectedFeatureIndex: number;

  /**
   * string: The selected feature layer's id from the layer's list
   */
  protected _selectedLayerId: string;

  /**
   * HTMLInstantAppsSocialShareElement: Share element
   */
  protected _shareNode: HTMLInstantAppsSocialShareElement;

  /**
   * boolean: Maintains a flag to know if urls params are loaded or not
   */
  protected _urlParamsLoaded: boolean;

  /**
   * __esri.FeatureLayer[]: Valid layers from the current map
   */
  protected _validLayers: __esri.FeatureLayer[];

  /**
   * __esri.FeatureLayer: Selected feature layer from the layer list
   */
  protected _selectedLayer: __esri.FeatureLayer;

  /**
   * ILayerItemsHash: LayerDetailsHash for each layer in the map
   */
  protected _layerItemsHash: ILayerItemsHash;

  /**
   * boolean: when true allow map to be collapsed
   */
  protected isFormOpen: boolean;

  //--------------------------------------------------------------------------
  //
  //  Watch handlers
  //
  //--------------------------------------------------------------------------

  /**
   * Called each time the mapView prop is changed.
   */
  @Watch("isMobile")
  async isMobileWatchHandler(): Promise<void> {
      this._sidePanelCollapsed = false;
  }

  /**
   * Called each time the mapView prop is changed.
   */
  @Watch("mapView")
  async mapViewWatchHandler(): Promise<void> {
    await this.mapView.when(async () => {
      await this.setMapView();
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Methods (public)
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Events (public)
  //
  //--------------------------------------------------------------------------

   /**
   * Emitted when toggle panel button is clicked in reporter
   */
   @Event() togglePanel: EventEmitter<{panelState: boolean, isFormOpen: boolean}>;

  //--------------------------------------------------------------------------
  //
  //  Functions (lifecycle)
  //
  //--------------------------------------------------------------------------

  /**
   * StencilJS: Called once just after the component is first connected to the DOM.
   * Create component translations and monitor the mediaQuery change to detect mobile/desktop mode
   * @returns Promise when complete
   */
  async componentWillLoad(): Promise<void> {
    this._urlParamsLoaded = false;
    await this._initModules();
    await this._getTranslations();
    await this.mapView?.when(async () => {
      //set configured layers array which are enabled for data collection
      this._layers = this.reportingOptions ? Object.keys(this.reportingOptions).filter((layerId: string) => {
          return this.reportingOptions[layerId].visible;
        }) : [];
      await this.setMapView();
    });
  }

  /**
   * Renders the component.
   */
  render() {
    const themeClass = this.theme === "dark" ? "calcite-mode-dark" : "calcite-mode-light";
    return (
      <Host>
        {this._reportSubmitted && <calcite-alert
          auto-close
          class={themeClass + " report-submitted-msg"}
          icon="check-circle"
          kind="success"
          label=""
          onCalciteAlertClose={() => { this._reportSubmitted = false }}
          open
          placement={"top"}>
          <div slot="message">{this.reportSubmittedMessage ? this.reportSubmittedMessage : this._translations.submitMsg}</div>
        </calcite-alert>}
        {this._featureCreationFailedErrorMsg && <calcite-alert
          auto-close
          class={themeClass}
          icon="x-octagon"
          kind="danger"
          label=""
          onCalciteAlertClose={() => { this._featureCreationFailedErrorMsg = "" }}
          open
          placement={"top"}>
          <div slot="title">{this._translations.error}</div>
          <div slot="message">{this._featureCreationFailedErrorMsg}</div>
        </calcite-alert>}
        {this._commentSubmitted && <calcite-alert
          auto-close
          class={'report-submitted '+ themeClass}
          icon="check-circle"
          kind="success"
          label=""
          onCalciteAlertClose={() => { this._commentSubmitted = false }}
          open
          placement={"top"}>
          <div slot="message">{this._translations.commentSubmittedMsg}</div>
        </calcite-alert>}
        {this._addingCommentFailed && <calcite-alert
          auto-close
          class={themeClass}
          icon="x-octagon"
          kind="danger"
          label=""
          onCalciteAlertClose={() => { this._addingCommentFailed = false }}
          open
          placement={"top"}>
          <div slot="title">{this._translations.error}</div>
          <div slot="message">{this._translations.addingCommentFailedMsg}</div>
        </calcite-alert>}
        <div>
          <calcite-shell content-behind >
            {this._getReporter()}
          </calcite-shell>
        </div>
        {this.filterModal()}
      </Host>
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Functions (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * Load esri javascript api modules
   *
   * @returns Promise resolving when function is done
   *
   * @protected
   */
  protected async _initModules(): Promise<void> {
    const [reactiveUtils] = await loadModules([
      "esri/core/reactiveUtils"
    ]);
    this.reactiveUtils = reactiveUtils;
  }

  /**
   * Set the selected layer id and layer name
   * @param layerId string layerId of the selected layer
   * @param layerName string layerName of the selected layer
   */
  protected async setSelectedLayer(
    layerId: string,
    layerName: string
  ): Promise<void> {
    this._selectedLayerId = layerId;
    this._selectedLayer = await getLayerOrTable(this.mapView, layerId);
    this._selectedLayerName = layerName;
    //show only current layer on map and hide other valid editable layers
    //if layerId is empty then show all the layers on map
    this._validLayers.forEach(layer => {
      layer.set('visible', !layerId || (layer.id === layerId));
    })
  }

  /**
   * Returns the layers configuration
   * @param layerId string layerId of the selected layer
   * @returns Configuration for the layerId
   */
  protected _getLayersConfig(layerId: string): IReportingOption | null {
    return this.reportingOptions && this.reportingOptions[layerId] ? this.reportingOptions[layerId] : null;
  }

  /**
   * Get the reporter app functionality
   * @protected
   */
  protected _getReporter(): VNode {
    const renderLists = [];
    this._flowItems.forEach((item) => {
      switch (item) {
        case "layer-list":
          renderLists.push(this.getLayerListFlowItem());
          break;
        case "feature-list":
          renderLists.push(this.getFeatureListFlowItem(this._selectedLayerId, this._selectedLayerName));
          break;
        case "feature-details":
          renderLists.push(this.getFeatureDetailsFlowItem());
          break;
        case "reporting-layer-list":
          renderLists.push(this.getChooseCategoryFlowItem());
          break;
        case "feature-create":
          renderLists.push(this.getFeatureCreateFlowItem());
          break;
        case "comment-details":
          renderLists.push(this.getCommentDetailsFlowItem());
          break;
        case "add-comment":
          renderLists.push(this.getAddCommentFlowItem());
          break;
      }
    });
    const themeClass = this.theme === "dark" ? "calcite-mode-dark" : "calcite-mode-light";
    return (
      <calcite-panel class={"width-full " + themeClass}>
        {this.mapView
          ? <calcite-flow>
            {renderLists?.length > 0 && renderLists}
          </calcite-flow>
          : <calcite-loader label="" scale="m" />}
      </calcite-panel>
    );
  }

  /**
   * Show filter component in modal
   * @returns node to interact with any configured filters for the current layer
   */
     protected filterModal(): VNode {
       //get layer expression for current selected layer
       const currentLayersExpressions = this.layerExpressions ? this.layerExpressions.filter(
         (exp) => exp.id === this._selectedLayerId) : [];
       return (currentLayersExpressions.length > 0 &&
         <calcite-modal
           aria-labelledby="modal-title"
           class="modal"
           kind="brand"
           onCalciteModalClose={() => void this._closeFilter()}
           open={this._filterOpen}
           widthScale="s"
         >
           <div
             class="display-flex align-center"
             id="modal-title"
             slot="header"
           >
             {this._translations?.filterLayerTitle?.replace("{{title}}", this._selectedLayerName)}
           </div>
           <div slot="content">
             <instant-apps-filter-list
               autoUpdateUrl={false}
               closeBtn={true}
               closeBtnOnClick={() => void this._closeFilter()}
               comboboxOverlayPositioning="fixed"
               layerExpressions={currentLayersExpressions}
               onFilterListReset={() => this._handleFilterListReset()}
               onFilterUpdate={() => this._handleFilterUpdate()}
               ref={(el) => this._filterList = el}
               view={this.mapView}
               zoomBtn={false}
             />
           </div>
         </calcite-modal>
       );
    }

  /**
   * Close the filter modal
   * @protected
   */
  protected _closeFilter(): void {
    if (this._filterOpen) {
      this._filterOpen = false;
    }
  }

  /**
   * When true the filter modal will be displayed
   * @protected
   */
  protected _toggleFilter(): void {
    this._filterOpen = !this._filterOpen;
  }

  /**
   * On sort option click update the sort field and sort order
   * @param sortField sort field
   * @param sortOrder sort order
   * @param sortOption selected sort option (Newest/Oldest/Highest Voted/Lowest Voted)
   */
  protected async sortOptionClick(
    sortField: string,
    sortOrder: "asc" | "desc",
    sortOption: string
  ): Promise<void> {
    this._updatedSorting = {
      field: sortField,
      order: sortOrder
    };
    this._updatedSortOption = sortOption;
  }

  /**
   * On sort button click, display the sorting options
   * @returns Sort options list
   */
  protected _toggleSort(): Node {
    const canSortByVotes = this.reportingOptions && this.reportingOptions[this._selectedLayerId] &&
      this.reportingOptions[this._selectedLayerId].like && this.reportingOptions[this._selectedLayerId].likeField;
    return (
      <calcite-popover
        autoClose
        label=""
        offsetDistance={0}
        placement={this.isMobile ? "leading-start" : "auto"}
        pointerDisabled
        referenceElement="sort-popover">
        <calcite-list selection-mode="single">
          <calcite-list-item
            label={this._translations.sortNewest}
            onCalciteListItemSelect={() => { void this.sortOptionClick(this._selectedLayer.objectIdField, "desc", "sortNewest") }}
            selected={this._updatedSortOption === "sortNewest"}
            value="sortNewest" />
          <calcite-list-item
            label={this._translations.sortOldest}
            onCalciteListItemSelect={() => { void this.sortOptionClick(this._selectedLayer.objectIdField, "asc", "sortOldest") }}
            selected={this._updatedSortOption === "sortOldest"}
            value="sortOldest" />
          {canSortByVotes &&
            <Fragment>
              <calcite-list-item
                label={this._translations.sortHighestVoted}
                onCalciteListItemSelect={() => { void this.sortOptionClick(this.reportingOptions[this._selectedLayerId].likeField, "desc", "sortHighestVoted") }}
                selected={this._updatedSortOption === "sortHighestVoted"}
                value="sortHighestVoted" />
              <calcite-list-item
                label={this._translations.sortLowestVoted}
                onCalciteListItemSelect={() => { void this.sortOptionClick(this.reportingOptions[this._selectedLayerId].likeField, "asc", "sortLowestVoted") }}
                selected={this._updatedSortOption === "sortLowestVoted"}
                value="sortLowestVoted" />
            </Fragment>
          }
        </calcite-list>
      </calcite-popover>
    );
  }

  /**
   * Reset the filter active prop
   * @protected
   */
  protected _handleFilterListReset(): void {
    //on reset filter list reset the filter active state
    this._filterActive = false;
    //reset the features list to reflect the applied filters
    void this._featureList.refresh();
  }

  /**
   * Check if the layers definitionExpression has been modified and update the feature list depending on the applied filters
   * @protected
   */
  protected _handleFilterUpdate(): void {
    //if filter are applied the url params will be generated
    //set the filter active state based on the length of applied filters
    this._filterActive = this._filterList.urlParams.getAll('filter').length > 0;
    //reset the features list to reflect the applied filters
    void this._featureList.refresh();
  }

  /**
   * Get the feature layer list
   * @returns the layer list items
   * @protected
   */
  protected getLayerListFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this.reportsHeader}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {this._hasValidLayers && this.enableNewReports &&
          <calcite-button
            appearance="solid"
            onClick={this.navigateToChooseCategory.bind(this)}
            slot="footer"
            width="full">
            {this.reportButtonText ? this.reportButtonText : this._translations.createReportButtonText}
          </calcite-button>}
        <calcite-panel
          full-height
          full-width>
          <layer-list
            class="height-full"
            layers={this._editableLayerIds?.length > 0 ? this._editableLayerIds : this._layers}
            mapView={this.mapView}
            onLayerSelect={this.displayFeaturesList.bind(this)}
            onLayersListLoaded={this.layerListLoaded.bind(this)}
            ref={el => this._layerList = el}
            showFeatureCount
            showNextIcon />
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * Get the layer list for creating a report
   * @returns Choose category flow item
   * @protected
   */
  protected getChooseCategoryFlowItem(): Node {
    const onlyReportingLayers = this.reportingOptions ? Object.keys(this.reportingOptions).filter((layerId: string) => {
      return this.reportingOptions[layerId].visible && this.reportingOptions[layerId].reporting && this._layerItemsHash[layerId] && this._layerItemsHash[layerId].supportsAdd;
    }) : [];
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this.reportButtonText ? this.reportButtonText : this._translations.createReportButtonText}
        onCalciteFlowItemBack={this.backFromSelectedPanel.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        <calcite-panel
          full-height
          full-width>
          <div class="progress-bar">
            <calcite-progress type="determinate" value={this._updatedProgressBarStatus} />
          </div>
          <calcite-notice
            class="notice-msg"
            icon="lightbulb"
            kind="success"
            open>
            <div slot="message">{this._translations.chooseCategoryMsg}</div>
          </calcite-notice>
          <layer-list
            class="height-full"
            layers={onlyReportingLayers}
            mapView={this.mapView}
            onLayerSelect={this.navigateToCreateFeature.bind(this)}
            showFeatureCount={false}
            showNextIcon={false} />
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * Get Feature create form of the selected feature layer
   * @returns feature create form
   * @protected
   */
  protected getFeatureCreateFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this._selectedLayerName}
        onCalciteFlowItemBack={this.backFromCreateFeaturePanel.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {this._showSubmitCancelButton && <div class={"width-full"}
          slot="footer">
          <calcite-button
            appearance="solid"
            class={"footer-top-button footer-button"}
            onClick={this.onCreateFeatureSubmitButtonClick.bind(this)}
            width="full">
            {this._translations.submit}
          </calcite-button>
          <calcite-button
            appearance="outline"
            class={"footer-button"}
            onClick={this.backFromCreateFeaturePanel.bind(this)}
            width="full">
            {this._translations.cancel}
          </calcite-button>
        </div>}
        <calcite-panel
          full-height
          full-width>
          <div class="progress-bar">
            <calcite-progress type="determinate" value={this._updatedProgressBarStatus} />
          </div>
          <calcite-notice
            class="notice-msg"
            icon="lightbulb"
            kind="success"
            open>
            <div slot="message">{this._translations.featureEditFormInfoMsg}</div>
          </calcite-notice>
          <create-feature
            customizeSubmit
            mapView={this.mapView}
            onDrawComplete={this.onFormReady.bind(this)}
            onEditingAttachment={this.showSubmitCancelButton.bind(this)}
            onFail={this.createFeatureFailed.bind(this)}
            onProgressStatus={this.updatedProgressStatus.bind(this)}
            onSuccess={this.onReportSubmitted.bind(this)}
            ref={el => this._createFeature = el }
            searchConfiguration={this.searchConfiguration}
            selectedLayerId={this._selectedLayerId}
          />
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * Update the progress bar status when editor panel changes
   * @param evt Event which has progress bar status
   * @protected
   */
  protected updatedProgressStatus(evt: CustomEvent): void {
    this._updatedProgressBarStatus = evt.detail;
  }

  /**
   * When form is ready then show submit and cancel button
   * @protected
   */
  protected onFormReady(): void {
    // update the form state when form is ready
    this.updateFormState(true);
    this._showSubmitCancelButton = true;
  }

  /**
   * When Add attachment panel is enabled hide the submit and cancel button
   * @protected
   */
  protected showSubmitCancelButton(evt: CustomEvent): void {
    this._showSubmitCancelButton = !evt.detail;
  }

  /**
   * On back from create feature, call submit editor to destroy the Editor widget instance
   * @protected
   */
  protected onCreateFeatureSubmitButtonClick(): void {
    if (this._createFeature) {
      void this._createFeature.submit();
    }
  }

  /**
   * On back from create feature, call close editor to destroy the Editor widget instance
   * @protected
   */
  protected backFromCreateFeaturePanel(): void {
    if (this._createFeature) {
      void this._createFeature.close();
    }
    //on back form will be closed, so update the form state
    if (this.isFormOpen) {
      this.updateFormState(false);
    }
    this.backFromSelectedPanel();
  }

  /**
   * On back from create realated feature, call submit editor to destroy the Editor widget instance
   * @protected
   */
  protected onCreateRelatedFeatureSubmitButtonClick(): void {
    if (this._createRelatedFeature) {
      void this._createRelatedFeature.submit();
    }
  }

  /**
   * On back from create related feature, call close editor to destroy the Editor widget instance
   * @protected
   */
  protected backFromCreateRelatedFeaturePanel(): void {
    if (this._createRelatedFeature) {
      void this._createRelatedFeature.close();
      this._showSubmitCancelButton = false;
    }
    //on back form will be closed, so update the form state
    if (this.isFormOpen) {
      this.updateFormState(false);
    }
    this.backFromSelectedPanel();
  }

  /**
   * On creating the feature is failed, show the error message
   * @param evt Event which has feature failed message
   * @protected
   */
  protected createFeatureFailed(evt: CustomEvent): void {
    console.error(evt.detail);
    this._featureCreationFailedErrorMsg = evt.detail.message;
  }

  /**
   * On submit report navigate to the layer list home page and refresh the layer list
   * @protected
   */
  protected onReportSubmitted(): void {
    //on report submit form will be closed, so update the form state
    if (this.isFormOpen) {
      this.updateFormState(false);
    }
    this._reportSubmitted = true;
    void this.navigateToHomePage();
  }

  /**
   * On adding the is failed, show the error message
   * @param evt Event which has comment failed message
   * @protected
   */
  protected addCommentFailed(evt: CustomEvent): void {
    console.error(evt.detail);
    this._addingCommentFailed = true;
  }

  /**
   * On submit comment navigate to the feature list and refresh the feature details
   * @protected
   */
  protected async onCommentSubmitted(): Promise<void> {
    this._commentSubmitted = true;
    this.backFromSelectedPanel();
    this._showLoadingIndicator = true;
    //update the feature details to reflect the like, dislike and comment values
    await this._featureDetails.refresh(this._currentFeature);
    setTimeout(() => {
      this._showLoadingIndicator = false;
    }, 300);
  }

  /**
   * Navigates to layer-list
   * @protected
   */
  protected async navigateToHomePage(): Promise<void> {
    if (this._createFeature) {
      void this._createFeature.close();
    }
    if (this._layerList) {
      void this._layerList.refresh();
    }
    await this.setSelectedFeatures([]);

    if (this._editableLayerIds.length === 1) {
      await this._featureList.refresh();
      this._flowItems = ["feature-list"];
    } else {
      this._flowItems = ["layer-list"];
    }
  }

  /**
   * On layer select open the feature create flow item
   * @param evt Event which has details of selected layerId and layerName
   * @protected
   */
  protected async navigateToCreateFeature(evt: CustomEvent): Promise<void> {
    if (evt.detail.layerId && evt.detail.layerName) {
      void this.setSelectedLayer(evt.detail.layerId, evt.detail.layerName);
    }
    this._showSubmitCancelButton = false;
    this._flowItems = [...this._flowItems, "feature-create"];
  }

  /**
   * On report an incident button click open the create a report panel with the layer list
   * @protected
   */
  protected navigateToChooseCategory(): void {
    this._flowItems = [...this._flowItems, "reporting-layer-list"];
  }

  /**
   * When layer list is loaded, we will receive the list of layers, if its  means we don't have any valid layer to be listed
   * @param evt Event which has list of layers
   * @protected
   */
  protected async layerListLoaded(evt: CustomEvent): Promise<void> {
    const layersListed = evt.detail;
    //consider only the layers listed in the layer-list component
    const allMapLayers = await getAllLayers(this.mapView);
    const reportingEnabledLayerIds = [];
    this._validLayers = [];
    allMapLayers.forEach((eachLayer: __esri.FeatureLayer) => {
      if (layersListed.includes(eachLayer.id)) {
        this._validLayers.push(eachLayer);
        //create list of reporting enabled layers
        if(this._getLayersConfig(eachLayer.id)?.reporting && this._layerItemsHash[eachLayer.id] && this._layerItemsHash[eachLayer.id].supportsAdd){
          reportingEnabledLayerIds.push(eachLayer.id);
        }
      }
    })
    //handleMap click on layer list loaded
    this.handleMapClick();
    //When we have any reporting layer then only show the create report button on layerList
    this._hasValidLayers = reportingEnabledLayerIds.length > 0;
    //navigate to the feature details if URL params found
    if (!this._urlParamsLoaded) {
      this._urlParamsLoaded = true;
      await this.loadFeatureFromURLParams();
    }
  }

  /**On click of layer list item show feature list
   * @param evt Event which has details of selected layerId and layerName
   * @protected
   */
  protected displayFeaturesList(evt: CustomEvent): void {
    this._updatedSorting = {
      field: '',
      order: 'desc'
    };
    this._filterActive = false;
    this._updatedSortOption = "sortNewest";
    void this.setSelectedLayer(evt.detail.layerId, evt.detail.layerName);
    this._flowItems = [...this._flowItems, "feature-list"];
  }

  /**
   * On back from selected panel navigate to the previous panel
   * @protected
   */
  protected backFromSelectedPanel(): void {
    this._updatedProgressBarStatus = 0.25;
    const updatedFlowItems = [...this._flowItems];
    // when back from comment details or add comment page don't clear the highlighted feature of map
    if (!(updatedFlowItems[updatedFlowItems.length - 1] === 'comment-details' ||
      updatedFlowItems[updatedFlowItems.length - 1] === 'add-comment')) {
      this.clearHighlights();
    }
    updatedFlowItems.pop();
    //Back to layer list, and return as the flowItems will be reset in navigateToHomePage
    if (updatedFlowItems.length === 1 && updatedFlowItems[0] === 'layer-list') {
      void this.navigateToHomePage();
      return;
    }
    this._flowItems = [...updatedFlowItems];
  }

  /**
   * Toggle side panel in case of mobile mode
   * @protected
   */
  protected toggleSidePanel(): void {
    this._sidePanelCollapsed = !this._sidePanelCollapsed;
    this.togglePanel.emit({ panelState: this._sidePanelCollapsed, isFormOpen: this.isFormOpen });
  }

  /**
   * Hide map when form open in case of mobile
   * @param isFormOpen updated form state
   * @protected
   */
  protected updateFormState(isFormOpen: boolean): void {
    this.isFormOpen = isFormOpen;
    this.togglePanel.emit({ panelState: this._sidePanelCollapsed, isFormOpen: this.isFormOpen });
  }

  /**
   * When feature is selected from list store that and show feature details
   * @param evt Event which has details of selected feature
   */
  protected async onFeatureSelectFromList(evt: CustomEvent): Promise<void> {
    this._showLoadingIndicator = true;
    await this.setSelectedFeatures([evt.detail]);
    this._flowItems = [...this._flowItems, "feature-details"];
  }

  /**
   * Gets related table id of the selected feature's layer
   * @protected
   */
  protected async getRelatedTable(): Promise<void> {
    const selectedLayer = (this._currentFeature.layer as __esri.FeatureLayer);
    const relatedTableIdFromRelnship = selectedLayer.relationships[0].relatedTableId;
    const allTables = await getAllTables(this.mapView);
    const relatedTable = allTables.filter((table) => selectedLayer.url === (table as __esri.FeatureLayer).url && relatedTableIdFromRelnship === (table as __esri.FeatureLayer).layerId);
    this._relatedTable = (relatedTable[0] as __esri.FeatureLayer);
  }

  /**
   * Show loading indicator while updating the feature details component
   * @param isLoading is feature detail component loading
   */
  protected async updatingFeatureDetails(isLoading: boolean): Promise<void> {
    this._showLoadingIndicator = isLoading;
  }

  /**
 * On Feature details change update the Layer title and the current selected layer id
 * @param evt Event hold the details of current feature graphic from the feature-details
 * @protected
 */
  protected async selectionChanged(evt: CustomEvent): Promise<void> {
    void this.updatingFeatureDetails(true);
    await this.setCurrentFeature(evt.detail.selectedFeature[0]);
    void this.highlightOnMap(evt.detail.selectedFeature[0]);
    this._selectedFeatureIndex = evt.detail.selectedFeatureIndex;
    //update the feature details to reflect the like, dislike and comment values
    await this._featureDetails.refresh(evt.detail.selectedFeature[0]);
  }

  /**
   * When comment is selected from list store that and show comment details
   * @param evt Event which has details of selected feature
   * @protected
   */
  protected async onCommentSelectFromList(evt: CustomEvent): Promise<void> {
    this._selectedRelatedFeature = [evt.detail];
    this._flowItems = [...this._flowItems, "comment-details"];
  }

  /**
   * Get feature list of the selected feature layer
   * @param layerId Layer id
   * @param layerName Layer name
   * @returns feature list node
   * @protected
   */
  protected getFeatureListFlowItem(
    layerId: string,
    layerName: string
  ): Node {
    const layerExpressions = this.layerExpressions?.filter((exp) => exp.id === this._selectedLayerId);
    const canCreateReports = this._getLayersConfig(this._selectedLayerId)?.reporting && this._layerItemsHash[this._selectedLayerId].supportsAdd;
    const showFilterIcon = layerExpressions?.length > 0;
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={layerName}
        loading={this._showLoadingIndicator}
        onCalciteFlowItemBack={this.backFromSelectedPanel.bind(this)}>
        {this._toggleSort()}
        <calcite-action
          icon="sort-ascending-arrow"
          id="sort-popover"
          slot={"header-actions-end"}
          text={this._translations.sort}
          title={this._translations.sort} />
        {showFilterIcon && <calcite-action
          icon="filter"
          indicator={this._filterActive}
          onClick={this._toggleFilter.bind(this)}
          slot={"header-actions-end"}
          text={this._translations.filter}
          title={this._translations.filter} />}
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {this.enableNewReports && canCreateReports &&
          <calcite-button
            appearance="solid"
            onClick={this.navigateToCreateFeature.bind(this)}
            slot="footer"
            width="full">
            {this.reportButtonText ? this.reportButtonText : this._translations.createReportButtonText}
          </calcite-button>}
        <calcite-panel full-height>
          {<feature-list
            class="height-full"
            highlightOnHover
            mapView={this.mapView}
            noFeaturesFoundMsg={this._translations.featureErrorMsg}
            onFeatureSelect={this.onFeatureSelectFromList.bind(this)}
            pageSize={30}
            ref={el => this._featureList = el }
            selectedLayerId={layerId}
            sortingInfo={this._updatedSorting}
          />}
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * Returns the calcite-flow item for feature details
   * @returns Node
   */
  protected getFeatureDetailsFlowItem(): Node {
    const showCommentBtn = this._getLayersConfig(this._selectedLayerId)?.comment && this._selectedLayer.relationships.length > 0;
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this._selectedLayerName}
        loading={this._showLoadingIndicator}
        onCalciteFlowItemBack={this.backFromSelectedPanel.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {/* Create share button */}
        <instant-apps-social-share
          autoUpdateShareUrl={false}
          class={"share-node"}
          embed={false}
          popoverButtonIconScale="s"
          ref={el => this._shareNode = el}
          removePopoverOffset={true}
          scale="m"
          shareButtonColor="neutral"
          shareButtonType="action"
          slot={"header-actions-end"}
          socialMedia={true}
          view={this.mapView}
        />
        {this._selectedFeature.length > 1 && this.getFeaturesPagination()}
        <calcite-panel>
          <feature-details
            class={'full-height'}
            graphics={this._selectedFeature}
            layerItemsHash={this._layerItemsHash}
            mapView={this.mapView}
            onCommentSelect={this.onCommentSelectFromList.bind(this)}
            onFeatureSelectionChange={this.selectionChanged.bind(this)}
            onLoadingStatus={(evt) => void this.updatingFeatureDetails(evt.detail)}
            ref={el => this._featureDetails = el }
            reportingOptions={this.reportingOptions}
          />
          {showCommentBtn &&
            <calcite-button
              appearance="solid"
              onClick={() => this._flowItems = [...this._flowItems, "add-comment"]}
              slot="footer"
              width="full"
            >
              {this._translations.comment}
            </calcite-button>}
        </calcite-panel>
      </calcite-flow-item>
    );
  }

  /**
   * Returns the pagination for the multiple features
   * Create pagination to avoid the overlap of like, dislike and comment section
   * @returns Node
   */
  protected getFeaturesPagination(): Node {
    return (
      <div class="feature-pagination">
        <div>
          <calcite-button
            appearance='transparent'
            disabled={false}
            iconStart="chevron-left"
            id="solutions-back"
            onClick={() => void this._featureDetails.back()}
            scale="s"
            width="full"
          />
          <calcite-tooltip label="" placement="top" reference-element="solutions-back">
            <span>{this._translations.back}</span>
          </calcite-tooltip>
        </div>
        <calcite-button
          appearance='transparent'
          onClick={() => void this._featureDetails.toggleListView()}
          scale="s">
          <span class="pagination-count">{this._getCount()}</span>
        </calcite-button>
        <div>
          <calcite-button
            appearance="transparent"
            disabled={false}
            iconStart="chevron-right"
            id="solutions-next"
            onClick={() => void this._featureDetails.next()}
            scale="s"
            width="full"
          />
          <calcite-tooltip placement="top" reference-element="solutions-next">
            <span>{this._translations.next}</span>
          </calcite-tooltip>
        </div>
      </div>
    );
  }

  /**
   * Returns the calcite-flow item for comment details
   * @returns Node
   */
  protected getCommentDetailsFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this._relatedTable.title}
        onCalciteFlowItemBack={this.backFromSelectedPanel.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        <calcite-panel full-height>
          <info-card
            allowEditing={false}
            graphics={this._selectedRelatedFeature}
            highlightEnabled={false}
            isLoading={false}
            isMobile={false}
            mapView={this.mapView}
            paginationEnabled={false}
          />
        </calcite-panel>
      </calcite-flow-item>
    );
  }

  /**
   * Returns the calcite-flow item for add comment
   * @returns Node
   */
  protected getAddCommentFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this._relatedTable.title}
        onCalciteFlowItemBack={this.backFromCreateRelatedFeaturePanel.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        <div class={"width-full"}
          slot="footer">
          {this._showSubmitCancelButton && <div class={"width-full"}
            slot="footer">
            <calcite-button
              appearance="solid"
              class={"footer-top-button footer-button"}
              onClick={this.onCreateRelatedFeatureSubmitButtonClick.bind(this)}
              width="full">
              {this._translations.submit}
            </calcite-button>
            <calcite-button
              appearance="outline"
              class={"footer-button"}
              onClick={this.backFromCreateRelatedFeaturePanel.bind(this)}
              width="full">
              {this._translations.cancel}
            </calcite-button>
          </div>}
        </div>
        <calcite-panel>
          <create-related-feature
            customizeSubmit
            mapView={this.mapView}
            onFail={this.addCommentFailed.bind(this)}
            onFormReady={this.onFormReady.bind(this)}
            onIsActionPending={this.showSubmitCancelButton.bind(this)}
            onSuccess={this.onCommentSubmitted.bind(this)}
            ref={el => this._createRelatedFeature = el}
            selectedFeature={this._currentFeature}
            table={this._relatedTable}
          />
        </calcite-panel>
      </calcite-flow-item>
    );
  }

  /**
   * Sets the selected features and updates the first feature as the current selected feature
   * @param features Graphics array of the features selected
   */
  protected async setSelectedFeatures(features: __esri.Graphic[]): Promise<void> {
    this._selectedFeature = features;
   await this.setCurrentFeature(this._selectedFeature.length ? this._selectedFeature[0] : null);
  }

  /**
   * Set the object id of the current selected feature, and also updates the current selected layer details
   * @param selectedFeature Graphic currently shown in feature details
   */
  protected async setCurrentFeature(selectedFeature?: __esri.Graphic): Promise<void> {
    this._currentFeature = selectedFeature;
    if (selectedFeature && selectedFeature.layer) {
      const layer = selectedFeature.layer as __esri.FeatureLayer;
      void this.setSelectedLayer(layer.id, layer.title);
      this._currentFeatureId = selectedFeature.attributes[layer.objectIdField];
      // check if comments are configured and relationship is present then only get the related table
      const isCommentTablePresent = this._getLayersConfig(layer.id)?.comment && layer.relationships.length > 0;
      if (isCommentTablePresent) {
        await this.getRelatedTable();
      }
    } else {
      if (this._editableLayerIds.length > 1) {
        void this.setSelectedLayer('', '');
      }
      this._currentFeatureId = '';
    }
    this._updateShareURL();
  }

  /**
   * Highlights the feature on map
   * @param selectedFeature Graphic currently shown in feature details
   */
  protected async highlightOnMap(selectedFeature?: __esri.Graphic): Promise<void> {
    // if a feature is already highlighted, remove the previous highlight
    this.clearHighlights();
    // highlight the newly selected feature only when it has valid geometry
    if (selectedFeature && selectedFeature.geometry && selectedFeature.layer) {
      const selectedLayerView = await getFeatureLayerView(this.mapView, selectedFeature.layer.id);
      // remove previous highlight options (if any) to highlight the feature by default color
      selectedLayerView.highlightOptions = null;
      this._highlightHandle = await highlightFeatures(
        [selectedFeature.getObjectId()],
        selectedLayerView,
        this.mapView,
        true,
        this.zoomToScale
      );
    }
    void this.updatingFeatureDetails(false);
  }

  /**
   * Clears the highlight
   * @protected
   */
  protected clearHighlights():void {
    //if a feature is already highlighted, then remove the highlight
    if(this._highlightHandle) {
      this._highlightHandle.remove();
     }
  }

  /**
   * Returns the action button to Expand/Collapse side panel in mobile mode
   * @protected
   */
  protected getActionToExpandCollapsePanel(): Node {
    return (
      <calcite-action
        icon={this._sidePanelCollapsed ? "chevrons-up" : "chevrons-down"}
        onClick={this.toggleSidePanel.bind(this)}
        slot="header-actions-end"
        text={this._sidePanelCollapsed ? this._translations.expand : this._translations.collapse} />
    );
  }

  /**
   * Set the current map info when maps change
   * @protected
   */
  protected async setMapView(): Promise<void> {
    await this.getLayersToShowInList();
    // if only one valid layer is present then directly render features list
    if (this._editableLayerIds?.length === 1) {
      await this.renderFeaturesList();
    } else {
      this._flowItems = ['layer-list'];
    }

    this.mapView.popupEnabled = false;
    if (this._defaultCenter && this._defaultLevel) {
      await this.mapView.goTo({
        center: this._defaultCenter,
        zoom: this._defaultLevel
      });
      this._defaultCenter = undefined;
      this._defaultLevel = undefined;
    }
  }

  /**
   * Handle map click event
   * @param layers Array of layerIds
   *
   * @protected
   */
  protected handleMapClick(): void {
    if (this._mapClickHandle) {
      this._mapClickHandle.remove();
    }
    this._mapClickHandle = this.reactiveUtils.on(
      () => this.mapView,
      "click",
      this.onMapClick.bind(this)
    );
  }

  /**
   * On map click do hitTest and get the clicked graphics from both reporting and non-reporting layers, and show feature details
   * @param event IMapClick map click event details
   *
   * @protected
   */
  protected async onMapClick(event: IMapClick): Promise<void> {
    //disable map popup
    this.mapView.popupEnabled = false;
    // Perform a hitTest on the View
    const hitTest = await this.mapView.hitTest(event);
    if (hitTest.results.length > 0) {
      const clickedGraphics = [];
      hitTest.results.forEach(function (result) {
        // check if the result type is graphic
        if (result.type === 'graphic') {
          clickedGraphics.push(result.graphic);
        }
      });
      const reportingLayerGraphics = clickedGraphics.filter((graphic) => {
        return this._validLayers.includes(graphic.layer);
      })
      const nonReportingLayerGraphics = clickedGraphics.filter((graphic) => {
        return !this._validLayers.includes(graphic.layer) && graphic?.layer?.id;
      })

      // if clicked graphic's layer is one of the reporting layers then show details in layer panel
      if (reportingLayerGraphics.length > 0) {
        //update the selectedFeature
        await this.setSelectedFeatures(reportingLayerGraphics);
        //if featureDetails not open then add it to the list else just reInit flowItems which will update details with newly selected features
        // eslint-disable-next-line unicorn/prefer-ternary
        if (this._flowItems.length && this._flowItems.includes("feature-details")) {
          this._flowItems = [... this._flowItems.slice(0, this._flowItems.indexOf("feature-details") + 1)];
          await this.highlightOnMap(clickedGraphics[0]);
        } else {
          this._flowItems = [...this._flowItems, "feature-details"];
        }
      }

      // if clicked graphic's layer is from non reporting layers then show popup on map
      if (nonReportingLayerGraphics.length > 0) {
        this.mapView.popupEnabled = true;
        const options = {
          features: nonReportingLayerGraphics,
          updateLocationEnabled: true
        };
        await this.mapView.openPopup(options);
      }
    }
  }

    /**
   * Get the current index of total string
   *
   * @returns the index of total string
   * @protected
   */
    protected _getCount(): string {
      const index = (this._selectedFeatureIndex + 1).toString();
      const total = this._selectedFeature.length.toString();
      return this._translations.indexOfTotal
        .replace("{{index}}", index)
        .replace("{{total}}", total);
    }

  /**
   * Fetches the component's translations
   * @returns Promise when complete
   * @protected
   */
  protected async _getTranslations(): Promise<void> {
    const messages = await getLocaleComponentStrings(this.el);
    this._translations = messages[0] as typeof CrowdsourceReporter_T9n;
  }

  /**
   * Returns the ids of all OR configured layers that support edits with the update capability
   * @param hash each layer item details
   * @param layers list of layers id
   * @returns array of editable layer ids
   */
  protected reduceToConfiguredLayers(
    hash: ILayerItemsHash
  ): string[] {
    return Object.keys(hash).reduce((prev, cur) => {
      // check if reporting options exists consider the visible prop if else just check the supports Add
      const showLayer = this.reportingOptions ? this._getLayersConfig(cur)?.visible 
        : hash[cur].supportsAdd;
      if (showLayer) {
        prev.push(cur);
      }
      return prev;
    }, []);
  }

  /**
   * Creates the list of layers to be listed in layer list
   * @protected
   */
  protected async getLayersToShowInList(): Promise<void> {
    const layerItemsHash = await getMapLayerHash(this.mapView, true) as ILayerItemsHash;
    const allMapLayers = await getAllLayers(this.mapView);
    allMapLayers.forEach((eachLayer: __esri.FeatureLayer) => {
      if (eachLayer?.type === "feature" && eachLayer?.editingEnabled && eachLayer?.capabilities?.operations?.supportsAdd) {
        layerItemsHash[eachLayer.id].supportsAdd = true;
      }
    })
    this._editableLayerIds = this.reduceToConfiguredLayers(layerItemsHash);
    this._layerItemsHash = layerItemsHash;
  }

  /**
   * renders feature list
   * @protected
   */
  protected async renderFeaturesList(): Promise<void> {
    this._flowItems = ['feature-list'];
    const evt = {
      detail: this._editableLayerIds
    } as CustomEvent
    await this.layerListLoaded(evt);
    void this.setSelectedLayer(this._validLayers[0].id, this._validLayers[0].title);
  }

  /**
   * Updates the share url for current selected feature
   * @protected
   */
   protected _updateShareURL(): void {
    const url = this._shareNode?.shareUrl;
    if (!url) {
      return;
    }
    const urlObj = new URL(url);
    //set the selected layers id
    if (this._selectedLayerId) {
      urlObj.searchParams.set("layerid", this._selectedLayerId);
    } else {
      urlObj.searchParams.delete("layerid");
    }
    //Set the selected features objectid
    if (this._selectedFeature?.length) {
      urlObj.searchParams.set("oid", this._currentFeatureId);
    } else {
      urlObj.searchParams.delete("oid");
    }
    //update the url in share component
    this._shareNode.shareUrl = urlObj.href;
  }

  /**
   * Navigates to selected features detail based on the URL params
   * @protected
   */
  protected async loadFeatureFromURLParams(): Promise<void> {
    if (this.center && this.level) {
      await this.mapView.goTo({
        center: this.center.split(';').map(Number),
        zoom: this.level
      });
    }
    if (this.layerId && this.objectId) {
      const layer = await getLayerOrTable(this.mapView, this.layerId);
      if (layer) {
        // only query if we have some ids...query with no ids will result in all features being returned
        const featureSet = await queryFeaturesByID([Number(this.objectId)], layer, [], true, this.mapView.spatialReference);
        if (featureSet.length) {
          //update the selectedFeature
          await this.setSelectedFeatures(featureSet);
          //if featureDetails not open then add it to the list else just reInit flowItems which will update details with newly selected features
          // eslint-disable-next-line unicorn/prefer-ternary
          if (this._flowItems.length && this._flowItems[this._flowItems.length - 1] !== "feature-details") {
            this._flowItems = [...this._flowItems, "feature-details"];
          } else {
            this._flowItems = [...this._flowItems];
          }
        }
      }
    }
  }
}
