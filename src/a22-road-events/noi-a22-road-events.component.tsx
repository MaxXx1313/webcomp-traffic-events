// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Element, forceUpdate, h, Host, Method, Prop, State, Watch } from "@stencil/core";
import { TrafficDataService } from "../data/noi/traffic-data-service";
import { DivIcon, LayerGroup, Map, Marker, Polyline } from 'leaflet';
import { StencilComponent } from "../utils/StencilComponent";
import { getLayoutClass, resolveLayoutAuto, ViewLayout } from "../utils/breakpoints";
import { AnnouncementShortInfo } from "../data/noi/AnnouncementInfo";
import { detectAllowedBrowserLanguage, translatePropertyInner } from "../utils/language";
import { watchElementSize } from "../utils/resize-observer";
import { LanguageDataService } from "../data/language/language-data-service";

/**
 * Road traffic events component
 *
 * @part map - Map
 * @part panel - Info panel
 * @part menu-btn - Open panel button (mobile only)
 */
@Component({
  tag: 'noi-a22-road-events',
  styleUrl: 'noi-a22-road-events.css',
  shadow: true,
})
export class NoiA22RoadEventsComponent implements StencilComponent {

  /**
   * Language
   * @default 'it'
   */
  @Prop({mutable: true})
  language = detectAllowedBrowserLanguage(['it', 'en', 'de'], 'it');

  /**
   * Layout appearance
   */
  @Prop({mutable: true})
  layout: ViewLayout = 'auto';

  /**
   * Events direction filter
   */
  @Prop({mutable: true})
  direction: 'north' | 'south' | 'both' = 'both';

  @State()
  layoutResolved: ViewLayout;

  private sizeObserver: ResizeObserver = null;

  map: Map;
  trafficEventsLayer: LayerGroup;

  @State()
  eventsData: AnnouncementShortInfo[] = [];

  @State()
  panelOpened = true;

  @Element() el: HTMLElement;

  private markerMap: { [cameraId: string]: Marker } = {};

  // note: services are overridden in tests
  readonly webcamDataService = new TrafficDataService();
  readonly languageService = LanguageDataService.getInstance();

  constructor() {
    this.mapReady = this.mapReady.bind(this);
  }

  connectedCallback() {
    this._recalculateLayoutClass();
    this.sizeObserver = watchElementSize(this.el, this._recalculateLayoutClass.bind(this));
    this.languageService.useLanguage(this.language);
  }

  disconnectedCallback() {
    this.sizeObserver?.unobserve(this.el);
  }

  @Watch('language')
  _onLanguageChanged() {
    this.languageService.useLanguage(this.language)
      .then(() => forceUpdate(this.el))
  }

  @Watch('layout')
  _recalculateLayoutClass() {
    this.layoutResolved = resolveLayoutAuto(this.el.offsetWidth, this.layout);
  }

  /**
   * Reload camera data (basically, it's images)
   */
  @Method()
  async refreshData() {
    if (this.map) {
      this.webcamDataService.getTrafficEvents().then(dataArr => {
        this.eventsData = dataArr;
        this._redrawMap();
      });
    }
    forceUpdate(this.el);
  }


  async mapReady(event: CustomEvent<Map>) {
    this.map = event.detail;

    this.trafficEventsLayer = new LayerGroup();
    this.map.addLayer(this.trafficEventsLayer);

    // get route points
    const routePath = await this.webcamDataService.getRoutePath();
    const roadLine = new Polyline([], {className: 'noi-map-line'});
    for (const p of routePath) {
      roadLine.addLatLng(p);
    }
    this.map.addLayer(roadLine);

    // center on line
    const bounds = roadLine.getBounds();
    this.map.setView(bounds.getCenter());
    this.map.setZoom(8); // TODO: zoom to fill the line


    //
    this.webcamDataService.getTrafficEvents().then(dataArr => {
      this.eventsData = dataArr;
      this._redrawMap();
    });
  }

  @Watch('direction')
  _redrawMap() {
    console.log('redrawMap');
    this.trafficEventsLayer.clearLayers();
    for (const eInfo of this.eventsData) {

      if (this.direction !== 'north') {
        if (eInfo.Direction === 'south' || eInfo.Direction === 'both' || !eInfo.Direction) {
          const marker = this.__createMarker(eInfo, 'S');
          this.markerMap[eInfo.Id + '-' + 'S'] = marker;
          this.trafficEventsLayer.addLayer(marker);
        }
      }
      if (this.direction !== 'south') {
        if (eInfo.Direction === 'north' || eInfo.Direction === 'both' || !eInfo.Direction) {
          const marker = this.__createMarker(eInfo, 'N');
          this.markerMap[eInfo.Id + '-' + 'N'] = marker;
          this.trafficEventsLayer.addLayer(marker);
        }
      }
    }
  }

  __createMarker(eInfo: AnnouncementShortInfo, direction: 'S' | 'N') {
    const itemHid = eInfo.Id + '-' + direction;
    const markerIcon = new DivIcon({
      html: `
            <div class="noi-marker__pin" data-marker-id="${itemHid}"></div>
            <div class="noi-marker__label">
                <img class="noi-marker__icon" src="${eInfo.EventIcon}" alt="${eInfo.EventIconAlt}" />
                <div class="noi-marker__direction">${direction === 'S' ? '▼ S' : '▲ N'}</div>
            </div>
          `,
      className: 'noi-marker noi-marker--yellow ' + (direction === 'S' ? 'noi-marker--left' : 'noi-marker--right'),
      iconSize: [16, 16], // size of the icon
      iconAnchor: [8, 8] // point of the icon which will correspond to marker's location
    });

    const marker = new Marker({
      lat: eInfo.Geo.position.Latitude,
      lng: eInfo.Geo.position.Longitude
    }, {icon: markerIcon});
    marker.addEventListener('click', () => {
      this.openPanel();
      this._bringToFront(marker);
      this._focusMapElement(itemHid);
      setTimeout(() => {
        this._focusListElement(itemHid);
      });
    });
    return marker;
  }

  openPanel() {
    this.panelOpened = true;
  }

  closePanel() {
    this.panelOpened = false;
  }

  private _lastInFront?: Marker;

  _bringToFront(marker: Marker) {
    this._lastInFront?.setZIndexOffset(1);
    this._lastInFront = marker;
    this._lastInFront?.setZIndexOffset(1000);
  }

  private _focusMapHidLast: string | null = null;

  _focusMapElement(itemHid: string) {

    if (this._focusMapHidLast === itemHid) {
      return;
    }

    this._focusMapHidLast = itemHid;
    const marker = this.markerMap[itemHid];
    this._bringToFront(marker);
    if (marker && this.map) {
      this.map.setView(marker.getLatLng());
    }

    //
    const elementChild = this.el.shadowRoot.querySelector(`[data-marker-id="${itemHid}"]`);
    const element = elementChild?.closest('.noi-marker');
    if (element) {
      element.classList.add('noi-marker--highlight');
      setTimeout(() => {
        element.classList.remove('noi-marker--highlight');
        this._focusMapHidLast = null;
      }, 3000);
    }

  }

  private _focusListHidLast: string | null = null;

  _focusListElement(itemHid: string) {
    if (this._focusListHidLast === itemHid) {
      return;
    }
    this._focusListHidLast = itemHid;
    const element = this.el.shadowRoot.querySelector(`[data-item-id="${itemHid}"]`);
    if (element) {
      element?.scrollIntoView();

      element.classList.add('road-event--highlight');
      setTimeout(() => {
        element.classList.remove('road-event--highlight');
        this._focusListHidLast = null;
      }, 3000);
    }
  }


  render() {
    return (
      <Host class={getLayoutClass(this.layoutResolved)}>
        {(this.panelOpened || this.layoutResolved !== 'mobile') ? <div class="layout__panel" part="panel">
          {this._renderPanel()}
        </div> : ''}

        <noi-button class="menu-btn" part="menu-btn" onClick={() => this.openPanel()}>
          <noi-icon name="menu"></noi-icon>
        </noi-button>

        <div class="layout__center">
          <noi-brennerlec-map part="map" onMapReady={e => this.mapReady(e)}></noi-brennerlec-map>
        </div>
      </Host>
    );
  }

  _renderPanel() {
    const southData = this.eventsData.filter(d => d.Direction != 'north');
    const northData = this.eventsData.filter(d => d.Direction != 'south');

    if (southData.length === 0 && northData.length === 0) {
      return '';
    }

    return (<div class="panel">

      {(southData.length > 0 && this.direction !== 'north') ? (
        <div>
          <div class="direction">
            <noi-icon name="arrow-down" class="direction__icon"></noi-icon>
            <div class="direction__body">
              <div class="direction__name">{this.languageService.translate('Direzione Sud')}</div>
              <div class="direction__description">{this.languageService.translate('Verso Modena')}</div>
            </div>
            <noi-button class="direction__suffix close-btn" onClick={() => this.closePanel()}>
              <noi-icon name="close"></noi-icon>
            </noi-button>
          </div>

          <div class="road-event__section">{this.languageService.translate('Info Traffico')}</div>

          {southData.map(el => this._renderPanelItem(el, 'S'))}
        </div>) : ''}

      {(northData.length > 0 && this.direction !== 'south') ? (
        <div>
          <div class="direction">
            <noi-icon name="arrow-up" class="direction__icon"></noi-icon>
            <div class="direction__body">
              <div class="direction__name">{this.languageService.translate('Direzione Nord')}</div>
              <div class="direction__description">{this.languageService.translate('Verso Brennero')}</div>
            </div>
            <noi-button class="direction__suffix close-btn" onClick={() => this.closePanel()}>
              <noi-icon name="close"></noi-icon>
            </noi-button>
          </div>

          <div class="road-event__section">{this.languageService.translate('Info Traffico')}</div>

          {northData.map(el => this._renderPanelItem(el, 'N'))}
        </div>) : ''}
    </div>);
  }


  _renderPanelItem(eInfo: AnnouncementShortInfo, direction: 'S' | 'N') {
    const itemTitle = translatePropertyInner(eInfo.Detail, 'Title', this.language) || eInfo.Shortname;
    const itemDetails = translatePropertyInner(eInfo.Detail, 'BaseText', this.language) || itemTitle || eInfo.Shortname;
    const itemHid = eInfo.Id + '-' + direction;
    const _onClick = () => {
      this.closePanel();
      this._focusMapElement(itemHid);
    };
    return (<div data-item-id={itemHid}
                 class="road-event"
                 onClick={_onClick}>

      <div class="road-event__info">
        <img class="road-event__icon" src={eInfo.EventIcon} alt={eInfo.EventIconAlt}/>
        <div class="road-event__details">
          {/*<div class="road-event__title">{itemTitle}</div>*/}
          <div class="road-event__description">{itemDetails}</div>
          {/*<div class="road-event__date">Started: {myFormatDate(eInfo?.StartTime)}</div>*/}
          <div class="road-event__date">{this.languageService.translate('Ultimo aggiornamento:')} {myFormatDate(eInfo?.LastChange)}</div>
          {/*<div class="road-event__date">Tags: {eInfo?.TagIds?.join(', ')}</div>*/}
        </div>
      </div>
    </div>);
  }

}

function myFormatDate(dateStr: string) {
  if (!dateStr) {
    return '';
  }
  try {
    const d = new Date(dateStr);
    if (!d.getTime()) {
      console.error('Invalid date', dateStr, d);
      return dateStr;
    }
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  } catch (e) {
    console.error(e);
    return dateStr;
  }
}
