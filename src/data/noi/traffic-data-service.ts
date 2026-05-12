// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ListResponse } from "../ListResponse";
import { getAssetPath } from "../../utils/asset-path";
import { buildUrl } from "../../utils/url";
import { AnnouncementInfo, AnnouncementShortInfo } from "./AnnouncementInfo";


// origin is used to track usage and traffic patterns
const ORIGIN = 'webcomp-brennerlec';

export class TrafficDataService {

  getRoutePath() {
    const dataPath = getAssetPath('data_a22-1km.json');
    // console.log('[WebcamDataService] dataPath', dataPath);
    return fetch(dataPath)
      .then(r => r.json() as Promise<Array<{ lat: number, lng: number }>>);
  }

  getTrafficEvents() {
    const roadName = 'a22';
    // return fetch(buildUrl(`https://api.tourism.testingmachine.eu/v1/Announcement`, {
    return fetch(buildUrl(`https://tourism.api.opendatahub.com/v1/Announcement`, {
      origin: ORIGIN,
      pagenumber: 1,
      pagesize: -1,
      // rawfilter: `eq(Source,'${roadName}')`,
      rawfilter: `and(eq(Source,'${roadName}'),eq(LicenseInfo.ClosedData,false),isnull(EndTime))`,
      removenullvalues: true,
      getasidarray: false,
    }))
      .then(r => r.json() as Promise<ListResponse<AnnouncementInfo>>)
      .then(r => r.Items)
      .then(r => {
        return r
          .filter(v => !!v?.Geo?.position)
          .map(__convertToShortInfo);
      });
  }

}


function __convertToShortInfo(d: AnnouncementInfo): AnnouncementShortInfo {
  return {
    Id: d.Id,
    Geo: d.Geo,
    StartTime: d.StartTime,
    LastChange: d.LastChange,
    Detail: d.Detail,
    Shortname: d.Shortname,
    TagIds: d.TagIds,
    EventIcon: getAssetPath('16.png'), // TODO: icon will be updated
    Direction: _getDirection(d),
  };
}


// TODO: _getDirection is temporary
function _getDirection(d: AnnouncementInfo): AnnouncementShortInfo['Direction'] {
  const isNorth = d.Shortname.includes('North');
  const isSouth = d.Shortname.includes('South');
  const isBoth = d.Shortname.includes('Both');

  if (isNorth && !isSouth && !isBoth) {
    return 'north';
  }
  if (!isNorth && isSouth && !isBoth) {
    return 'south';
  }
  if (!isNorth && !isSouth && isBoth) {
    return 'both';
  }
  console.warn('Unable to detect direction: ', d);
  return null;
}
