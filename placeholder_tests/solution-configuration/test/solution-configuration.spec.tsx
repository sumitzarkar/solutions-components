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

import { newSpecPage } from '@stencil/core/testing';
import { SolutionConfiguration } from '../solution-configuration';
import { h } from '@stencil/core';
import state from "../../../utils/solution-store";

// Mock MutationObserver because Jest environment doesn't have it
const mutationObserverMock = jest.fn(function MutationObserver(): void {
  this.observe = jest.fn();
});
global.MutationObserver = mutationObserverMock as any;

xdescribe('solution-configuration', () => {
  // has to be a better way..
  global.MutationObserver = class {
    constructor() { }
    disconnect(): void { }
    observe(): void { }
    takeRecords(): any[] { return [] }
  };

  beforeEach(() => {
    state._testAccess("_emptyTheStore");
  });

  it('renders', async () => {
    state.setStoreInfo("featureServices", [
      "Feature Service 1",
      "Feature Service 2"
    ]);
    const page = await newSpecPage({
      components: [SolutionConfiguration],
      supportsShadowDom: false,
      template: () => (
        <solution-configuration></solution-configuration>
      )
    });
    expect(page.root).toEqualHtml(`
      <solution-configuration itemid="">
        <div class="configuration-container">
          <div class="configuration">
            <calcite-tabs class="config-tabs">
              <calcite-tab-nav slot="tab-nav">
                <calcite-tab-title>Definition</calcite-tab-title>
                <calcite-tab-title>Spatial Reference</calcite-tab-title>
              </calcite-tab-nav>

              <calcite-tab class="config-tab" active>
                <div class="config-solution">

                  <div class="config-inventory">
                    <solution-contents id="configInventory"></solution-contents>
                  </div>
                  <calcite-button appearance="transparent" class="collapse-btn" icon-start="chevrons-left" id="collapse-vars" scale="s" title="Cancel Edits"></calcite-button>
                  <div class="config-item">
                    <solution-item></solution-item>
                  </div>

                </div>
              </calcite-tab>
              <calcite-tab class="config-tab">
                <div class="config-solution">
                  <solution-spatial-ref id="configure-solution-spatial-ref" locked=""></solution-spatial-ref>
                </div>
              </calcite-tab>
            </calcite-tabs>
          </div>
        </div>
      </solution-configuration>
    `);
  });

  it('does not render spatial ref tab when no services are found', async () => {
    const page = await newSpecPage({
      components: [SolutionConfiguration],
      supportsShadowDom: false,
      template: () => (
        <solution-configuration></solution-configuration>
      )
    });
    expect(page.root).toEqualHtml(`
      <solution-configuration itemid="">
        <div class="configuration-container">
          <div class="configuration">
            <calcite-tabs class="config-tabs">
              <calcite-tab-nav slot="tab-nav">
                <calcite-tab-title>Definition</calcite-tab-title>
              </calcite-tab-nav>

              <calcite-tab class="config-tab" active>
                <div class="config-solution">

                  <div class="config-inventory">
                    <solution-contents id="configInventory"></solution-contents>
                  </div>
                  <calcite-button appearance="transparent" class="collapse-btn" icon-start="chevrons-left" id="collapse-vars" scale="s" title="Cancel Edits"></calcite-button>
                  <div class="config-item">
                    <solution-item></solution-item>
                  </div>

                </div>
              </calcite-tab>
            </calcite-tabs>
          </div>
        </div>
      </solution-configuration>
    `);
  });
});