// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * iso-8601 string
 */
export type DateTimeString = string;

/**
 *
 */
export interface ListResponse<T> {
  TotalResults: number;
  TotalPages: number;
  CurrentPage: number;
  PreviousPage: string;
  NextPage: string;
  Seed: string;
  Items: T[];
}
