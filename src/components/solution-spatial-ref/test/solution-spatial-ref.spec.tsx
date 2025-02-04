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

import * as locale from '../../../utils/locale';
import state from "../../../utils/solution-store";
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { SolutionSpatialRef } from '../solution-spatial-ref';
import {
  CSpatialRefCustomizingPrefix,
  CSpatialRefCustomizingSuffix,
} from '../../../utils/interfaces';

describe('solution-spatial-ref', () => {

  describe('page display', () => {

    beforeEach(() => {
      jest.spyOn(locale, 'getLocaleComponentStrings').mockImplementation(
        () => Promise.resolve([{"spatialReferencePlaceholder": "Search for spatial reference using name or WKID"}, "en"])
      );

      state._testAccess("_emptyTheStore");
      state.setStoreInfo("spatialReferenceInfo", {
        enabled: true,
        enabledDefault: false,
        services: {
          "123": true,
          "456": false
        },
        wkid: "2865"
      });
      state.setStoreInfo("featureServices", [
        {
          id: "123",
          name: "Feature Service 1",
          enabled: true
        },
        {
          id: "456",
          name: "Feature Service 2",
          enabled: false
        }
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('renders', async () => {
      const page = await newSpecPage({
        components: [SolutionSpatialRef],
        supportsShadowDom: false,
        template: () => (
          <solution-spatial-ref/>
        )
      });
      expect(page.root).toEqualHtml(`
        <solution-spatial-ref enabled="">
          <label class="switch-label">
            <calcite-switch checked="" class="spatial-ref-switch" scale="m"></calcite-switch>
          </label>
          <br>
          <div class="spatial-ref-component" id="spatialRefDefn">
            <div>
              <label class="spatial-ref-item-title"></label>
              <ul class="spatial-ref-services-list">
                <li class="spatial-ref-services-list-item">
                  <label class="switch-label">
                    <calcite-switch checked="" class="spatial-ref-item-switch" scale="m"></calcite-switch>
                    Feature Service 1
                  </label>
                </li>
                <li class="spatial-ref-services-list-item">
                  <label class="switch-label">
                    <calcite-switch class="spatial-ref-item-switch" scale="m"></calcite-switch>
                    Feature Service 2
                  </label>
                </li>
              </ul>
            </div>
          </div>
          <label class="switch-label spatial-ref-component">
            <calcite-switch class="spatial-ref-switch" scale="m"></calcite-switch>
          </label>
        </solution-spatial-ref>
      `);
    });

  });

  describe('functions', () => {

    describe('_parameterizeWkid', () => {

      it('parameterizes', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_parameterizeWkid", "2865");
        expect(result).toEqual(`${CSpatialRefCustomizingPrefix}2865${CSpatialRefCustomizingSuffix}`);
      });

      it('returns already-parameterized string', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_parameterizeWkid", `${CSpatialRefCustomizingPrefix}2865${CSpatialRefCustomizingSuffix}`);
        expect(result).toEqual(`${CSpatialRefCustomizingPrefix}2865${CSpatialRefCustomizingSuffix}`);
      });

      it('handles undefined wkid', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_parameterizeWkid");
        expect(result).toBeUndefined();
      });

      it('handles null wkid', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_parameterizeWkid", null);
        expect(result).toBeNull();
      });

      it('handles empty string', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_parameterizeWkid", "");
        expect(result).toEqual("");
      });

    });

    describe('_unparameterizeWkid', () => {

      it('unparameterizes', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_unparameterizeWkid", `${CSpatialRefCustomizingPrefix}2865${CSpatialRefCustomizingSuffix}`);
        expect(result).toEqual("2865");
      });

      it('returns unparameterized string', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_unparameterizeWkid", "2865");
        expect(result).toEqual("2865");
      });

      it('handles undefined wkid', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_unparameterizeWkid");
        expect(result).toBeUndefined();
      });

      it('handles null wkid', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_unparameterizeWkid", null);
        expect(result).toBeNull();
      });

      it('handles empty string', async () => {
        const component = new SolutionSpatialRef();
        const result = await component._testAccess("_unparameterizeWkid", "");
        expect(result).toEqual("");
      });

    });

  });

});
