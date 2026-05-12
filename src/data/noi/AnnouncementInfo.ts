// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DateTimeString } from "../ListResponse";

/**
 * Data received from api
 */
export interface AnnouncementInfo {
  Id: string;
  Geo: {
    position: {
      Default: boolean;
      Geometry: string; // "POINT (10.8431 44.6689)",
      Latitude: number;
      Longitude: number;
      // Gpstype: string; // enum
    }
  },
  // "_Meta": Metadata;
  Active: boolean;
  Detail: { [languageCode: string]: DetailGeneric };
  Source: string;
  TagIds: string[];
  // "Mapping":
  Shortname: string; // "Current Situation - A22, km 313.1-313.1, South",
  StartTime: DateTimeString;
  EndTime?: DateTimeString;
  LastChange: DateTimeString;
  FirstImport: DateTimeString;
  HasLanguage: string; // language codes
  // "LicenseInfo": 	LicenseInfo
}


interface DetailGeneric {
  BaseText?: string;
  Title?: string;
  Language?: string;
}


export interface AnnouncementShortInfo {
  Id: AnnouncementInfo['Id'];
  Detail: AnnouncementInfo['Detail'];
  Geo: AnnouncementInfo['Geo'];
  StartTime: AnnouncementInfo['StartTime'];
  LastChange: AnnouncementInfo['LastChange'];
  Shortname: AnnouncementInfo['Shortname'];
  TagIds: AnnouncementInfo['TagIds'];

  EventIcon: string;
  Direction: 'south' | 'north' | 'both' | null;
}
