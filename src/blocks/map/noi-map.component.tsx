// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Element, Event, EventEmitter } from "@stencil/core";
import { LatLng, Map, TileLayer } from 'leaflet';
import { StencilComponent } from "../../utils/StencilComponent";

const TILE_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * (INTERNAL) render leaflet map
 */
@Component({
  tag: 'noi-brennerlec-map',
  // styleUrl: 'noi-map.css',
  // shadow: true,
  styleUrls: [
    '../../../node_modules/leaflet/dist/leaflet.css',
    'noi-map.css',
  ],
})
export class NoiMapComponent implements StencilComponent {

  map: Map = null;
  sizeObserver: ResizeObserver = null;

  @Element() el: HTMLElement;

  /**
   * Emitted when map is initialized and ready to draw on it
   */
  @Event() mapReady: EventEmitter<Map>;

  connectedCallback() {
    this.map = new Map(this.el, {
      zoomControl: false,
      center: new LatLng(46.53591, 11.49772),
      zoom: 8,
      // preferCanvas: true,
    });
    this.map.attributionControl.getContainer().part = 'map-attribution';
    this.map.attributionControl.addAttribution("<a href='https://opendatahub.com' target='_blank'>OpenDataHub.com</a> | &copy <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors.");

    this.map.addLayer(new TileLayer(TILE_LAYER));
    this.mapReady.emit(this.map);
    this._watchSize();
  }

  _watchSize() {
    if (typeof window.ResizeObserver === 'function') {
      this.sizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });
      this.sizeObserver.observe(this.el);
    } else {
      console.warn('ResizeObserver is not supported');
    }
  }

  _unwatchSize() {
    if (this.sizeObserver) {
      this.sizeObserver.unobserve(this.el);
      this.sizeObserver = null;
    }
  }

  disconnectedCallback() {
    this._unwatchSize();
  }

  // render() {
  //   return <Host></Host>;
  // }

}
