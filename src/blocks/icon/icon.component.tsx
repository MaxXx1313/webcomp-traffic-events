// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Prop, State, Watch, h } from "@stencil/core";

export type IconName = 'close'
  | 'stations'
  | 'search'
  ;

// Shared cache across all instances of this component
const iconCache = new Map<string, Promise<string> | string>();


/**
 * (INTERNAL) render an icon.
 *
 * Icons are embedded inside the component (so far).
 *
 * Icon size can be changed by 'font-size' style
 */
@Component({
  tag: 'noi-icon',
  styleUrl: 'icon.css',
  shadow: true,
})
export class IconComponent {

  /**
   * icon name
   */
  @Prop()
  name: IconName | string;

  /**
   * icon url
   */
  @Prop()
  src?: string;

  @State() svgContent: string = '';

  @Watch('src')
  onSrcChanged() {
    this.loadIcon();
  }

  componentWillLoad() {
    this.loadIcon();
  }


  private async loadIcon() {
    if (!this.src) {
      this.svgContent = '';
      return;
    }

    try {
      // 1. Check if the icon is already cached or currently fetching
      if (iconCache.has(this.src)) {
        this.svgContent = await iconCache.get(this.src)!;
        return;
      }

      // 2. Create the fetch promise and store it in the cache immediately
      const fetchPromise = fetch(this.src)
        .then(async (response) => {
          if (!response.ok) throw new Error(`Failed to fetch SVG`);
          const text = await response.text();

          // Update the cache with the actual text content once resolved
          iconCache.set(this.src, text);
          return text;
        })
        .catch((error) => {
          // Remove from cache on failure so it can try again later if requested
          iconCache.delete(this.src);
          throw error;
        });


      iconCache.set(this.src, fetchPromise);
      this.svgContent = await fetchPromise;

    } catch (error) {
      console.error('Error loading icon:', error);
      this.svgContent = ''; // Fallback to empty on error
    }
  }

  render() {
    if(this.svgContent) {
      return (<span
        class="icon-wrapper"
        innerHTML={this.svgContent}
      />);
    } else {
      return (<span class="icon-wrapper">{this._getContentByName(this.name)}</span>);
    }
  }

  _getContentByName(iconName: string) {

    switch (iconName) {
      case 'menu':
        return (<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"
                  d="M80 160h352M80 256h352M80 352h352"/>
          </svg>
        );
      case 'close':
        return (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                fill="currentColor"/>
        </svg>);
      case 'arrow-down':
        return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
          <path fill="currentColor" d="M32 16L29.18 13.18L18 24.34L18 0L14 0L14 24.34L2.8399999 13.16L0 16L16 32L32 16Z"
                fill-rule="evenodd"/>
        </svg>);
      case 'arrow-up':
        return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
          <path transform="rotate(180 16 16)"
                fill="currentColor" d="M32 16L29.18 13.18L18 24.34L18 0L14 0L14 24.34L2.8399999 13.16L0 16L16 32L32 16Z"
                fill-rule="evenodd"/>
        </svg>);
    }
  }
}
