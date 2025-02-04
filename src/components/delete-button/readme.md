# delete-button



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description                                                                                                                 | Type                   | Default     |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `buttonType` | `button-type` | ButtonType (button \| action): Support usage as action or button                                                            | `"action" \| "button"` | `"button"`  |
| `disabled`   | `disabled`    | boolean: This overrides internal enable/disable logic that is based on checks if the layer supports delete                  | `boolean`              | `false`     |
| `icon`       | `icon`        | string: The icon to display in the component                                                                                | `string`               | `undefined` |
| `ids`        | --            | number[]: The ids that would be deleted                                                                                     | `any[]`                | `[]`        |
| `layer`      | --            | esri/views/layers/FeatureLayer: https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-FeatureLayer.html | `FeatureLayer`         | `undefined` |


## Events

| Event           | Description                                       | Type                                         |
| --------------- | ------------------------------------------------- | -------------------------------------------- |
| `editsComplete` | Emitted on demand when features have been deleted | `CustomEvent<"add" \| "delete" \| "update">` |


## Dependencies

### Used by

 - [crowdsource-manager](../crowdsource-manager)
 - [info-card](../info-card)
 - [layer-table](../layer-table)

### Depends on

- calcite-button
- calcite-action
- calcite-modal

### Graph
```mermaid
graph TD;
  delete-button --> calcite-button
  delete-button --> calcite-action
  delete-button --> calcite-modal
  calcite-button --> calcite-loader
  calcite-button --> calcite-icon
  calcite-action --> calcite-loader
  calcite-action --> calcite-icon
  calcite-modal --> calcite-scrim
  calcite-modal --> calcite-icon
  calcite-scrim --> calcite-loader
  crowdsource-manager --> delete-button
  info-card --> delete-button
  layer-table --> delete-button
  style delete-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
